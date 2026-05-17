import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type MidnightWalletProvider } from './wallet.js';
import { type NetworkConfig } from './config.js';

export type DonorProofCircuits = 'commitExpense' | 'verifyCompliance';

export type DonorProofProviders = MidnightProviders<any>;

export function buildProviders(
  wallet: MidnightWalletProvider,
  zkConfigPath: string,
  config: NetworkConfig,
): DonorProofProviders {
  const zkConfigProvider = new NodeZkConfigProvider<DonorProofCircuits>(
    zkConfigPath,
  );

  const coinPubKeyHex = String(wallet.getCoinPublicKey()).slice(0, 32);
  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: `donor-proof-${coinPubKeyHex}`,
      privateStoragePasswordProvider: () => 'DonorProof-Test-Password',
      accountId: wallet.getCoinPublicKey(),
    }),
    publicDataProvider: indexerPublicDataProvider(
      config.indexer,
      config.indexerWS,
    ),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: wallet,
    midnightProvider: wallet,
  };
}
