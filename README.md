# DonorProof

Privacy-preserving charity compliance on the Midnight blockchain.

Charities prove restricted donations were used correctly — in real time, without exposing the people they serve. Zero-knowledge proofs mean the expense data never leaves the charity; only the proof goes on-chain.

---

## How it works

1. **Deploy** a campaign contract with compliance thresholds (e.g. ≥85% direct aid, ≤10% admin)
2. **Commit expenses** as they occur — each call generates a ZK proof and extends a tamper-evident chain hash; the raw amounts stay private
3. **Verify compliance** — one on-chain transaction proves all thresholds were met without revealing individual expense records

The public sees: `isVerified = true`, total spend, category breakdown, chain hash.  
They do not see: expense IDs, beneficiary data, supplier names, or individual payment amounts.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 22 | [nodejs.org](https://nodejs.org) |
| Yarn | 1.22.22 | `npm i -g yarn` |
| Docker + Compose | any recent | [docker.com](https://docker.com) |
| Compact CLI | latest | `npm i -g @midnight-ntwrk/compact-cli` |

---

## Quick start

### 1. Install dependencies

```bash
yarn install
```

### 2. Start the local Midnight devnet

```bash
yarn env:up
```

This starts three Docker containers:
- **midnight-node** on port `9945`
- **indexer** on port `8089`
- **proof-server** on port `6301`

Wait until all containers are healthy (Docker Compose waits automatically with `--wait`).

### 3. Compile the contract

```bash
yarn compile:contract
```

This runs the full ZK compilation (generates proving and verifier keys). Takes ~30 seconds.  
Output goes to `contracts/managed/donor-proof/`.

### 4. Get a wallet seed

Any 64-character hex string works as a seed on the local devnet. The devnet faucet funds it automatically.

```bash
# Example seed (use any value for local testing)
export MIDNIGHT_SEED=0000000000000000000000000000000000000000000000000000000000000001
```

---

## CLI usage

All commands require `MIDNIGHT_SEED` to be set.

### Deploy a new campaign

```bash
MIDNIGHT_SEED=<seed> yarn cli deploy [--min-direct-aid 85] [--max-admin 10]
```

Deploys a new contract with your compliance thresholds. The deploying wallet becomes the immutable campaign owner. The contract address is saved to `.donor-proof-address.json`.

```
Deployed at: 16298cc6583fcb4300f001d0ed49289d0e9d4bae4a1062eccc4e5dc9651a828a
Thresholds:  direct-aid >= 85%  admin <= 10%
```

### Commit an expense

```bash
MIDNIGHT_SEED=<seed> yarn cli commit-expense --amount <n> --category <direct-aid|admin|logistics>
```

Submits one expense on-chain. Each call:
- generates a unique nullifier (prevents double-submission of the same expense)
- computes a cryptographic commitment binding the private expense details
- extends the tamper-evident chain hash
- updates public running totals

```bash
# £900 food aid
MIDNIGHT_SEED=<seed> yarn cli commit-expense --amount 900 --category direct-aid

# £150 admin
MIDNIGHT_SEED=<seed> yarn cli commit-expense --amount 150 --category admin
```

### Verify compliance

```bash
MIDNIGHT_SEED=<seed> yarn cli verify
```

Runs the on-chain ZK proof. Checks:
- `directAidSpend * 100 >= totalSpend * directAidThreshold`
- `adminSpend * 100 <= totalSpend * adminThreshold`

If both pass, `isVerified = true` is written to the ledger.

```
Verified. tx: 37a83809732a44a18e9f4c76a62f4cfe399811814ef5a5e4a39024f613c28f3b
```

### Check campaign status

```bash
MIDNIGHT_SEED=<seed> yarn cli status
```

```
Campaign:      16298cc6583fcb4300f001d0ed49289d0e9d4bae...
Status:        ● Verified
Expenses:      3
Total spend:   1500
Direct aid:    1350 (90%)
Admin:         150 (10%)
Thresholds:    direct-aid >= 85%   admin <= 10%
Chain hash:    a3f1c2e9b8d74...
```

### Connect to an existing contract

```bash
MIDNIGHT_SEED=<seed> yarn cli load [--address <contract-address>]
```

Reads state from the saved address (or an explicit `--address`). Useful for checking status without running a new command.

---

## Full demo flow

```bash
# Terminal — start devnet
yarn env:up

# Set your seed once
export MIDNIGHT_SEED=0000000000000000000000000000000000000000000000000000000000000001

# Deploy campaign: 85% direct-aid minimum, 10% admin cap
yarn cli deploy --min-direct-aid 85 --max-admin 10

# Commit three expenses (private amounts, public totals)
yarn cli commit-expense --amount 900  --category direct-aid   # food supplier
yarn cli commit-expense --amount 450  --category direct-aid   # medical supplies
yarn cli commit-expense --amount 150  --category admin        # operations

# Check current state
yarn cli status
# Total: 1500 | Direct aid: 1350 (90%) | Admin: 150 (10%)

# Prove compliance on-chain
yarn cli verify

# Confirm isVerified = true
yarn cli status
```

---

## Integration tests

The test suite deploys the contract and exercises all three circuits end-to-end against the local devnet.

```bash
# Devnet must be running first
yarn env:up

yarn test:local
```

Tests cover:
- Deploy with constructor thresholds
- `commitExpense` — totals update, sequence increments, chain hash extends
- `verifyCompliance` — `isVerified` flips to `true` when thresholds are met

---

## Project layout

```
contracts/
  donor-proof.compact       Compact smart contract (ZK circuits)
  index.ts                  Re-exports compiled contract types
  managed/donor-proof/      Generated artifacts (keys, ZKIR, contract)

src/
  index.ts                  CLI entry point
  launcher.ts               Wires wallet + providers + API
  api.ts                    DonorProofAPI class (deploy, commit, verify)
  witnesses.ts              Witness implementations + PendingExpense type
  providers.ts              Midnight provider wiring
  wallet.ts                 MidnightWalletProvider wrapper
  config.ts                 Network configuration
  logger.ts                 Pino logger
  test/
    donor-proof.test.ts     End-to-end integration tests

compose.yml                 Local devnet (node, indexer, proof-server)
package.json
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MIDNIGHT_SEED` | — | **Required.** 64-char hex wallet seed |
| `MIDNIGHT_NETWORK` | `local` | Network to connect to (`local` only for now) |
| `MIDNIGHT_HOST` | `127.0.0.1` | Devnet host |
| `MIDNIGHT_NODE_PORT` | `9945` | Node WebSocket port |
| `MIDNIGHT_INDEXER_PORT` | `8089` | Indexer HTTP/WS port |
| `MIDNIGHT_PROOF_SERVER_PORT` | `6301` | Proof server port |

---

## Scripts

| Command | Description |
|---------|-------------|
| `yarn compile:contract` | Compile Compact contract with full ZK key generation |
| `yarn env:up` | Start local Midnight devnet (Docker) |
| `yarn env:down` | Stop local devnet |
| `yarn cli <command>` | Run CLI (see above) |
| `yarn test:local` | Run integration tests against local devnet |
| `yarn typecheck` | TypeScript type check |

---

## Why Midnight

Midnight is the only production blockchain that combines programmable ZK proof generation with a public verification layer and a private data model as a first-class primitive.

- On **Ethereum**: choose between private *or* verifiable. Not both.
- On **Midnight**: the expense data never leaves the charity. The proof verifies on-chain. Both.

This is not a workaround. It is the first time a charity can make a mathematically verifiable compliance claim without violating the privacy of the people they serve.
