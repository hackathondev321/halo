"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { RiskPanel } from "./risk-panel";
import { PortfolioTab } from "./portfolio-tab";
import { ActivityTab } from "./activity-tab";
import { SecurityTab } from "./security-tab";
import type {
  ActivityResponse,
  PortfolioResponse,
  RiskScoreResponse,
  SecurityResponse,
  WalletType,
} from "@/lib/types";

const TABS = [
  { id: "portfolio", label: "Portfolio" },
  { id: "activity", label: "Activity" },
  { id: "security", label: "Security" },
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

  const [risk, setRisk] = useState<RiskScoreResponse | null>(null);
  const [riskErr, setRiskErr] = useState<string | null>(null);

  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [portfolioErr, setPortfolioErr] = useState<string | null>(null);

  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [activityErr, setActivityErr] = useState<string | null>(null);

  const [security, setSecurity] = useState<SecurityResponse | null>(null);
  const [securityErr, setSecurityErr] = useState<string | null>(null);

  useEffect(() => {
    setRisk(null);
    setPortfolio(null);
    setActivity(null);
    setSecurity(null);

    const addr = encodeURIComponent(address);

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
  }, [address]);

  return (
    <div className="space-y-8">
      <RiskPanel data={risk} error={riskErr} />

      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition",
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
      </div>
    </div>
  );
}
