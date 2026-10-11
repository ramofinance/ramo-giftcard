import type { CardFont, CardTextColors, CardTextPositions, CardTextStyles } from "./templates";

export type TokenSymbol = "USDT" | "USDC";

export type Config = {
  chainId: number;
  tokens: { symbol: TokenSymbol; address: string; decimals: number }[];
  feeUsd: string;
  minGift: string;
  maxGift: string;
  gasBnb: string;
  botUsername: string;
  templates: number;
};

export type Form = {
  senderName: string;
  receiverName: string;
  receiverId: string;
  cardText: string;
  cardFont: CardFont;
  cardTextSize: number;
  cardTextRotation: number;
  cardTextPositions?: CardTextPositions;
  cardTextColors?: CardTextColors;
  cardTextStyles?: CardTextStyles;
  message: string;
  token: TokenSymbol;
  amount: string;
  gas: boolean;
};

export type Draft = {
  code: string;
  token: { symbol: TokenSymbol; address: string };
  amountUnits: string;
  feeUnits: string;
  gasWei: string;
  feeAddress: string;
};

export type DeliverResult = {
  ok: boolean;
  orderId: string;
  receiver: "sent" | "failed";
  sender: "sent" | "failed" | "skipped";
  repeated?: boolean;
};

// Kept only in this browser until the gift is delivered, so a closed tab can never lose money.
export type Pending = {
  draft: Draft;
  address: string;
  mnemonic: string;
  senderWallet: string;
  form: Form;
  templateId: number;
  txs: { gift?: string; fee?: string; gas?: string };
  createdAt: number;
};

export type OrderSummary = {
  orderId: string;
  amount: string;
  token: string;
  receiverName: string;
  status: "delivered" | "receiver_failed";
  createdAt: number;
};

export const DEFAULT_CONFIG: Config = {
  chainId: 56,
  tokens: [
    { symbol: "USDT", address: "0x55d398326f99059ff775485246999027b3197955", decimals: 18 },
    { symbol: "USDC", address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", decimals: 18 }
  ],
  feeUsd: "0.5",
  minGift: "1",
  maxGift: "5000",
  gasBnb: "0.001",
  botUsername: "ramofinance_alerts_bot",
  templates: 100
};
