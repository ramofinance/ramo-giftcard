import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CardPreview from "./CardPreview";
import TelegramLogin from "./TelegramLogin";
import { api, errorText } from "../lib/api";
import { clearPending, createPending, loadPending, runPayment } from "../lib/flow";
import type { Step } from "../lib/flow";
import { getTemplate } from "../lib/templates";
import type { CardTextField, CardTextPosition } from "../lib/templates";
import { defaultCardTextColors, defaultCardTextPositions } from "../lib/card";
import { BOT, currentUser, inMiniApp } from "../lib/telegram";
import { DEFAULT_CONFIG } from "../lib/types";
import type { Config, DeliverResult, Form, Pending } from "../lib/types";
import { fromUnits, shortAddress, toUnits } from "../lib/units";
import { connectWallet, hasWallet, walletErrorText } from "../lib/wallet";
import { useLanguage } from "../lib/i18n";

type Done = { result: DeliverResult; mnemonic: string; address: string; txs: Pending["txs"]; receiverName: string };
const TEXT_FIELDS: CardTextField[] = ["brand", "category", "receiver", "sender", "amount", "message", "network"];

export default function CreatePage() {
  const { language, t } = useLanguage();
  const params = useParams();
  const template = getTemplate(Number(params.id) || 1);

  const [cfg, setCfg] = useState<Config>(DEFAULT_CONFIG);
  const [user, setUser] = useState(currentUser());
  const [account, setAccount] = useState("");
  const [form, setForm] = useState<Form>({ senderName: "", receiverName: "", receiverId: "", cardText: "", cardFont: "modern", cardTextSize: 23, cardTextRotation: 0, message: "", token: "USDT", amount: "10", gas: true });
  const [selectedText, setSelectedText] = useState<CardTextField>("receiver");
  const [reach, setReach] = useState<"idle" | "ok" | "no">("idle");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<Step | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Pending | null>(loadPending());
  const [done, setDone] = useState<Done | null>(null);
  const [reveal, setReveal] = useState(false);
  const stepLabels: [Step, string][] = [
    ["check", t("validation.title")],
    ["gift", t("validation.gift")],
    ["fee", t("validation.fee")],
    ["gas", t("validation.gas")],
    ["deliver", t("validation.deliver")]
  ];

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const defaultPositions = defaultCardTextPositions(template);
  const defaultColors = defaultCardTextColors(template);
  const textPositions = { ...defaultPositions, ...form.cardTextPositions };
  const textColors = { ...defaultColors, ...form.cardTextColors };
  const position = textPositions[selectedText]!;
  const updatePosition = (field: CardTextField, value: CardTextPosition) => set("cardTextPositions", { ...defaultCardTextPositions(template), ...form.cardTextPositions, [field]: value });

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
    if (!form.senderName.trim() || !form.receiverName.trim()) return t("create.validateNames");
    if (!/^\d{5,15}$/.test(form.receiverId.trim())) return t("create.validateId");
    const min = toUnits(cfg.minGift);
    const max = toUnits(cfg.maxGift);
    if (giftUnits === null || (min !== null && giftUnits < min) || (max !== null && giftUnits > max)) return t("create.validateAmount", { min: cfg.minGift, max: cfg.maxGift, token: form.token });
    return null;
  };

  const fail = (e: unknown) => {
    setError(walletErrorText(e, language) ?? errorText(e, language));
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
    try { setAccount(await connectWallet()); } catch (e) { setError(walletErrorText(e, language) ?? t("create.walletConnectFailed")); }
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
      finish(p, await runPayment(p, setStep, language));
    } catch (e) { fail(e); } finally { setBusy(false); setStep(null); }
  };

  const resume = async () => {
    if (!pending) return;
    if (!account) return setError(t("create.connectFirst"));
    if (account.toLowerCase() !== pending.senderWallet.toLowerCase()) return setError(t("create.sameWallet"));
    setError(""); setBusy(true);
    try { finish(pending, await runPayment(pending, setStep, language)); } catch (e) { fail(e); } finally { setBusy(false); setStep(null); }
  };

  const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => {});

  // ---------- finished ----------
  if (done) {
    const r = done.result;
    return (
      <div className="panel">
        <h1 className="page-title">{r.receiver === "sent" ? `🎉 ${t("create.sent")}` : t("create.failed")}</h1>
        {r.receiver === "sent"
          ? <p className="ok">{t("create.sentInfo", { name: done.receiverName })}</p>
          : <p className="error">{t("create.failedInfo")}</p>}
        {r.sender === "sent" && <p className="dim">{t("create.senderCopy")}</p>}
        <p className="dim small">{t("create.order")}: {r.orderId}</p>
        <div className="backup">
          <strong>{t("create.backup")}</strong>
          {reveal
            ? <p className="phrase" dir="ltr">{done.mnemonic}</p>
            : <button className="btn ghost" onClick={() => setReveal(true)}>{t("create.reveal")}</button>}
          <p className="dim small" dir="ltr">{done.address}</p>
          <div className="row">
            <button className="btn ghost" onClick={() => copy(done.mnemonic)}>{t("create.copyWords")}</button>
            {done.txs.gift && <a className="btn ghost" target="_blank" rel="noreferrer" href={`https://bscscan.com/tx/${done.txs.gift}`}>{t("create.bscscan")}</a>}
          </div>
        </div>
        <button className="btn" onClick={() => { setDone(null); setReveal(false); }}>{t("create.another")}</button>
      </div>
    );
  }

  const needLogin = !user;
  const needWallet = !account;
  const [receiverHintBefore, receiverHintAfter] = t("create.receiverHint").split("{bot}");

  return (
    <div className="create">
      <section className="create-preview">
        <CardPreview template={template} senderName={form.senderName} receiverName={form.receiverName} amount={form.amount} token={form.token} cardText={form.cardText} cardFont={form.cardFont} cardTextSize={form.cardTextSize} cardTextRotation={form.cardTextRotation} cardTextPositions={textPositions} cardTextColors={textColors} selectedText={selectedText} onTextSelect={setSelectedText} onTextPositionChange={updatePosition} language={language} />
        <div className="row between">
          <span className="dim small">{t("create.template")}: {t(`tpl.${template.design}`)}</span>
          <Link to="/templates" className="small">{t("create.change")}</Link>
        </div>
      </section>

      <section className="create-form panel">
        {pending && !busy && (
          <div className="notice">
            <strong>{t("create.pending")}</strong>
            <p className="small">{pending.txs.gift ? t("create.alreadyStarted") : t("create.notPaid")}</p>
            <div className="row">
              {pending.txs.gift && <button className="btn" onClick={resume}>{t("create.continue")}</button>}
              <button className="btn ghost" onClick={() => setReveal(!reveal)}>{reveal ? t("create.hideWords") : t("create.showWords")}</button>
              {!pending.txs.gift && <button className="btn ghost" onClick={() => { clearPending(); setPending(null); }}>{t("create.delete")}</button>}
            </div>
            {reveal && <p className="phrase" dir="ltr">{pending.mnemonic}</p>}
          </div>
        )}

        <div className="two">
          <label>{t("create.sender")}<input value={form.senderName} maxLength={40} onChange={(e) => set("senderName", e.target.value)} /></label>
          <label>{t("create.receiver")}<input value={form.receiverName} maxLength={40} onChange={(e) => set("receiverName", e.target.value)} /></label>
        </div>

        <label>
          {t("create.receiverId")}
          <div className="inline">
            <input dir="ltr" inputMode="numeric" placeholder="123456789" value={form.receiverId} onChange={(e) => { set("receiverId", e.target.value.replace(/\D/g, "")); setReach("idle"); }} />
            <button type="button" className="btn ghost" disabled={!user || form.receiverId.length < 5} onClick={checkReceiver}>{t("create.check")}</button>
          </div>
          <span className="dim small">{receiverHintBefore}<a href={`https://t.me/${BOT}`} target="_blank" rel="noreferrer">{BOT}</a>{receiverHintAfter}</span>
          {reach === "ok" && <span className="ok small">✓ {t("create.ready")}</span>}
          {reach === "no" && <span className="error small">{t("create.notReady")}</span>}
        </label>

        <div className="two">
          <label>{t("create.token")}
            <select value={form.token} onChange={(e) => set("token", e.target.value as Form["token"])}>
              {cfg.tokens.map((t) => <option key={t.symbol} value={t.symbol}>{t.symbol} (BNB Chain)</option>)}
            </select>
          </label>
          <label>{t("create.amount")}
            <input dir="ltr" inputMode="decimal" value={form.amount} onChange={(e) => set("amount", e.target.value.replace(",", "."))} />
          </label>
        </div>

        <label>{t("create.cardText")}<input value={form.cardText} maxLength={80} placeholder={t("create.cardPlaceholder")} onChange={(e) => set("cardText", e.target.value)} /></label>
        <div className="two">
          <label>{t("create.font")}
            <select value={form.cardFont} onChange={(e) => set("cardFont", e.target.value as Form["cardFont"])}>
              <option value="modern">{t("create.fontModern")}</option>
              <option value="classic">{t("create.fontClassic")}</option>
              <option value="clean">{t("create.fontClean")}</option>
            </select>
          </label>
          <label className="range-field"><span className="range-label"><span>{t("create.textSize")}</span><b>{form.cardTextSize}px</b></span>
            <input type="range" min="16" max="38" value={form.cardTextSize} onChange={(e) => set("cardTextSize", Number(e.target.value))} />
          </label>
        </div>
        <label className="range-field"><span className="range-label"><span>{t("create.rotation")}</span><b>{form.cardTextRotation > 0 ? `+${form.cardTextRotation}` : form.cardTextRotation}°</b></span>
          <input type="range" min="-12" max="12" value={form.cardTextRotation} onChange={(e) => set("cardTextRotation", Number(e.target.value))} />
        </label>
        <div className="text-editor">
          <h3>{t("create.textEditorTitle")}</h3>
          <p className="editor-hint">{t("create.textEditorHint")}</p>
          <label>{t("create.textLayer")}
            <select value={selectedText} onChange={(e) => setSelectedText(e.target.value as CardTextField)}>
              {TEXT_FIELDS.map((field) => <option key={field} value={field}>{t(`create.layer.${field}`)}</option>)}
            </select>
          </label>
          <label className="color-field">{t("create.textColor")}
            <input type="color" value={textColors[selectedText]!} onChange={(e) => set("cardTextColors", { ...defaultColors, ...form.cardTextColors, [selectedText]: e.target.value })} />
          </label>
          <div className="text-controls">
            <label className="range-field"><span className="range-label"><span>{t("create.positionX")}</span><b>{position.x}px</b></span>
              <input type="range" min="0" max="1000" value={position.x} onChange={(e) => updatePosition(selectedText, { ...position, x: Number(e.target.value) })} />
            </label>
            <label className="range-field"><span className="range-label"><span>{t("create.positionY")}</span><b>{position.y}px</b></span>
              <input type="range" min="0" max="625" value={position.y} onChange={(e) => updatePosition(selectedText, { ...position, y: Number(e.target.value) })} />
            </label>
          </div>
          <div className="editor-actions">
            <button type="button" className="btn ghost" onClick={() => updatePosition(selectedText, defaultPositions[selectedText]!)}>{t("create.resetPosition")}</button>
          </div>
        </div>
        <label>{t("create.personalMessage")}<textarea rows={3} maxLength={300} value={form.message} onChange={(e) => set("message", e.target.value)} /></label>

        <label className="check">
          <input type="checkbox" checked={form.gas} onChange={(e) => set("gas", e.target.checked)} />
          <span>{t("create.gas", { amount: cfg.gasBnb })}</span>
        </label>

        <div className="summary">
          <div><span>{t("create.summaryGift")}</span><b dir="ltr">{form.amount || "0"} {form.token}</b></div>
          <div><span>{t("create.serviceFee")}</span><b dir="ltr">{cfg.feeUsd} {form.token}</b></div>
          {form.gas && <div><span>{t("create.gasFee")}</span><b dir="ltr">{cfg.gasBnb} BNB</b></div>}
          <div className="sum-total"><span>{t("create.total")}</span><b dir="ltr">{total} {form.token}</b></div>
        </div>

        <p className="dim small">{t("create.security")}</p>

        {error && <p className="error" role="alert">{error}</p>}

        {busy && step && (
          <ol className="steps-list">
            {stepLabels.filter(([s]) => s !== "gas" || form.gas).map(([s, label]) => (
              <li key={s} className={s === step ? "on" : ""}>{label}</li>
            ))}
          </ol>
        )}

        {needLogin ? (
          <div className="center">
            <p className="dim small">{t("create.login")}</p>
            {!inMiniApp() && <TelegramLogin onDone={() => setUser(currentUser())} />}
          </div>
        ) : needWallet ? (
          <>
          <button className="btn wide" onClick={connect} disabled={!hasWallet()}>{t("create.connect")}</button>
          {!hasWallet() && (
            <p className="dim small">
                {t("create.noWallet")}
                <button className="link" onClick={() => copy(window.location.href)}>{t("create.copyLink")}</button>
              </p>
            )}
          </>
        ) : (
          <button className="btn wide" onClick={pay} disabled={busy}>
            {busy ? t("create.busy") : t("create.pay", { total, token: form.token })}
          </button>
        )}
        {account && <p className="dim small" dir="ltr">{t("create.wallet")}: {shortAddress(account)}</p>}
      </section>
    </div>
  );
}
