"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { RiskPanel } from "./risk-panel";
import { PortfolioTab } from "./portfolio-tab";
import { ActivityTab } from "./activity-tab";
import { SecurityTab } from "./security-tab";
import { HistoryChart } from "./history-chart";
import { CounterpartiesPanel } from "./counterparties-panel";
import { AiSummary } from "./ai-summary";
import type {
  ActivityResponse,
  AiSummaryResponse,
  CounterpartiesResponse,
  HistoryResponse,
  PortfolioResponse,
  RiskScoreResponse,
  SecurityResponse,
  WalletType,
} from "@/lib/types";

const TABS = [
  { id: "portfolio", label: "Portfolio" },
  { id: "activity", label: "Activity" },
  { id: "security", label: "Security" },
  { id: "counterparties", label: "Counterparties" },
] as const;

type TabId = (typeof TABS)[number]["id"];

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`${res.status} ${msg}`);
  }
  return res.json();
}

export function Dashboard({
  address,
  walletType,
}: {
  address: string;
  walletType: WalletType;
}) {
  const [tab, setTab] = useState<TabId>("portfolio");
  const [days, setDays] = useState<number>(30);

  const [risk, setRisk] = useState<RiskScoreResponse | null>(null);
  const [riskErr, setRiskErr] = useState<string | null>(null);

  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [portfolioErr, setPortfolioErr] = useState<string | null>(null);

  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [activityErr, setActivityErr] = useState<string | null>(null);

  const [security, setSecurity] = useState<SecurityResponse | null>(null);
  const [securityErr, setSecurityErr] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [historyErr, setHistoryErr] = useState<string | null>(null);

  const [cps, setCps] = useState<CounterpartiesResponse | null>(null);
  const [cpsErr, setCpsErr] = useState<string | null>(null);

  const [ai, setAi] = useState<AiSummaryResponse | null>(null);
  const [aiErr, setAiErr] = useState<string | null>(null);

  const addr = encodeURIComponent(address);

  useEffect(() => {
    setRisk(null);
    setPortfolio(null);
    setActivity(null);
    setSecurity(null);
    setCps(null);
    setAi(null);

    setRiskErr(null);
    setPortfolioErr(null);
    setActivityErr(null);
    setSecurityErr(null);
    setCpsErr(null);
    setAiErr(null);

    fetchJSON<PortfolioResponse>(`/api/wallet/${addr}/portfolio`)
      .then(setPortfolio)
      .catch((e) => setPortfolioErr(String(e)));
    fetchJSON<RiskScoreResponse>(`/api/wallet/${addr}/risk`)
      .then(setRisk)
      .catch((e) => setRiskErr(String(e)));
    fetchJSON<ActivityResponse>(`/api/wallet/${addr}/activity`)
      .then(setActivity)
      .catch((e) => setActivityErr(String(e)));
    fetchJSON<SecurityResponse>(`/api/wallet/${addr}/security`)
      .then(setSecurity)
      .catch((e) => setSecurityErr(String(e)));
    fetchJSON<CounterpartiesResponse>(`/api/wallet/${addr}/counterparties`)
      .then(setCps)
      .catch((e) => setCpsErr(String(e)));
    // AI summary is derived from the others; fetch slightly after so upstream
    // endpoints are warm, but don't block rendering.
    fetchJSON<AiSummaryResponse>(`/api/wallet/${addr}/ai-summary`)
      .then(setAi)
      .catch((e) => setAiErr(String(e)));
  }, [address, addr]);

  // History is re-fetched when the `days` window changes
  useEffect(() => {
    setHistory(null);
    setHistoryErr(null);
    fetchJSON<HistoryResponse>(`/api/wallet/${addr}/history?days=${days}`)
      .then(setHistory)
      .catch((e) => setHistoryErr(String(e)));
  }, [addr, days]);

  return (
    <div className="space-y-6">
      <RiskPanel data={risk} error={riskErr} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <HistoryChart
            data={history}
            error={historyErr}
            days={days}
            onDaysChange={setDays}
          />
        </div>
        <div className="lg:col-span-2">
          <AiSummary data={ai} error={aiErr} />
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap",
              tab === t.id
                ? "border-[#a78bfa] text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === "portfolio" && (
          <PortfolioTab data={portfolio} error={portfolioErr} />
        )}
        {tab === "activity" && (
          <ActivityTab data={activity} error={activityErr} />
        )}
        {tab === "security" && (
          <SecurityTab
            data={security}
            error={securityErr}
            walletType={walletType}
          />
        )}
        {tab === "counterparties" && (
          <CounterpartiesPanel data={cps} error={cpsErr} />
        )}
      </div>
    </div>
  );
}
