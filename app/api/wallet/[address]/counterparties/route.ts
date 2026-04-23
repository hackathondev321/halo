import { NextResponse } from "next/server";
import { getGoldRush, SOLANA_CHAIN, EVM_CHAINS } from "@/lib/goldrush";
import { detectAddressType } from "@/lib/utils";
import type { Counterparty, CounterpartiesResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function categorize(label?: string | null): string {
  const l = (label ?? "").toLowerCase();
  if (!l) return "Unknown";
  if (l.includes("uniswap") || l.includes("raydium") || l.includes("jupiter") || l.includes("orca") || l.includes("router") || l.includes("swap") || l.includes("curve") || l.includes("pancake")) {
    return "DEX";
  }
  if (l.includes("bridge") || l.includes("wormhole") || l.includes("layerzero") || l.includes("stargate") || l.includes("across")) {
    return "Bridge";
  }
  if (l.includes("stake") || l.includes("lido") || l.includes("rocket") || l.includes("eigenlayer") || l.includes("marinade")) {
    return "Staking";
  }
  if (l.includes("opensea") || l.includes("magic eden") || l.includes("magiceden") || l.includes("blur") || l.includes("tensor") || l.includes("nft")) {
    return "NFT";
  }
  if (l.includes("binance") || l.includes("coinbase") || l.includes("kraken") || l.includes("okx") || l.includes("kucoin") || l.includes("bybit")) {
    return "CEX";
  }
  if (l.includes("aave") || l.includes("compound") || l.includes("morpho") || l.includes("spark")) {
    return "Lending";
  }
  return "Contract";
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

  const chains = type === "solana" ? [SOLANA_CHAIN] : EVM_CHAINS;
  const client = getGoldRush();
  const errors: { chain: string; message: string }[] = [];
  const walletLower = address.toLowerCase();

  // Aggregate counterparties across chains
  type Acc = {
    address: string;
    label: string | null;
    interactions: number;
    lastSeen: number;
    totalValueQuote: number;
    categoryLabel: string | null;
    chains: Set<string>;
    seenIn: boolean;
    seenOut: boolean;
  };
  const map = new Map<string, Acc>();

  const results = await Promise.all(
    chains.map((chain) =>
      client.TransactionService.getAllTransactionsForAddressByPage(
        chain,
        address,
        { quoteCurrency: "USD", noLogs: true }
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
    if (!r.res || r.res.error || !r.res.data) {
      errors.push({
        chain: r.chain,
        message: r.res?.error_message ?? "No data",
      });
      continue;
    }

    for (const tx of r.res.data.items ?? []) {
      if (!tx) continue;
      const from = (tx.from_address ?? "").toLowerCase();
      const to = (tx.to_address ?? "").toLowerCase();
      if (!from && !to) continue;
      const isSelfFrom = from === walletLower;
      const isSelfTo = to === walletLower;
      if (isSelfFrom && isSelfTo) continue;

      const counterAddr = isSelfFrom ? to : from;
      const counterLabel = isSelfFrom
        ? tx.to_address_label ?? null
        : tx.from_address_label ?? null;
      if (!counterAddr) continue;

      const key = counterAddr;
      const ts = tx.block_signed_at
        ? new Date(tx.block_signed_at).getTime()
        : Date.now();
      const val = Number(tx.value_quote ?? 0);

      const existing = map.get(key) ?? {
        address: counterAddr,
        label: counterLabel,
        interactions: 0,
        lastSeen: 0,
        totalValueQuote: 0,
        categoryLabel: counterLabel,
        chains: new Set<string>(),
        seenIn: false,
        seenOut: false,
      };
      existing.interactions += 1;
      existing.totalValueQuote += val;
      existing.lastSeen = Math.max(existing.lastSeen, ts);
      existing.chains.add(r.chain);
      if (counterLabel && !existing.label) existing.label = counterLabel;
      if (isSelfFrom) existing.seenOut = true;
      else existing.seenIn = true;
      map.set(key, existing);
    }
  }

  const items: Counterparty[] = Array.from(map.values())
    .map((a) => ({
      address: a.address,
      label: a.label,
      interactions: a.interactions,
      lastSeen: new Date(a.lastSeen).toISOString(),
      totalValueQuote: a.totalValueQuote,
      category: categorize(a.label),
      chains: Array.from(a.chains),
      direction: (a.seenIn && a.seenOut
        ? "both"
        : a.seenIn
        ? "in"
        : "out") as Counterparty["direction"],
    }))
    .sort((a, b) => b.interactions - a.interactions)
    .slice(0, 20);

  const out: CounterpartiesResponse = {
    address,
    totalCounterparties: map.size,
    items,
    errors,
  };

  return NextResponse.json(out, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
