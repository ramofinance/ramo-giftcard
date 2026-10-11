// RAMO Gift Card API - Cloudflare Worker. One file, no dependencies (paste it into the Cloudflare editor).
//
// How a gift works (nothing secret is ever stored by us):
//   1. The sender's browser creates a brand new wallet (12 words stay in the browser).
//   2. The sender's own wallet pays: gift -> new wallet, fee -> our fee address (and a little BNB for gas).
//   3. The browser calls /api/gift/deliver. We check the payments on BNB Chain, then relay the card and the
//      12 words to the receiver (and a copy to the sender) through Telegram, and tell the admins amount + names.
//      The 12 words exist in this Worker's memory only while that single request runs. They are never written
//      to KV or logs.
//
// Settings (Cloudflare dashboard > Worker > Settings):
//   Binding   GIFT_KV            KV namespace (orders index, drafts, idempotency markers - no keys)
//   Secret    BOT_TOKEN          the bot that sends the messages and signs the Telegram login
//   Variable  FEE_ADDRESS        BNB Chain address that receives the 0.5 fee (public address only)
//   Variable  ADMIN_CHAT_IDS     comma separated Telegram IDs that get the admin summary
//   Variable  ALLOWED_ORIGINS    optional, default https://ramofinance.github.io (comma separated)
//   Variable  FEE_USD / MIN_GIFT / MAX_GIFT / SENDER_COPY / BSC_RPC   optional

const TOKENS = {
  USDT: { address: "0x55d398326f99059ff775485246999027b3197955", decimals: 18 },
  USDC: { address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", decimals: 18 }
};
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const DEFAULT_RPC = ["https://bsc-dataseed.bnbchain.org", "https://bsc-dataseed1.binance.org", "https://bsc-rpc.publicnode.com"];
const MIN_CONFIRMATIONS = 3;
const DRAFT_TTL = 86400;
const GAS_GIFT_WEI = 1000000000000000n; // 0.001 BNB, enough for many USDT transfers on BNB Chain
const BOT_USERNAME = "ramofinance_alerts_bot";
const TEMPLATE_COUNT = 100;

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const pad32 = (a) => "0x" + String(a).toLowerCase().replace(/^0x/, "").padStart(64, "0");

const parseUnits = (s, dec) => {
  if (!/^\d+(\.\d{1,6})?$/.test(String(s))) return null;
  const [i, f = ""] = String(s).split(".");
  return BigInt(i) * 10n ** BigInt(dec) + BigInt((f + "0".repeat(dec)).slice(0, dec));
};
const formatUnits = (units, dec) => {
  const s = BigInt(units).toString().padStart(dec + 1, "0");
  const whole = s.slice(0, -dec);
  const frac = s.slice(-dec).replace(/0+$/, "").slice(0, 4);
  return frac ? `${whole}.${frac}` : whole;
};
const randInt = (n) => crypto.getRandomValues(new Uint32Array(1))[0] % n;

// ---------- Telegram authentication (Mini App initData or Login Widget) ----------
async function hmacSha256(keyBytes, message) {
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, typeof message === "string" ? enc.encode(message) : message));
}

async function verifyWebApp(initData, token) {
  const p = new URLSearchParams(initData);
  const hash = p.get("hash");
  if (!hash) return null;
  p.delete("hash");
  const data = [...p.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secret = await hmacSha256(enc.encode("WebAppData"), token);
  const age = Date.now() / 1000 - Number(p.get("auth_date"));
  if (hex(await hmacSha256(secret, data)) !== hash || !(age >= 0 && age < 86400)) return null;
  try {
    const u = JSON.parse(p.get("user"));
    return u && u.id ? { id: u.id, name: u.first_name || "", username: u.username || "" } : null;
  } catch { return null; }
}

async function verifyLogin(raw, token) {
  let d;
  try { d = JSON.parse(raw); } catch { return null; }
  if (!d || !d.hash || !d.id) return null;
  const { hash, ...rest } = d;
  const data = Object.keys(rest).sort().map((k) => `${k}=${rest[k]}`).join("\n");
  const secret = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(token)));
  const age = Date.now() / 1000 - Number(rest.auth_date);
  if (hex(await hmacSha256(secret, data)) !== hash || !(age >= 0 && age < 86400)) return null;
  return { id: d.id, name: d.first_name || "", username: d.username || "" };
}

async function authenticate(request, env) {
  if (!env.BOT_TOKEN) return null;
  const init = request.headers.get("X-Tg-Init-Data");
  if (init) return await verifyWebApp(init, env.BOT_TOKEN);
  const login = request.headers.get("X-Tg-Login"); // URL-encoded JSON (headers cannot carry Persian letters)
  if (login) {
    try { return await verifyLogin(decodeURIComponent(login), env.BOT_TOKEN); } catch { return null; }
  }
  return null;
}

// ---------- Telegram sending ----------
async function tg(env, method, payload) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    return await res.json();
  } catch { return { ok: false }; }
}
const sendHtml = (env, chat, text) => tg(env, "sendMessage", { chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true });

async function sendCard(env, chat, pngBase64, caption) {
  try {
    const bin = atob(pngBase64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    const form = new FormData();
    form.append("chat_id", String(chat));
    form.append("caption", caption);
    form.append("parse_mode", "HTML");
    form.append("photo", new Blob([bytes], { type: "image/png" }), "gift.png");
    const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: "POST", body: form });
    return await res.json();
  } catch { return { ok: false }; }
}

// A bot can only write to people who pressed Start. sendChatAction tells us without sending anything visible.
const canMessage = async (env, id) => (await tg(env, "sendChatAction", { chat_id: id, action: "typing" })).ok === true;

// ---------- BNB Chain checks (plain JSON-RPC) ----------
async function rpc(env, method, params) {
  const urls = env.BSC_RPC ? String(env.BSC_RPC).split(",") : DEFAULT_RPC;
  let last;
  for (const url of urls) {
    try {
      const res = await fetch(url.trim(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.result;
    } catch (e) { last = e; }
  }
  throw last || new Error("rpc failed");
}

async function receiptState(env, hash) {
  const receipt = await rpc(env, "eth_getTransactionReceipt", [hash]);
  if (!receipt) return { pending: true };
  if (receipt.status !== "0x1") return { failed: true };
  const head = parseInt(await rpc(env, "eth_blockNumber", []), 16);
  if (head - parseInt(receipt.blockNumber, 16) + 1 < MIN_CONFIRMATIONS) return { pending: true };
  return { receipt };
}

const hasTransfer = (receipt, token, from, to, units, exact) =>
  (receipt.logs || []).some((l) =>
    String(l.address).toLowerCase() === token && l.topics && l.topics[0] === TRANSFER_TOPIC &&
    l.topics[1] === pad32(from) && l.topics[2] === pad32(to) &&
    (exact ? BigInt(l.data) === units : BigInt(l.data) >= units));

// ---------- responses ----------
function makeReply(cors) {
  return (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

const readJson = async (request) => { try { return await request.json(); } catch { return null; } };

// ---------- handlers ----------
function publicConfig(env) {
  return {
    chainId: 56,
    tokens: Object.entries(TOKENS).map(([symbol, t]) => ({ symbol, address: t.address, decimals: t.decimals })),
    feeUsd: env.FEE_USD || "0.5",
    minGift: env.MIN_GIFT || "1",
    maxGift: env.MAX_GIFT || "5000",
    gasBnb: "0.001",
    botUsername: BOT_USERNAME,
    templates: TEMPLATE_COUNT
  };
}

async function handleStart(request, env, user, reply) {
  const b = await readJson(request);
  if (!b) return reply({ error: "json" }, 400);
  if (!env.FEE_ADDRESS || !/^0x[0-9a-fA-F]{40}$/.test(env.FEE_ADDRESS)) return reply({ error: "not_configured" }, 500);
  const receiverId = Number(b.receiverId);
  const token = TOKENS[b.token];
  if (!Number.isSafeInteger(receiverId) || receiverId <= 0) return reply({ error: "bad_receiver" }, 400);
  if (!token) return reply({ error: "bad_token" }, 400);
  const amount = parseUnits(b.amount, token.decimals);
  const min = parseUnits(env.MIN_GIFT || "1", 18);
  const max = parseUnits(env.MAX_GIFT || "5000", 18);
  if (amount === null || amount < min || amount > max) return reply({ error: "bad_amount" }, 400);
  if (!(await canMessage(env, receiverId))) return reply({ error: "receiver_not_started", bot: BOT_USERNAME }, 409);

  let code;
  for (let i = 0; i < 6; i += 1) {
    code = String(100000 + randInt(900000));
    if (!(await env.GIFT_KV.get(`draft:${code}`))) break;
  }
  // The fee carries a tiny order code (< 0.000000000001 USD). It ties the payment on-chain to THIS Telegram user.
  const feeUnits = parseUnits(env.FEE_USD || "0.5", 18) + BigInt(code);
  const gasWei = b.gas ? GAS_GIFT_WEI : 0n;
  const draft = { tgId: user.id, receiverId, token: b.token, amountUnits: amount.toString(), feeUnits: feeUnits.toString(), gasWei: gasWei.toString(), createdAt: Date.now() };
  await env.GIFT_KV.put(`draft:${code}`, JSON.stringify(draft), { expirationTtl: DRAFT_TTL });
  return reply({ code, token: { symbol: b.token, address: token.address }, amountUnits: draft.amountUnits, feeUnits: draft.feeUnits, gasWei: draft.gasWei, feeAddress: env.FEE_ADDRESS });
}

const WORDS = /^([a-z]{3,8} ){11}[a-z]{3,8}$/;
const HASH = /^0x[0-9a-fA-F]{64}$/;
const ADDR = /^0x[0-9a-fA-F]{40}$/;

function receiverText(o) {
  return [
    `🎁 <b>یک هدیه‌ی رمزارزی برای شما رسید!</b>`,
    `از طرف: <b>${esc(o.senderName)}</b>`,
    `مبلغ: <b>${esc(o.amount)} ${esc(o.token)}</b> (شبکه BNB Smart Chain)`,
    o.message ? `\n💌 ${esc(o.message)}` : "",
    `\n🔐 <b>عبارت بازیابی ۱۲ کلمه‌ای کیف شما</b> (برای دیدن، روی کلمات بزنید):`,
    `<tg-spoiler>${esc(o.mnemonic)}</tg-spoiler>`,
    `\nآدرس کیف:\n<code>${esc(o.address)}</code>`,
    `\n📲 <b>مراحل دریافت</b>`,
    `۱) کیف پول Rabby را نصب کنید: https://rabby.io`,
    `۲) گزینه‌ی «Import Seed Phrase» (وارد کردن عبارت بازیابی) را بزنید و ۱۲ کلمه را به همان ترتیب وارد کنید.`,
    `۳) شبکه‌ی BNB Chain را انتخاب کنید؛ موجودی هدیه را همان‌جا می‌بینید.`,
    o.gas ? `⛽ مقدار کمی BNB هم برای کارمزد انتقال داخل کیف گذاشته شده است.` : "",
    `\n⚠️ این ۱۲ کلمه مثل رمز عبور حساب بانکی است: به هیچ‌کس ندهید. کسی که این کلمات را دارد صاحب کیف است. برای امنیت کامل، بعد از ورود، موجودی را به کیف جدیدِ خودتان منتقل کنید.`
  ].filter(Boolean).join("\n");
}

const senderText = (o) =>
  `✅ <b>هدیه‌ی شما برای ${esc(o.receiverName)} ارسال شد.</b>\nمبلغ: ${esc(o.amount)} ${esc(o.token)}\nکد سفارش: <code>${esc(o.orderId)}</code>\n\n📎 نسخه‌ی شما از عبارت بازیابی همین کیف:\n<tg-spoiler>${esc(o.mnemonic)}</tg-spoiler>\n\nآدرس کیف: <code>${esc(o.address)}</code>\nاین نسخه فقط برای بایگانی شماست؛ هر کس این کلمات را داشته باشد می‌تواند موجودی را جابه‌جا کند.`;

async function handleDeliver(request, env, user, reply) {
  const b = await readJson(request);
  if (!b || typeof b !== "object") return reply({ error: "json" }, 400);
  const code = String(b.code || "");
  if (!/^\d{6}$/.test(code)) return reply({ error: "bad_code" }, 400);

  const doneRaw = await env.GIFT_KV.get(`done:${code}`);
  if (doneRaw) {
    const done = JSON.parse(doneRaw);
    return done.tgId === user.id ? reply({ ...done.result, repeated: true }) : reply({ error: "forbidden" }, 403);
  }
  const draftRaw = await env.GIFT_KV.get(`draft:${code}`);
  if (!draftRaw) return reply({ error: "draft_expired" }, 410);
  const draft = JSON.parse(draftRaw);
  if (draft.tgId !== user.id) return reply({ error: "forbidden" }, 403);

  const clean = (v, n) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, n);
  const senderName = clean(b.senderName, 40);
  const receiverName = clean(b.receiverName, 40);
  const message = clean(b.message, 300);
  const templateId = Number(b.templateId);
  const address = String(b.address || "");
  const senderWallet = String(b.senderWallet || "");
  const mnemonic = String(b.mnemonic || "").trim();
  const txs = b.txs || {};
  const png = String(b.cardPng || "");
  if (!senderName || !receiverName) return reply({ error: "names_required" }, 400);
  if (!Number.isInteger(templateId) || templateId < 1 || templateId > TEMPLATE_COUNT) return reply({ error: "bad_template" }, 400);
  if (!ADDR.test(address) || !ADDR.test(senderWallet)) return reply({ error: "bad_address" }, 400);
  if (!WORDS.test(mnemonic)) return reply({ error: "bad_phrase" }, 400);
  if (!HASH.test(txs.gift || "") || !HASH.test(txs.fee || "") || (draft.gasWei !== "0" && !HASH.test(txs.gas || ""))) return reply({ error: "bad_txs" }, 400);
  if (png && (png.length > 700000 || !png.startsWith("iVBORw0KGgo"))) return reply({ error: "bad_card" }, 400);

  const hashes = [txs.gift, txs.fee, draft.gasWei !== "0" ? txs.gas : null].filter(Boolean).map((h) => h.toLowerCase());
  if (new Set(hashes).size !== hashes.length) return reply({ error: "bad_txs" }, 400);
  for (const h of hashes) {
    const used = await env.GIFT_KV.get(`tx:${h}`);
    if (used && used !== code) return reply({ error: "tx_reused" }, 409);
  }

  // ----- verify the payments on BNB Chain -----
  const token = TOKENS[draft.token];
  const sender = senderWallet.toLowerCase();
  let states;
  try { states = await Promise.all(hashes.map((h) => receiptState(env, h))); } catch { return reply({ error: "rpc_unavailable" }, 503); }
  if (states.some((s) => s.failed)) return reply({ error: "payment_failed" }, 400);
  if (states.some((s) => s.pending)) return reply({ error: "pending" }, 409);

  const [giftState, feeState, gasState] = states;
  if (!hasTransfer(giftState.receipt, token.address, sender, address, BigInt(draft.amountUnits), false)) return reply({ error: "gift_payment_mismatch" }, 400);
  if (!hasTransfer(feeState.receipt, token.address, sender, env.FEE_ADDRESS, BigInt(draft.feeUnits), true)) return reply({ error: "fee_payment_mismatch" }, 400);
  if (draft.gasWei !== "0") {
    let tx;
    try { tx = await rpc(env, "eth_getTransactionByHash", [hashes[2]]); } catch { return reply({ error: "rpc_unavailable" }, 503); }
    const ok = tx && String(tx.from).toLowerCase() === sender && String(tx.to).toLowerCase() === address.toLowerCase() && BigInt(tx.value) >= BigInt(draft.gasWei);
    if (!ok) return reply({ error: "gas_payment_mismatch" }, 400);
  }

  for (const h of hashes) await env.GIFT_KV.put(`tx:${h}`, code);

  // ----- deliver -----
  const orderId = "RG-" + Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[randInt(32)]).join("");
  const amount = formatUnits(draft.amountUnits, token.decimals);
  const info = { senderName, receiverName, message, amount, token: draft.token, mnemonic, address, orderId, gas: draft.gasWei !== "0" };

  let receiverOk = false;
  if (png) await sendCard(env, draft.receiverId, png, `🎁 هدیه از طرف <b>${esc(senderName)}</b> برای <b>${esc(receiverName)}</b>`);
  receiverOk = (await sendHtml(env, draft.receiverId, receiverText(info))).ok === true;

  let senderOk = false;
  if (env.SENDER_COPY !== "false") senderOk = (await sendHtml(env, user.id, senderText(info))).ok === true;

  const link = (h) => `https://bscscan.com/tx/${h}`;
  const adminText = [
    `🎁 هدیه‌ی جدید ${receiverOk ? "(تحویل شد)" : "⚠️ (ارسال به گیرنده ناموفق بود)"}`,
    `مبلغ: ${amount} ${draft.token} • کارمزد: ${formatUnits(draft.feeUnits, 18)}`,
    `فرستنده: ${esc(senderName)} • ID ${user.id}${user.username ? " • @" + esc(user.username) : ""}`,
    `گیرنده: ${esc(receiverName)} • ID ${draft.receiverId}`,
    `سفارش: ${orderId}`,
    link(txs.gift), link(txs.fee)
  ].join("\n");
  for (const id of String(env.ADMIN_CHAT_IDS || "").split(",").map((s) => s.trim()).filter(Boolean)) await sendHtml(env, id, adminText);

  const result = { ok: true, orderId, receiver: receiverOk ? "sent" : "failed", sender: env.SENDER_COPY === "false" ? "skipped" : senderOk ? "sent" : "failed" };
  const summary = { orderId, amount, token: draft.token, receiverName, status: receiverOk ? "delivered" : "receiver_failed", createdAt: Date.now() };
  await env.GIFT_KV.put(`done:${code}`, JSON.stringify({ tgId: user.id, result }), { expirationTtl: 2592000 });
  await env.GIFT_KV.put(`u:${user.id}:${String(Date.now()).padStart(13, "0")}:${orderId}`, "1", { metadata: summary });
  await env.GIFT_KV.delete(`draft:${code}`);
  return reply(result);
}

export default {
  async fetch(request, env) {
    const allowed = String(env.ALLOWED_ORIGINS || "https://ramofinance.github.io").split(",").map((s) => s.trim());
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
      "Access-Control-Allow-Headers": "Content-Type, X-Tg-Init-Data, X-Tg-Login",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      Vary: "Origin"
    };
    const reply = makeReply(cors);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (origin && !allowed.includes(origin)) return reply({ error: "origin" }, 403);

    const path = new URL(request.url).pathname;
    try {
      if (request.method === "GET" && path === "/api/config") return reply(publicConfig(env));
      if (!env.GIFT_KV || !env.BOT_TOKEN) return reply({ error: "not_configured" }, 500);

      const user = await authenticate(request, env);
      if (!user) return reply({ error: "auth" }, 401);

      if (request.method === "POST" && path === "/api/receiver/check") {
        const b = await readJson(request);
        const id = Number(b && b.receiverId);
        if (!Number.isSafeInteger(id) || id <= 0) return reply({ error: "bad_receiver" }, 400);
        return reply({ reachable: await canMessage(env, id), bot: BOT_USERNAME });
      }
      if (request.method === "POST" && path === "/api/gift/start") return await handleStart(request, env, user, reply);
      if (request.method === "POST" && path === "/api/gift/deliver") return await handleDeliver(request, env, user, reply);
      if (request.method === "GET" && path === "/api/orders/mine") {
        const list = await env.GIFT_KV.list({ prefix: `u:${user.id}:`, limit: 50 });
        return reply(list.keys.map((k) => k.metadata).filter(Boolean).reverse());
      }
      return reply({ error: "not_found" }, 404);
    } catch {
      return reply({ error: "server_error" }, 500);
    }
  }
};
