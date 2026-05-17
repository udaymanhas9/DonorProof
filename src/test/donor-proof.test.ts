import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  deployContract,
  submitCallTx,
} from '@midnight-ntwrk/midnight-js-contracts';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import pino from 'pino';
import type { EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';

import { getConfig } from '../config.js';
import { buildProviders, type DonorProofProviders } from '../providers.js';
import { MidnightWalletProvider, syncWallet } from '../wallet.js';
import { ledger, zkConfigPath, createCompiledContract } from '../../contracts/index.js';
import { makeWitnesses, initialPrivateState, newExpenseId, newBlindingFactor } from '../witnesses.js';

// Required for GraphQL subscriptions in Node.js.
// @ts-expect-error WebSocket global assignment for apollo
globalThis.WebSocket = WebSocket;

const ALICE_SEED =
  '0000000000000000000000000000000000000000000000000000000000000001';
const ALICE_PRIVATE_STATE_ID = 'AlicePrivateDonorProofState';

const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport: { target: 'pino-pretty' },
});

// Demo campaign thresholds
const MIN_DIRECT_AID_PCT = 85n; // at least 85% must be direct aid
const MAX_ADMIN_PCT = 10n;      // admin must stay below 10%

describe('DonorProof Contract', () => {
  let aliceWallet: MidnightWalletProvider;
  let aliceProviders: DonorProofProviders;
  let contractAddress: ContractAddress;

  const config = getConfig();

  async function queryLedger(providers: DonorProofProviders) {
    const state =
      await providers.publicDataProvider.queryContractState(contractAddress);
    expect(state).not.toBeNull();
    return ledger(state!.data);
  }

  beforeAll(async () => {
    setNetworkId(config.networkId);

    const envConfig: EnvironmentConfiguration = {
      walletNetworkId: config.networkId,
      networkId: config.networkId,
      indexer: config.indexer,
      indexerWS: config.indexerWS,
      node: config.node,
      nodeWS: config.nodeWS,
      faucet: config.faucet,
      proofServer: config.proofServer,
    };

    aliceWallet = await MidnightWalletProvider.build(
      logger,
      envConfig,
      ALICE_SEED,
    );
    await aliceWallet.start();
    await syncWallet(logger, aliceWallet.wallet, 600_000);

    aliceProviders = buildProviders(aliceWallet, zkConfigPath, config);
    logger.info('Providers initialized. Ready to test.');
  }, 300_000);

  afterAll(async () => {
    if (aliceWallet) {
      logger.info('Stopping Alice wallet...');
      await aliceWallet.stop();
    }
  });

  it('deploys the contract with compliance thresholds', async () => {
    // Constructor takes (minDirectAid, maxAdmin) — the deploying wallet is
    // automatically recorded as campaignOwner.
    const compiled = createCompiledContract(makeWitnesses());

    const deployed: any = await (deployContract as any)(aliceProviders, {
      compiledContract: compiled,
      privateStateId: ALICE_PRIVATE_STATE_ID,
      initialPrivateState,
      args: [MIN_DIRECT_AID_PCT, MAX_ADMIN_PCT],
    });

    contractAddress = deployed.deployTxData.public.contractAddress;
    expect(contractAddress).toBeDefined();

    const state = await queryLedger(aliceProviders);
    expect(state.directAidThreshold).toEqual(MIN_DIRECT_AID_PCT);
    expect(state.adminThreshold).toEqual(MAX_ADMIN_PCT);
    expect(state.isVerified).toEqual(false);
    expect(state.totalSpend).toEqual(0n);
    logger.info(`Contract deployed at: ${contractAddress}`);
  }, 120_000);

  it('commits a food-aid expense (private: £900)', async () => {
    const compiled = createCompiledContract(makeWitnesses({
      expenseId: newExpenseId(),
      blindingFactor: newBlindingFactor(),
      amount: 900n,
      isDirectAid: true,
      isAdmin: false,
    }));

    await (submitCallTx as any)(aliceProviders, {
      compiledContract: compiled,
      contractAddress,
      privateStateId: ALICE_PRIVATE_STATE_ID,
      circuitId: 'commitExpense',
      args: [],
    });

    const state = await queryLedger(aliceProviders);
    expect(state.totalSpend).toEqual(900n);
    expect(state.directAidSpend).toEqual(900n);
    expect(state.adminSpend).toEqual(0n);
    expect(state.expenseSequence).toEqual(1n);
    expect(state.expenseChainHash).toBeDefined();
    logger.info(`Expense 1 committed. totalSpend=${state.totalSpend}, directAid=${state.directAidSpend}`);
  }, 120_000);

  it('commits a medical expense (private: £450)', async () => {
    const compiled = createCompiledContract(makeWitnesses({
      expenseId: newExpenseId(),
      blindingFactor: newBlindingFactor(),
      amount: 450n,
      isDirectAid: true,
      isAdmin: false,
    }));

    await (submitCallTx as any)(aliceProviders, {
      compiledContract: compiled,
      contractAddress,
      privateStateId: ALICE_PRIVATE_STATE_ID,
      circuitId: 'commitExpense',
      args: [],
    });

    const state = await queryLedger(aliceProviders);
    expect(state.totalSpend).toEqual(1350n);
    expect(state.directAidSpend).toEqual(1350n);
    expect(state.expenseSequence).toEqual(2n);
    logger.info(`Expense 2 committed. totalSpend=${state.totalSpend}, directAid=${state.directAidSpend}`);
  }, 120_000);

  it('commits an admin expense (private: £150)', async () => {
    const compiled = createCompiledContract(makeWitnesses({
      expenseId: newExpenseId(),
      blindingFactor: newBlindingFactor(),
      amount: 150n,
      isDirectAid: false,
      isAdmin: true,
    }));

    await (submitCallTx as any)(aliceProviders, {
      compiledContract: compiled,
      contractAddress,
      privateStateId: ALICE_PRIVATE_STATE_ID,
      circuitId: 'commitExpense',
      args: [],
    });

    const state = await queryLedger(aliceProviders);
    expect(state.totalSpend).toEqual(1500n);
    expect(state.directAidSpend).toEqual(1350n);
    expect(state.adminSpend).toEqual(150n);
    expect(state.expenseSequence).toEqual(3n);
    logger.info(`Expense 3 committed. totalSpend=${state.totalSpend}, admin=${state.adminSpend}`);
  }, 120_000);

  it('verifies compliance — directAid 90%, admin 10%', async () => {
    const compiled = createCompiledContract(makeWitnesses());

    await (submitCallTx as any)(aliceProviders, {
      compiledContract: compiled,
      contractAddress,
      privateStateId: ALICE_PRIVATE_STATE_ID,
      circuitId: 'verifyCompliance',
      args: [],
    });

    const state = await queryLedger(aliceProviders);
    expect(state.isVerified).toEqual(true);

    // Compute percentages off-chain from public totals (Compact has no division).
    const directAidPct = Number(state.directAidSpend * 100n / state.totalSpend);
    const adminPct = Number(state.adminSpend * 100n / state.totalSpend);

    expect(directAidPct).toBeGreaterThanOrEqual(Number(MIN_DIRECT_AID_PCT));
    expect(adminPct).toBeLessThanOrEqual(Number(MAX_ADMIN_PCT));

    logger.info(
      `Compliance verified. directAid=${directAidPct}% (>=${MIN_DIRECT_AID_PCT}%), ` +
      `admin=${adminPct}% (<=${MAX_ADMIN_PCT}%)`
    );
  }, 120_000);
});
