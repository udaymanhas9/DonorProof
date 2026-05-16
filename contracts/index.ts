import { CompiledContract } from '@midnight-ntwrk/compact-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export {
  Contract,
  ledger,
  pureCircuits,
  type Ledger,
  type ImpureCircuits,
  type PureCircuits,
  type Witnesses,
} from './managed/donor-proof/contract/index.js';
import { Contract, type Witnesses } from './managed/donor-proof/contract/index.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const zkConfigPath = path.resolve(currentDir, 'managed', 'donor-proof');

export function createCompiledContract<PS>(witnesses: Witnesses<PS>) {
  return CompiledContract.make('DonorProofContract', Contract).pipe(
    CompiledContract.withWitnesses(witnesses),
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );
}
