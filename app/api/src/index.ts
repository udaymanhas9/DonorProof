import * as DonorProof from '../../contract/src/managed/donor-proof/contract/index.js';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { type Logger } from 'pino';
import {
  type DonorProofContract,
  type DonorProofProviders,
  type DeployedDonorProofContract,
  donorProofPrivateStateKey,
} from './common-types.js';
import {
  CompiledDonorProofContract,
  setPendingExpense,
  initialPrivateState,
  newExpenseId,
  newBlindingFactor,
} from '../../contract/src/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { map, type Observable } from 'rxjs';

export interface DonorProofState {
  readonly campaignOwner: string;
  readonly directAidThreshold: number;
  readonly adminThreshold: number;
  readonly totalSpend: bigint;
  readonly directAidSpend: bigint;
  readonly adminSpend: bigint;
  readonly expenseSequence: number;
  readonly isVerified: boolean;
  readonly directAidPct: number;
  readonly adminPct: number;
  readonly potHasCoin: boolean;
  readonly potValue: bigint;
}

export interface DeployedDonorProofAPI {
  readonly contractAddress: ContractAddress;
  readonly state$: Observable<DonorProofState>;
  commitExpense: (amount: bigint, isDirectAid: boolean, isAdmin: boolean) => Promise<void>;
  verifyCompliance: () => Promise<void>;
  donorDeposit: (amount: bigint, restriction: number) => Promise<void>;
  releaseFunds: () => Promise<void>;
}

function buildState$(
  providers: DonorProofProviders,
  contractAddress: ContractAddress,
): Observable<DonorProofState> {
  return providers.publicDataProvider
    .contractStateObservable(contractAddress, { type: 'all' })
    .pipe(
      map((contractState) => {
        const s = DonorProof.ledger(contractState.data);
        const total = s.totalSpend > 0n ? s.totalSpend : 1n;
        return {
          campaignOwner: Buffer.from(s.campaignOwner.bytes).toString('hex'),
          directAidThreshold: Number(s.directAidThreshold),
          adminThreshold: Number(s.adminThreshold),
          totalSpend: s.totalSpend,
          directAidSpend: s.directAidSpend,
          adminSpend: s.adminSpend,
          expenseSequence: Number(s.expenseSequence),
          isVerified: s.isVerified,
          directAidPct: s.totalSpend > 0n ? Number((s.directAidSpend * 100n) / total) : 0,
          adminPct: s.totalSpend > 0n ? Number((s.adminSpend * 100n) / total) : 0,
          potHasCoin: s.potHasCoin,
          potValue: s.potHasCoin ? s.pot.value : 0n,
        };
      }),
    );
}

export class DonorProofAPI implements DeployedDonorProofAPI {
  readonly contractAddress: ContractAddress;
  readonly state$: Observable<DonorProofState>;

  private constructor(
    contractAddress: ContractAddress,
    state$: Observable<DonorProofState>,
    private readonly deployedContract: DeployedDonorProofContract,
    private readonly logger?: Logger,
  ) {
    this.contractAddress = contractAddress;
    this.state$ = state$;
  }

  async commitExpense(amount: bigint, isDirectAid: boolean, isAdmin: boolean): Promise<void> {
    this.logger?.info({ amount, isDirectAid, isAdmin }, 'commitExpense');
    setPendingExpense({
      expenseId: newExpenseId(),
      blindingFactor: newBlindingFactor(),
      amount,
      isDirectAid,
      isAdmin,
    });
    try {
      await this.deployedContract.callTx.commitExpense();
    } finally {
      setPendingExpense(null);
    }
  }

  async verifyCompliance(): Promise<void> {
    this.logger?.info('verifyCompliance');
    await this.deployedContract.callTx.verifyCompliance();
  }

  async donorDeposit(amount: bigint, restriction: number): Promise<void> {
    this.logger?.info({ amount, restriction }, 'donorDeposit');
    const coin = {
      nonce: crypto.getRandomValues(new Uint8Array(32)),
      color: new Uint8Array(32),
      value: amount,
    };
    await this.deployedContract.callTx.donorDeposit(coin, BigInt(restriction));
  }

  async releaseFunds(): Promise<void> {
    this.logger?.info('releaseFunds');
    await this.deployedContract.callTx.releaseFunds();
  }

  static async deploy(
    providers: DonorProofProviders,
    minDirectAid: number,
    maxAdmin: number,
    logger?: Logger,
  ): Promise<DonorProofAPI> {
    logger?.info('deployContract');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deployed = await (deployContract as any)(providers, {
      compiledContract: CompiledDonorProofContract,
      privateStateId: donorProofPrivateStateKey,
      initialPrivateState,
      args: [BigInt(minDirectAid), BigInt(maxAdmin)],
    });
    const contractAddress = deployed.deployTxData.public.contractAddress;
    const state$ = buildState$(providers, contractAddress);
    return new DonorProofAPI(contractAddress, state$, deployed as DeployedDonorProofContract, logger);
  }

  static async join(
    providers: DonorProofProviders,
    contractAddress: ContractAddress,
    logger?: Logger,
  ): Promise<DonorProofAPI> {
    logger?.info({ contractAddress }, 'joinContract');
    const deployed = await findDeployedContract<DonorProofContract>(providers, {
      contractAddress,
      compiledContract: CompiledDonorProofContract,
      privateStateId: donorProofPrivateStateKey,
      initialPrivateState,
    });
    const state$ = buildState$(providers, contractAddress);
    return new DonorProofAPI(contractAddress, state$, deployed, logger);
  }
}

export * from './common-types.js';
