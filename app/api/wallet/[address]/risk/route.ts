import { NextResponse } from "next/server";
import {
  getGoldRush,
  SOLANA_CHAIN,
  EVM_CHAINS,
  BLUECHIP_SYMBOLS,
  HIGH_RISK_SPENDERS,
  chainLabel,
} from "@/lib/goldrush";
import { detectAddressType, parseBalance } from "@/lib/utils";
import type { RiskBreakdown, RiskScoreResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function grade(score: number): RiskScoreResponse["grade"] {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function severityFor(ratio: number): RiskBreakdown["severity"] {
  if (ratio >= 0.75) return "low";
  if (ratio >= 0.4) return "medium";
  return "high";
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address: raw } = await params;
  const address = decodeURIComponent(raw).trim();
  const type = detectAddressType(address);
  if (type === "unknown") {
    return NextResponse.json(
      { error: "Invalid wallet address" },
      { status: 400 }
    );
  }

  const isSolana = type === "solana";
  const chains = isSolana ? [SOLANA_CHAIN] : EVM_CHAINS;
  const client = getGoldRush();

  // Pull balances
  const balResults = await Promise.all(
    chains.map((chain) =>
      client.BalanceService.getTokenBalancesForWalletAddress(chain, address, {
        quoteCurrency: "USD",
      })
        .then((res) => ({ chain: String(chain), res }))
        .catch(() => ({ chain: String(chain), res: null }))
    )
  );

  let totalValue = 0;
  let bluechipValue = 0;
  let spamCount = 0;
  let tokenCount = 0;
  const chainsWithValue = new Set<string>();

  for (const r of balResults) {
    if (!r.res || r.res.error || !r.res.data) continue;
    for (const t of r.res.data.items ?? []) {
      if (!t) continue;
      const bal = parseBalance(
        t.balance != null ? t.balance.toString() : "0",
        t.contract_decimals ?? 0
      );
      if (bal === 0) continue;
      tokenCount += 1;
      const q = t.quote ?? 0;
      totalValue += q;
      if (q > 1) chainsWithValue.add(r.chain);
      if (t.is_spam) spamCount += 1;
      const sym = (t.contract_ticker_symbol ?? "").toUpperCase();
      if (BLUECHIP_SYMBOLS.has(sym) || t.native_token) {
        bluechipValue += q;
      }
    }
  }

  // Pull approvals (EVM only)
  let approvalTotalAtRisk = 0;
  let unlimitedApprovals = 0;
  let highRiskSpenders = 0;
  let totalApprovals = 0;

  if (!isSolana) {
    const approvals = await Promise.all(
      EVM_CHAINS.map((chain) =>
        client.SecurityService.getApprovals(chain, address)
          .then((res) => ({ chain: String(chain), res }))
          .catch(() => ({ chain: String(chain), res: null }))
      )
    );
    for (const r of approvals) {
      if (!r.res || r.res.error || !r.res.data) continue;
      for (const item of r.res.data.items ?? []) {
        if (!item) continue;
        for (const s of item.spenders ?? []) {
          if (!s) continue;
          const var_ = Number(s.value_at_risk_quote ?? 0);
          const aq = Number(s.allowance_quote ?? 0);
          if (var_ <= 0 && aq <= 0) continue;
          totalApprovals += 1;
          approvalTotalAtRisk += var_;
          const allowance = s.allowance?.toString() ?? "0";
          if (allowance.length >= 30) unlimitedApprovals += 1;
          if (
            s.risk_factor?.toLowerCase().includes("high") ||
            HIGH_RISK_SPENDERS.has((s.spender_address ?? "").toLowerCase())
          ) {
            highRiskSpenders += 1;
          }
        }
      }
    }
  }

  // Pull transaction summary (for age / activity signal)
  let totalCount = 0;
  let earliestTime: number | null = null;
  const summaryChain = isSolana ? SOLANA_CHAIN : EVM_CHAINS[0];
  try {
    const s = await client.TransactionService.getTransactionSummary(
      summaryChain,
      address,
      { quoteCurrency: "USD" }
    );
    if (!s.error && s.data?.items?.[0]) {
      const it = s.data.items[0];
      totalCount = Number(it.total_count ?? 0);
      if (it.earliest_transaction?.block_signed_at) {
        earliestTime = new Date(
          it.earliest_transaction.block_signed_at
        ).getTime();
      }
    }
  } catch {
    // non-fatal
  }

  // Scoring
  const breakdown: RiskBreakdown[] = [];

  // 1) Portfolio quality (bluechip %)
  {
    const ratio = totalValue > 0 ? bluechipValue / totalValue : 1;
    const score = Math.round(ratio * 25);
    breakdown.push({
      label: "Portfolio quality",
      description:
        totalValue > 0
          ? `${(ratio * 100).toFixed(0)}% of value in bluechip / native assets`
          : "No on-chain value detected",
      score,
      maxScore: 25,
      severity: severityFor(ratio),
    });
  }

  // 2) Spam exposure (lower spam = higher score)
  {
    const spamRatio = tokenCount > 0 ? spamCount / tokenCount : 0;
    const ratio = Math.max(0, 1 - spamRatio * 3);
    const score = Math.round(ratio * 15);
    breakdown.push({
      label: "Spam token exposure",
      description:
        spamCount === 0
          ? "No suspected spam tokens in wallet"
          : `${spamCount} suspected spam / dust tokens detected`,
      score,
      maxScore: 15,
      severity: severityFor(ratio),
    });
  }

  // 3) Approval hygiene (EVM only)
  if (!isSolana) {
    let score = 25;
    let desc = "No open token approvals";
    if (totalApprovals > 0) {
      let penalty = 0;
      penalty += Math.min(10, unlimitedApprovals * 2);
      penalty += Math.min(15, highRiskSpenders * 5);
      penalty += approvalTotalAtRisk > 1000 ? 5 : approvalTotalAtRisk > 100 ? 3 : 1;
      score = Math.max(0, 25 - penalty);
      desc = `${totalApprovals} approvals · ${unlimitedApprovals} unlimited · ${highRiskSpenders} high-risk spenders`;
    }
    const ratio = score / 25;
    breakdown.push({
      label: "Approval hygiene",
      description: desc,
      score,
      maxScore: 25,
      severity: severityFor(ratio),
    });
  } else {
    breakdown.push({
      label: "Approval hygiene",
      description:
        "Solana uses program-level transfer authority — no standing approvals to audit.",
      score: 25,
      maxScore: 25,
      severity: "low",
    });
  }

  // 4) Wallet age
  {
    let score = 5;
    let desc = "Brand-new wallet (<7 days)";
    if (earliestTime) {
      const ageDays = (Date.now() - earliestTime) / (1000 * 60 * 60 * 24);
      if (ageDays >= 365) {
        score = 15;
        desc = `Wallet aged ${Math.round(ageDays / 365)}+ years (${totalCount.toLocaleString()} txs)`;
      } else if (ageDays >= 90) {
        score = 12;
        desc = `Wallet aged ${Math.round(ageDays)} days (${totalCount.toLocaleString()} txs)`;
      } else if (ageDays >= 30) {
        score = 8;
        desc = `Wallet aged ${Math.round(ageDays)} days (${totalCount.toLocaleString()} txs)`;
      } else {
        score = 5;
        desc = `Young wallet — ${Math.round(ageDays)} days (${totalCount.toLocaleString()} txs)`;
      }
    }
    const ratio = score / 15;
    breakdown.push({
      label: "Wallet age & history",
      description: desc,
      score,
      maxScore: 15,
      severity: severityFor(ratio),
    });
  }

  // 5) Chain diversification
  {
    let score = 10;
    let desc = "Single-chain wallet";
    const active = chainsWithValue.size;
    if (active >= 4) {
      score = 20;
      desc = `Active on ${active} chains (${Array.from(chainsWithValue).map(chainLabel).join(", ")})`;
    } else if (active === 3) {
      score = 17;
      desc = `Active on 3 chains`;
    } else if (active === 2) {
      score = 14;
      desc = `Active on 2 chains`;
    } else if (active === 1) {
      score = 10;
      desc = `Active on 1 chain (${chainLabel(Array.from(chainsWithValue)[0] ?? "-")})`;
    }
    const ratio = score / 20;
    breakdown.push({
      label: "Chain diversification",
      description: desc,
      score,
      maxScore: 20,
      severity: severityFor(ratio),
    });
  }

  const total = breakdown.reduce((s, b) => s + b.score, 0);
  const maxTotal = breakdown.reduce((s, b) => s + b.maxScore, 0);
  const score100 = Math.round((total / maxTotal) * 100);
  const g = grade(score100);

  const insights: string[] = [];
  if (unlimitedApprovals > 0) {
    insights.push(
      `You have ${unlimitedApprovals} unlimited token approval${unlimitedApprovals === 1 ? "" : "s"} still active. Revoke unused ones.`
    );
  }
  if (highRiskSpenders > 0) {
    insights.push(
      `${highRiskSpenders} approval${highRiskSpenders === 1 ? " is" : "s are"} to flagged / high-risk contracts.`
    );
  }
  if (spamCount >= 5) {
    insights.push(
      `Detected ${spamCount} likely spam tokens — do not interact with them.`
    );
  }
  if (chainsWithValue.size >= 3) {
    insights.push(
      `Multi-chain power user — value spread across ${chainsWithValue.size} networks.`
    );
  }
  if (totalValue < 1 && totalCount === 0) {
    insights.push(
      `No on-chain activity found. Double-check the address or try a different chain.`
    );
  }
  if (insights.length === 0) {
    insights.push(`No major risk signals detected. Keep it tidy.`);
  }

  const severity: RiskBreakdown["severity"] =
    score100 >= 70 ? "low" : score100 >= 50 ? "medium" : "high";

  const headline =
    severity === "low"
      ? "Your wallet is in healthy shape"
      : severity === "medium"
      ? "A few things worth cleaning up"
      : "Several risks detected — action recommended";

  const out: RiskScoreResponse = {
    address,
    score: score100,
    grade: g,
    severity,
    headline,
    breakdown,
    insights,
  };

  return NextResponse.json(out, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
