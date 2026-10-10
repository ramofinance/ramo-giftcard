import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CardPreview from "./CardPreview";
import TelegramLogin from "./TelegramLogin";
import { api, errorText } from "../lib/api";
import { clearPending, createPending, loadPending, runPayment } from "../lib/flow";
import type { Step } from "../lib/flow";
import { getTemplate } from "../lib/templates";
import { BOT, currentUser, inMiniApp } from "../lib/telegram";
import { DEFAULT_CONFIG } from "../lib/types";
import type { Config, DeliverResult, Form, Pending } from "../lib/types";
import { fromUnits, shortAddress, toUnits } from "../lib/units";
import { connectWallet, hasWallet, walletErrorText } from "../lib/wallet";

const STEP_LABELS: [Step, string][] = [
  ["check", "بررسی موجودی کیف پول"],
  ["gift", "پرداخت هدیه به کیف جدید (در کیف پول تایید کنید)"],
  ["fee", "پرداخت کارمزد سرویس"],
  ["gas", "ارسال کمی BNB برای کارمزد گیرنده"],
  ["deliver", "ساخت کارت و ارسال در تلگرام"]
];

type Done = { result: DeliverResult; mnemonic: string; address: string; txs: Pending["txs"]; receiverName: string };

export default function CreatePage() {
  const params = useParams();
  const template = getTemplate(Number(params.id) || 1);

  const [cfg, setCfg] = useState<Config>(DEFAULT_CONFIG);
  const [user, setUser] = useState(currentUser());
  const [account, setAccount] = useState("");
  const [form, setForm] = useState<Form>({ senderName: "", receiverName: "", receiverId: "", cardText: "", message: "", token: "USDT", amount: "10", gas: true });
  const [reach, setReach] = useState<"idle" | "ok" | "no">("idle");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<Step | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Pending | null>(loadPending());
  const [done, setDone] = useState<Done | null>(null);
  const [reveal, setReveal] = useState(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    api<Config>("/api/config", { auth: false }).then(setCfg).catch(() => {});
  }, []);
  useEffect(() => {
    if (user && !form.senderName) set("senderName", user.first_name);
  }, [user]);
  useEffect(() => {
    const eth = (window as any).ethereum;
    const onAccounts = (a: string[]) => setAccount(a[0] || "");
    eth?.on?.("accountsChanged", onAccounts);
    return () => eth?.removeListener?.("accountsChanged", onAccounts);
  }, []);

  const giftUnits = toUnits(form.amount);
  const total = useMemo(() => (giftUnits === null ? "—" : fromUnits(giftUnits + (toUnits(cfg.feeUsd) ?? 0n))), [giftUnits, cfg.feeUsd]);

  const validate = (): string | null => {
    if (!form.senderName.trim() || !form.receiverName.trim()) return "اسم شما و اسم گیرنده را بنویسید.";
    if (!/^\d{5,15}$/.test(form.receiverId.trim())) return "شناسه‌ی عددی تلگرام گیرنده را درست وارد کنید.";
    const min = toUnits(cfg.minGift);
    const max = toUnits(cfg.maxGift);
    if (giftUnits === null || (min !== null && giftUnits < min) || (max !== null && giftUnits > max)) return `مبلغ باید بین ${cfg.minGift} تا ${cfg.maxGift} ${form.token} باشد.`;
    return null;
  };

  const fail = (e: unknown) => {
    setError(walletErrorText(e) ?? errorText(e));
    const p = loadPending();
    if (p && !p.txs.gift) { clearPending(); setPending(null); } else setPending(p); // nothing paid yet -> nothing to resume
  };

  const checkReceiver = async () => {
    setError("");
    try {
      const r = await api<{ reachable: boolean }>("/api/receiver/check", { body: { receiverId: Number(form.receiverId) } });
      setReach(r.reachable ? "ok" : "no");
    } catch (e) { fail(e); }
  };

  const connect = async () => {
    setError("");
    try { setAccount(await connectWallet()); } catch (e) { setError(walletErrorText(e) ?? "اتصال کیف پول انجام نشد."); }
  };

  const finish = (p: Pending, result: DeliverResult) => {
    setPending(null);
    setDone({ result, mnemonic: p.mnemonic, address: p.address, txs: p.txs, receiverName: p.form.receiverName });
  };

  const pay = async () => {
    const problem = validate();
    if (problem) return setError(problem);
    setError(""); setBusy(true);
    try {
      const p = await createPending(form, template.id, account);
      setPending(p);
      finish(p, await runPayment(p, setStep));
    } catch (e) { fail(e); } finally { setBusy(false); setStep(null); }
  };

  const resume = async () => {
    if (!pending) return;
    if (!account) return setError("اول کیف پول را وصل کنید.");
    if (account.toLowerCase() !== pending.senderWallet.toLowerCase()) return setError("با همان کیف پولی که سفارش را شروع کردید وارد شوید.");
    setError(""); setBusy(true);
    try { finish(pending, await runPayment(pending, setStep)); } catch (e) { fail(e); } finally { setBusy(false); setStep(null); }
  };

  const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => {});

  // ---------- finished ----------
  if (done) {
    const r = done.result;
    return (
      <div className="panel">
        <h1 className="page-title">{r.receiver === "sent" ? "هدیه ارسال شد 🎉" : "پرداخت انجام شد، ولی ارسال به گیرنده ناموفق بود"}</h1>
        {r.receiver === "sent"
          ? <p className="ok">کارت و کیف پول جدید برای {done.receiverName} در تلگرام فرستاده شد.</p>
          : <p className="error">گیرنده نتوانست پیام را بگیرد (احتمالاً ربات را بلاک کرده). موجودی در کیف زیر امن است؛ ۱۲ کلمه را خودتان برایش بفرستید.</p>}
        {r.sender === "sent" && <p className="dim">یک نسخه از ۱۲ کلمه هم برای خود شما در تلگرام فرستاده شد.</p>}
        <p className="dim small">کد سفارش: {r.orderId}</p>
        <div className="backup">
          <strong>نسخه‌ی پشتیبان (فقط برای شما)</strong>
          {reveal
            ? <p className="phrase" dir="ltr">{done.mnemonic}</p>
            : <button className="btn ghost" onClick={() => setReveal(true)}>نمایش ۱۲ کلمه</button>}
          <p className="dim small" dir="ltr">{done.address}</p>
          <div className="row">
            <button className="btn ghost" onClick={() => copy(done.mnemonic)}>کپی ۱۲ کلمه</button>
            {done.txs.gift && <a className="btn ghost" target="_blank" rel="noreferrer" href={`https://bscscan.com/tx/${done.txs.gift}`}>تراکنش در BscScan</a>}
          </div>
        </div>
        <button className="btn" onClick={() => { setDone(null); setReveal(false); }}>ساخت هدیه‌ی دیگر</button>
      </div>
    );
  }

  const needLogin = !user;
  const needWallet = !account;

  return (
    <div className="create">
      <section className="create-preview">
        <CardPreview template={template} senderName={form.senderName} receiverName={form.receiverName} amount={form.amount} token={form.token} cardText={form.cardText} />
        <div className="row between">
          <span className="dim small">قالب: {template.name}</span>
          <Link to="/templates" className="small">تغییر قالب</Link>
        </div>
      </section>

      <section className="create-form panel">
        {pending && !busy && (
          <div className="notice">
            <strong>یک هدیه‌ی نیمه‌کاره دارید</strong>
            <p className="small">{pending.txs.gift ? "پرداخت شروع شده است. با «ادامه» سفارش کامل می‌شود." : "هنوز پرداختی انجام نشده است."}</p>
            <div className="row">
              {pending.txs.gift && <button className="btn" onClick={resume}>ادامه‌ی سفارش</button>}
              <button className="btn ghost" onClick={() => setReveal(!reveal)}>{reveal ? "پنهان کردن ۱۲ کلمه" : "نمایش ۱۲ کلمه‌ی کیف"}</button>
              {!pending.txs.gift && <button className="btn ghost" onClick={() => { clearPending(); setPending(null); }}>حذف</button>}
            </div>
            {reveal && <p className="phrase" dir="ltr">{pending.mnemonic}</p>}
          </div>
        )}

        <div className="two">
          <label>اسم شما<input value={form.senderName} maxLength={40} onChange={(e) => set("senderName", e.target.value)} /></label>
          <label>اسم گیرنده<input value={form.receiverName} maxLength={40} onChange={(e) => set("receiverName", e.target.value)} /></label>
        </div>

        <label>
          شناسه‌ی عددی تلگرام گیرنده
          <div className="inline">
            <input dir="ltr" inputMode="numeric" placeholder="123456789" value={form.receiverId} onChange={(e) => { set("receiverId", e.target.value.replace(/\D/g, "")); setReach("idle"); }} />
            <button type="button" className="btn ghost" disabled={!user || form.receiverId.length < 5} onClick={checkReceiver}>بررسی</button>
          </div>
          <span className="dim small">شناسه را از ربات @userinfobot بگیرید. گیرنده باید یک‌بار ربات <a href={`https://t.me/${BOT}`} target="_blank" rel="noreferrer">@{BOT}</a> را استارت کرده باشد.</span>
          {reach === "ok" && <span className="ok small">گیرنده آماده‌ی دریافت است ✅</span>}
          {reach === "no" && <span className="error small">گیرنده هنوز ربات را استارت نکرده. لینک ربات را برایش بفرستید و بعد دوباره «بررسی» بزنید.</span>}
        </label>

        <div className="two">
          <label>ارز
            <select value={form.token} onChange={(e) => set("token", e.target.value as Form["token"])}>
              {cfg.tokens.map((t) => <option key={t.symbol} value={t.symbol}>{t.symbol} (BNB Chain)</option>)}
            </select>
          </label>
          <label>مبلغ هدیه
            <input dir="ltr" inputMode="decimal" value={form.amount} onChange={(e) => set("amount", e.target.value.replace(",", "."))} />
          </label>
        </div>

        <label>متن روی کارت<input value={form.cardText} maxLength={80} placeholder="مثلاً: تولدت مبارک!" onChange={(e) => set("cardText", e.target.value)} /></label>
        <label>پیام شخصی (در تلگرام)<textarea rows={3} maxLength={300} value={form.message} onChange={(e) => set("message", e.target.value)} /></label>

        <label className="check">
          <input type="checkbox" checked={form.gas} onChange={(e) => set("gas", e.target.checked)} />
          <span>{cfg.gasBnb} BNB هم برای کارمزد انتقال گیرنده داخل کیف بگذار (پیشنهاد می‌شود)</span>
        </label>

        <div className="summary">
          <div><span>هدیه</span><b dir="ltr">{form.amount || "0"} {form.token}</b></div>
          <div><span>کارمزد سرویس</span><b dir="ltr">{cfg.feeUsd} {form.token}</b></div>
          {form.gas && <div><span>BNB برای کارمزد گیرنده</span><b dir="ltr">{cfg.gasBnb} BNB</b></div>}
          <div className="sum-total"><span>جمع از کیف شما</span><b dir="ltr">{total} {form.token}</b></div>
        </div>

        <p className="dim small">گیرنده یک کیف پول تازه با ۱۲ کلمه‌ی بازیابی می‌گیرد و یک نسخه از همان ۱۲ کلمه برای شما هم فرستاده می‌شود؛ هر کس این کلمات را داشته باشد صاحب موجودی است. این کلمات روی سرور ما ذخیره نمی‌شوند.</p>

        {error && <p className="error" role="alert">{error}</p>}

        {busy && step && (
          <ol className="steps-list">
            {STEP_LABELS.filter(([s]) => s !== "gas" || form.gas).map(([s, label]) => (
              <li key={s} className={s === step ? "on" : ""}>{label}</li>
            ))}
          </ol>
        )}

        {needLogin ? (
          <div className="center">
            <p className="dim small">برای ارسال هدیه ابتدا با تلگرام وارد شوید.</p>
            {!inMiniApp() && <TelegramLogin onDone={() => setUser(currentUser())} />}
          </div>
        ) : needWallet ? (
          <>
            <button className="btn wide" onClick={connect} disabled={!hasWallet()}>اتصال کیف پول</button>
            {!hasWallet() && (
              <p className="dim small">
                کیف پولی در این مرورگر پیدا نشد. این صفحه را داخل مرورگر برنامه‌ی کیف پول (Rabby، Trust Wallet یا MetaMask) باز کنید
                یا در کامپیوتر افزونه‌ی Rabby را نصب کنید.
                <button className="link" onClick={() => copy(window.location.href)}>کپی لینک این صفحه</button>
              </p>
            )}
          </>
        ) : (
          <button className="btn wide" onClick={pay} disabled={busy}>
            {busy ? "در حال انجام… این صفحه را نبندید" : `پرداخت ${total} ${form.token} و ارسال هدیه`}
          </button>
        )}
        {account && <p className="dim small" dir="ltr">Wallet: {shortAddress(account)}</p>}
      </section>
    </div>
  );
}
