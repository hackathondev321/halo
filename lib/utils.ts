import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(n: number | null | undefined, opts?: { compact?: boolean }): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "$0.00";
  if (opts?.compact && Math.abs(n) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(n);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n);
}

export function formatNumber(n: number | null | undefined, decimals = 4): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "0";
  if (Math.abs(n) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(n);
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
  }).format(n);
}

export function shortAddress(addr: string, chars = 4): string {
  if (!addr) return "";
  if (addr.length <= chars * 2 + 2) return addr;
  return `${addr.slice(0, chars + 2)}…${addr.slice(-chars)}`;
}

export function timeAgo(input: string | number | Date): string {
  const date = new Date(input);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function isSolanaAddress(addr: string): boolean {
  if (!addr) return false;
  // Solana addresses are base58, 32-44 chars, no 0, O, I, l
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr) && !addr.startsWith("0x");
}

export function isEvmAddress(addr: string): boolean {
  if (!addr) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export function isEnsName(addr: string): boolean {
  if (!addr) return false;
  return /\.(eth|lens|crypto|x|wallet|nft)$/i.test(addr);
}

export type AddressType = "solana" | "evm" | "ens" | "unknown";

export function detectAddressType(addr: string): AddressType {
  const trimmed = addr.trim();
  if (isEvmAddress(trimmed)) return "evm";
  if (isEnsName(trimmed)) return "ens";
  if (isSolanaAddress(trimmed)) return "solana";
  return "unknown";
}

export function parseBalance(balance: string | number | null | undefined, decimals: number): number {
  if (balance === null || balance === undefined) return 0;
  const n = typeof balance === "string" ? parseFloat(balance) : balance;
  if (Number.isNaN(n)) return 0;
  return n / Math.pow(10, decimals);
}
