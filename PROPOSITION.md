# DonorProof — Proposition

---

## The Problem

Restricted charitable donations are broken on both sides.

**Donors** give money with conditions — food aid, medical support, housing — and have no mechanism to verify those conditions were met. They receive an annual report, written by the charity, reviewed by an auditor the charity hired. They are asked to trust a system that is structurally incentivised to present the charity favourably.

**Charities** face the inverse problem. They want to prove compliance, but the data that would prove it — beneficiary names, case records, supplier relationships, payment references, operational locations — is exactly the data they are legally and ethically obligated to protect. Publishing it violates GDPR, UK safeguarding law, and donor trust in vulnerable populations. Redacting it destroys its evidentiary value.

The result: charities cannot prove what they have done, and donors cannot verify it. The only resolution is trust, and trust in the charity sector is declining.

---

## Why This Cannot Be Solved Without Midnight

The constraint is not technical laziness. It is mathematically unavoidable without zero-knowledge proofs.

**Option A — Publish the expense data:**
Donors can verify compliance. Charities violate GDPR, expose beneficiaries, and face regulatory consequences. Non-starter.

**Option B — Encrypt the expense data on a regular blockchain:**
Privacy is preserved. But encryption is opaque — you can commit a hash and prove you committed it, but you cannot prove anything about the contents of that hash without revealing the data. Verification is impossible.

**Option C — Zero-knowledge proof over private data:**
The expense data never leaves the charity. A cryptographic proof is generated locally, verified on-chain. The proof attests that the private data satisfies the compliance conditions. The conditions are met or they are not. No data is exposed.

This is only possible on Midnight. No other production blockchain combines programmable ZK proof generation with a public verification layer and a private data model as a first-class primitive. On Ethereum you must choose between private or verifiable. On Midnight you get both.

---

## What DonorProof Does

DonorProof is a Midnight-native compliance layer for restricted charitable donations.

**Core mechanism — commit at expense time:**

When a charity incurs an expense, it immediately commits a hash of the expense record to the Midnight ledger. This commitment is permanent and timestamped. The underlying data — supplier, amount, beneficiary, payment reference — stays private.

When a campaign closes or a reporting period ends, the charity generates a ZK proof against those committed hashes. The proof attests that:

- Total expenses do not exceed total donations received
- Food-restricted donations were matched only to food-category expenses
- Medical-restricted donations were matched only to medical-category expenses
- Direct aid spend meets the declared threshold (e.g. ≥ 85%)
- Admin spend does not exceed the declared cap (e.g. ≤ 10%)

The public sees the proof result. They do not see what is behind it.

**Why committing at expense time matters:**

Annual reports can be written retroactively to fit any narrative. A commitment made on the day a payment occurred cannot. If a charity commits expense hashes continuously, the sequence of commitments is tamper-evident. A later proof can only be run against data that was committed at the time of spending. You cannot reclassify a payment from admin to food after the fact — the commitment timestamp is on-chain and immutable.

This does not require an auditor. It does not require the charity to pay suppliers on-chain. It requires only that the charity records expenses in real time rather than assembling them at year-end.

---

## Why a Charity Signs Up

### 1. Regulatory compliance is already mandatory — this makes it cheaper

UK charities with income over £25,000 must file with the Charity Commission. US nonprofits file 990s with the IRS. Most jurisdictions have mandatory fund-use reporting. DonorProof does not add a compliance burden. It converts an existing annual burden into a continuous automated process that produces better evidence at lower cost.

### 2. Donor retention depends on trust signals

Donor trust in charities is at a long-term low. Charities that can demonstrate compliance provably rather than assertively have a differentiator. A "Verified on DonorProof" badge is a stronger signal than a PDF audit report because it cannot be edited.

### 3. Beneficiary protection is a legal obligation, not a preference

GDPR Article 9 classifies data on vulnerable populations as special category data requiring explicit protection. Charities that publish detailed spending data risk regulatory exposure. DonorProof lets them prove compliance without publishing anything that creates that exposure.

### 4. Restricted grant reporting is a pain point with real cost

Many large grants (government, institutional, foundation) require detailed restricted fund reporting. This currently involves manual reconciliation, narrative reports, and auditor review. A continuous on-chain commitment record with generated compliance proofs can serve as primary evidence, reducing the audit and reporting overhead.

### 5. First-mover advantage

The charity that adopts DonorProof first in its vertical — domestic abuse refuges, refugee support, mental health services — owns the trust narrative in that vertical. Being the first food-aid charity to offer real-time verifiable restricted fund compliance is a fundraising advantage.

---

## What Donors Get

- Real-time campaign compliance status, not an annual PDF.
- Verifiable proof that the restriction they attached to their donation was respected.
- No exposure of the people their donation helped.

The donor does not need to trust the charity's word. They verify the proof.

---

## Trust Model

DonorProof is not a fraud-detection system. It does not catch a charity that fabricates expenses from the start and commits fake hashes immediately.

What it provides:

| Threat | DonorProof response |
|---|---|
| Retroactive data manipulation | Blocked — commitments are immutable and timestamped |
| Misclassification at time of spending | Detectable — commitment sequence is auditable |
| Genuine misuse of restricted funds | Proof fails — non-compliant campaigns cannot pass the threshold check |
| Fraud via fabricated inputs from day one | Not detected — outside scope |

This is an honest scope. It is also a stronger guarantee than any annual report, which provides none of the above.

---

## One-Line Pitch

> DonorProof lets charities prove restricted donations were used correctly, in real time, without exposing the people they serve.

---

## Demo Flow

```
1. Charity creates a campaign: "Winter Relief Fund"
   — sets thresholds: ≥85% direct aid, ≤10% admin
   — declares accepted restriction categories: food, medical, housing

2. Donor donates £1,000 with restriction: food only

3. Charity incurs expense: food supplier, £900
   — commits hash(expenseId + amount + category + timestamp) to Midnight ledger
   — private data stays local

4. Campaign closes. Charity runs ZK proof.
   — proof verifies: food donation matched to food expense, thresholds met

5. Public dashboard shows:
   Verified
   Direct aid: 93%
   Admin: 7%
   Restricted donations: compliant
   Beneficiary data: private
```

The donor checks the proof. The proof passed. Their money went where they said it should go.
