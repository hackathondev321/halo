import { NextResponse } from "next/server";
import {
  getGoldRush,
  SOLANA_CHAIN,
  EVM_CHAINS,
  chainLabel,
} from "@/lib/goldrush";
import { detectAddressType } from "@/lib/utils";
import type { HistoryPoint, HistoryResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
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

  const url = new URL(req.url);
  const daysParam = Number(url.searchParams.get("days") ?? "30");
  const days = Math.max(7, Math.min(90, Number.isFinite(daysParam) ? daysParam : 30));

  const chains = type === "solana" ? [SOLANA_CHAIN] : EVM_CHAINS;
  const client = getGoldRush();
  const errors: { chain: string; message: string }[] = [];
  const fetched: string[] = [];

  const results = await Promise.all(
    chains.map((chain) =>
      client.BalanceService.getHistoricalPortfolioForWalletAddress(
        chain,
        address,
        { quoteCurrency: "USD", days }
      )
        .then((res) => ({ chain: String(chain), res }))
        .catch((err) => ({
          chain: String(chain),
          res: null,
          err: err?.message ?? String(err),
        }))
    )
  );

  // Aggregate: build a map of dayKey → { total, byChain }
  const agg = new Map<string, HistoryPoint>();

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
    fetched.push(r.chain);
    const items = r.res.data.items ?? [];
    // Sum close.quote per day across all holdings on this chain
    const perDay = new Map<string, number>();
    for (const h of items) {
      if (!h) continue;
      for (const pt of h.holdings ?? []) {
        if (!pt?.timestamp) continue;
        const key = new Date(pt.timestamp).toISOString().slice(0, 10);
        const val = Number(pt.close?.quote ?? 0);
        perDay.set(key, (perDay.get(key) ?? 0) + val);
      }
    }

    for (const [day, val] of perDay) {
      const existing = agg.get(day) ?? {
        timestamp: day,
        quote: 0,
        byChain: {} as Record<string, number>,
      };
      existing.quote += val;
      existing.byChain[r.chain] = val;
      agg.set(day, existing);
    }
  }

  const points = Array.from(agg.values()).sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );

  const values = points.map((p) => p.quote);
  const high = values.length ? Math.max(...values) : 0;
  const low = values.length ? Math.min(...values) : 0;
  const current = points.length ? points[points.length - 1].quote : 0;
  const first = points.length ? points[0].quote : 0;
  const changePct = first > 0 ? ((current - first) / first) * 100 : 0;

  const out: HistoryResponse = {
    address,
    days,
    points,
    high,
    low,
    current,
    changePct,
    fetchedChains: fetched.map(chainLabel),
    errors,
  };

  return NextResponse.json(out, {
    headers: { "Cache-Control": "private, max-age=300" },
  });
}
