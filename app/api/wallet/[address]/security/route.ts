import { NextResponse } from "next/server";
import { getGoldRush, EVM_CHAINS, HIGH_RISK_SPENDERS } from "@/lib/goldrush";
import { detectAddressType } from "@/lib/utils";
import type { RiskySpender, SecurityResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  if (type === "solana") {
    const empty: SecurityResponse = {
      address,
      totalAtRisk: 0,
      unlimitedApprovals: 0,
      highRiskSpenders: 0,
      spenders: [],
      errors: [
        {
          chain: "solana-mainnet",
          message:
            "Solana uses program-level transfer authority — no ERC-20-style approvals to audit.",
        },
      ],
    };
    return NextResponse.json(empty);
  }

  const errors: { chain: string; message: string }[] = [];
  const spenders: RiskySpender[] = [];

  const client = getGoldRush();
  const results = await Promise.all(
    EVM_CHAINS.map((chain) =>
      client.SecurityService.getApprovals(chain, address)
        .then((res) => ({ chain: String(chain), res }))
        .catch((err) => ({
          chain: String(chain),
          res: null,
          err: err?.message ?? String(err),
        }))
    )
  );

  for (const r of results) {
    if ("err" in r && r.err) {
      errors.push({ chain: r.chain, message: r.err as string });
      continue;
    }
    if (!r.res || r.res.error || !r.res.data) {
      errors.push({
        chain: r.chain,
        message: r.res?.error_message ?? "No data",
      });
      continue;
    }
    for (const item of r.res.data.items ?? []) {
      if (!item) continue;
      for (const s of item.spenders ?? []) {
        if (!s) continue;
        const valueAtRisk = Number(s.value_at_risk_quote ?? 0);
        const allowanceQuote = Number(s.allowance_quote ?? 0);
        if (valueAtRisk <= 0 && allowanceQuote <= 0) continue;

        spenders.push({
          chain: r.chain,
          tokenSymbol: item.ticker_symbol ?? "?",
          tokenAddress: item.token_address ?? "",
          spenderAddress: s.spender_address ?? "",
          spenderLabel: s.spender_address_label ?? null,
          allowance: s.allowance ?? "0",
          allowanceQuote,
          valueAtRiskQuote: valueAtRisk,
          riskFactor: s.risk_factor ?? "OK",
          prettyValueAtRisk: s.pretty_value_at_risk_quote ?? "$0.00",
        });
      }
    }
  }

  spenders.sort((a, b) => b.valueAtRiskQuote - a.valueAtRiskQuote);

  const totalAtRisk = spenders.reduce((sum, s) => sum + s.valueAtRiskQuote, 0);
  const unlimitedApprovals = spenders.filter((s) => {
    const allowance = s.allowance?.toString() ?? "0";
    return allowance.length >= 30 || allowance.toLowerCase().includes("unlimited");
  }).length;
  const highRiskSpenders = spenders.filter(
    (s) =>
      s.riskFactor?.toLowerCase().includes("high") ||
      HIGH_RISK_SPENDERS.has(s.spenderAddress.toLowerCase())
  ).length;

  const out: SecurityResponse = {
    address,
    totalAtRisk,
    unlimitedApprovals,
    highRiskSpenders,
    spenders: spenders.slice(0, 100),
    errors,
  };

  return NextResponse.json(out, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
