import { ImageResponse } from "next/og";
import { detectAddressType, shortAddress } from "@/lib/utils";

export const runtime = "nodejs";
export const alt = "Halo wallet risk score";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type RiskSummary = {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  headline: string;
  severity: "low" | "medium" | "high";
};

const GRADE_COLOR: Record<string, string> = {
  A: "#10b981",
  B: "#22d3ee",
  C: "#f59e0b",
  D: "#f97316",
  F: "#ef4444",
};

function baseUrlFromEnv(): string | null {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return null;
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address: raw } = await params;
  const address = decodeURIComponent(raw).trim();
  const type = detectAddressType(address);

  let risk: RiskSummary | null = null;
  const origin = baseUrlFromEnv();
  if (origin && type !== "unknown") {
    try {
      const r = await fetch(
        `${origin}/api/wallet/${encodeURIComponent(address)}/risk`,
        { cache: "no-store" }
      );
      if (r.ok) risk = (await r.json()) as RiskSummary;
    } catch {
      risk = null;
    }
  }

  const score = risk?.score ?? 0;
  const grade = risk?.grade ?? "?";
  const color = GRADE_COLOR[grade] ?? "#a1a1aa";
  const headline = risk?.headline ?? "Halo — wallet risk, portfolio, and activity";
  const severity = risk?.severity ?? "low";
  const short = shortAddress(address, 6);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0f",
          padding: 64,
          color: "#f5f5f7",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 999,
              border: "2px solid #a78bfa",
              marginRight: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "#a78bfa",
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 600 }}>
            Halo
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              fontSize: 18,
              color: "#a1a1aa",
              fontWeight: 500,
            }}
          >
            powered by GoldRush
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            marginTop: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 260,
              height: 260,
              borderRadius: 999,
              border: `14px solid ${color}`,
              marginRight: 56,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 96,
                fontWeight: 700,
                color,
                lineHeight: 1,
              }}
            >
              {String(score)}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "#a1a1aa",
                marginTop: 8,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              Grade {grade}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 20,
                color: "#a1a1aa",
                textTransform: "uppercase",
                letterSpacing: 3,
              }}
            >
              Halo risk score · {severity} risk
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 52,
                fontWeight: 600,
                lineHeight: 1.15,
                marginTop: 12,
                color: "#f5f5f7",
              }}
            >
              {headline}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 24,
                marginTop: 24,
                color: "#a1a1aa",
                fontFamily: "monospace",
              }}
            >
              {short}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            borderTop: "1px solid #27272a",
            paddingTop: 18,
            fontSize: 18,
            color: "#a1a1aa",
          }}
        >
          <div style={{ display: "flex", flex: 1 }}>
            Solana + 6 EVM chains · portfolio · approvals · counterparties
          </div>
          <div style={{ display: "flex", color: "#f5f5f7" }}>halo.vercel.app</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
