"use client";

import type { CounterpartiesResponse } from "@/lib/types";
import { chainLabel, chainColor } from "@/lib/goldrush";
import { shortAddress, formatUSD, timeAgo } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";

const CATEGORY_COLOR: Record<string, string> = {
  DEX: "#8b5cf6",
  Bridge: "#06b6d4",
  Staking: "#10b981",
  NFT: "#f59e0b",
  CEX: "#ef4444",
  Lending: "#22d3ee",
  Contract: "#a1a1aa",
  Unknown: "#71717a",
};

export function CounterpartiesPanel({
  data,
  error,
}: {
  data: CounterpartiesResponse | null;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="card p-6 border-[#ef4444]/40">
        <div className="text-sm text-[#ef4444]">
          Failed to load counterparties: {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-6">
        <div className="skeleton h-5 w-48 mb-4" />
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <div className="card p-6">
        <div className="text-sm font-medium mb-1">Top counterparties</div>
        <div className="text-sm text-muted-foreground">
          No counterparties detected from recent on-chain activity.
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Counterparty graph
          </div>
          <div className="text-base font-semibold mt-0.5">
            Top interactions · {data.totalCounterparties.toLocaleString()}{" "}
            unique
          </div>
        </div>
      </div>

      <div className="divide-y divide-border">
        {data.items.slice(0, 8).map((c) => {
          const color = CATEGORY_COLOR[c.category] ?? "#a1a1aa";
          const Dir =
            c.direction === "in"
              ? ArrowDownLeft
              : c.direction === "out"
              ? ArrowUpRight
              : ArrowLeftRight;
          return (
            <div
              key={c.address}
              className="flex items-center gap-3 py-2.5"
            >
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                style={{
                  background: `${color}22`,
                  border: `1px solid ${color}55`,
                }}
              >
                <Dir size={14} style={{ color }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate">
                    {c.label ?? shortAddress(c.address, 6)}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider"
                    style={{
                      background: `${color}22`,
                      color,
                      border: `1px solid ${color}44`,
                    }}
                  >
                    {c.category}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span>{c.interactions} tx</span>
                  <span>·</span>
                  <span>{timeAgo(c.lastSeen)}</span>
                  {c.chains.slice(0, 2).map((ch) => (
                    <span
                      key={ch}
                      className="inline-flex items-center gap-1"
                    >
                      <span>·</span>
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: chainColor(ch) }}
                      />
                      {chainLabel(ch)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-medium tabular-nums">
                  {formatUSD(c.totalValueQuote, { compact: true })}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  flow
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
