# Halo — See your entire onchain halo

Paste any wallet address and get an instant **Risk Score (0–100)**, a unified portfolio view, and an approval audit — across **Solana** and **6 EVM chains** — all powered by [GoldRush by Covalent](https://goldrush.dev).

Built for the **Colosseum Frontier Hackathon · Covalent GoldRush Sidetrack**.

---

## The problem

Crypto wallets are a security black box. Users hold assets on Solana *and* Ethereum *and* Base *and* Polygon and have no single place to:

- See **everything they own** across chains
- Spot a **forgotten unlimited approval** that can drain them
- Understand whether their wallet is **hygienic or risky at a glance**

Today, you need a separate tab for Solscan, Etherscan, Revoke.cash, a portfolio app, and a price tracker — and none of them score risk.

## The product

**Halo** is a wallet intelligence dashboard that answers *"how risky is this wallet, right now?"* in one screen:

- **Halo Risk Score (0–100 + letter grade)** — a composite score from five signals:
  1. **Portfolio quality** — % of value in native / bluechip / stablecoin assets
  2. **Spam exposure** — suspected scam / dust tokens flagged by GoldRush
  3. **Approval hygiene** — unlimited approvals + high-risk spenders
  4. **Wallet age & history** — derived from earliest tx + total tx count
  5. **Chain diversification** — number of chains holding real value
- **Portfolio tab** — balances across Solana + 6 EVM chains, filterable, with chain distribution bar
- **Activity tab** — recent transactions, **classified** (Swap / Bridge / Stake / NFT / Transfer / Contract call) and linked to explorers
- **Security tab** — per-token approval audit with unlimited-approval flags and value-at-risk

Works for **Solana addresses**, **0x EVM addresses**, and **ENS / Lens / Unstoppable** names (auto-resolved by GoldRush).

## Why it wins the GoldRush track

Covalent's brief specifically calls out *"Score wallet risk from SPL token balances, approval hygiene, and full transaction history."* That is literally the core loop of Halo.

### GoldRush endpoints used

| Endpoint | Where it's used | Purpose |
| --- | --- | --- |
| `BalanceService.getTokenBalancesForWalletAddress` | `/api/wallet/[address]/portfolio`, `/risk` | Full token portfolio incl. spam flag, native flag, USD quotes |
| `TransactionService.getAllTransactionsForAddressByPage` | `/api/wallet/[address]/activity` | Classified recent transaction feed |
| `TransactionService.getTransactionSummary` | `/api/wallet/[address]/risk` | Wallet age + total tx count for scoring |
| `SecurityService.getApprovals` | `/api/wallet/[address]/security`, `/risk` | Unlimited-approval detection, value-at-risk, risk factor, high-risk spenders |

### Chains covered (7)

- `solana-mainnet` (primary — Frontier theme)
- `eth-mainnet`, `base-mainnet`, `matic-mainnet`, `arbitrum-mainnet`, `optimism-mainnet`, `bsc-mainnet`

### Creative GoldRush-powered ideas baked in

- **Spam-aware scoring** — uses `is_spam` directly from GoldRush balance items instead of reinventing a spam list.
- **Bluechip-ratio weighting** — rewards wallets that concentrate value in native / stable / bluechip tokens (`BLUECHIP_SYMBOLS` in `lib/goldrush.ts`).
- **Composite grading** — A/B/C/D/F letter grade on top of the 0–100 number, with per-dimension severity bars for explainability.
- **Solana-aware UX** — Halo correctly explains that Solana uses program-level transfer authority (so the Security tab shows a contextual message rather than empty state).

## Running locally

```bash
# 1. Install
npm install

# 2. Add your GoldRush key (free 14-day trial, 25k credits/month)
#    Sign up at https://goldrush.dev/platform
cp .env.example .env.local
# then edit .env.local and paste your key

# 3. Run
npm run dev
# http://localhost:3000
```

Hit any of the demo wallets from the landing page, or paste your own.

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript (strict)
- Tailwind CSS v4
- `@covalenthq/client-sdk` v3 (GoldRush)
- Node.js runtime for API routes (required for the SDK)

## Project layout

```
app/
  page.tsx                  # Landing: wallet input + demo addresses
  wallet/[address]/page.tsx # Dashboard shell (risk hero + tabs)
  api/wallet/[address]/
    portfolio/route.ts      # BalanceService per chain → normalized tokens
    activity/route.ts       # TransactionService → classified tx feed
    security/route.ts       # SecurityService.getApprovals → risky spenders
    risk/route.ts           # Composite Halo Risk Score (0–100)
components/
  wallet-search.tsx         # Address input w/ client-side validation
  dashboard.tsx             # Tab switcher
  risk-panel.tsx            # Score ring + insights + breakdown bars
  portfolio-tab.tsx         # Tokens table + chain distribution
  activity-tab.tsx          # Tx feed with categories + explorer links
  security-tab.tsx          # Approvals audit w/ unlimited flags
lib/
  goldrush.ts               # Lazy GoldRush client, chain metadata, heuristics
  utils.ts                  # Address detection, formatters
  types.ts                  # Normalized response types
```

## Submission checklist (Covalent track)

- [x] Uses **4+ GoldRush endpoints** (Balance, Transaction × 2, Security)
- [x] Covers **Solana + 6 EVM chains**
- [x] Clear use case — *Score wallet risk from balances, approval hygiene, tx history*
- [x] Live, usable demo (any address works)
- [x] Public GitHub repository (this repo)
- [ ] Short demo video tagging [@goldrushdev](https://x.com/goldrushdev) on X

## License

MIT.
