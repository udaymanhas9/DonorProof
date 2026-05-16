#!/usr/bin/env node
/**
 * DonorProof CLI
 *
 * Usage:
 *   npx tsx src/index.ts deploy [--min-direct-aid 85] [--max-admin 10]
 *   npx tsx src/index.ts load [--address <contract-address>]
 *   npx tsx src/index.ts commit-expense --amount <n> --category <direct-aid|admin|logistics>
 *   npx tsx src/index.ts verify
 *   npx tsx src/index.ts status
 *
 * Environment:
 *   MIDNIGHT_SEED        Wallet seed phrase (required)
 *   MIDNIGHT_NETWORK     'local' (default) or 'testnet'
 *   MIDNIGHT_HOST        Node host for local devnet (default: 127.0.0.1)
 */

import { launch } from './launcher.js';
import { newExpenseId, newBlindingFactor } from './api.js';
import { firstValueFrom } from 'rxjs';

const args = process.argv.slice(2);
const command = args[0];

function flag(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

function requireFlag(name: string): string {
  const v = flag(name);
  if (!v) { console.error(`Missing --${name}`); process.exit(1); }
  return v;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) { console.error(`Missing env var ${name}`); process.exit(1); }
  return v;
}

async function main(): Promise<void> {
  if (!command || command === 'help') {
    console.log(`
DonorProof CLI

  deploy              Deploy a new campaign contract
    --min-direct-aid  Minimum direct-aid percentage (default 85)
    --max-admin       Maximum admin spend percentage (default 10)

  load                Connect to an existing contract
    --address         Contract address (optional; falls back to saved address)

  commit-expense      Commit a single expense on-chain
    --amount          Amount in smallest unit (required)
    --category        direct-aid | admin | logistics (required)

  verify              Run the compliance proof on-chain

  status              Print the current campaign state

Environment:
  MIDNIGHT_SEED       Wallet seed (required for all commands)
  MIDNIGHT_NETWORK    local | testnet (default: local)
    `);
    return;
  }

  const seed = requireEnv('MIDNIGHT_SEED');

  if (command === 'deploy') {
    const minDirectAid = BigInt(flag('min-direct-aid') ?? '85');
    const maxAdmin = BigInt(flag('max-admin') ?? '10');
    const { api } = await launch({ seed, action: 'deploy', minDirectAid, maxAdmin });
    console.log(`\nDeployed at: ${String(api.contractAddress)}`);
    console.log(`Thresholds:  direct-aid >= ${minDirectAid}%  admin <= ${maxAdmin}%`);
    return;
  }

  if (command === 'load') {
    const contractAddress = flag('address');
    const { api } = await launch({ seed, action: 'load', contractAddress });
    const state = await firstValueFrom(api.state$);
    console.log(`\nConnected to: ${String(api.contractAddress)}`);
    console.log(`Verified:     ${state.isVerified}`);
    console.log(`Expenses:     ${state.expenseSequence}`);
    console.log(`Total spend:  ${state.totalSpend}`);
    return;
  }

  if (command === 'commit-expense') {
    const amount = BigInt(requireFlag('amount'));
    const category = requireFlag('category');

    const isDirectAid = category === 'direct-aid';
    const isAdmin = category === 'admin';

    if (!isDirectAid && !isAdmin && category !== 'logistics') {
      console.error('--category must be one of: direct-aid, admin, logistics');
      process.exit(1);
    }

    const { api } = await launch({ seed, action: 'load', contractAddress: flag('address') });

    const expense = {
      expenseId: newExpenseId(),
      blindingFactor: newBlindingFactor(),
      amount,
      isDirectAid,
      isAdmin,
    };

    console.log(`Committing expense: amount=${amount} category=${category}`);
    const txHash = await api.commitExpense(expense);
    console.log(`\nCommitted. tx: ${txHash}`);
    return;
  }

  if (command === 'verify') {
    const { api } = await launch({ seed, action: 'load', contractAddress: flag('address') });
    console.log('Submitting compliance proof...');
    const txHash = await api.verifyCompliance();
    console.log(`\nVerified. tx: ${txHash}`);
    return;
  }

  if (command === 'status') {
    const { api } = await launch({ seed, action: 'load', contractAddress: flag('address') });
    const state = await firstValueFrom(api.state$);

    const directAidPct = state.totalSpend > 0n
      ? Number((state.directAidSpend * 100n) / state.totalSpend)
      : 0;
    const adminPct = state.totalSpend > 0n
      ? Number((state.adminSpend * 100n) / state.totalSpend)
      : 0;

    console.log(`
Campaign:      ${String(api.contractAddress)}
Status:        ${state.isVerified ? '● Verified' : '○ Pending'}
Expenses:      ${state.expenseSequence}
Total spend:   ${state.totalSpend}
Direct aid:    ${state.directAidSpend} (${directAidPct}%)
Admin:         ${state.adminSpend} (${adminPct}%)
Thresholds:    direct-aid >= ${state.directAidThreshold}%   admin <= ${state.adminThreshold}%
Chain hash:    ${Buffer.from(state.expenseChainHash).toString('hex').slice(0, 16)}...
    `);
    return;
  }

  console.error(`Unknown command: ${command}. Run with 'help' for usage.`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
