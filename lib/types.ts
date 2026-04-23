export type WalletType = "solana" | "evm";

export interface NormalizedToken {
  chain: string;
  contractAddress: string;
  symbol: string;
  name: string;
  logoUrl: string | null;
  balance: number;
  quote: number;
  quoteRate: number;
  decimals: number;
  type: string;
  isSpam: boolean;
  isNative: boolean;
}

export interface PortfolioResponse {
  address: string;
  walletType: WalletType;
  totalQuote: number;
  change24hQuote: number;
  change24hPct: number;
  activeChains: string[];
  tokens: NormalizedToken[];
  byChain: Record<string, { quote: number; count: number }>;
  fetchedChains: string[];
  errors: { chain: string; message: string }[];
}

export interface NormalizedTx {
  chain: string;
  hash: string;
  timestamp: string;
  successful: boolean;
  direction: "in" | "out" | "self";
  from: string;
  to: string;
  fromLabel: string | null;
  toLabel: string | null;
  valueQuote: number;
  valuePretty: string;
  gasQuote: number;
  category: string;
}

export interface ActivityResponse {
  address: string;
  items: NormalizedTx[];
  errors: { chain: string; message: string }[];
}

export interface RiskySpender {
  chain: string;
  tokenSymbol: string;
  tokenAddress: string;
  spenderAddress: string;
  spenderLabel: string | null;
  allowance: string;
  allowanceQuote: number;
  valueAtRiskQuote: number;
  riskFactor: string;
  prettyValueAtRisk: string;
}

export interface SecurityResponse {
  address: string;
  totalAtRisk: number;
  unlimitedApprovals: number;
  highRiskSpenders: number;
  spenders: RiskySpender[];
  errors: { chain: string; message: string }[];
}

export interface RiskBreakdown {
  label: string;
  description: string;
  score: number;
  maxScore: number;
  severity: "low" | "medium" | "high";
}

export interface RiskScoreResponse {
  address: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  severity: "low" | "medium" | "high";
  headline: string;
  breakdown: RiskBreakdown[];
  insights: string[];
}
