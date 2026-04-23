import { NextResponse } from "next/server";
import { getGoldRush, SOLANA_CHAIN, EVM_CHAINS, chainLabel } from "@/lib/goldrush";
import { detectAddressType, parseBalance } from "@/lib/utils";
import type { NormalizedToken, PortfolioResponse, WalletType } from "@/lib/types";

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

  const walletType: WalletType = type === "solana" ? "solana" : "evm";
  const chains = walletType === "solana" ? [SOLANA_CHAIN] : EVM_CHAINS;

  const errors: { chain: string; message: string }[] = [];
  const tokens: NormalizedToken[] = [];
  const fetched: string[] = [];

  const client = getGoldRush();
  const results = await Promise.all(
    chains.map((chain) =>
      client.BalanceService.getTokenBalancesForWalletAddress(
        chain,
        address,
        { noSpam: false, quoteCurrency: "USD" }
      )
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
    const res = r.res;
    if (!res || res.error || !res.data) {
      errors.push({
        chain: r.chain,
        message: res?.error_message ?? "No data",
      });
      continue;
    }
    fetched.push(r.chain);
    for (const item of res.data.items ?? []) {
      if (!item) continue;
      const balance = parseBalance(
        item.balance != null ? item.balance.toString() : "0",
        item.contract_decimals ?? 0
      );
      if (balance === 0 && !item.native_token) continue;

      tokens.push({
        chain: r.chain,
        contractAddress: item.contract_address ?? "",
        symbol: item.contract_ticker_symbol ?? "?",
        name: item.contract_display_name ?? item.contract_name ?? "Unknown",
        logoUrl: item.logo_url ?? null,
        balance,
        quote: item.quote ?? 0,
        quoteRate: item.quote_rate ?? 0,
        decimals: item.contract_decimals ?? 0,
        type: item.type ?? "cryptocurrency",
        isSpam: item.is_spam ?? false,
        isNative: Boolean(item.native_token),
      });
    }
  }

  tokens.sort((a, b) => b.quote - a.quote);

  const totalQuote = tokens.reduce((sum, t) => sum + (t.quote || 0), 0);

  const byChain: Record<string, { quote: number; count: number }> = {};
  for (const t of tokens) {
    const entry = byChain[t.chain] ?? { quote: 0, count: 0 };
    entry.quote += t.quote || 0;
    entry.count += 1;
    byChain[t.chain] = entry;
  }

  // 24h change — approximate from balance_24h if available via re-fetch;
  // we keep 0 as safe default unless quote_24h field populates further.
  const change24hQuote = 0;
  const change24hPct = 0;

  const activeChains = Object.keys(byChain).sort(
    (a, b) => (byChain[b].quote || 0) - (byChain[a].quote || 0)
  );

  const out: PortfolioResponse = {
    address,
    walletType,
    totalQuote,
    change24hQuote,
    change24hPct,
    activeChains,
    tokens,
    byChain,
    fetchedChains: fetched.map(chainLabel),
    errors,
  };

  return NextResponse.json(out, {
    headers: { "Cache-Control": "private, max-age=30" },
  });
}
