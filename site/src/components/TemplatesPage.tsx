import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
const API = "https://ramo-giftcard-api.YOUR-WORKER-NAME.workers.dev";
const CAT_NAMES: Record<string, string> = { birthday: "🎂 تولد", thanks: "🙏 تشکر", holiday: "🎄 مناسبت‌ها", love: "💝 عاشقانه", minimal: "🎨 مینیمال", graduation: "🎓 تحصیلات", crypto: "🚀 کریپتو" };
export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch(API + "/api/templates").then(r => r.json()).then(data => { setTemplates(data); setLoading(false); }).catch(() => setLoading(false)); }, []);
  const grouped: Record<string, any[]> = {};
  templates.forEach(t => { const cat = CAT_NAMES[t.category] || t.category; if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(t); });
  if (loading) return <div style={{textAlign:"center",padding:60,color:"#888"}}>در حال بارگذاری...</div>;
  return (
    <div>
      <h1 className="page-title">انتخاب تم کارت هدیه</h1>
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} style={{marginBottom:24}}>
          <h3 style={{fontSize:14,color:"#888",marginBottom:10}}>{cat}</h3>
          <div className="templates-grid">
            {items.map((t: any) => (
              <Link to={"/create/" + t.id} key={t.id} className="template-card" style={{background: t.bgGradient || "linear-gradient(135deg, #f5af19, #f12711)"}}>{t.name}</Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
