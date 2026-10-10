export interface GiftCardOrder {
  orderId: string;
  status: "pending_payment" | "confirmed" | "completed" | "failed";
  sender: { tgId: number; name: string; walletAddress: string };
  receiver: { tgId: number; name: string };
  gift: { templateId: number; message: string; amountUSDT: number; txHash?: string; newlyCreatedWallet: string; encryptedMnemonic: string };
  fee: number;
  createdAt: number;
}

export interface Template {
  id: number; name: string; category: string; bgGradient: string;
}
