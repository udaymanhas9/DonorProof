import { CompiledContract } from "@midnight-ntwrk/compact-js";

export * from "./managed/donor-proof/contract/index.js";
export * from "./witnesses.js";

import * as CompiledDonorProof from "./managed/donor-proof/contract/index.js";
import * as Witnesses from "./witnesses.js";

export const CompiledDonorProofContract = CompiledContract.make<
  CompiledDonorProof.Contract<Witnesses.DonorProofPrivateState>
>("DonorProof", CompiledDonorProof.Contract<Witnesses.DonorProofPrivateState>).pipe(
  CompiledContract.withWitnesses(Witnesses.witnesses),
  CompiledContract.withCompiledFileAssets("./managed/donor-proof"),
);
