import { GoldRushClient, ChainName, type Chain } from "@covalenthq/client-sdk";

let _client: GoldRushClient | null = null;

/**
 * Lazily instantiate the GoldRush client so the module can be imported during
 * `next build` (page-data collection) without requiring an API key.
 */
export function getGoldRush(): GoldRushClient {
  if (_client) return _client;
  const apiKey = process.env.GOLDRUSH_API_KEY ?? "";
  if (!apiKey) {
    throw new Error(
      "GOLDRUSH_API_KEY is not set. Create .env.local with your key from https://goldrush.dev/platform"
    );
  }
  _client = new GoldRushClient(apiKey, {
    debug: false,
    threadCount: 3,
  });
  return _client;
}


export const SOLANA_CHAIN: Chain = ChainName.SOLANA_MAINNET;

export const EVM_CHAINS: Chain[] = [
  ChainName.ETH_MAINNET,
  ChainName.BASE_MAINNET,
  ChainName.MATIC_MAINNET,
  ChainName.ARBITRUM_MAINNET,
  ChainName.OPTIMISM_MAINNET,
  ChainName.BSC_MAINNET,
];

export const ALL_CHAINS: Chain[] = [SOLANA_CHAIN, ...EVM_CHAINS];

export type ChainMeta = { label: string; color: string; native: string };

export const CHAIN_META: Record<string, ChainMeta> = {
  "solana-mainnet": { label: "Solana", color: "#14f195", native: "SOL" },
  "eth-mainnet": { label: "Ethereum", color: "#627eea", native: "ETH" },
  "base-mainnet": { label: "Base", color: "#0052ff", native: "ETH" },
  "matic-mainnet": { label: "Polygon", color: "#8247e5", native: "POL" },
  "arbitrum-mainnet": { label: "Arbitrum", color: "#28a0f0", native: "ETH" },
  "optimism-mainnet": { label: "Optimism", color: "#ff0420", native: "ETH" },
  "bsc-mainnet": { label: "BNB Chain", color: "#f0b90b", native: "BNB" },
};

export function chainMeta(chain: string): ChainMeta {
  return CHAIN_META[chain] ?? { label: chain, color: "#a1a1aa", native: "?" };
}

export function chainLabel(chain: string): string {
  return chainMeta(chain).label;
}

export function chainColor(chain: string): string {
  return chainMeta(chain).color;
}

/**
 * Known high-risk spender / scam addresses across chains.
 * Lightweight seed list — production version would pull from a database.
 */
export const HIGH_RISK_SPENDERS: Set<string> = new Set([
  "0x000000000022d473030f116ddee9f6b43ac78ba3",
].map((x) => x.toLowerCase()));

export const UNLIMITED_APPROVAL_THRESHOLD = BigInt(
  "100000000000000000000000000000"
);

/**
 * Common stablecoin + bluechip symbols used by the heuristic spam/quality filter.
 */
export const BLUECHIP_SYMBOLS = new Set([
  "USDC", "USDT", "DAI", "ETH", "WETH", "SOL", "WSOL", "BTC", "WBTC",
  "MATIC", "POL", "BNB", "ARB", "OP", "BONK", "JUP", "PYTH", "JTO",
  "LDO", "UNI", "AAVE", "CRV", "LINK", "USDG", "FRAX", "USDS", "PYUSD",
]);
