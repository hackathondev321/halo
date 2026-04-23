"use client";

import { chainColor, chainLabel, CHAIN_META } from "@/lib/goldrush";
import { cn, formatNumber, formatUSD, shortAddress } from "@/lib/utils";
import type { PortfolioResponse } from "@/lib/types";
import { useState } from "react";

export function PortfolioTab({
  data,
  error,
}: {
  data: PortfolioResponse | null;
  error: string | null;
}) {
  const [chainFilter, setChainFilter] = useState<string | null>(null);

  if (error) {
    return (
      <div className="card p-6 border-[#ef4444]/40 text-sm text-[#ef4444]">
        {error}
      </div>
    );
  }
  if (!data) return <PortfolioSkeleton />;

  const filtered = chainFilter
    ? data.tokens.filter((t) => t.chain === chainFilter)
    : data.tokens;
  const shown = filtered.filter((t) => (t.quote ?? 0) > 0.01 || t.isNative);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total value"
          value={formatUSD(data.totalQuote, { compact: false })}
          sub={`${data.activeChains.length} chain${data.activeChains.length === 1 ? "" : "s"} active`}
        />
        <StatCard
          label="Tokens"
          value={shown.length.toString()}
          sub={`${data.tokens.length} raw · ${data.tokens.filter((t) => t.isSpam).length} spam filtered`}
        />
        <StatCard
          label="Top holding"
          value={data.tokens[0]?.symbol ?? "—"}
          sub={formatUSD(data.tokens[0]?.quote ?? 0, { compact: true })}
        />
      </div>

      {data.activeChains.length > 1 && (
        <ChainDistribution data={data} />
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <FilterChip
          active={chainFilter === null}
          onClick={() => setChainFilter(null)}
          label="All chains"
          count={data.tokens.length}
        />
        {data.activeChains.map((c) => (
          <FilterChip
            key={c}
            active={chainFilter === c}
            onClick={() => setChainFilter(c)}
            label={chainLabel(c)}
            count={data.byChain[c]?.count ?? 0}
            color={chainColor(c)}
          />
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="px-4 py-3 font-medium">Token</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Chain</th>
              <th className="px-4 py-3 font-medium text-right">Balance</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No tokens with USD value on this selection.
                </td>
              </tr>
            ) : (
              shown.slice(0, 100).map((t, i) => (
                <tr
                  key={`${t.chain}-${t.contractAddress}-${i}`}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {t.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.logoUrl}
                          alt=""
                          className="w-7 h-7 rounded-full bg-muted"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                          }}
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                          {t.symbol.slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium truncate flex items-center gap-1.5">
                          {t.symbol}
                          {t.isSpam && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40">
                              SPAM
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {t.name || shortAddress(t.contractAddress)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <ChainPill chain={t.chain} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatNumber(t.balance)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {t.quoteRate ? formatUSD(t.quoteRate) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatUSD(t.quote, { compact: true })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data.errors.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Skipped: {data.errors.map((e) => chainLabel(e.chain)).join(", ")}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-xs px-3 py-1.5 rounded-full border transition flex items-center gap-1.5",
        active
          ? "bg-[#8b5cf6]/20 border-[#8b5cf6]/60 text-foreground"
          : "bg-card border-border text-muted-foreground hover:text-foreground"
      )}
    >
      {color && (
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      )}
      <span>{label}</span>
      <span className="text-muted-foreground">{count}</span>
    </button>
  );
}

function ChainPill({ chain }: { chain: string }) {
  const meta = CHAIN_META[chain];
  if (!meta) return <span className="text-xs">{chain}</span>;
  return (
    <div className="inline-flex items-center gap-1.5 text-xs">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: meta.color }}
      />
      <span className="text-muted-foreground">{meta.label}</span>
    </div>
  );
}

function ChainDistribution({ data }: { data: PortfolioResponse }) {
  const total = data.totalQuote || 1;
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Value by chain
      </div>
      <div className="flex rounded-lg overflow-hidden h-3">
        {data.activeChains.map((c) => {
          const v = data.byChain[c]?.quote ?? 0;
          const pct = (v / total) * 100;
          if (pct < 0.1) return null;
          return (
            <div
              key={c}
              style={{ width: `${pct}%`, background: chainColor(c) }}
              title={`${chainLabel(c)} · ${formatUSD(v)}`}
            />
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {data.activeChains.map((c) => {
          const v = data.byChain[c]?.quote ?? 0;
          const pct = (v / total) * 100;
          return (
            <div key={c} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: chainColor(c) }}
              />
              <span className="truncate">{chainLabel(c)}</span>
              <span className="text-muted-foreground tabular-nums ml-auto">
                {pct.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-3 w-24 mb-3" />
            <div className="skeleton h-7 w-32 mb-2" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="card p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton w-8 h-8 rounded-full" />
            <div className="flex-1">
              <div className="skeleton h-3 w-28 mb-1.5" />
              <div className="skeleton h-2 w-20" />
            </div>
            <div className="skeleton h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
