import { createLogger } from './logger.js';
import { MidnightWalletProvider, syncWallet } from './wallet.js';
import { buildProviders } from './providers.js';
import { getConfig } from './config.js';
import { zkConfigPath } from '../contracts/index.js';
import { DonorProofAPI } from './api.js';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ADDRESS_FILE = '.donor-proof-address.json';

export type LaunchResult = {
  api: DonorProofAPI;
  wallet: MidnightWalletProvider;
};

export type LaunchOptions = {
  seed: string;
  action: 'deploy' | 'load';
  contractAddress?: string;
  minDirectAid?: bigint;
  maxAdmin?: bigint;
};

export async function launch(opts: LaunchOptions): Promise<LaunchResult> {
  const logger = createLogger('launcher');
  const config = getConfig();

  setNetworkId(config.networkId as Parameters<typeof setNetworkId>[0]);

  logger.info({ action: 'starting wallet', network: config.networkId });
  const env = {
    walletNetworkId: config.networkId,
    networkId: config.networkId,
    indexer: config.indexer,
    indexerWS: config.indexerWS,
    node: config.node,
    nodeWS: config.nodeWS,
    proofServer: config.proofServer,
    faucet: config.faucet,
  };

  const wallet = await MidnightWalletProvider.build(logger, env as Parameters<typeof MidnightWalletProvider.build>[1], opts.seed);
  await wallet.start();
  await syncWallet(logger, wallet.wallet);

  const providers = buildProviders(wallet, zkConfigPath, config);

  let api: DonorProofAPI;

  if (opts.action === 'deploy') {
    const minDirectAid = opts.minDirectAid ?? 85n;
    const maxAdmin = opts.maxAdmin ?? 10n;
    api = await DonorProofAPI.deploy(providers, minDirectAid, maxAdmin, logger);
    saveAddress(api.contractAddress as unknown as string);
    logger.info({ message: 'Contract deployed', address: api.contractAddress });
  } else {
    const address = opts.contractAddress ?? loadAddress();
    if (!address) throw new Error('No contract address. Run deploy first.');
    api = await DonorProofAPI.findDeployed(providers, address as unknown as ContractAddress, logger);
    logger.info({ message: 'Connected to existing contract', address });
  }

  return { api, wallet };
}

function saveAddress(address: string): void {
  writeFileSync(ADDRESS_FILE, JSON.stringify({ address }, null, 2));
}

function loadAddress(): string | undefined {
  if (!existsSync(ADDRESS_FILE)) return undefined;
  try {
    const data = JSON.parse(readFileSync(ADDRESS_FILE, 'utf-8')) as { address?: string };
    return data.address;
  } catch {
    return undefined;
  }
}
