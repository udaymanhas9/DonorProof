import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { type Logger } from 'pino';
import { ConnectedAPI, type InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { fromHex, toHex } from '@midnight-ntwrk/compact-runtime';
import { Binding, FinalizedTransaction, Proof, SignatureEnabled, Transaction, TransactionId } from '@midnight-ntwrk/ledger-v8';
import { type UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import { NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { inMemoryPrivateStateProvider } from '../in-memory-private-state-provider';
import { DonorProofAPI, type DeployedDonorProofAPI, type DonorProofState, type CharityInfo, type DonorProofCircuitKeys, type DonorProofPrivateState } from '../../../api/src/index.js';
import semver from 'semver';
import { firstValueFrom, interval, map, filter, take, timeout, throwError, concatMap, catchError, BehaviorSubject } from 'rxjs';
import { pipe as fnPipe } from 'fp-ts/function';
import { MOCK_CHARITIES, DEMO_CHARITY_CONTRACT, DEMO_OWNER_KEY, type MockCharity } from '../config/mockData';

const REGISTRY_KEY = 'donorproof_charities';
const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type ExpenseRecord = {
  id: string;
  amount: bigint;
  category: string;
  isDirectAid: boolean;
  isAdmin: boolean;
  timestamp: string;
  commitmentHash: string;
};

export type ProofRecord = {
  timestamp: string;
  directAidPct: number;
  adminPct: number;
  expenseSequence: number;
  txHash: string;
};

export type CharityDeployment = {
  readonly info: CharityInfo;
  readonly api: DeployedDonorProofAPI;
  state: DonorProofState | null;
};

export type DonorProofContextValue = {
  walletStatus: WalletStatus;
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  connectAsDonor: () => void;
  connectAsCharity: () => void;
  isDemoMode: boolean;

  charities: CharityInfo[];
  currentCharity: CharityDeployment | null;
  isCharityOwner: boolean;

  deployNewCharity: (info: Omit<CharityInfo, 'contractAddress'>, minDirectAid: number, maxAdmin: number) => Promise<void>;
  joinCharity: (address: string) => Promise<DeployedDonorProofAPI>;
  commitExpense: (amount: bigint, isDirectAid: boolean, isAdmin: boolean, category: string) => Promise<void>;
  verifyCompliance: () => Promise<void>;
  donorDeposit: (contractAddress: string, amount: bigint, restriction: number) => Promise<void>;
  releaseFunds: () => Promise<void>;

  expenseLog: ExpenseRecord[];
  proofRecord: ProofRecord | null;

  txPending: boolean;
  error: string | null;
};

const DonorProofContext = createContext<DonorProofContextValue | undefined>(undefined);

export const useDonorProof = (): DonorProofContextValue => {
  const ctx = useContext(DonorProofContext);
  if (!ctx) throw new Error('useDonorProof must be used within DonorProofProvider');
  return ctx;
};

// ── Registry helpers ─────────────────────────────────────────────────────────

const getRegistry = (): CharityInfo[] => {
  try {
    return JSON.parse(localStorage.getItem(REGISTRY_KEY) ?? '[]') as CharityInfo[];
  } catch {
    return [];
  }
};

const saveRegistry = (charities: CharityInfo[]): void => {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(charities));
};

const seedMockCharities = (): void => {
  const existing = getRegistry();
  if (existing.length > 0) return;
  const infos: CharityInfo[] = MOCK_CHARITIES.map(({ state: _s, ...info }) => info);
  saveRegistry(infos);
};

// ── Mock API factory ─────────────────────────────────────────────────────────

function makeMockApi(
  charity: MockCharity,
  getState: () => DonorProofState,
): DeployedDonorProofAPI {
  const subject = new BehaviorSubject<DonorProofState>(getState());
  return {
    contractAddress: charity.contractAddress,
    state$: subject.asObservable(),
    commitExpense: async () => {},
    verifyCompliance: async () => {},
    donorDeposit: async () => {},
    releaseFunds: async () => {},
  };
}

// ── Wallet helpers ───────────────────────────────────────────────────────────

const getFirstCompatibleWallet = (): InitialAPI | undefined => {
  if (!window.midnight) return undefined;
  return Object.values(window.midnight).find(
    (w): w is InitialAPI =>
      !!w && typeof w === 'object' && 'apiVersion' in w &&
      semver.satisfies((w as InitialAPI).apiVersion, COMPATIBLE_CONNECTOR_API_VERSION),
  );
};

const connectToWallet = (logger: Logger, networkId: string): Promise<ConnectedAPI> =>
  firstValueFrom(
    fnPipe(
      interval(100),
      map(() => getFirstCompatibleWallet()),
      filter((api): api is InitialAPI => !!api),
      take(1),
      timeout({
        first: 5_000,
        with: () => throwError(() => new Error('Midnight Lace wallet not found. Install the extension and set network to "undeployed".')),
      }),
      concatMap(async (initialAPI) => {
        const connected = await initialAPI.connect(networkId);
        await connected.getConnectionStatus();
        return connected;
      }),
      catchError(() => throwError(() => new Error('Unable to connect to wallet. Is the extension authorized?'))),
    ),
  );

const buildProviders = async (logger: Logger, networkId: string) => {
  const connectedAPI = await connectToWallet(logger, networkId);
  const zkConfigPath = window.location.origin;
  const keyProvider = new FetchZkConfigProvider<DonorProofCircuitKeys>(zkConfigPath, fetch.bind(window));
  const config = await connectedAPI.getConfiguration();
  const shieldedAddresses = await connectedAPI.getShieldedAddresses();
  const privateStateProvider = inMemoryPrivateStateProvider<string, DonorProofPrivateState>();

  return {
    providers: {
      privateStateProvider,
      zkConfigProvider: keyProvider,
      proofProvider: httpClientProofProvider(config.proverServerUri!, keyProvider),
      publicDataProvider: indexerPublicDataProvider(config.indexerUri, config.indexerWsUri),
      walletProvider: {
        getCoinPublicKey: () => shieldedAddresses.shieldedCoinPublicKey,
        getEncryptionPublicKey: () => shieldedAddresses.shieldedEncryptionPublicKey,
        balanceTx: async (tx: UnboundTransaction, _ttl?: Date): Promise<FinalizedTransaction> => {
          const serializedTx = toHex(tx.serialize());
          const received = await connectedAPI.balanceUnsealedTransaction(serializedTx);
          return Transaction.deserialize<SignatureEnabled, Proof, Binding>('signature', 'proof', 'binding', fromHex(received.tx));
        },
      },
      midnightProvider: {
        submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
          await connectedAPI.submitTransaction(toHex(tx.serialize()));
          return tx.identifiers()[0];
        },
      },
    },
    coinPublicKey: shieldedAddresses.shieldedCoinPublicKey,
    connectedAPI,
  };
};

// ── Commitment hash ───────────────────────────────────────────────────────────

const fakeCommitmentHash = (amount: bigint, category: string, idx: number): string => {
  const raw = `${amount}-${category}-${idx}-${Date.now()}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) { h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0; }
  const base = Math.abs(h).toString(16).padStart(8, '0');
  return `0x${base}${Math.abs(h ^ 0xdeadbeef).toString(16).padStart(8, '0')}${idx.toString(16).padStart(4, '0')}`;
};

const fakeTxHash = (): string =>
  '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');

// ── Provider ─────────────────────────────────────────────────────────────────

export const DonorProofProvider: React.FC<React.PropsWithChildren<{ logger: Logger }>> = ({ logger, children }) => {
  const [walletStatus, setWalletStatus] = useState<WalletStatus>('disconnected');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [charities, setCharities] = useState<CharityInfo[]>(() => {
    seedMockCharities();
    return getRegistry();
  });
  const [currentCharity, setCurrentCharity] = useState<CharityDeployment | null>(null);
  const [isCharityOwner, setIsCharityOwner] = useState(false);
  const [expenseLog, setExpenseLog] = useState<ExpenseRecord[]>([]);
  const [proofRecord, setProofRecord] = useState<ProofRecord | null>(null);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providersRef = useRef<Awaited<ReturnType<typeof buildProviders>> | null>(null);
  const mockStateRef = useRef<DonorProofState | null>(null);
  const expenseCountRef = useRef(0);
  const networkId = (import.meta.env.VITE_NETWORK_ID as NetworkId) ?? 'undeployed';

  // ── Demo login ─────────────────────────────────────────────────────────────

  const connectAsDonor = useCallback(() => {
    setIsDemoMode(true);
    setWalletAddress('demo-donor');
    setWalletStatus('connected');
    setIsCharityOwner(false);
    setCurrentCharity(null);
  }, []);

  const connectAsCharity = useCallback(() => {
    const demoCharity = MOCK_CHARITIES.find(c => c.contractAddress === DEMO_CHARITY_CONTRACT)!;
    mockStateRef.current = { ...demoCharity.state };

    const mockApi: DeployedDonorProofAPI = {
      contractAddress: demoCharity.contractAddress,
      state$: new BehaviorSubject<DonorProofState>(mockStateRef.current).asObservable(),
      commitExpense: async () => {},
      verifyCompliance: async () => {},
      donorDeposit: async () => {},
      releaseFunds: async () => {},
    };

    const deployment: CharityDeployment = {
      info: { name: demoCharity.name, category: demoCharity.category, description: demoCharity.description, contractAddress: demoCharity.contractAddress },
      api: mockApi,
      state: mockStateRef.current,
    };

    setIsDemoMode(true);
    setWalletAddress(DEMO_OWNER_KEY);
    setWalletStatus('connected');
    setIsCharityOwner(true);
    setCurrentCharity(deployment);
  }, []);

  // ── Real wallet login ──────────────────────────────────────────────────────

  const connectWallet = useCallback(async () => {
    setWalletStatus('connecting');
    setError(null);
    try {
      const built = await buildProviders(logger, networkId);
      providersRef.current = built;
      setWalletAddress(built.coinPublicKey);
      setWalletStatus('connected');
      setIsDemoMode(false);

      const registry = getRegistry();
      for (const info of registry) {
        if (info.contractAddress.startsWith('mock:')) continue;
        try {
          const api = await DonorProofAPI.join(built.providers as any, info.contractAddress, logger);
          const snapshot = await firstValueFrom(api.state$);
          if (snapshot.campaignOwner === built.coinPublicKey.slice(0, 64)) {
            const deployment: CharityDeployment = { info, api, state: snapshot };
            api.state$.subscribe((s) => setCurrentCharity((prev) => prev ? { ...prev, state: s } : null));
            setCurrentCharity(deployment);
            setIsCharityOwner(true);
            break;
          }
        } catch {
          // not owner or not found — continue
        }
      }
    } catch (err) {
      setWalletStatus('disconnected');
      const msg = err instanceof Error ? err.message : 'Wallet connection failed';
      setError(msg);
      throw new Error(msg);
    }
  }, [logger, networkId]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const deployNewCharity = useCallback(async (
    info: Omit<CharityInfo, 'contractAddress'>,
    minDirectAid: number,
    maxAdmin: number,
  ) => {
    if (!providersRef.current) throw new Error('Wallet not connected');
    setTxPending(true);
    setError(null);
    try {
      const api = await DonorProofAPI.deploy(providersRef.current.providers as any, minDirectAid, maxAdmin, logger);
      const charityInfo: CharityInfo = { ...info, contractAddress: api.contractAddress };
      const updated = [...getRegistry(), charityInfo];
      saveRegistry(updated);
      setCharities(updated);
      const snapshot = await firstValueFrom(api.state$);
      const deployment: CharityDeployment = { info: charityInfo, api, state: snapshot };
      api.state$.subscribe((s) => setCurrentCharity((prev) => prev ? { ...prev, state: s } : null));
      setCurrentCharity(deployment);
      setIsCharityOwner(true);
    } finally {
      setTxPending(false);
    }
  }, [logger]);

  const joinCharity = useCallback(async (address: string): Promise<DeployedDonorProofAPI> => {
    // Mock addresses: return a live BehaviorSubject API
    if (address.startsWith('mock:')) {
      const mock = MOCK_CHARITIES.find(c => c.contractAddress === address);
      if (!mock) throw new Error('Mock charity not found');
      const subject = new BehaviorSubject<DonorProofState>(mock.state);
      return {
        contractAddress: mock.contractAddress,
        state$: subject.asObservable(),
        commitExpense: async () => {},
        verifyCompliance: async () => {},
        donorDeposit: async () => {},
        releaseFunds: async () => {},
      };
    }
    if (!providersRef.current) throw new Error('Wallet not connected');
    return DonorProofAPI.join(providersRef.current.providers as any, address, logger);
  }, [logger]);

  const commitExpense = useCallback(async (amount: bigint, isDirectAid: boolean, isAdmin: boolean, category: string) => {
    if (!currentCharity) throw new Error('No charity selected');
    setTxPending(true);
    setError(null);
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 2000));
        expenseCountRef.current += 1;
        const idx = expenseCountRef.current;
        const record: ExpenseRecord = {
          id: `E-${String(idx).padStart(3, '0')}`,
          amount,
          category,
          isDirectAid,
          isAdmin,
          timestamp: new Date().toLocaleString(),
          commitmentHash: fakeCommitmentHash(amount, category, idx),
        };
        setExpenseLog(prev => [record, ...prev]);
        setCurrentCharity(prev => {
          if (!prev?.state) return prev;
          const s = prev.state;
          const newTotal = s.totalSpend + amount;
          const newDirect = s.directAidSpend + (isDirectAid ? amount : 0n);
          const newAdmin = s.adminSpend + (isAdmin ? amount : 0n);
          return {
            ...prev,
            state: {
              ...s,
              totalSpend: newTotal,
              directAidSpend: newDirect,
              adminSpend: newAdmin,
              expenseSequence: s.expenseSequence + 1,
              directAidPct: newTotal > 0n ? Number((newDirect * 100n) / newTotal) : 0,
              adminPct: newTotal > 0n ? Number((newAdmin * 100n) / newTotal) : 0,
            },
          };
        });
      } else {
        await currentCharity.api.commitExpense(amount, isDirectAid, isAdmin);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
      throw err;
    } finally {
      setTxPending(false);
    }
  }, [currentCharity, isDemoMode]);

  const verifyCompliance = useCallback(async () => {
    if (!currentCharity) throw new Error('No charity selected');
    setTxPending(true);
    setError(null);
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 4000));
        const state = currentCharity.state;
        if (state) {
          setProofRecord({
            timestamp: new Date().toLocaleString(),
            directAidPct: state.directAidPct,
            adminPct: state.adminPct,
            expenseSequence: state.expenseSequence,
            txHash: fakeTxHash(),
          });
        }
        setCurrentCharity(prev => {
          if (!prev?.state) return prev;
          return { ...prev, state: { ...prev.state, isVerified: true } };
        });
      } else {
        await currentCharity.api.verifyCompliance();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Proof generation failed');
      throw err;
    } finally {
      setTxPending(false);
    }
  }, [currentCharity, isDemoMode]);

  const donorDeposit = useCallback(async (contractAddress: string, amount: bigint, restriction: number) => {
    setTxPending(true);
    setError(null);
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 1500));
        // In demo mode, update the pot balance locally to reflect the donation.
        setCurrentCharity(prev => {
          if (!prev || prev.info.contractAddress !== contractAddress) return prev;
          const prevPot = prev.state?.potValue ?? 0n;
          return prev.state
            ? { ...prev, state: { ...prev.state, potHasCoin: true, potValue: prevPot + amount } }
            : prev;
        });
      } else {
        const api = await DonorProofAPI.join(providersRef.current!.providers as any, contractAddress, logger);
        await api.donorDeposit(amount, restriction);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Donation failed');
      throw err;
    } finally {
      setTxPending(false);
    }
  }, [isDemoMode, logger]);

  const releaseFunds = useCallback(async () => {
    if (!currentCharity) throw new Error('No charity selected');
    setTxPending(true);
    setError(null);
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 2000));
        setCurrentCharity(prev =>
          prev?.state ? { ...prev, state: { ...prev.state, potHasCoin: false, potValue: 0n } } : prev,
        );
      } else {
        await currentCharity.api.releaseFunds();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Release failed');
      throw err;
    } finally {
      setTxPending(false);
    }
  }, [currentCharity, isDemoMode]);

  return (
    <DonorProofContext.Provider value={{
      walletStatus, walletAddress, connectWallet, connectAsDonor, connectAsCharity, isDemoMode,
      charities, currentCharity, isCharityOwner,
      deployNewCharity, joinCharity, commitExpense, verifyCompliance, donorDeposit, releaseFunds,
      expenseLog, proofRecord,
      txPending, error,
    }}>
      {children}
    </DonorProofContext.Provider>
  );
};
