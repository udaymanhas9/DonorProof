export type NetworkConfig = {
  networkId: string;
  indexer: string;
  indexerWS: string;
  node: string;
  nodeWS: string;
  proofServer: string;
  faucet: string;
};

const host = process.env['MIDNIGHT_HOST'] ?? '127.0.0.1';
const nodePort = process.env['MIDNIGHT_NODE_PORT'] ?? '9945';
const indexerPort = process.env['MIDNIGHT_INDEXER_PORT'] ?? '8089';
const proofServerPort = process.env['MIDNIGHT_PROOF_SERVER_PORT'] ?? '6301';

export const LOCAL_CONFIG: NetworkConfig = {
  networkId: 'undeployed',
  indexer: `http://${host}:${indexerPort}/api/v4/graphql`,
  indexerWS: `ws://${host}:${indexerPort}/api/v4/graphql/ws`,
  node: `http://${host}:${nodePort}`,
  nodeWS: `ws://${host}:${nodePort}`,
  proofServer: `http://${host}:${proofServerPort}`,
  faucet: '',
};

export const PREPROD_CONFIG: NetworkConfig = {
  networkId: 'preprod',
  indexer: 'https://indexer.preprod.midnight.network/api/v3/graphql',
  indexerWS: 'wss://indexer.preprod.midnight.network/api/v3/graphql/ws',
  node: 'https://rpc.preprod.midnight.network',
  nodeWS: 'wss://rpc.preprod.midnight.network',
  proofServer: process.env['MIDNIGHT_PROOF_SERVER'] ?? 'http://127.0.0.1:6301',
  faucet: 'https://faucet.preprod.midnight.network/api/request-tokens',
};

export const PREVIEW_CONFIG: NetworkConfig = {
  networkId: 'preview',
  indexer: 'https://indexer.preview.midnight.network/api/v3/graphql',
  indexerWS: 'wss://indexer.preview.midnight.network/api/v3/graphql/ws',
  node: 'https://rpc.preview.midnight.network',
  nodeWS: 'wss://rpc.preview.midnight.network',
  proofServer: process.env['MIDNIGHT_PROOF_SERVER'] ?? 'http://127.0.0.1:6301',
  faucet: 'https://faucet.preview.midnight.network/api/request-tokens',
};

export function getConfig(): NetworkConfig {
  const network = process.env['MIDNIGHT_NETWORK'] ?? 'local';
  switch (network) {
    case 'local': return LOCAL_CONFIG;
    case 'preprod': return PREPROD_CONFIG;
    case 'preview': return PREVIEW_CONFIG;
    default:
      throw new Error(
        `Unknown network: "${network}". Set MIDNIGHT_NETWORK to local, preprod, or preview.`,
      );
  }
}
