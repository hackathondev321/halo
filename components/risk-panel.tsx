"use client";

import type { RiskScoreResponse } from "@/lib/types";

const SEVERITY_COLOR: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
};

const GRADE_COLOR: Record<string, string> = {
  A: "#10b981",
  B: "#22d3ee",
  C: "#f59e0b",
  D: "#f97316",
  F: "#ef4444",
};

export function RiskPanel({
  data,
  error,
}: {
  data: RiskScoreResponse | null;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="card p-6 border-[#ef4444]/40">
        <div className="text-sm text-[#ef4444]">
          Failed to load risk score: {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-6">
          <div className="skeleton w-32 h-32 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-6 w-72" />
            <div className="skeleton h-4 w-56" />
          </div>
        </div>
      </div>
    );
  }

  const gradeColor = GRADE_COLOR[data.grade] ?? "#a1a1aa";
  const sevColor = SEVERITY_COLOR[data.severity] ?? "#a1a1aa";
  const pct = data.score;

  return (
    <div className="card p-6 md:p-8 relative overflow-hidden">
      <div
        className="glow absolute"
        style={{
          top: -100,
          left: -100,
          width: 260,
          height: 260,
          background: gradeColor,
          opacity: 0.18,
        }}
      />

      <div className="relative flex flex-col md:flex-row md:items-center gap-8">
        <div className="shrink-0 flex items-center justify-center">
          <ScoreRing score={pct} color={gradeColor} grade={data.grade} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{
                color: sevColor,
                background: `${sevColor}22`,
                border: `1px solid ${sevColor}55`,
              }}
            >
              {data.severity} risk
            </span>
            <span className="text-xs text-muted-foreground">
              Halo Risk Score
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold leading-tight mb-3">
            {data.headline}
          </h2>

          <ul className="space-y-1 text-sm text-muted-foreground">
            {data.insights.map((ins, i) => (
              <li key={i}>{ins}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {data.breakdown.map((b) => (
          <BreakdownCell key={b.label} item={b} />
        ))}
      </div>
    </div>
  );
}

function ScoreRing({
  score,
  color,
  grade,
}: {
  score: number;
  color: string;
  grade: string;
}) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative w-36 h-36">
      <svg width="144" height="144" viewBox="0 0 144 144">
        <circle
          cx="72"
          cy="72"
          r={r}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="10"
        />
        <circle
          cx="72"
          cy="72"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 72 72)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-semibold tabular-nums" style={{ color }}>
          {score}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Grade {grade}
        </div>
      </div>
    </div>
  );
}

function BreakdownCell({
  item,
}: {
  item: RiskScoreResponse["breakdown"][number];
}) {
  const pct = item.maxScore > 0 ? item.score / item.maxScore : 0;
  const color = SEVERITY_COLOR[item.severity] ?? "#a1a1aa";
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-xs font-medium text-foreground">{item.label}</div>
        <div className="text-xs tabular-nums text-muted-foreground">
          {item.score}/{item.maxScore}
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct * 100}%`,
            background: color,
          }}
        />
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground leading-snug line-clamp-2">
        {item.description}
      </div>
    </div>
  );
}
