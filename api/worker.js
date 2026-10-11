// RAMO Gift Card API - Cloudflare Worker. One file, no dependencies (paste it into the Cloudflare editor).
//
// How a gift works (nothing secret is ever stored by us):
//   1. The sender's browser creates a brand new wallet (12 words stay in the browser).
//   2. The sender's own wallet pays: gift -> new wallet, fee -> our fee address (and a little BNB for gas).
//   3. The browser calls /api/gift/deliver. We check the payments on BNB Chain, then send the card and
//      the new wallet details to the buyer through Telegram, and tell the admins amount + names.
//      The 12 words exist in this Worker's memory only while that single request runs. They are never written
//      to KV or logs.
//
// Settings (Cloudflare dashboard > Worker > Settings):
//   Binding   GIFT_KV            KV namespace (orders index, drafts, idempotency markers - no keys)
//   Secret    BOT_TOKEN          the bot that sends the messages and signs the Telegram login
//   Variable  FEE_ADDRESS        BNB Chain address that receives the 0.5 fee (public address only)
//   Variable  ADMIN_USERNAMES    comma separated Telegram usernames (without numeric IDs)
//   Secret    TELEGRAM_WEBHOOK_SECRET  Telegram webhook authentication secret
//   Variable  ALLOWED_ORIGINS    optional, default https://ramofinance.github.io (comma separated)
//   Variable  FEE_USD / MIN_GIFT / MAX_GIFT / BSC_RPC   optional

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
const localeOf = (value) => {
  const code = String(value || "en").toLowerCase();
  return ["fa", "ar", "es", "zh"].find((language) => code.startsWith(language)) || "en";
};
const usernameOf = (value) => String(value || "").trim().replace(/^@/, "").toLowerCase();
const BOT_COPY = {
  fa: { caption: "🎁 کارت هدیه برای {name}", title: "🎁 کارت و کیف هدیه‌ی شما آماده است", sender: "از طرف: {name}", amount: "مبلغ: {amount} {token} در شبکه‌ی BNB Smart Chain", message: "💌 پیام: {message}", words: "🔐 عبارت بازیابی ۱۲ کلمه‌ای کیف هدیه (برای دیدن، روی کلمات بزنید):", address: "آدرس کیف:", steps: "📲 مراحل دریافت", step1: "۱) کیف پول Rabby را نصب کنید: https://rabby.io", step2: "۲) گزینه‌ی Import Seed Phrase را بزنید و ۱۲ کلمه را به همان ترتیب وارد کنید.", step3: "۳) شبکه‌ی BNB Chain را انتخاب کنید؛ موجودی هدیه را همان‌جا می‌بینید.", gas: "⛽ کمی BNB هم برای کارمزد انتقال داخل کیف گذاشته شده است.", forward: "می‌توانید کارت و اطلاعات کیف را خودتان برای {name} بفرستید.", safety: "⚠️ این ۱۲ کلمه مثل رمز حساب بانکی است. هر کس آن‌ها را داشته باشد می‌تواند موجودی را جابه‌جا کند؛ فقط از راه امن برای گیرنده بفرستید.", adminTitle: "🎁 هدیه‌ی جدید: {status}", delivered: "به خریدار تحویل شد", failed: "ارسال به خریدار ناموفق بود", fee: "کارمزد", buyer: "خریدار", recipient: "نام روی کارت", order: "سفارش", registered: "✅ دسترسی مدیر برای این حساب فعال شد؛ اعلان‌های هدیه را دریافت می‌کنید.", notAdmin: "این حساب در فهرست مدیران ربات نیست." },
  ar: { caption: "🎁 بطاقة هدية إلى {name}", title: "🎁 بطاقتك ومحفظة الهدية جاهزتان", sender: "من: {name}", amount: "المبلغ: {amount} {token} على BNB Smart Chain", message: "💌 الرسالة: {message}", words: "🔐 كلمات استعادة المحفظة (١٢ كلمة؛ اضغط لإظهارها):", address: "عنوان المحفظة:", steps: "📲 كيفية استخدام الهدية", step1: "١) ثبّت محفظة Rabby: https://rabby.io", step2: "٢) اختر Import Seed Phrase وأدخل الكلمات الـ١٢ بالترتيب نفسه.", step3: "٣) اختر شبكة BNB Chain لرؤية الرصيد.", gas: "⛽ أُضيف بعض BNB إلى المحفظة لرسوم التحويل.", forward: "يمكنك إرسال البطاقة ومعلومات المحفظة إلى {name} بنفسك.", safety: "⚠️ هذه الكلمات الـ١٢ تمنح السيطرة على الأموال. أرسلها إلى المستلم عبر وسيلة آمنة فقط.", adminTitle: "🎁 هدية جديدة: {status}", delivered: "تم التسليم إلى المشتري", failed: "تعذر الإرسال إلى المشتري", fee: "الرسوم", buyer: "المشتري", recipient: "الاسم على البطاقة", order: "الطلب", registered: "✅ تم تفعيل صلاحية المدير لهذا الحساب؛ ستصلك إشعارات الهدايا.", notAdmin: "هذا الحساب غير موجود في قائمة مديري البوت." },
  en: { caption: "🎁 Gift card for {name}", title: "🎁 Your gift card and wallet are ready", sender: "From: {name}", amount: "Amount: {amount} {token} on BNB Smart Chain", message: "💌 Message: {message}", words: "🔐 Your gift wallet's 12 recovery words (tap to reveal):", address: "Wallet address:", steps: "📲 How to access the gift", step1: "1) Install Rabby Wallet: https://rabby.io", step2: "2) Choose Import Seed Phrase and enter the 12 words in order.", step3: "3) Select BNB Chain to see the gift balance.", gas: "⛽ A little BNB was added for the wallet's transfer fee.", forward: "You can forward the card and wallet details to {name} yourself.", safety: "⚠️ Anyone with these 12 words controls the funds. Share them with the recipient only through a secure channel.", adminTitle: "🎁 New gift: {status}", delivered: "delivered to buyer", failed: "could not be delivered to buyer", fee: "Fee", buyer: "Buyer", recipient: "Name on card", order: "Order", registered: "✅ Admin access is enabled for this account. Gift alerts are now active.", notAdmin: "This account is not listed as a bot administrator." },
  es: { caption: "🎁 Tarjeta de regalo para {name}", title: "🎁 Tu tarjeta y cartera de regalo están listas", sender: "De: {name}", amount: "Importe: {amount} {token} en BNB Smart Chain", message: "💌 Mensaje: {message}", words: "🔐 Las 12 palabras de recuperación de tu cartera (pulsa para verlas):", address: "Dirección de la cartera:", steps: "📲 Cómo acceder al regalo", step1: "1) Instala Rabby Wallet: https://rabby.io", step2: "2) Elige Import Seed Phrase e introduce las 12 palabras en orden.", step3: "3) Selecciona BNB Chain para ver el saldo.", gas: "⛽ Se añadió algo de BNB para la comisión de transferencia.", forward: "Puedes reenviar tú mismo la tarjeta y los datos de la cartera a {name}.", safety: "⚠️ Quien tenga estas 12 palabras controla los fondos. Compártelas con quien recibe solo por un canal seguro.", adminTitle: "🎁 Nuevo regalo: {status}", delivered: "entregado al comprador", failed: "no se pudo entregar al comprador", fee: "Tarifa", buyer: "Comprador", recipient: "Nombre en la tarjeta", order: "Pedido", registered: "✅ Esta cuenta ya tiene acceso de administrador y recibirá avisos de regalos.", notAdmin: "Esta cuenta no figura entre los administradores del bot." },
  zh: { caption: "🎁 送给 {name} 的礼品卡", title: "🎁 您的礼品卡和钱包已准备好", sender: "赠送人：{name}", amount: "金额：{amount} {token}（BNB Smart Chain）", message: "💌 留言：{message}", words: "🔐 礼品钱包的 12 个助记词（点击查看）：", address: "钱包地址：", steps: "📲 如何领取礼物", step1: "1) 安装 Rabby Wallet：https://rabby.io", step2: "2) 选择 Import Seed Phrase，并按顺序输入 12 个助记词。", step3: "3) 选择 BNB Chain 即可查看余额。", gas: "⛽ 钱包中已加入少量 BNB，用于转账手续费。", forward: "您可以自行将贺卡和钱包信息转发给 {name}。", safety: "⚠️ 持有这 12 个助记词的人可以控制资金。请仅通过安全渠道发送给收礼人。", adminTitle: "🎁 新礼物：{status}", delivered: "已发送给购买者", failed: "未能发送给购买者", fee: "手续费", buyer: "购买者", recipient: "贺卡上的姓名", order: "订单", registered: "✅ 此账号已启用管理员权限，将收到礼物通知。", notAdmin: "此账号不在机器人管理员名单中。" }
};
const fill = (text, values) => Object.entries(values).reduce((result, [key, value]) => result.split(`{${key}}`).join(value), text);

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
const canMessage = async (env, id) => (await tg(env, "sendChatAction", { chat_id: id, action: "typing" })).ok === true;

async function sendCard(env, chat, pngBase64, caption) {
  try {
    const bin = atob(pngBase64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    const form = new FormData();
    form.append("chat_id", String(chat));
    form.append("caption", caption);
    form.append("parse_mode", "HTML");
    const jpeg = pngBase64.startsWith("/9j/");
    form.append("photo", new Blob([bytes], { type: jpeg ? "image/jpeg" : "image/png" }), jpeg ? "gift.jpg" : "gift.png");
    const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: "POST", body: form });
    return await res.json();
  } catch { return { ok: false }; }
}

function buyerText(o) {
  const c = BOT_COPY[o.language];
  return [
    c.title,
    fill(c.sender, { name: esc(o.senderName) }),
    fill(c.amount, { amount: esc(o.amount), token: esc(o.token) }),
    o.message ? fill(c.message, { message: esc(o.message) }) : "",
    c.words,
    `<tg-spoiler>${esc(o.mnemonic)}</tg-spoiler>`,
    `${c.address}\n<code>${esc(o.address)}</code>`,
    c.steps,
    c.step1,
    c.step2,
    c.step3,
    o.gas ? c.gas : "",
    fill(c.forward, { name: esc(o.receiverName) }),
    c.safety
  ].filter(Boolean).join("\n");
}

function adminText(o) {
  const c = BOT_COPY[o.language];
  return [
    fill(c.adminTitle, { status: o.buyerOk ? c.delivered : c.failed }),
    `${fill(c.amount, { amount: esc(o.amount), token: esc(o.token) })} • ${c.fee}: ${esc(o.fee)}`,
    `${c.buyer}: ${o.username ? "@" + esc(o.username) : "Telegram"}`,
    fill(c.sender, { name: esc(o.senderName) }),
    `${c.recipient}: ${esc(o.receiverName)}`,
    `${c.order}: ${esc(o.orderId)}`,
    `https://bscscan.com/tx/${o.txs.gift}`,
    `https://bscscan.com/tx/${o.txs.fee}`
  ].join("\n");
}

function configuredAdmins(env) {
  return new Set(String(env.ADMIN_USERNAMES || "").split(",").map(usernameOf).filter((name) => /^[a-z0-9_]{5,32}$/.test(name)));
}

async function handleTelegramWebhook(request, env, reply) {
  const secret = String(env.TELEGRAM_WEBHOOK_SECRET || "");
  if (!secret || request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== secret) return reply({ error: "webhook_auth" }, 401);
  const update = await readJson(request);
  const message = update?.message;
  if (typeof message?.text !== "string" || !/^\/start(?:@\w+)?(?:\s|$)/i.test(message.text)) return reply({ ok: true });
  const username = usernameOf(message.from?.username);
  if (message.chat?.type !== "private" || String(message.chat.id) !== String(message.from?.id)) return reply({ ok: true });
  const isAdmin = Boolean(username && configuredAdmins(env).has(username));
  const language = localeOf(message.from?.language_code);
  const registeredChat = isAdmin ? await env.GIFT_KV.get(`admin:${username}`) : null;
  if (isAdmin && registeredChat && String(registeredChat) !== String(message.chat.id)) {
    await sendHtml(env, message.chat.id, BOT_COPY[language].notAdmin);
    return reply({ ok: true });
  }
  if (isAdmin && !registeredChat) await env.GIFT_KV.put(`admin:${username}`, String(message.chat.id));
  await sendHtml(env, message.chat.id, BOT_COPY[language][isAdmin ? "registered" : "notAdmin"]);
  return reply({ ok: true });
}

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
  const token = TOKENS[b.token];
  if (!token) return reply({ error: "bad_token" }, 400);
  const amount = parseUnits(b.amount, token.decimals);
  const min = parseUnits(env.MIN_GIFT || "1", 18);
  const max = parseUnits(env.MAX_GIFT || "5000", 18);
  if (amount === null || amount < min || amount > max) return reply({ error: "bad_amount" }, 400);
  if (!(await canMessage(env, user.id))) return reply({ error: "buyer_not_started", bot: BOT_USERNAME }, 409);
  let code;
  for (let i = 0; i < 6; i += 1) {
    code = String(100000 + randInt(900000));
    if (!(await env.GIFT_KV.get(`draft:${code}`))) break;
  }
  // The fee carries a tiny order code (< 0.000000000001 USD). It ties the payment on-chain to THIS Telegram user.
  const feeUnits = parseUnits(env.FEE_USD || "0.5", 18) + BigInt(code);
  const gasWei = b.gas ? GAS_GIFT_WEI : 0n;
  const draft = { tgId: user.id, token: b.token, amountUnits: amount.toString(), feeUnits: feeUnits.toString(), gasWei: gasWei.toString(), createdAt: Date.now() };
  await env.GIFT_KV.put(`draft:${code}`, JSON.stringify(draft), { expirationTtl: DRAFT_TTL });
  return reply({ code, token: { symbol: b.token, address: token.address }, amountUnits: draft.amountUnits, feeUnits: draft.feeUnits, gasWei: draft.gasWei, feeAddress: env.FEE_ADDRESS });
}

const WORDS = /^([a-z]{3,8} ){11}[a-z]{3,8}$/;
const HASH = /^0x[0-9a-fA-F]{64}$/;
const ADDR = /^0x[0-9a-fA-F]{40}$/;

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
  const language = localeOf(b.language);
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
  // the card image: JPEG (what the site sends) or PNG, at most ~750 KB
  if (png && (png.length > 1000000 || !(png.startsWith("/9j/") || png.startsWith("iVBORw0KGgo")))) return reply({ error: "bad_card" }, 400);

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
  const info = { senderName, receiverName, message, amount, token: draft.token, mnemonic, address, orderId, gas: draft.gasWei !== "0", language };

  const cardOk = png ? (await sendCard(env, user.id, png, fill(BOT_COPY[language].caption, { name: esc(receiverName) }))).ok === true : false;
  const walletOk = (await sendHtml(env, user.id, buyerText(info))).ok === true;
  const buyerOk = cardOk && walletOk;

  const adminInfo = { amount, token: draft.token, fee: formatUnits(draft.feeUnits, 18), username: user.username, senderName, receiverName, orderId, language, buyerOk, txs };
  const admins = configuredAdmins(env);
  for (const username of admins) {
    const chatId = await env.GIFT_KV.get(`admin:${username}`);
    if (chatId) await sendHtml(env, chatId, adminText(adminInfo));
  }

  const result = { ok: true, orderId, buyer: buyerOk ? "sent" : "failed" };
  const summary = { orderId, amount, token: draft.token, receiverName, status: buyerOk ? "delivered" : "delivery_failed", createdAt: Date.now() };
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
      if (request.method === "POST" && path === "/api/telegram/webhook") return await handleTelegramWebhook(request, env, reply);

      const user = await authenticate(request, env);
      if (!user) return reply({ error: "auth" }, 401);

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
