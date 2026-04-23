import { NextResponse } from "next/server";
import { getGoldRush, SOLANA_CHAIN, EVM_CHAINS } from "@/lib/goldrush";
import { detectAddressType } from "@/lib/utils";
import type { ActivityResponse, NormalizedTx } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function classify(tx: {
  from_address?: string | null;
  to_address?: string | null;
  to_address_label?: string | null;
  log_events?: unknown;
  value?: bigint | number | string | null;
  successful?: boolean | null;
}): string {
  if (!tx.successful) return "Failed";
  const toLabel = (tx.to_address_label ?? "").toLowerCase();
  if (toLabel.includes("router") || toLabel.includes("swap") || toLabel.includes("uniswap") || toLabel.includes("jupiter") || toLabel.includes("raydium") || toLabel.includes("orca")) {
    return "Swap";
  }
  if (toLabel.includes("bridge") || toLabel.includes("wormhole") || toLabel.includes("layerzero")) {
    return "Bridge";
  }
  if (toLabel.includes("stake") || toLabel.includes("lido") || toLabel.includes("rocket")) {
    return "Stake";
  }
  if (toLabel.includes("nft") || toLabel.includes("magiceden") || toLabel.includes("opensea")) {
    return "NFT";
  }
  const valStr = tx.value?.toString() ?? "0";
  if (valStr !== "0" && valStr !== "") return "Transfer";
  return "Contract call";
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
  const errors: { chain: string; message: string }[] = [];
  const items: NormalizedTx[] = [];

  const client = getGoldRush();
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
    const walletLower = address.toLowerCase();
    for (const tx of r.res.data.items ?? []) {
      if (!tx) continue;
      const from = tx.from_address ?? "";
      const to = tx.to_address ?? "";
      const direction: NormalizedTx["direction"] =
        from.toLowerCase() === walletLower && to.toLowerCase() === walletLower
          ? "self"
          : from.toLowerCase() === walletLower
          ? "out"
          : "in";

      items.push({
        chain: r.chain,
        hash: tx.tx_hash ?? "",
        timestamp: tx.block_signed_at
          ? new Date(tx.block_signed_at).toISOString()
          : new Date().toISOString(),
        successful: Boolean(tx.successful),
        direction,
        from,
        to,
        fromLabel: tx.from_address_label ?? null,
        toLabel: tx.to_address_label ?? null,
        valueQuote: tx.value_quote ?? 0,
        valuePretty: tx.pretty_value_quote ?? "$0.00",
        gasQuote: tx.gas_quote ?? 0,
        category: classify(tx),
      });
    }
  }

  items.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
  const trimmed = items.slice(0, 50);

  const out: ActivityResponse = {
    address,
    items: trimmed,
    errors,
  };

  return NextResponse.json(out, {
    headers: { "Cache-Control": "private, max-age=30" },
  });
}
