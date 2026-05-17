import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { Contract, Witnesses, DonorProofPrivateState } from '../../contract/src/index.js';

export type { DonorProofPrivateState } from '../../contract/src/index.js';

export const donorProofPrivateStateKey = 'donorProofPrivateState';
export type PrivateStateId = typeof donorProofPrivateStateKey;

export type PrivateStates = {
  readonly donorProofPrivateState: DonorProofPrivateState;
};

export type DonorProofContract = Contract<DonorProofPrivateState, Witnesses<DonorProofPrivateState>>;
export type DonorProofCircuitKeys = Exclude<keyof DonorProofContract['impureCircuits'], number | symbol>;
export type DonorProofProviders = MidnightProviders<DonorProofCircuitKeys, PrivateStateId, DonorProofPrivateState>;
export type DeployedDonorProofContract = FoundContract<DonorProofContract>;

export type CharityInfo = {
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly contractAddress: string;
};

export type ExpenseEntry = {
  readonly id: string;
  readonly amount: number;
  readonly category: 'food' | 'medical' | 'housing' | 'logistics' | 'admin';
  readonly isDirectAid: boolean;
  readonly isAdmin: boolean;
  readonly timestamp: string;
};

export type DonorProofLedgerState = {
  readonly campaignOwner: { bytes: Uint8Array };
  readonly directAidThreshold: bigint;
  readonly adminThreshold: bigint;
  readonly totalSpend: bigint;
  readonly directAidSpend: bigint;
  readonly adminSpend: bigint;
  readonly expenseChainHash: Uint8Array;
  readonly expenseSequence: bigint;
  readonly isVerified: boolean;
  readonly potHasCoin: boolean;
  readonly potValue: bigint;
};
