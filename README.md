# DonorProof

Privacy-preserving charity compliance on the Midnight blockchain.

Charities prove restricted donations were used correctly — in real time, without exposing the people they serve. Zero-knowledge proofs mean the expense data never leaves the charity; only the proof goes on-chain. Donors lock shielded NIGHT tokens with a spending restriction that is cryptographically enforced.

---

## How it works

1. **Donors deposit** shielded NIGHT tokens with a category restriction (food, medical, housing, or unrestricted). Funds are locked in the contract until compliance is proved.
2. **Charities commit expenses** as they occur — each call generates a ZK proof and extends a tamper-evident chain hash; raw amounts stay private.
3. **Verify compliance** — one on-chain transaction proves all thresholds were met without revealing individual expense records. `isVerified` flips to `true`.
4. **Release funds** — once verified, the charity owner can withdraw the full pooled balance to their wallet.

**Public on-chain:** `isVerified`, total spend, category breakdown, chain hash, nullifier set.  
**Private (never leaves the device):** expense IDs, blinding factors, beneficiary data, supplier names, individual amounts.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 22 | [nodejs.org](https://nodejs.org) |
| Yarn | 1.22.22 | `npm i -g yarn` |
| Docker + Compose | any recent | [docker.com](https://docker.com) |
| Compact CLI | latest | `npm i -g @midnight-ntwrk/compact-cli` |

For the browser UI, install the **Midnight Lace** wallet extension and set it to your chosen network.

---

## Quick start — local devnet

### 1. Install dependencies

```bash
yarn install
```

### 2. Start the local Midnight devnet

```bash
yarn env:up
```

Starts three Docker containers: `midnight-node` (9945), `indexer` (8089), `proof-server` (6301).

### 3. Compile the contract

```bash
yarn compile:contract
```

Runs full ZK compilation (generates proving + verifier keys). Takes ~60 seconds.  
Output: `contracts/managed/donor-proof/`

### 4. Set your wallet seed

```bash
export MIDNIGHT_SEED=0000000000000000000000000000000000000000000000000000000000000001
```

Any 64-character hex string works on the local devnet. The faucet funds it automatically.

---

## CLI usage

All commands require `MIDNIGHT_SEED` to be set. All support `MIDNIGHT_NETWORK=local|preprod|preview`.

### Deploy a new campaign

```bash
MIDNIGHT_SEED=<seed> yarn cli deploy [--min-direct-aid 85] [--max-admin 10]
```

Deploys a contract with your compliance thresholds. The deploying wallet becomes the immutable campaign owner. Address saved to `.donor-proof-address.json`.

### Commit an expense

```bash
MIDNIGHT_SEED=<seed> yarn cli commit-expense --amount <n> --category <direct-aid|admin|logistics>
```

Each call: generates a nullifier (prevents double-submission), computes a commitment, extends the chain hash, updates public running totals.

```bash
yarn cli commit-expense --amount 900  --category direct-aid
yarn cli commit-expense --amount 450  --category direct-aid
yarn cli commit-expense --amount 150  --category admin
```

### Verify compliance

```bash
MIDNIGHT_SEED=<seed> yarn cli verify
```

Runs the on-chain ZK proof. If thresholds pass, `isVerified = true` is written to the ledger.

### Check status

```bash
MIDNIGHT_SEED=<seed> yarn cli status
```

### Connect to an existing contract

```bash
MIDNIGHT_SEED=<seed> yarn cli load [--address <contract-address>]
```

---

## Full demo flow

```bash
yarn env:up
export MIDNIGHT_SEED=0000000000000000000000000000000000000000000000000000000000000001

yarn cli deploy --min-direct-aid 85 --max-admin 10
yarn cli commit-expense --amount 900  --category direct-aid
yarn cli commit-expense --amount 450  --category direct-aid
yarn cli commit-expense --amount 150  --category admin
yarn cli status    # Total: 1500 | Direct aid: 90% | Admin: 10%
yarn cli verify
yarn cli status    # Status: ● Verified
```

---

## Browser UI

The React frontend lets donors view campaigns, donate with a restriction, and lets charity owners log expenses, run the compliance proof, and release funds.

### Run locally (demo mode — no wallet required)

```bash
cd app/bboard-ui
npm run dev
```

Opens at `http://localhost:5173`. Choose **Browse as Donor** or **Manage as Charity** on the login screen — no wallet extension needed.

### Run against preprod testnet

```bash
cd app/bboard-ui
npm run dev:preprod
```

Requires Midnight Lace set to `preprod` network. The wallet provides all endpoint URLs automatically.

### Build for production (preprod)

```bash
cd app/bboard-ui
npm run build        # builds against preprod, bundles ZK keys
npm run start        # serves on a random port
```

Produces a fully static site in `dist/` with all ZK prover/verifier keys bundled. Serve from any static host.

### Build for preview testnet

```bash
npm run build:preview
npm run start
```

---

## Testnet usage (CLI)

Set `MIDNIGHT_NETWORK` to connect to a public testnet. You still need a local proof server running.

```bash
# preprod
MIDNIGHT_NETWORK=preprod MIDNIGHT_SEED=<seed> yarn cli deploy

# preview
MIDNIGHT_NETWORK=preview MIDNIGHT_SEED=<seed> yarn cli deploy
```

The proof server must be running locally (Docker). Set `MIDNIGHT_PROOF_SERVER=http://127.0.0.1:6301` if it's on a non-default port.

For devnet faucet tokens on preprod/preview, use the web faucet:
- preprod: `https://faucet.preprod.midnight.network`
- preview: `https://faucet.preview.midnight.network`

---

## Project layout

```
contracts/
  donor-proof.compact          Compact smart contract (4 ZK circuits)
  managed/donor-proof/         Generated artifacts — gitignored (keys, ZKIR, types)

src/
  index.ts                     CLI entry point
  launcher.ts                  Wallet + provider wiring
  api.ts                       DonorProofAPI (deploy, join, commitExpense, verify)
  witnesses.ts                 Witness implementations
  providers.ts                 Midnight provider builder
  config.ts                    Network config (local / preprod / preview)

app/
  contract/                    Browser-safe contract package
    src/
      donor-proof.compact      Contract source (mirrors contracts/)
      witnesses.ts             Browser witnesses (Web Crypto, no Node.js)
      managed/donor-proof/     Generated types + ZK keys (gitignored)
  api/                         Shared API types and DonorProofAPI for the UI
    src/
      index.ts                 DonorProofAPI class
      common-types.ts          Shared TypeScript types
  bboard-ui/                   React/Vite frontend
    src/
      contexts/                DonorProofContext — wallet, state, all actions
      pages/                   Landing, Charities, CampaignPage, Dashboard,
                               Expenses, RunProof, PrivateLedger
      components/              Header, CharityCard, ProofBadge, SpendBar, etc.
      config/                  Theme, mock data
    .env.local                 Local devnet (VITE_NETWORK_ID=undeployed)
    .env.preprod               Preprod testnet (VITE_NETWORK_ID=preprod)
    .env.preview               Preview testnet (VITE_NETWORK_ID=preview)

compose.yml                    Local devnet Docker Compose
.env.example                   Environment variable reference
```

---

## Environment variables

### CLI / Node.js

| Variable | Default | Description |
|----------|---------|-------------|
| `MIDNIGHT_SEED` | — | **Required.** 64-char hex wallet seed |
| `MIDNIGHT_NETWORK` | `local` | `local`, `preprod`, or `preview` |
| `MIDNIGHT_HOST` | `127.0.0.1` | Local devnet host |
| `MIDNIGHT_NODE_PORT` | `9945` | Node port (local only) |
| `MIDNIGHT_INDEXER_PORT` | `8089` | Indexer port (local only) |
| `MIDNIGHT_PROOF_SERVER_PORT` | `6301` | Proof server port (local only) |
| `MIDNIGHT_PROOF_SERVER` | `http://127.0.0.1:6301` | Proof server URL (preprod/preview) |

### Browser UI (Vite)

| Variable | Values | Description |
|----------|--------|-------------|
| `VITE_NETWORK_ID` | `undeployed` / `preprod` / `preview` | Midnight network for wallet connection |
| `VITE_LOGGING_LEVEL` | `info` / `trace` | Pino log level |

---

## Scripts

### Root

| Command | Description |
|---------|-------------|
| `yarn compile:contract` | Full ZK compilation (generates keys) |
| `yarn env:up` | Start local devnet (Docker) |
| `yarn env:down` | Stop local devnet |
| `yarn cli <command>` | Run CLI |
| `yarn test:local` | Integration tests against local devnet |
| `yarn typecheck` | TypeScript check |

### UI (`app/bboard-ui`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server against local devnet |
| `npm run dev:preprod` | Dev server against preprod testnet |
| `npm run dev:preview` | Dev server against preview testnet |
| `npm run build` | Production build (preprod) with ZK keys bundled |
| `npm run build:preview` | Production build (preview) |
| `npm run start` | Serve production build |

---

## Privacy model

| Data | Visibility |
|------|-----------|
| Expense amount | Private — never disclosed |
| Expense ID / blinding factor | Private — never disclosed |
| Category (direct-aid / admin) | Public — needed to update on-chain totals |
| Aggregate totals (`totalSpend`, `directAidSpend`, `adminSpend`) | Public |
| Commitment hash per expense | Public — cryptographic fingerprint only |
| Nullifier per expense | Public — proves no double-submission |
| `isVerified` | Public |
| Donor's coin public key | Public — disclosed to record restriction |
| Donated amount per donor | Public — recorded against coin public key |
| Pot balance | Public — visible as `pot.value` |

---

## Why Midnight

Midnight is the only blockchain that combines programmable ZK proof generation with a public verification layer and a private data model as a first-class primitive.

- On **Ethereum**: choose between private *or* verifiable. Not both.
- On **Midnight**: expense data never leaves the charity. The proof verifies on-chain. Both.

This is not a workaround. It is the first time a charity can make a mathematically verifiable compliance claim without violating the privacy of the people they serve.
