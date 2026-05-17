import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { map, tap, type Observable } from 'rxjs';
import { type Logger } from 'pino';
import {
  createCompiledContract,
  ledger,
  type Ledger,
  type Witnesses,
} from '../contracts/index.js';
import { type DonorProofProviders } from './providers.js';
import {
  initialPrivateState,
  newBlindingFactor,
  newExpenseId,
  type PendingExpense,
  type PrivateState,
} from './witnesses.js';

export type { PendingExpense };
export { newExpenseId, newBlindingFactor };

export type DonorProofState = {
  campaignOwner: { bytes: Uint8Array };
  directAidThreshold: bigint;
  adminThreshold: bigint;
  totalSpend: bigint;
  directAidSpend: bigint;
  adminSpend: bigint;
  expenseChainHash: Uint8Array;
  expenseSequence: bigint;
  isVerified: boolean;
};

const PRIVATE_STATE_KEY = 'donor-proof-v1' as const;

export class DonorProofAPI {
  // Mutable slot: set immediately before each commitExpense call, cleared after.
  // The witnesses below close over this via `this`, so they always read the
  // current value at prove-time.
  private pendingExpense: PendingExpense | undefined = undefined;

  private readonly witnesses: Witnesses<PrivateState> = {
    expenseId: (ctx) => [ctx.privateState, this.pendingExpense?.expenseId ?? new Uint8Array(32)],
    expenseBlind: (ctx) => [ctx.privateState, this.pendingExpense?.blindingFactor ?? new Uint8Array(32)],
    expenseAmount: (ctx) => [ctx.privateState, this.pendingExpense?.amount ?? 0n],
    expenseIsDirectAid: (ctx) => [ctx.privateState, this.pendingExpense?.isDirectAid ?? false],
    expenseIsAdmin: (ctx) => [ctx.privateState, this.pendingExpense?.isAdmin ?? false],
  };

  // Compiled once per instance; witnesses are the same object throughout.
  private readonly compiledContract = createCompiledContract(this.witnesses);

  // Set by deploy() or findDeployed() before the instance is returned.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private deployedContract!: any;

  private constructor(
    private readonly providers: DonorProofProviders,
    private readonly logger?: Logger,
  ) {}

  // Lazy observable — always resolves address from the current deployedContract.
  get state$(): Observable<DonorProofState> {
    const address: ContractAddress = this.deployedContract.deployTxData.public.contractAddress;
    return this.providers.publicDataProvider
      .contractStateObservable(address, { type: 'latest' })
      .pipe(
        map((contractState) => {
          const ls: Ledger = ledger(contractState.data);
          return {
            campaignOwner: ls.campaignOwner,
            directAidThreshold: ls.directAidThreshold,
            adminThreshold: ls.adminThreshold,
            totalSpend: ls.totalSpend,
            directAidSpend: ls.directAidSpend,
            adminSpend: ls.adminSpend,
            expenseChainHash: ls.expenseChainHash,
            expenseSequence: ls.expenseSequence,
            isVerified: ls.isVerified,
          };
        }),
        tap((state) =>
          this.logger?.trace({
            stateChanged: {
              isVerified: state.isVerified,
              expenseSequence: state.expenseSequence.toString(),
              totalSpend: state.totalSpend.toString(),
            },
          }),
        ),
      );
  }

  get contractAddress(): ContractAddress {
    return this.deployedContract.deployTxData.public.contractAddress;
  }

  // Deploy a new campaign. The deploying wallet automatically becomes the campaign owner.
  static async deploy(
    providers: DonorProofProviders,
    minDirectAid: bigint,
    maxAdmin: bigint,
    logger?: Logger,
  ): Promise<DonorProofAPI> {
    const api = new DonorProofAPI(providers, logger);
    logger?.info({ action: 'deploy', minDirectAid: minDirectAid.toString(), maxAdmin: maxAdmin.toString() });

    api.deployedContract = await deployContract(providers, {
      compiledContract: api.compiledContract,
      args: [minDirectAid, maxAdmin],
      privateStateId: PRIVATE_STATE_KEY,
      initialPrivateState,
    });

    logger?.info({ deployed: { address: api.contractAddress } });
    return api;
  }

  // Reconnect to a previously deployed campaign by its contract address.
  static async findDeployed(
    providers: DonorProofProviders,
    contractAddress: ContractAddress,
    logger?: Logger,
  ): Promise<DonorProofAPI> {
    const api = new DonorProofAPI(providers, logger);
    logger?.info({ action: 'findDeployed', contractAddress });

    api.deployedContract = await findDeployedContract(providers, {
      compiledContract: api.compiledContract,
      contractAddress,
      privateStateId: PRIVATE_STATE_KEY,
      initialPrivateState,
    });

    return api;
  }

  // Commit a single expense on-chain.
  // Amount and category come from PendingExpense; id and blinding factor never leave the prover.
  async commitExpense(expense: PendingExpense): Promise<string> {
    this.pendingExpense = expense;
    try {
      const tx = await this.deployedContract.callTx.commitExpense();
      this.logger?.info({
        transactionAdded: {
          circuit: 'commitExpense',
          txHash: tx.public.txHash,
          blockHeight: tx.public.blockHeight,
        },
      });
      return tx.public.txHash as string;
    } finally {
      this.pendingExpense = undefined;
    }
  }

  // Submit the ZK compliance proof on-chain.
  // Sets isVerified = true if directAid and admin thresholds are met.
  async verifyCompliance(): Promise<string> {
    const tx = await this.deployedContract.callTx.verifyCompliance();
    this.logger?.info({
      transactionAdded: {
        circuit: 'verifyCompliance',
        txHash: tx.public.txHash,
        blockHeight: tx.public.blockHeight,
      },
    });
    return tx.public.txHash as string;
  }
}
