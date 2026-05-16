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

export function getConfig(): NetworkConfig {
  const network = process.env['MIDNIGHT_NETWORK'] ?? 'local';
  if (network !== 'local') {
    throw new Error(
      `Unknown network: ${network}. This harness only supports 'local'.`,
    );
  }
  return LOCAL_CONFIG;
}
