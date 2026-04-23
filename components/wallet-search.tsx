"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { detectAddressType } from "@/lib/utils";

export function WalletSearch({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    const type = detectAddressType(trimmed);
    if (type === "unknown") {
      setError(
        "That doesn't look like a Solana, Ethereum, or ENS address. Try again."
      );
      return;
    }
    setError(null);
    setLoading(true);
    router.push(`/wallet/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-stretch gap-2 p-1.5 rounded-2xl border border-border bg-card shadow-[0_8px_40px_rgba(139,92,246,0.15)]">
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste a wallet address (Solana, EVM, or ENS)"
          className="flex-1 bg-transparent px-4 py-3 text-sm md:text-base outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!value.trim() || loading}
          className="btn-primary px-5 md:px-6 text-sm md:text-base"
        >
          {loading ? "Loading…" : "Scan"}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-xs text-[#ef4444] text-left px-2">
          {error}
        </div>
      )}
    </form>
  );
}
