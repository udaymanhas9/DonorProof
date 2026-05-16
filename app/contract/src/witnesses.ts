import { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import { Ledger } from "./managed/donor-proof/contract/index.js";

export type DonorProofPrivateState = Record<string, never>;

export const initialPrivateState: DonorProofPrivateState = {};
export const donorProofPrivateStateKey = "donorProofPrivateState";

export type PendingExpense = {
  expenseId: Uint8Array;
  blindingFactor: Uint8Array;
  amount: bigint;
  isDirectAid: boolean;
  isAdmin: boolean;
};

let _pendingExpense: PendingExpense | null = null;

export function setPendingExpense(expense: PendingExpense | null): void {
  _pendingExpense = expense;
}

export function newExpenseId(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function newBlindingFactor(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export const witnesses = {
  expenseId: ({ privateState }: WitnessContext<Ledger, DonorProofPrivateState>): [DonorProofPrivateState, Uint8Array] =>
    [privateState, _pendingExpense?.expenseId ?? new Uint8Array(32)],

  expenseBlind: ({ privateState }: WitnessContext<Ledger, DonorProofPrivateState>): [DonorProofPrivateState, Uint8Array] =>
    [privateState, _pendingExpense?.blindingFactor ?? new Uint8Array(32)],

  expenseAmount: ({ privateState }: WitnessContext<Ledger, DonorProofPrivateState>): [DonorProofPrivateState, bigint] =>
    [privateState, _pendingExpense?.amount ?? 0n],

  expenseIsDirectAid: ({ privateState }: WitnessContext<Ledger, DonorProofPrivateState>): [DonorProofPrivateState, boolean] =>
    [privateState, _pendingExpense?.isDirectAid ?? false],

  expenseIsAdmin: ({ privateState }: WitnessContext<Ledger, DonorProofPrivateState>): [DonorProofPrivateState, boolean] =>
    [privateState, _pendingExpense?.isAdmin ?? false],
};
