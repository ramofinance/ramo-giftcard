import worker from "../worker.js";
import crypto from "node:crypto";
let fails = 0; const ok = (name, cond, extra="") => { console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  " + extra)); if (!cond) fails++; };

const BOT = "123456:TESTTOKEN"; const ORIGIN = "https://ramofinance.github.io";
const FEE = "0x" + "f".repeat(40), SENDER = "0x" + "a1".repeat(20), GIFTW = "0x" + "b2".repeat(20);
const USDT = "0x55d398326f99059ff775485246999027b3197955";
const MN = "abandon ability able about above absent absorb abstract absurd abuse access accident";
const TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const p32 = (a) => "0x" + a.replace(/^0x/, "").padStart(64, "0");

// --- KV mock
class KV { m = new Map(); async get(k){ return this.m.get(k)?.v ?? null; } async put(k,v,o={}){ this.m.set(k,{v,meta:o.metadata}); } async delete(k){ this.m.delete(k); }
  async list({prefix,limit}){ return { keys: [...this.m.keys()].filter(k=>k.startsWith(prefix)).sort().slice(0,limit).map(name=>({name,metadata:this.m.get(name).meta})) }; } }

// --- Telegram + RPC mock
let tgCalls = [], blocked = new Set(), chain = {}, head = 1000;
globalThis.fetch = async (url, init) => {
  const u = String(url);
  if (u.includes("api.telegram.org")) {
    const method = u.split("/").pop(); let body;
    if (init.body instanceof FormData) { body = { chat_id: init.body.get("chat_id"), caption: init.body.get("caption"), photo: !!init.body.get("photo") }; } else body = JSON.parse(init.body);
    tgCalls.push({ method, ...body });
    const id = Number(body.chat_id);
    return new Response(JSON.stringify(blocked.has(id) ? { ok: false, error_code: 403 } : { ok: true }));
  }
  const req = JSON.parse(init.body); let result = null;
  if (req.method === "eth_getTransactionReceipt") result = chain[req.params[0]]?.receipt ?? null;
  if (req.method === "eth_getTransactionByHash") result = chain[req.params[0]]?.tx ?? null;
  if (req.method === "eth_blockNumber") result = "0x" + head.toString(16);
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }));
};

const env = { BOT_TOKEN: BOT, GIFT_KV: new KV(), FEE_ADDRESS: FEE, ADMIN_CHAT_IDS: "900,901" };
const hmac = (k, m) => crypto.createHmac("sha256", k).update(m).digest();
const webAppAuth = (user, age = 0) => { const p = { auth_date: String(Math.floor(Date.now()/1000) - age), query_id: "Q", user: JSON.stringify(user) };
  const dcs = Object.keys(p).sort().map(k => `${k}=${p[k]}`).join("\n"); const hash = hmac(hmac("WebAppData", BOT), dcs).toString("hex"); return new URLSearchParams({ ...p, hash }).toString(); };
const loginAuth = (user) => { const d = { ...user, auth_date: String(Math.floor(Date.now()/1000)) }; const dcs = Object.keys(d).sort().map(k=>`${k}=${d[k]}`).join("\n");
  const hash = hmac(crypto.createHash("sha256").update(BOT).digest(), dcs).toString("hex"); return encodeURIComponent(JSON.stringify({ ...d, hash })); };
const call = async (method, path, body, headers = {}) => { const r = await worker.fetch(new Request("https://api.example" + path, { method, headers: { Origin: ORIGIN, "Content-Type": "application/json", ...headers }, body: body ? JSON.stringify(body) : undefined }), env); return { status: r.status, json: await r.json() }; };

const alice = { id: 111, first_name: "علی", username: "alice" }; const bob = { id: 222, first_name: "Bob" };
const A = { "X-Tg-Init-Data": webAppAuth(alice) }; const B = { "X-Tg-Init-Data": webAppAuth(bob) };

// 1. basics & auth
let r = await call("GET", "/api/config"); ok("config is public", r.status === 200 && r.json.tokens.length === 2 && r.json.templates === 100);
r = await call("POST", "/api/gift/start", {}); ok("no auth -> 401", r.status === 401);
r = await call("POST", "/api/gift/start", {}, { "X-Tg-Init-Data": webAppAuth(alice, 90000) }); ok("expired initData -> 401", r.status === 401);
r = await call("POST", "/api/gift/start", {}, { "X-Tg-Init-Data": webAppAuth(alice).replace(/hash=\w/, "hash=0") }); ok("tampered initData -> 401", r.status === 401);
r = await call("GET", "/api/orders/mine", null, { "X-Tg-Login": loginAuth(alice) }); ok("Telegram Login Widget with Persian name accepted", r.status === 200, JSON.stringify(r));
const evil = await worker.fetch(new Request("https://api.example/api/config", { headers: { Origin: "https://evil.example" } }), env); ok("foreign origin blocked", evil.status === 403);

// 2. start
blocked.add(777);
r = await call("POST", "/api/gift/start", { receiverId: 777, token: "USDT", amount: "10", gas: true }, A); ok("receiver who never pressed Start -> 409", r.status === 409 && r.json.error === "receiver_not_started");
r = await call("POST", "/api/gift/start", { receiverId: 555, token: "USDT", amount: "0.2", gas: true }, A); ok("amount below minimum rejected", r.status === 400);
r = await call("POST", "/api/gift/start", { receiverId: 555, token: "DOGE", amount: "10" }, A); ok("unknown token rejected", r.status === 400);
r = await call("POST", "/api/gift/start", { receiverId: 555, token: "USDT", amount: "25.5", gas: true }, A);
const d = r.json; ok("start ok", r.status === 200 && /^\d{6}$/.test(d.code));
ok("fee = 0.5 + order code in wei", BigInt(d.feeUnits) === 500000000000000000n + BigInt(d.code));
ok("amount units exact", d.amountUnits === "25500000000000000000" && d.gasWei === "1000000000000000");

// helper to put payments on the mock chain
const receipt = (from, to, value, block = 990) => ({ status: "0x1", blockNumber: "0x" + block.toString(16), logs: [{ address: USDT.toUpperCase().replace("0X","0x"), topics: [TOPIC, p32(from), p32(to)], data: "0x" + BigInt(value).toString(16).padStart(64, "0") }] });
const H = (n) => "0x" + n.toString(16).padStart(64, "0");
chain[H(1)] = { receipt: receipt(SENDER, GIFTW, d.amountUnits) };
chain[H(2)] = { receipt: receipt(SENDER, FEE, d.feeUnits) };
chain[H(3)] = { receipt: { status: "0x1", blockNumber: "0x3de", logs: [] }, tx: { from: SENDER.toUpperCase().replace("0X","0x"), to: GIFTW, value: "0x38d7ea4c68000", input: "0x" } };
const payload = (extra = {}) => ({ code: d.code, senderName: "علی <b>x</b>", receiverName: "Sara", message: "تولدت مبارک & <script>", templateId: 7, address: GIFTW, senderWallet: SENDER, mnemonic: MN, txs: { gift: H(1), fee: H(2), gas: H(3) }, cardPng: "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/", ...extra });

// 3. deliver: failure paths first
r = await call("POST", "/api/gift/deliver", payload(), B); ok("another Telegram user cannot use my order -> 403", r.status === 403);
r = await call("POST", "/api/gift/deliver", payload({ mnemonic: "not a real phrase" }), A); ok("bad phrase rejected", r.status === 400 && r.json.error === "bad_phrase");
r = await call("POST", "/api/gift/deliver", payload({ cardPng: "PHNjcmlwdD4=" }), A); ok("non-image card rejected", r.status === 400);
r = await call("POST", "/api/gift/deliver", payload({ cardPng: "iVBORw0KGgo" + "A".repeat(1000100) }), A); ok("oversized card rejected", r.status === 400 && r.json.error === "bad_card");
head = 991; r = await call("POST", "/api/gift/deliver", payload(), A); ok("not enough confirmations -> 409 pending", r.status === 409 && r.json.error === "pending");
head = 1000;
chain[H(2)] = { receipt: receipt(SENDER, FEE, 500000000000000000n) };
r = await call("POST", "/api/gift/deliver", payload(), A); ok("fee without the order code rejected", r.status === 400 && r.json.error === "fee_payment_mismatch");
chain[H(2)] = { receipt: receipt(SENDER, FEE, d.feeUnits) };
chain[H(1)] = { receipt: receipt(SENDER, GIFTW, 1000n) };
r = await call("POST", "/api/gift/deliver", payload(), A); ok("too small gift rejected", r.status === 400 && r.json.error === "gift_payment_mismatch");
chain[H(1)] = { receipt: receipt(SENDER, GIFTW, d.amountUnits) };
chain[H(1)].receipt.status = "0x0"; r = await call("POST", "/api/gift/deliver", payload(), A); ok("reverted tx rejected", r.status === 400 && r.json.error === "payment_failed");
chain[H(1)].receipt.status = "0x1";
ok("nothing was sent to anyone while checks failed", tgCalls.filter(c => c.method !== "sendChatAction").length === 0);

// 4. deliver success
tgCalls = [];
r = await call("POST", "/api/gift/deliver", payload(), A);
ok("deliver ok", r.status === 200 && r.json.ok && r.json.receiver === "sent" && r.json.sender === "sent", JSON.stringify(r));
const sent = tgCalls.filter(c => c.chat_id == 555 || c.chat_id == 111 || c.chat_id == 900 || c.chat_id == 901);
ok("receiver got card photo + message", sent.some(c => c.chat_id == 555 && c.method === "sendPhoto") && sent.some(c => c.chat_id == 555 && c.method === "sendMessage"));
const rm = sent.find(c => c.chat_id == 555 && c.method === "sendMessage").text;
ok("12 words in spoiler + Rabby link + address", rm.includes("<tg-spoiler>" + MN + "</tg-spoiler>") && rm.includes("https://rabby.io") && rm.includes(GIFTW));
ok("user text is HTML-escaped", rm.includes("&lt;script&gt;") && !rm.includes("<script>") && sent.find(c=>c.method==="sendPhoto").caption.includes("&lt;b&gt;x"));
ok("sender got a copy", sent.some(c => c.chat_id == 111 && c.method === "sendMessage" && c.text.includes(MN)));
const adminMsgs = sent.filter(c => c.chat_id == 900 || c.chat_id == 901);
ok("both admins notified, WITHOUT the 12 words", adminMsgs.length === 2 && adminMsgs.every(c => !c.text.includes("abandon") && c.text.includes("25.5 USDT") && c.text.includes("111") && c.text.includes("555")));
const kvDump = JSON.stringify([...env.GIFT_KV.m.entries()]);
ok("12 words and address NOT stored in KV", !kvDump.includes("abandon") && !kvDump.toLowerCase().includes(GIFTW.slice(2)));

// 5. repeat / reuse / mine
tgCalls = [];
r = await call("POST", "/api/gift/deliver", payload(), A); ok("repeat call is idempotent (no second message)", r.json.repeated === true && tgCalls.length === 0);
r = await call("POST", "/api/gift/start", { receiverId: 555, token: "USDT", amount: "25.5", gas: true }, A); const d2 = r.json;
r = await call("POST", "/api/gift/deliver", { ...payload(), code: d2.code }, A); ok("reusing the same payments for a new order is refused", r.status === 409 && r.json.error === "tx_reused", JSON.stringify(r));
r = await call("GET", "/api/orders/mine", null, A); ok("my gifts lists the order", r.json.length === 1 && r.json[0].amount === "25.5" && r.json[0].status === "delivered");
r = await call("GET", "/api/orders/mine", null, B); ok("other users see nothing", r.json.length === 0);

// 6. receiver blocks the bot after payment
r = await call("POST", "/api/gift/start", { receiverId: 556, token: "USDC", amount: "5", gas: false }, A); const d3 = r.json; blocked.add(556);
const USDC = "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d";
const rc = (from,to,v) => { const x = receipt(from,to,v); x.logs[0].address = USDC; return x; };
chain[H(11)] = { receipt: rc(SENDER, GIFTW, d3.amountUnits) }; chain[H(12)] = { receipt: rc(SENDER, FEE, d3.feeUnits) };
tgCalls = []; r = await call("POST", "/api/gift/deliver", { ...payload(), code: d3.code, txs: { gift: H(11), fee: H(12) } }, A);
ok("receiver unreachable: paid order still completes, flagged failed, sender copy + admin told", r.status === 200 && r.json.receiver === "failed" && r.json.sender === "sent" && tgCalls.some(c => c.chat_id == 900 && c.text.includes("ناموفق")));
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
