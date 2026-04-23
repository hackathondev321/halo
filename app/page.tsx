import Link from "next/link";
import { WalletSearch } from "@/components/wallet-search";
import { Logo } from "@/components/logo";

const DEMO_WALLETS = [
  {
    label: "Solana whale",
    address: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
    chain: "Solana",
  },
  {
    label: "vitalik.eth",
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    chain: "Ethereum",
  },
  {
    label: "Base power user",
    address: "0x2b4a66557a79263275826ad31a4cddc2789334bd",
    chain: "Multi-chain",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="hero-grid absolute inset-0 pointer-events-none" />
      <div
        className="glow"
        style={{
          top: "-20%",
          left: "-10%",
          width: 520,
          height: 520,
          background: "#8b5cf6",
        }}
      />
      <div
        className="glow"
        style={{
          bottom: "-10%",
          right: "-10%",
          width: 520,
          height: 520,
          background: "#06b6d4",
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={28} />
          <span className="text-lg font-semibold tracking-tight">Halo</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <a
            href="https://goldrush.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition"
          >
            Powered by GoldRush
          </a>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition"
          >
            GitHub
          </a>
        </nav>
      </header>

      <main className="relative z-10 flex flex-col items-center px-6 pt-20 pb-32 text-center md:pt-28">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#8b5cf6]/40 bg-[#8b5cf6]/10 text-xs font-medium text-[#a78bfa] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] pulse-dot" />
          Solana Frontier Hackathon · Covalent GoldRush Track
        </div>

        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight max-w-3xl leading-[1.08]">
          See your entire{" "}
          <span className="bg-linear-to-r from-[#a78bfa] to-[#22d3ee] bg-clip-text text-transparent">
            onchain halo
          </span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-xl">
          Drop any wallet to get an instant Risk Score, portfolio breakdown, and
          approval audit — across Solana and 6 EVM chains, in one view.
        </p>

        <div className="mt-10 w-full max-w-xl">
          <WalletSearch />
        </div>

        <div className="mt-8 w-full max-w-xl">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
            Try a demo wallet
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {DEMO_WALLETS.map((w) => (
              <Link
                key={w.address}
                href={`/wallet/${w.address}`}
                className="text-xs px-3 py-2 rounded-full border border-border bg-card hover:bg-muted transition"
              >
                <span className="font-medium">{w.label}</span>
                <span className="text-muted-foreground ml-2">· {w.chain}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl text-left">
          <Feature
            label="01"
            title="Risk Score 0–100"
            desc="Composite rating from portfolio quality, spam exposure, approval hygiene, wallet age, and chain activity."
          />
          <Feature
            label="02"
            title="Cross-chain in one call"
            desc="Solana SPL + 6 EVM networks unified through GoldRush's multi-chain data endpoints."
          />
          <Feature
            label="03"
            title="Approval audit"
            desc="Spot unlimited approvals and high-risk spenders before your wallet gets drained."
          />
        </div>
      </main>

      <footer className="relative z-10 px-6 py-8 text-center text-xs text-muted-foreground border-t border-border">
        Built with{" "}
        <a
          href="https://goldrush.dev"
          className="text-foreground hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          GoldRush by Covalent
        </a>{" "}
        · Open source · Frontier Hackathon submission
      </footer>
    </div>
  );
}

function Feature({
  label,
  title,
  desc,
}: {
  label: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="card p-5">
      <div className="text-xs font-mono text-[#a78bfa] mb-3 tracking-wider">
        {label}
      </div>
      <div className="font-medium mb-1">{title}</div>
      <div className="text-sm text-muted-foreground leading-relaxed">
        {desc}
      </div>
    </div>
  );
}
