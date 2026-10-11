import { useState } from "react";
import { Link } from "react-router-dom";
import CardPreview from "./CardPreview";
import { CATEGORIES, TEMPLATES } from "../lib/templates";
import { useLanguage } from "../lib/i18n";

export default function TemplatesPage() {
  const [cat, setCat] = useState<string>("all");
  const { language, t: copy } = useLanguage();
  const list = cat === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.category === cat);

  return (
    <>
      <h1 className="page-title">{copy("templates.title")}</h1>
      <div className="chips" role="tablist">
        <button className={cat === "all" ? "chip on" : "chip"} onClick={() => setCat("all")}>{copy("cat.all")} ({TEMPLATES.length})</button>
        {CATEGORIES.map((c) => (
          <button key={c.key} className={cat === c.key ? "chip on" : "chip"} onClick={() => setCat(c.key)}>{c.emoji} {copy(`cat.${c.key}`)}</button>
        ))}
      </div>
      <div className="grid">
        {list.map((t) => (
          <Link key={t.id} to={`/create/${t.id}`} className="tpl" data-category={t.category}>
            <span className="tpl-image">
              <CardPreview template={t} senderName="RAMO" receiverName={language === "fa" ? "دوست عزیز" : language === "ar" ? "صديق عزيز" : language === "zh" ? "亲爱的朋友" : language === "es" ? "alguien especial" : "Dear friend"} amount="25" token="USDT" cardText="" cardFont="modern" cardTextSize={23} cardTextRotation={0} language={language} />
            </span>
            <span className="tpl-caption">
               <span><small>{copy(`cat.${t.category}`)}</small><strong>{copy(`tpl.${t.design}`)}</strong></span>
              <span className="tpl-arrow" aria-hidden="true">↗</span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
