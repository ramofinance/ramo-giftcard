import { Router } from "itty-router";
import { ethers } from "ethers";
import { TEMPLATES } from "./templates";
import { generateWallet, transferUSDT } from "./wallet";
import { generateCardSVG } from "./card";
import { GiftCardOrder } from "./types";

const router = Router();
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

router.get("/api/templates", () => json(TEMPLATES));

router.post("/api/gift/create", async (req: any, env: any) => {
  try {
    const body = await req.json();
    const { senderName, senderWallet, receiverName, receiverTgId, message, amountUSDT, templateId } = body;
    if (!senderName || !receiverName || !receiverTgId || !amountUSDT || !templateId) return json({ error: "all fields required" }, 400);
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return json({ error: "invalid template" }, 400);
    const orderId = "RG-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const { address, mnemonic } = await generateWallet();
    const order: GiftCardOrder = {
      orderId, status: "pending_payment",
      sender: { tgId: 0, name: senderName, walletAddress: senderWallet },
      receiver: { tgId: receiverTgId, name: receiverName },
      gift: { templateId, message: message || "", amountUSDT, newlyCreatedWallet: address, encryptedMnemonic: btoa(mnemonic) },
      fee: 0.5, createdAt: Date.now()
    };
    await env.GIFT_KV.put(`order:${orderId}`, JSON.stringify(order));
    const cardSvg = generateCardSVG({ bgGradient: template.bgGradient, senderName, receiverName, message: message || "", amount: amountUSDT });
    const treasuryWallet = new ethers.Wallet.createRandom();
    return json({ orderId, walletAddress: address, treasuryAddress: treasuryWallet.address, cardSvg, usdtTokenAddress: "0x55d398326f99059fF775485246999027B3197955" });
  } catch (e: any) { return json({ error: e.message }, 500); }
});

router.post("/api/gift/confirm", async (req: any, env: any) => {
  try {
    const body = await req.json();
    const { orderId } = body;
    const raw = await env.GIFT_KV.get(`order:${orderId}`);
    if (!raw) return json({ error: "order not found" }, 404);
    const order: GiftCardOrder = JSON.parse(raw);
    if (order.status !== "pending_payment") return json({ error: "already processed" }, 400);
    const treasuryKey = await env.GIFT_KV.get("treasury_private_key");
    if (!treasuryKey) return json({ error: "treasury not configured" }, 500);
    const sendAmount = (order.gift.amountUSDT - order.fee).toFixed(2);
    const txHash = await transferUSDT(treasuryKey, order.gift.newlyCreatedWallet, sendAmount);
    order.status = "completed";
    order.gift.txHash = txHash;
    await env.GIFT_KV.put(`order:${orderId}`, JSON.stringify(order));
    await env.GIFT_KV.put(`deliver:${order.receiver.tgId}`, JSON.stringify({ orderId, senderName: order.sender.name, receiverName: order.receiver.name, message: order.gift.message, amount: order.gift.amountUSDT, walletAddress: order.gift.newlyCreatedWallet, mnemonic: order.gift.encryptedMnemonic }));
    return json({ status: "completed", orderId, txHash });
  } catch (e: any) { return json({ error: e.message }, 500); }
});

router.get("/api/gift/status/:orderId", async (req: any, env: any) => {
  const raw = await env.GIFT_KV.get(`order:${req.params.orderId}`);
  if (!raw) return json({ error: "not found" }, 404);
  return json(JSON.parse(raw));
});

router.get("/api/admin/recent", async (req: any, env: any) => {
  const list = await env.GIFT_KV.list({ prefix: "order:" });
  const orders: any[] = [];
  for (const key of list.keys) {
    const raw = await env.GIFT_KV.get(key.name);
    if (raw) { const o = JSON.parse(raw); orders.push({ orderId: o.orderId, status: o.status, sender: o.sender.name, receiver: o.receiver, amount: o.gift.amountUSDT, createdAt: o.createdAt }); }
  }
  orders.sort((a, b) => b.createdAt - a.createdAt);
  return json(orders.slice(0, 50));
});

router.all("*", () => json({ error: "not found" }, 404));

export default {
  fetch(req: Request, env: any, ctx: any) {
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    return router.handle(req, env, ctx).then((r: any) => r).catch((e: Error) => json({ error: e.message }, 500));
  }
};
