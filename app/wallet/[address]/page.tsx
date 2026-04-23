import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { detectAddressType, shortAddress } from "@/lib/utils";
import { WalletSearch } from "@/components/wallet-search";
import { Dashboard } from "@/components/dashboard";
import { Logo } from "@/components/logo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address: raw } = await params;
  const address = decodeURIComponent(raw).trim();
  const short = shortAddress(address, 6);
  const title = `${short} — Halo wallet risk score`;
  const description =
    "Multi-chain wallet risk score, portfolio history, approvals audit and counterparty graph — powered by GoldRush.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function WalletPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address: raw } = await params;
  const address = decodeURIComponent(raw).trim();
  const type = detectAddressType(address);
  if (type === "unknown") notFound();

  return (
    <div className="relative min-h-screen">
      <div
        className="glow"
        style={{
          top: "-5%",
          left: "10%",
          width: 360,
          height: 360,
          background: "#8b5cf6",
          opacity: 0.25,
        }}
      />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-10 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={28} />
          <span className="text-lg font-semibold tracking-tight">Halo</span>
        </Link>
        <div className="w-full md:w-auto md:flex-1 md:max-w-xl md:mx-8">
          <WalletSearch initial={address} />
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="px-2 py-1 rounded-md bg-muted border border-border font-mono">
            {type.toUpperCase()}
          </span>
          <span className="font-mono">{shortAddress(address, 6)}</span>
        </div>
      </header>

      <main className="relative z-10 px-4 py-6 md:px-10 md:py-10 max-w-7xl mx-auto">
        <Dashboard address={address} walletType={type === "solana" ? "solana" : "evm"} />
      </main>

      <footer className="relative z-10 px-6 py-6 text-center text-xs text-muted-foreground border-t border-border mt-12">
        Data by{" "}
        <a
          href="https://goldrush.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground"
        >
          GoldRush
        </a>{" "}
        · Balances, approvals, transactions across Solana + 6 EVM chains
      </footer>
    </div>
  );
}
