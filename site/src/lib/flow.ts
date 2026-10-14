import { Wallet } from "ethers";
import { api, ApiError } from "./api";
import { cardPngBase64 } from "./card";
import { getTemplate } from "./templates";
import type { DeliverResult, Draft, Form, Pending } from "./types";
import { bnbBalance, sendBnb, sendToken, tokenBalance, waitForReceipt } from "./wallet";
import type { Language } from "./i18n";

export type Step = "check" | "gift" | "fee" | "gas" | "deliver";

const KEY = "ramo_gift_pending";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const SAFETY_BNB = 300000000000000n; // 0.0003 BNB kept for the sender's own network fees

export const loadPending = (): Pending | null => {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
};
const notify = () => window.dispatchEvent(new Event("ramo-pending"));
export const savePending = (p: Pending) => { localStorage.setItem(KEY, JSON.stringify(p)); notify(); };
export const clearPending = () => { localStorage.removeItem(KEY); notify(); };

// Step 1: ask the server for an order and create the gift wallet in the browser.
// The 12 words stay here until the buyer confirms they saved them.
export async function createPending(form: Form, templateId: number, senderWallet: string): Promise<Pending> {
  const draft = await api<Draft>("/api/gift/start", {
    body: { token: form.token, amount: form.amount, gas: form.gas }
  });
  const wallet = Wallet.createRandom();
  const phrase = wallet.mnemonic?.phrase;
  if (!phrase) throw new Error("wallet_failed");
  const pending: Pending = { draft, address: wallet.address, mnemonic: phrase, senderWallet, form, templateId, txs: {}, createdAt: Date.now() };
  savePending(pending); // saved BEFORE any money moves
  return pending;
}

// Step 2: pay from the sender's wallet, then ask the server to deliver. Safe to run again after an interruption:
// payments that already have a hash are never sent twice.
export async function runPayment(p: Pending, onStep: (s: Step) => void, language: Language = "fa"): Promise<DeliverResult> {
  const gift = BigInt(p.draft.amountUnits);
  const fee = BigInt(p.draft.feeUnits);
  const gas = BigInt(p.draft.gasWei);

  if (!p.txs.gift) {
    onStep("check");
    const [token, bnb] = await Promise.all([tokenBalance(p.draft.token.address, p.senderWallet), bnbBalance(p.senderWallet)]);
    if (token < gift + fee) { clearPending(); throw new Error("insufficient_token"); }
    if (bnb < gas + SAFETY_BNB) { clearPending(); throw new Error("insufficient_bnb"); }
  }

  onStep("gift");
  if (!p.txs.gift) { p.txs.gift = await sendToken(p.senderWallet, p.draft.token.address, p.address, gift); savePending(p); }
  await waitForReceipt(p.txs.gift);

  onStep("fee");
  if (!p.txs.fee) { p.txs.fee = await sendToken(p.senderWallet, p.draft.token.address, p.draft.feeAddress, fee); savePending(p); }
  await waitForReceipt(p.txs.fee);

  if (gas > 0n) {
    onStep("gas");
    if (!p.txs.gas) { p.txs.gas = await sendBnb(p.senderWallet, p.address, gas); savePending(p); }
    await waitForReceipt(p.txs.gas);
  }

  onStep("deliver");
  const cardPng = await cardPngBase64({
    template: getTemplate(p.templateId),
    senderName: p.form.senderName,
    receiverName: p.form.receiverName,
    amount: p.form.amount,
    token: p.form.token,
    cardText: p.form.cardText,
    cardFont: p.form.cardFont || "modern",
    cardTextSize: p.form.cardTextSize || 23,
    cardTextRotation: p.form.cardTextRotation || 0,
    cardTextPositions: p.form.cardTextPositions,
    cardTextColors: p.form.cardTextColors,
    cardTextStyles: p.form.cardTextStyles,
    language
  });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const result = await api<DeliverResult>("/api/gift/deliver", {
        body: {
          code: p.draft.code,
          senderName: p.form.senderName,
          receiverName: p.form.receiverName,
          message: p.form.message,
          templateId: p.templateId,
          address: p.address,
          senderWallet: p.senderWallet,
          mnemonic: p.mnemonic,
          txs: p.txs,
          cardPng,
          language
        }
      });
      p.delivered = result;
      savePending(p); // the 12 words stay in this browser until the buyer confirms they saved them
      return result;
    } catch (e) {
      // "pending" = the network needs a few more blocks; "rpc_unavailable" = try again shortly
      if (e instanceof ApiError && (e.code === "pending" || e.code === "rpc_unavailable")) { await sleep(4000); continue; }
      throw e;
    }
  }
  throw new ApiError("pending", 409);
}
