import { Link } from "react-router-dom";
import CardPreview from "./CardPreview";
import { getTemplate } from "../lib/templates";
import { useLanguage } from "../lib/i18n";

export default function HomePage() {
  const { language, t } = useLanguage();
  const names = language === "fa" ? { sender: "محسن", receiver: "مینا" } : language === "ar" ? { sender: "محسن", receiver: "مينا" } : language === "zh" ? { sender: "莫森", receiver: "米娜" } : { sender: "Mohsen", receiver: "Mina" };
  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <span className="hero-eyebrow">{t("home.eyebrow")}</span>
          <h1>{t("home.title").split("\n").map((line) => <span key={line}>{line}<br /></span>)}</h1>
          <p>{t("home.description")}</p>
          <div className="row">
            <Link className="btn" to="/templates">{t("home.choose")}</Link>
            <Link className="btn ghost" to="/create/1">{t("home.start")}</Link>
          </div>
          <div className="hero-meta"><span>{t("home.count")}</span><span>USDT · USDC</span><span>BNB Smart Chain</span></div>
        </div>
        <div className="hero-card">
          <CardPreview template={getTemplate(1)} senderName={names.sender} receiverName={names.receiver} amount="25" token="USDT" cardText="" cardFont="modern" cardTextSize={23} cardTextRotation={0} language={language} />
        </div>
      </section>

      <section className="steps">
        {[1, 2, 3, 4].map((n) => (
          <div className="step" key={n}>
            <span className="step-n">{n.toLocaleString(language === "fa" ? "fa-IR" : language === "ar" ? "ar" : language === "zh" ? "zh-CN" : language)}</span>
            <h3>{t(`home.steps.${n}.title`)}</h3>
            <p>{t(`home.steps.${n}.body`)}</p>
          </div>
        ))}
      </section>

      <section className="trust">
        <h2>{t("home.trust.title")}</h2>
        <ul>
          <li>{t("home.trust.1")}</li>
          <li>{t("home.trust.2")}</li>
          <li>{t("home.trust.3")}</li>
        </ul>
      </section>
    </>
  );
}
