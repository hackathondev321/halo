"use client";

import { CHAIN_META, chainLabel } from "@/lib/goldrush";
import { formatUSD, shortAddress } from "@/lib/utils";
import type { SecurityResponse, WalletType, RiskySpender } from "@/lib/types";

export function SecurityTab({
  data,
  error,
  walletType,
}: {
  data: SecurityResponse | null;
  error: string | null;
  walletType: WalletType;
}) {
  if (error) {
    return (
      <div className="card p-6 border-[#ef4444]/40 text-sm text-[#ef4444]">
        {error}
      </div>
    );
  }
  if (!data) return <SecuritySkeleton />;

  if (walletType === "solana") {
    return (
      <div className="card p-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#14f195]/40 bg-[#14f195]/10 mb-4">
          <div className="w-2 h-2 rounded-full bg-[#14f195]" />
        </div>
        <div className="font-medium mb-1">Solana-native wallet</div>
        <div className="text-sm text-muted-foreground max-w-md mx-auto">
          Solana uses program-level transfer authority rather than ERC-20-style
          approvals, so there are no standing token allowances to audit here.
          The Portfolio and Activity tabs still show live onchain data.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RiskStat
          label="Total value at risk"
          value={formatUSD(data.totalAtRisk, { compact: true })}
          tone={data.totalAtRisk > 100 ? "danger" : "neutral"}
        />
        <RiskStat
          label="Unlimited approvals"
          value={data.unlimitedApprovals.toString()}
          tone={data.unlimitedApprovals > 0 ? "warning" : "success"}
        />
        <RiskStat
          label="High-risk spenders"
          value={data.highRiskSpenders.toString()}
          tone={data.highRiskSpenders > 0 ? "danger" : "success"}
        />
      </div>

      {data.spenders.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#10b981]/40 bg-[#10b981]/10 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#10b981]" />
          </div>
          <div className="font-medium mb-1">Clean approval slate</div>
          <div className="text-sm text-muted-foreground">
            No open token approvals found across the queried EVM chains.
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-4 py-3 font-medium">Token</th>
                <th className="px-4 py-3 font-medium">Spender</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Chain</th>
                <th className="px-4 py-3 font-medium text-right">Allowance</th>
                <th className="px-4 py-3 font-medium text-right">At risk</th>
              </tr>
            </thead>
            <tbody>
              {data.spenders.map((s, i) => (
                <SpenderRow key={`${s.chain}-${s.tokenAddress}-${s.spenderAddress}-${i}`} spender={s} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.errors.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Skipped: {data.errors.map((e) => chainLabel(e.chain)).join(", ")}
        </div>
      )}
    </div>
  );
}

function RiskStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "success" | "warning" | "danger";
}) {
  const toneColor =
    tone === "success"
      ? "#10b981"
      : tone === "warning"
      ? "#f59e0b"
      : tone === "danger"
      ? "#ef4444"
      : "#a1a1aa";
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className="mt-1 text-2xl font-semibold tabular-nums"
        style={{ color: tone === "neutral" ? undefined : toneColor }}
      >
        {value}
      </div>
    </div>
  );
}

function SpenderRow({ spender: s }: { spender: RiskySpender }) {
  const meta = CHAIN_META[s.chain];
  const riskHigh = s.riskFactor?.toLowerCase().includes("high");
  const unlimited = (s.allowance?.length ?? 0) >= 30;

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition">
      <td className="px-4 py-3">
        <div className="font-medium">{s.tokenSymbol}</div>
        <div className="text-xs text-muted-foreground font-mono">
          {shortAddress(s.tokenAddress)}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="truncate max-w-[180px]">
            {s.spenderLabel ?? shortAddress(s.spenderAddress, 6)}
          </span>
          {riskHigh && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40">
              HIGH
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {shortAddress(s.spenderAddress, 6)}
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {meta && (
          <div className="inline-flex items-center gap-1.5 text-xs">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: meta.color }}
            />
            <span className="text-muted-foreground">{meta.label}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {unlimited ? (
          <span className="text-xs text-[#f59e0b] font-medium">UNLIMITED</span>
        ) : (
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatUSD(s.allowanceQuote, { compact: true })}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right tabular-nums font-medium">
        {s.prettyValueAtRisk}
      </td>
    </tr>
  );
}

function SecuritySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-3 w-24 mb-3" />
            <div className="skeleton h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="card p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex-1">
              <div className="skeleton h-3 w-28 mb-1.5" />
              <div className="skeleton h-2 w-32" />
            </div>
            <div className="skeleton h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
