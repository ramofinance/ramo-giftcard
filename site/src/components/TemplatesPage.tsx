import { useState } from "react";
import { Link } from "react-router-dom";
import CardPreview from "./CardPreview";
import { CATEGORIES, TEMPLATES } from "../lib/templates";

export default function TemplatesPage() {
  const [cat, setCat] = useState<string>("all");
  const list = cat === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.category === cat);

  return (
    <>
      <h1 className="page-title">قالب‌های کارت هدیه</h1>
      <div className="chips" role="tablist">
        <button className={cat === "all" ? "chip on" : "chip"} onClick={() => setCat("all")}>همه ({TEMPLATES.length})</button>
        {CATEGORIES.map((c) => (
          <button key={c.key} className={cat === c.key ? "chip on" : "chip"} onClick={() => setCat(c.key)}>{c.emoji} {c.name}</button>
        ))}
      </div>
      <div className="grid">
        {list.map((t) => (
          <Link key={t.id} to={`/create/${t.id}`} className="tpl" data-category={t.category}>
            <span className="tpl-image">
              <CardPreview template={t} senderName="رامو" receiverName="دوست عزیز" amount="25" token="USDT" cardText="یک هدیه‌ی کوچک برای تو" />
            </span>
            <span className="tpl-caption">
              <span><small>{t.categoryName}</small><strong>{t.name}</strong></span>
              <span className="tpl-arrow" aria-hidden="true">↗</span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
