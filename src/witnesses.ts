import { randomBytes } from 'node:crypto';
import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Ledger, Witnesses } from '../contracts/managed/donor-proof/contract/index.js';

export type PendingExpense = {
  expenseId: Uint8Array;      // 32-byte unique identifier from the charity's books
  blindingFactor: Uint8Array; // 32-byte random blinding factor for the commitment
  amount: bigint;
  isDirectAid: boolean;
  isAdmin: boolean;
};

// Private state is empty — witnesses capture expense data via closure.
export type PrivateState = Record<string, never>;

export const initialPrivateState: PrivateState = {};

// Generate a fresh expense ID and blinding factor for a new expense.
export function newExpenseId(): Uint8Array {
  return randomBytes(32);
}

export function newBlindingFactor(): Uint8Array {
  return randomBytes(32);
}

// Returns witnesses that supply the given expense's private inputs to the circuit.
// Create a fresh instance per commitExpense call — the closure captures the expense.
export function makeWitnesses(expense?: PendingExpense): Witnesses<PrivateState> {
  return {
    expenseId(context: WitnessContext<Ledger, PrivateState>): [PrivateState, Uint8Array] {
      return [context.privateState, expense?.expenseId ?? new Uint8Array(32)];
    },
    expenseBlind(context: WitnessContext<Ledger, PrivateState>): [PrivateState, Uint8Array] {
      return [context.privateState, expense?.blindingFactor ?? new Uint8Array(32)];
    },
    expenseAmount(context: WitnessContext<Ledger, PrivateState>): [PrivateState, bigint] {
      return [context.privateState, expense?.amount ?? 0n];
    },
    expenseIsDirectAid(context: WitnessContext<Ledger, PrivateState>): [PrivateState, boolean] {
      return [context.privateState, expense?.isDirectAid ?? false];
    },
    expenseIsAdmin(context: WitnessContext<Ledger, PrivateState>): [PrivateState, boolean] {
      return [context.privateState, expense?.isAdmin ?? false];
    },
  };
}
