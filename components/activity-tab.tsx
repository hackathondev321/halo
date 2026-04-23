"use client";

import { ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import { CHAIN_META, chainColor, chainLabel } from "@/lib/goldrush";
import { formatUSD, shortAddress, timeAgo } from "@/lib/utils";
import type { ActivityResponse, NormalizedTx } from "@/lib/types";

const CATEGORY_STYLE: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  Swap: { color: "#22d3ee", bg: "rgba(34,211,238,0.12)", border: "rgba(34,211,238,0.4)" },
  Bridge: { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.4)" },
  Stake: { color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.4)" },
  NFT: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.4)" },
  Transfer: { color: "#e4e4e7", bg: "rgba(228,228,231,0.08)", border: "rgba(228,228,231,0.25)" },
  "Contract call": { color: "#a1a1aa", bg: "rgba(161,161,170,0.08)", border: "rgba(161,161,170,0.3)" },
  Failed: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.4)" },
};

const EXPLORERS: Record<string, (hash: string) => string> = {
  "solana-mainnet": (h) => `https://solscan.io/tx/${h}`,
  "eth-mainnet": (h) => `https://etherscan.io/tx/${h}`,
  "base-mainnet": (h) => `https://basescan.org/tx/${h}`,
  "matic-mainnet": (h) => `https://polygonscan.com/tx/${h}`,
  "arbitrum-mainnet": (h) => `https://arbiscan.io/tx/${h}`,
  "optimism-mainnet": (h) => `https://optimistic.etherscan.io/tx/${h}`,
  "bsc-mainnet": (h) => `https://bscscan.com/tx/${h}`,
};

export function ActivityTab({
  data,
  error,
}: {
  data: ActivityResponse | null;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="card p-6 border-[#ef4444]/40 text-sm text-[#ef4444]">
        {error}
      </div>
    );
  }
  if (!data) return <ActivitySkeleton />;

  if (data.items.length === 0) {
    return (
      <div className="card p-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-border bg-muted mb-4">
          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
        </div>
        <div className="font-medium mb-1">No recent activity</div>
        <div className="text-sm text-muted-foreground">
          This wallet has no recent transactions on the chains we queried.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="divide-y divide-border">
          {data.items.map((tx) => (
            <Row key={`${tx.chain}-${tx.hash}`} tx={tx} />
          ))}
        </div>
      </div>
      {data.errors.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Skipped: {data.errors.map((e) => chainLabel(e.chain)).join(", ")}
        </div>
      )}
    </div>
  );
}

function Row({ tx }: { tx: NormalizedTx }) {
  const cat = CATEGORY_STYLE[tx.category] ?? CATEGORY_STYLE["Contract call"];
  const meta = CHAIN_META[tx.chain];
  const url = EXPLORERS[tx.chain]?.(tx.hash);
  const directionLabel =
    tx.direction === "in" ? "Received" : tx.direction === "out" ? "Sent" : "Self";
  const DirIcon =
    tx.direction === "in"
      ? ArrowDownLeft
      : tx.direction === "out"
      ? ArrowUpRight
      : RefreshCw;
  const counterparty = tx.direction === "out" ? tx.to : tx.from;
  const counterpartyLabel =
    (tx.direction === "out" ? tx.toLabel : tx.fromLabel) ?? null;

  return (
    <a
      href={url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition"
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: `${chainColor(tx.chain)}22`, border: `1px solid ${chainColor(tx.chain)}55` }}
      >
        <DirIcon className="w-4 h-4" style={{ color: chainColor(tx.chain) }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[11px] font-medium px-1.5 py-0.5 rounded border"
            style={{ color: cat.color, background: cat.bg, borderColor: cat.border }}
          >
            {tx.category}
          </span>
          <span className="text-sm font-medium">{directionLabel}</span>
          {meta && (
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: meta.color }}
              />
              {meta.label}
            </span>
          )}
          {!tx.successful && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40">
              FAILED
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate">
          {counterpartyLabel ? (
            <span className="text-foreground/80">{counterpartyLabel}</span>
          ) : (
            <span className="font-mono">{shortAddress(counterparty, 6)}</span>
          )}
          <span className="mx-1.5">·</span>
          <span>{timeAgo(tx.timestamp)}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-medium tabular-nums">
          {tx.valueQuote > 0 ? tx.valuePretty : "—"}
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          gas {formatUSD(tx.gasQuote, { compact: true })}
        </div>
      </div>
    </a>
  );
}

function ActivitySkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="divide-y divide-border">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="skeleton w-9 h-9 rounded-full" />
            <div className="flex-1">
              <div className="skeleton h-3 w-40 mb-2" />
              <div className="skeleton h-2 w-32" />
            </div>
            <div className="skeleton h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
