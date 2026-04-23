import { NextResponse } from "next/server";
import { detectAddressType } from "@/lib/utils";
import type { AiSummaryResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function baseUrl(req: Request): string {
  const hdr = new Headers(req.headers);
  const proto = hdr.get("x-forwarded-proto") ?? "https";
  const host = hdr.get("x-forwarded-host") ?? hdr.get("host");
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

function fallbackSummary(ctx: {
  address: string;
  risk: {
    score?: number;
    grade?: string;
    headline?: string;
    insights?: string[];
    breakdown?: { label: string; description: string }[];
  } | null;
  portfolio: {
    totalQuote?: number;
    activeChains?: string[];
    tokens?: { symbol: string; quote: number }[];
  } | null;
  counterparties: { items?: { label: string | null; category: string }[] } | null;
}): AiSummaryResponse {
  const score = ctx.risk?.score ?? 0;
  const grade = ctx.risk?.grade ?? "?";
  const total = ctx.portfolio?.totalQuote ?? 0;
  const chains = ctx.portfolio?.activeChains?.length ?? 0;
  const top = ctx.portfolio?.tokens?.slice(0, 3).map((t) => t.symbol) ?? [];
  const cps =
    ctx.counterparties?.items
      ?.filter((c) => c.label)
      .slice(0, 3)
      .map((c) => c.label) ?? [];

  const headline = `${grade} grade · $${total.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })} across ${chains} chain${chains === 1 ? "" : "s"}`;

  const summary = [
    `This wallet scores ${score}/100 (grade ${grade}). ${
      ctx.risk?.headline ?? ""
    }`.trim(),
    total > 0
      ? `Holds ~$${total.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })} across ${chains} active chain${chains === 1 ? "" : "s"}${
          top.length ? `, led by ${top.join(", ")}` : ""
        }.`
      : `No significant on-chain value detected in the scanned chains.`,
    cps.length
      ? `Most-used counterparties include ${cps.join(", ")}.`
      : `No labeled counterparties surfaced from recent activity.`,
  ].join(" ");

  const recs = (ctx.risk?.insights ?? []).slice(0, 4);

  return {
    address: ctx.address,
    summary,
    headlines: [headline, ctx.risk?.headline ?? ""].filter(Boolean) as string[],
    recommendations:
      recs.length > 0 ? recs : ["Keep approvals tidy and monitor dust tokens."],
    model: "deterministic-fallback",
    generated: false,
    reason:
      "OPENAI_API_KEY not set — returning deterministic summary. Add the key to enable LLM-generated narrative.",
  };
}

export async function GET(
  req: Request,
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

  const origin = baseUrl(req);
  const addr = encodeURIComponent(address);

  const [risk, portfolio, counterparties] = await Promise.all([
    safeFetch<{
      score: number;
      grade: string;
      headline: string;
      insights: string[];
      breakdown: { label: string; description: string }[];
    }>(`${origin}/api/wallet/${addr}/risk`),
    safeFetch<{
      totalQuote: number;
      activeChains: string[];
      tokens: { symbol: string; quote: number; chain: string }[];
    }>(`${origin}/api/wallet/${addr}/portfolio`),
    safeFetch<{
      items: {
        label: string | null;
        category: string;
        interactions: number;
      }[];
    }>(`${origin}/api/wallet/${addr}/counterparties`),
  ]);

  const ctx = { address, risk, portfolio, counterparties };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(fallbackSummary(ctx), {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  }

  const prompt = [
    "You are a wallet-risk analyst. Given the structured data below, produce a concise briefing.",
    "",
    "Return STRICT JSON with keys:",
    "  summary: string  (3-4 sentences, plain English, no markdown, no emojis)",
    "  headlines: string[]  (2-3 short headlines, <= 10 words each)",
    "  recommendations: string[]  (2-4 concrete actions the wallet owner should take)",
    "",
    "Rules: no markdown, no lists in summary, no emojis, no hype language.",
    "",
    "Address: " + address,
    "Risk: " + JSON.stringify(risk ?? {}),
    "Portfolio: " +
      JSON.stringify({
        totalQuote: portfolio?.totalQuote,
        activeChains: portfolio?.activeChains,
        topTokens: (portfolio?.tokens ?? []).slice(0, 8).map((t) => ({
          symbol: t.symbol,
          chain: t.chain,
          quote: t.quote,
        })),
      }),
    "Counterparties: " +
      JSON.stringify(
        (counterparties?.items ?? []).slice(0, 8).map((c) => ({
          label: c.label,
          category: c.category,
          interactions: c.interactions,
        }))
      ),
  ].join("\n");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You analyze on-chain wallet data and respond with strict JSON. No emojis, no markdown.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const msg = await res.text();
      const fb = fallbackSummary(ctx);
      fb.reason = `OpenAI error ${res.status}: ${msg.slice(0, 200)}`;
      return NextResponse.json(fb);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: {
      summary?: string;
      headlines?: string[];
      recommendations?: string[];
    } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      const fb = fallbackSummary(ctx);
      fb.reason = "AI returned non-JSON response";
      return NextResponse.json(fb);
    }

    const out: AiSummaryResponse = {
      address,
      summary:
        (parsed.summary ?? "").trim() || fallbackSummary(ctx).summary,
      headlines: Array.isArray(parsed.headlines)
        ? parsed.headlines.slice(0, 3)
        : fallbackSummary(ctx).headlines,
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.slice(0, 4)
        : fallbackSummary(ctx).recommendations,
      model: MODEL,
      generated: true,
    };
    return NextResponse.json(out, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (err) {
    const fb = fallbackSummary(ctx);
    fb.reason = `AI call failed: ${err instanceof Error ? err.message : String(err)}`;
    return NextResponse.json(fb);
  }
}
