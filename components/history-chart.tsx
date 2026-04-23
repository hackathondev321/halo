"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { HistoryResponse } from "@/lib/types";
import { formatUSD } from "@/lib/utils";

export function HistoryChart({
  data,
  error,
  days,
  onDaysChange,
}: {
  data: HistoryResponse | null;
  error: string | null;
  days: number;
  onDaysChange: (d: number) => void;
}) {
  const options = [
    { label: "7D", value: 7 },
    { label: "30D", value: 30 },
    { label: "90D", value: 90 },
  ];

  if (error) {
    return (
      <div className="card p-6 border-[#ef4444]/40">
        <div className="text-sm text-[#ef4444]">
          Failed to load history: {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-5 w-40" />
          <div className="skeleton h-7 w-32" />
        </div>
        <div className="skeleton h-48 w-full" />
      </div>
    );
  }

  const positive = data.changePct >= 0;
  const accent = positive ? "#10b981" : "#ef4444";
  const chartData = data.points.map((p) => ({
    day: p.timestamp.slice(5),
    value: p.quote,
  }));

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Portfolio value · {data.days}d
          </div>
          <div className="mt-1 flex items-baseline gap-3 flex-wrap">
            <div className="text-3xl font-semibold tabular-nums">
              {formatUSD(data.current)}
            </div>
            <div
              className="text-sm font-medium tabular-nums"
              style={{ color: accent }}
            >
              {positive ? "+" : ""}
              {data.changePct.toFixed(2)}%
            </div>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            H {formatUSD(data.high, { compact: true })} · L{" "}
            {formatUSD(data.low, { compact: true })} ·{" "}
            {data.fetchedChains.join(" + ") || "no chains"}
          </div>
        </div>

        <div className="flex items-center gap-1 bg-muted/40 border border-border rounded-lg p-0.5">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => onDaysChange(o.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                o.value === days
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-52">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No historical data available for this wallet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="halo-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                stroke="#a1a1aa"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                stroke="#a1a1aa"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  formatUSD(Number(v), { compact: true }).replace("$", "$")
                }
                width={60}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--foreground)",
                }}
                formatter={(value) => [formatUSD(Number(value)), "Value"]}
                labelFormatter={(l) => String(l)}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={accent}
                strokeWidth={2}
                fill="url(#halo-grad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
