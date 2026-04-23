# Halo — See your entire onchain halo

Paste any wallet address and get an instant **Risk Score (0–100)**, a unified portfolio view, a **30-day value chart**, an **approval audit**, a **counterparty graph**, and an **AI-generated briefing** — across **Solana** and **6 EVM chains** — all powered by [GoldRush by Covalent](https://goldrush.dev).

Built for the **Colosseum Frontier Hackathon · Covalent GoldRush Sidetrack**.

---

## The problem

Crypto wallets are a security black box. Users hold assets on Solana *and* Ethereum *and* Base *and* Polygon and have no single place to:

- See **everything they own** across chains
- Watch their **portfolio curve** over the last 7/30/90 days
- Spot a **forgotten unlimited approval** that can drain them
- Understand **who their wallet has actually been talking to**
- Get a **plain-English risk summary** they can act on

Today, you need a separate tab for Solscan, Etherscan, Revoke.cash, DeBank, and a block explorer — and none of them score risk or explain it in English.

## The product

**Halo** is a wallet intelligence dashboard that answers *"how risky is this wallet, right now?"* in one screen:

- **Halo Risk Score (0–100 + letter grade)** — a composite score from five signals:
  1. **Portfolio quality** — % of value in native / bluechip / stablecoin assets
  2. **Spam exposure** — suspected scam / dust tokens flagged by GoldRush
  3. **Approval hygiene** — unlimited approvals + high-risk spenders
  4. **Wallet age & history** — derived from earliest tx + total tx count
  5. **Chain diversification** — number of chains holding real value
- **Portfolio value chart** — 7/30/90-day historical curve aggregated across every active chain, with high / low / change % annotations
- **AI briefing** — an AI-generated 3-4 sentence summary of the wallet, headline tags, and concrete recommended actions (deterministic fallback always available; upgrades to LLM narrative when `OPENAI_API_KEY` is set)
- **Portfolio tab** — balances across Solana + 6 EVM chains, filterable, with chain distribution bar
- **Activity tab** — recent transactions, **classified** (Swap / Bridge / Stake / NFT / Transfer / Contract call) and linked to explorers
- **Security tab** — per-token approval audit with unlimited-approval flags and value-at-risk
- **Counterparties tab** — top 20 addresses this wallet interacts with, categorised (DEX / Bridge / CEX / Staking / NFT / Lending), with flow direction and chain badges
- **Shareable OpenGraph card** — every `/wallet/:address` URL renders a custom risk-score OG image, so Halo links unfurl natively on X / Telegram / Discord

Works for **Solana addresses**, **0x EVM addresses**, and **ENS / Lens / Unstoppable** names (auto-resolved by GoldRush).

## Why it wins the GoldRush track

Covalent's brief specifically calls out *"Score wallet risk from SPL token balances, approval hygiene, and full transaction history."* That is literally the core loop of Halo — and we layer on historical portfolio, counterparty analytics, AI narrative, and a dynamic OG card so the output is actually shareable.

### GoldRush endpoints used (5)

| Endpoint | Where it's used | Purpose |
| --- | --- | --- |
| `BalanceService.getTokenBalancesForWalletAddress` | `/api/wallet/[address]/portfolio`, `/risk` | Full token portfolio incl. spam flag, native flag, USD quotes |
| `BalanceService.getHistoricalPortfolioForWalletAddress` | `/api/wallet/[address]/history` | 7/30/90-day daily close values aggregated per chain |
| `TransactionService.getAllTransactionsForAddressByPage` | `/api/wallet/[address]/activity`, `/counterparties` | Classified recent tx feed + counterparty graph |
| `TransactionService.getTransactionSummary` | `/api/wallet/[address]/risk` | Wallet age + total tx count for scoring |
| `SecurityService.getApprovals` | `/api/wallet/[address]/security`, `/risk` | Unlimited-approval detection, value-at-risk, risk factor, high-risk spenders |

### Chains covered (7)

- `solana-mainnet` (primary — Frontier theme)
- `eth-mainnet`, `base-mainnet`, `matic-mainnet`, `arbitrum-mainnet`, `optimism-mainnet`, `bsc-mainnet`

### Creative GoldRush-powered ideas baked in

- **Spam-aware scoring** — uses `is_spam` directly from GoldRush balance items instead of reinventing a spam list.
- **Bluechip-ratio weighting** — rewards wallets that concentrate value in native / stable / bluechip tokens (`BLUECHIP_SYMBOLS` in `lib/goldrush.ts`).
- **Composite grading** — A/B/C/D/F letter grade on top of the 0–100 number, with per-dimension severity bars for explainability.
- **Counterparty categorisation** — labels `to_address_label` into DEX / Bridge / CEX / Staking / NFT / Lending for at-a-glance behavior analysis.
- **Historical aggregation** — sums each chain's daily close quote on the client side so a single-view curve represents the *entire* wallet, not one chain.
- **Solana-aware UX** — Halo correctly explains that Solana uses program-level transfer authority (so the Security tab shows a contextual message rather than empty state).
- **AI briefing with graceful fallback** — if `OPENAI_API_KEY` is set, the `/ai-summary` endpoint asks an LLM to write a plain-English wallet report using the risk / portfolio / counterparty context. Without a key, a deterministic summary built from the same data is returned — so the feature *always works*.
- **Dynamic OpenGraph image** — `/wallet/:address/opengraph-image` renders a per-wallet PNG showing risk score, grade, headline, and address. Paste any wallet URL into X and the preview shows the real score.

## Running locally

```bash
# 1. Install
npm install

# 2. Add your GoldRush key (free 14-day trial, 25k credits/month)
#    Sign up at https://goldrush.dev/platform
cp .env.example .env.local
# then edit .env.local and paste your key.
# OPENAI_API_KEY is optional — without it, /ai-summary returns the deterministic fallback.

# 3. Run
npm run dev
# http://localhost:3000
```

Hit any of the demo wallets from the landing page, or paste your own.

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript (strict)
- Tailwind CSS v4
- Recharts (portfolio history chart)
- `next/og` (dynamic OpenGraph images)
- `@covalenthq/client-sdk` v3 (GoldRush)
- Node.js runtime for API routes (required for the SDK + `next/og`)

## Project layout

```
app/
  page.tsx                             # Landing: wallet input + demo addresses
  wallet/[address]/page.tsx            # Dashboard shell (risk hero + history + tabs)
  wallet/[address]/opengraph-image.tsx # Dynamic OG card per wallet
  api/wallet/[address]/
    portfolio/route.ts        # BalanceService per chain → normalized tokens
    history/route.ts          # Historical portfolio, aggregated across chains
    activity/route.ts         # TransactionService → classified tx feed
    counterparties/route.ts   # Top 20 interacting addresses, categorised
    security/route.ts         # SecurityService.getApprovals → risky spenders
    risk/route.ts             # Composite Halo Risk Score (0–100)
    ai-summary/route.ts       # LLM briefing (falls back to deterministic)
components/
  wallet-search.tsx           # Address input w/ client-side validation
  dashboard.tsx               # Tab switcher + data fetching
  risk-panel.tsx              # Score ring + insights + breakdown bars
  history-chart.tsx           # Recharts area chart with 7/30/90D toggle
  ai-summary.tsx              # AI briefing card
  counterparties-panel.tsx    # Top counterparties list
  portfolio-tab.tsx           # Tokens table + chain distribution
  activity-tab.tsx            # Tx feed with categories + explorer links
  security-tab.tsx            # Approvals audit w/ unlimited flags
lib/
  goldrush.ts                 # Lazy GoldRush client, chain metadata, heuristics
  utils.ts                    # Address detection, formatters
  types.ts                    # Normalized response types
```

## Submission checklist (Covalent track)

- [x] Uses **5 GoldRush endpoints** (Balance × 2, Transaction × 2, Security)
- [x] Covers **Solana + 6 EVM chains**
- [x] Clear use case — *Score wallet risk from balances, approval hygiene, tx history*
- [x] Adds creative extensions the brief suggests — historical portfolio, counterparty graph, AI agent briefing
- [x] Live, usable demo (any address works)
- [x] Public GitHub repository (this repo)
- [ ] Short demo video tagging [@goldrushdev](https://x.com/goldrushdev) on X

## License

MIT.
