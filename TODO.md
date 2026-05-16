# DonorProof — TODO

Gaps identified by comparing against kyc-midnight and reviewing Midnight feature utilisation.

---

## Blocker — Core Value Proposition Not Implemented

These items mean the proposition document is currently making promises the contract does not keep.
Fix these before anything else — without them, there is no reason this needs to be on Midnight.

- [x] **Implement per-expense hash commitments**
  Each `commitExpense()` call now computes `persistentCommit([id, amount, isDirectAid, isAdmin], blind)` and extends `expenseChainHash = persistentHash([expenseChainHash, commitment])`. The chain makes expense history append-only: retroactively inserting an expense would require changing every subsequent chain hash, which is immutable on-chain. The ZK proof for each call cryptographically links the private commitment to the publicly disclosed totals.

- [x] **Prove totals derive from committed hashes**
  Compact Maps don't support iteration, so `verifyCompliance()` cannot re-derive totals from a stored set. The link between commitments and totals is the ZK proof chain: each `commitExpense()` proof attests "I know private data that both generated this commitment AND updated these totals consistently." The chain of proofs is the cryptographic guarantee.

- [x] **Add a sequence/ordering anchor per expense**
  `expenseSequence: Counter` increments on every `commitExpense()`. Each expense is ordered by its sequence number; the chain hash preserves that order immutably.

- [ ] **Nullifier for double-submission prevention** ← implemented, but keep this note
  `expenseNullifiers: Set<Bytes<32>>` stores `persistentHash(["donorproof:nullifier", expenseId])` for each committed expense. Attempting to re-submit the same expense ID reverts the transaction.

---

## Critical — Midnight Features Not Being Used

- [ ] **Shielded donations via Zswap / NIGHT tokens**
  Currently donations are "simulated" (UI state only, no on-chain token flow). This is the biggest missed opportunity. Midnight's Zswap lets donors transfer NIGHT tokens privately with a restriction encoded in the witness — the charity cannot access the funds until `verifyCompliance()` passes.
  Fix: Add a `donorDeposit(restriction: Uint<8>)` circuit that locks NIGHT coins in the contract (using `receiveAndRetain` or equivalent Zswap stdlib function) with the restriction as a private witness. Add a `releaseFunds()` circuit that is only callable after `isVerified = true` and releases to the charity. This makes the donation real, the restriction enforced by the ZK proof, and the donor amount optionally shielded. **This is the one thing no other chain can do.**

- [ ] **Nullifiers to prevent double-submitting the same expense**
  Nothing stops the charity from calling `commitExpense()` with the same expense data twice. Add a nullifier: `persistentHash(["donor-proof:nullifier", expenseId, secretKey])` written to a `Set<Bytes<32>>` — assert it is not already a member before committing.

- [ ] **Donor coin public key for restriction tracing**
  If a donor makes a shielded deposit with a restriction, the restriction should be stored against their coin public key so `verifyCompliance()` can prove that their specific restriction category was met — not just that the overall aggregate passed.

---

## Critical — Contract Security

- [x] **Enforce campaign ownership in circuits**
  Added `circuit assertOnlyOwner()` using `ownPublicKey() == campaignOwner`. Both `commitExpense` and `verifyCompliance` now call this guard at entry.

- [x] **Replace `createCampaign` with a `constructor`**
  Removed `createCampaign` export circuit. Constructor takes `(minDirectAid, maxAdmin)` — the deploying wallet is automatically recorded as `campaignOwner` via `ownPublicKey()`. `campaignOwner`, `directAidThreshold`, and `adminThreshold` are now `sealed` (immutable after deploy).

---

## High — Application Layer (nothing runnable exists yet)

- [x] **Add a deploy/call API class** (`src/api.ts`)
  `DonorProofAPI` with `deploy()`, `findDeployed()`, lazy `state$` observable, `commitExpense(expense)`, `verifyCompliance()`. Witnesses close over a mutable `pendingExpense` slot — set before each call, cleared after. Contract address persisted to `.donor-proof-address.json`.

- [x] **Add a CLI entry point** (`src/index.ts`)
  Commands: `deploy`, `load`, `commit-expense --amount --category`, `verify`, `status`. Run with `yarn cli` (uses `npx tsx`).

- [x] **Add a standalone launcher** (`src/launcher.ts`)
  Wires `MidnightWalletProvider` + `buildProviders` + `DonorProofAPI` in one call. Saves/loads contract address from `.donor-proof-address.json`.

---

## Medium — Contract Expressiveness

- [ ] **Add query circuits that return values**
  All three circuits return `[]`. Add read-only circuits so callers don't have to parse raw ledger state:
  - `getCampaignStatus(): Boolean` — returns `isVerified`
  - `getSpendBreakdown(): [Uint<64>, Uint<64>, Uint<64>]` — returns `(totalSpend, directAidSpend, adminSpend)`
  - `getThresholds(): [Uint<8>, Uint<8>]` — returns `(directAidThreshold, adminThreshold)`

- [ ] **Track per-charity / per-campaign state with a Map**
  Currently the contract holds only one global campaign. KYC uses `Map<Bytes<32>, Attestation>` for per-user records.
  Consider `Map<Bytes<32>, CampaignState>` keyed by campaign owner public key to support multiple campaigns.

- [ ] **Add a `Counter` for campaign versioning / epoch**
  KYC tracks `epoch: Counter` and `instance: Counter`. Useful for invalidating stale proofs and supporting campaign upgrades.

---

## Medium — Network & Configuration

- [ ] **Add testnet configuration**
  `config.ts` throws for anything other than `'local'`. Add testnet endpoints (indexer, node, proof server) and a `MIDNIGHT_NETWORK=testnet` branch.

- [ ] **Add `findDeployedContract` support**
  The API layer should persist the deployed contract address (e.g., to a local file or env var) and be able to reconnect without redeploying.

---

## Low — Code Quality & Structure

- [ ] **Split contract into modules**
  KYC separates `Ownable.compact`, `Utils.compact`, `initializable.compact`. Extract ownership logic into its own module once the Ownable pattern is added.

- [ ] **Add CI workflow**
  KYC has `.github/workflows/`. Add at minimum: compile contract, type-check TypeScript, run vitest.

- [ ] **Add integration tests**
  KYC has `vitest.config.js` and `vitest.setup.js` in the CLI package. Add tests that deploy the contract locally and exercise all three circuits end-to-end.

- [x] **Fix `privateStateStoreName` uniqueness bug**
  `providers.ts` now derives the store name from the first 32 chars of the wallet's coin public key. Stable across restarts; no more leaking LevelDB stores on every provider build.

- [ ] **Add a UI (stretch)**
  KYC has `bboard-ui/` — React/Vite frontend with a `DeployedBoardContext` and `Board` component. A minimal donor-facing UI showing `isVerified`, spend breakdown, and thresholds would complete the demo story.
