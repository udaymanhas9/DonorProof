# DonorProof — App Design

---

## What this app is

A multi-charity transparency platform. Any charity deploys their own DonorProof contract. Donors browse all participating charities, view real-time compliance proofs, and simulate restricted donations. Charity employees manage expenses and run proofs via their connected Midnight wallet.

---

## User roles

**Charity employee**
Identified automatically: if connected wallet address matches `campaignOwner` on any deployed contract, the dashboard unlocks. No login system. Wallet = identity.

**Donor**
No wallet required to browse. Optional wallet connection to simulate a donation (records restriction on-chain, no token transfer).

No auditor role. Dropped — adds human bottleneck with no architectural benefit given the commit-at-expense-time model.

---

## Route structure

```
/                        Landing — mission, live charity feed preview
/charities               All charities — searchable, filterable
/charity/:address        Public campaign page — proof status, spend breakdown, donate
/dashboard               Charity home (wallet-gated)
/dashboard/expenses      Log expense, view private expense history
/dashboard/proof         Preview compliance result, submit proof on-chain
/dashboard/campaign      Campaign settings and thresholds
```

Public routes: `/`, `/charities`, `/charity/:address`
Wallet-gated: `/dashboard/*` — if wallet not connected or not a registered campaignOwner, redirect to `/`

---

## Multi-charity model

Each charity deploys their own contract instance. The frontend indexes them via a registry file (JSON for hackathon, upgradeable to an on-chain registry later).

```json
[
  {
    "name": "Winter Relief Fund",
    "category": "Humanitarian",
    "address": "contract_address_here",
    "logo": "/logos/winter-relief.png"
  }
]
```

Wallet detection logic:
```
onWalletConnect(address) →
  check registry contracts for campaignOwner === address
  if match → unlock /dashboard for that charity
  else → donor view only
```

---

## Visual design

### Philosophy

Apple-level clarity. One purpose per screen. Whitespace is not empty space — it signals confidence. The proof badge is the hero element; everything else supports it.

### Palette

| Token | Hex | Use |
|---|---|---|
| Background | `#FAFAF8` | Page background — warm off-white, not clinical |
| Surface | `#FFFFFF` | Cards, panels, modals |
| Primary | `#1B4332` | Deep forest green — trust, care, nature |
| Accent | `#40916C` | CTAs, active states, highlights |
| Text | `#111827` | Primary copy |
| Muted | `#6B7280` | Labels, secondary copy |
| Border | `#E5E7EB` | Hairline card borders |
| Verified wash | `#D1FAE5` | Background on proof-verified states |
| Unverified wash | `#FEF3C7` | Background on pending proof states |

**Why green:** Charity, nature, trust. Not blue (too corporate/banking). Not red. Deep forest green signals care without being playful.

### Typography

Font: **Inter** (system fallback: -apple-system, sans-serif)

| Role | Size | Weight |
|---|---|---|
| Page heading | 32–40px | 700 |
| Section heading | 20–24px | 600 |
| Body | 16px | 400 |
| Label / caption | 13–14px | 500 |
| Badge text | 12px | 600 |

No decorative fonts. No serif. Clean and functional throughout.

### Component rules

- Card: `border-radius: 12px`, `1px solid #E5E7EB`, `box-shadow: 0 1px 4px rgba(0,0,0,0.06)` on hover
- Button (primary): filled `#1B4332`, white text, 8px radius, 44px height minimum
- Button (secondary): outlined, `#1B4332` border and text, transparent fill
- Input: 1px border, 8px radius, focus ring in accent green
- Spacing unit: 4px base, use multiples (8, 12, 16, 24, 32, 48)
- No gradients. No shadows heavier than above. No decorative illustrations.

---

## Key screens

### 1. Landing `/`

**Layout:** Full-width hero, then charity feed preview (3 cards), then "How it works" strip.

**Hero:**
```
[Nav: DonorProof logo left | Connect Wallet right]

                    Private compliance.
                  Publicly verifiable.

  Charities prove restricted funds were used correctly.
  Donors verify without seeing sensitive beneficiary data.

           [Browse Charities]   [How it works]
```

**Why:** Leads with the value proposition, not features. Two CTAs, one primary. No clutter.

---

### 2. Charity feed `/charities`

**Layout:** Search bar + category filter at top. Responsive grid of charity cards below.

**Charity card:**
```
┌─────────────────────────────────────┐
│  [Logo]  Winter Relief Fund         │
│          Humanitarian · 3 campaigns │
│                                     │
│  ● Verified   87% direct aid        │
│  ▓▓▓▓▓▓▓▓▓▓░░  Admin 8%            │
│                                     │
│  [View Campaign]   [Donate]         │
└─────────────────────────────────────┘
```

Proof badge: green dot + "Verified" on `#D1FAE5` wash. Unverified: amber dot + "Proof pending" on `#FEF3C7`.

Spend bar: horizontal, colour-coded (green = direct aid, amber = logistics, red = admin). No labels needed — tooltip on hover.

**Why cards:** Scannable. Donor needs to compare charities quickly. Badge is the first thing the eye lands on.

---

### 3. Campaign page `/charity/:address`

**Layout:** Two-column on desktop. Left: campaign info + proof status. Right: donate panel.

**Left column:**
```
Winter Relief Fund
──────────────────
● Verified  •  Last proof: 2 days ago

  Direct aid    87%  ▓▓▓▓▓▓▓▓▓▓
  Logistics      5%  ▓
  Admin          8%  ▓▓

  Expenses committed: 47
  Total spend recorded: £124,500
  Restricted funds: compliant ✓

  [What is a proof?]  ← expander, explains ZK for non-technical donors
```

**Right column (donate panel):**
```
┌──────────────────────────┐
│  Simulate a donation     │
│                          │
│  Amount  [£ _______]     │
│                          │
│  Restriction             │
│  ○ Unrestricted          │
│  ○ Food aid only         │
│  ○ Medical only          │
│  ○ Housing only          │
│                          │
│  [Connect Wallet]        │
│  or                      │
│  [Simulate without wallet│
└──────────────────────────┘
```

**Why two-column:** Proof data and donation action co-exist without tabbing. Donor reads the proof, feels confident, donates — one continuous flow.

---

### 4. Charity dashboard `/dashboard`

**Layout:** Sidebar nav + main content area.

**Sidebar:**
```
DonorProof
──────────
[Charity name]
[Wallet: 0x1234...] 
NIGHT: 1,240
DUST:  0.42

──────────
Overview
Expenses
Run Proof
Campaign Settings
```

**Overview panel:**
```
Winter Relief Fund

Compliance status:  ● Verified
Last proof run:     2 days ago

Spend summary
─────────────
Total committed:   £124,500
Direct aid:        £108,315  (87%)
Admin:             £ 9,960   ( 8%)
Logistics:         £ 6,225   ( 5%)

Expenses on-chain: 47
Proof status:      ✓ Thresholds met
```

**Why wallet balance in sidebar:** Charity employees are making real on-chain transactions. DUST balance is operationally important — if it runs out, they can't commit expenses or run proofs. Always visible.

---

### 5. Log expense `/dashboard/expenses`

**Layout:** Form left, recent expense list right.

**Form:**
```
Log Private Expense
───────────────────
Amount         [£ _______]

Category
  ○ Food aid        (direct aid)
  ○ Medical         (direct aid)
  ○ Housing         (direct aid)
  ○ Logistics       (neutral)
  ○ Admin           (admin)

                    [Commit Expense →]
                    costs ~0.002 DUST
```

Below the button, a small explainer:
```
ℹ  Amount and category are private witness inputs.
   Only the aggregate totals update on-chain.
   Individual expense details never leave this device.
```

Recent list (right panel):
```
Today
  E-047  Food aid    committed 14:32   ● on-chain
  E-046  Medical     committed 11:05   ● on-chain

Yesterday
  E-045  Admin       committed 16:20   ● on-chain
  E-044  Logistics   committed 09:11   ● on-chain
```

No amounts in the list. Amount stays private even in the local UI history — keeps the mental model consistent.

**Why show DUST cost on the button:** Educates the user, builds trust, and prevents surprise when gas is deducted.

---

### 6. Run proof `/dashboard/proof`

**Layout:** Single-column, centred. Step-by-step flow.

```
Run Compliance Proof
────────────────────

Current snapshot (from ledger)
  Total spend:    £124,500
  Direct aid:     £108,315  →  87%
  Admin:          £  9,960  →   8%

Thresholds
  Direct aid ≥ 85%   ✓  87% — passes
  Admin      ≤ 10%   ✓   8% — passes

─────────────────────────────────────
  This proof will be generated on-chain.
  Estimated cost: ~0.008 DUST

  [Generate & Submit Proof →]
─────────────────────────────────────

After submission, your campaign page will
show ● Verified to all donors.
```

If thresholds fail, the button is disabled and the failing row is highlighted red. Charity can log more compliant expenses before running the proof.

**Why preview before submit:** Proof generation costs DUST. User should see the result will pass before spending gas. No surprises.

---

## Wallet integration model

```
[Midnight browser extension]
        ↕
[DonorProof frontend]
  - reads NIGHT + DUST balance
  - signs transactions for:
      commitExpense()      → costs DUST
      createCampaign()     → costs DUST
      verifyCompliance()   → costs DUST (proof gen is expensive)

Donations are simulated:
  - amount + restriction recorded in UI state
  - optionally committed as metadata on-chain
  - no real token transfer
```

Real on-chain activity is gated behind wallet connection. Browse, view campaigns, and see proofs require no wallet.

---

## What we are not building

- Auth system — wallet is identity
- Beneficiary data storage — never collected
- Receipt uploads — hash only, stored off-chain by charity
- Auditor role — dropped
- Real donation token transfer — simulated for hackathon
- Mobile-native — responsive web only
