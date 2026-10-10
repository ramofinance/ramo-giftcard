import { Link } from "react-router-dom";
import CardPreview from "./CardPreview";
import { getTemplate } from "../lib/templates";

const STEPS = [
  ["۱", "قالب را انتخاب کنید", "از بین ۱۰۰ طرح، کارتی که به مناسبت می‌خورد را بردارید."],
  ["۲", "مبلغ و پیام را بنویسید", "تتر یا USDC روی شبکه‌ی BNB Chain، با اسم و پیام دلخواه."],
  ["۳", "با کیف پول خودتان پرداخت کنید", "پول مستقیم از کیف شما می‌رود؛ ما به کلید شما دسترسی نداریم."],
  ["۴", "هدیه در تلگرام می‌رسد", "گیرنده کارت و یک کیف پول تازه با ۱۲ کلمه‌ی بازیابی می‌گیرد."]
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <span className="hero-eyebrow">RAMO FINANCE · DIGITAL GIFTS</span>
          <h1>هدیه‌ی رمزارزی بدهید،<br />به‌سادگی یک کارت تبریک</h1>
          <p>
            یک کارت قشنگ با مبلغ دلخواه تتر. گیرنده‌ی شما در تلگرام کارت را می‌گیرد و بدون هیچ دانش قبلی، قدم‌به‌قدم
            با کیف پول Rabby وارد دنیای بلاکچین می‌شود.
          </p>
          <div className="row">
            <Link className="btn" to="/templates">انتخاب قالب</Link>
            <Link className="btn ghost" to="/create/1">شروع سریع</Link>
          </div>
          <div className="hero-meta"><span>۱۰۰ طرح اختصاصی</span><span>USDT · USDC</span><span>BNB Smart Chain</span></div>
        </div>
        <div className="hero-card">
          <CardPreview template={getTemplate(1)} senderName="رضا" receiverName="سارا" amount="25" token="USDT" cardText="تولدت مبارک! این هدیه‌ی کوچک من به توست." />
        </div>
      </section>

      <section className="steps">
        {STEPS.map(([n, title, text]) => (
          <div className="step" key={n}>
            <span className="step-n">{n}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </section>

      <section className="trust">
        <h2>امنیت، بدون نگهداری</h2>
        <ul>
          <li>کیف هدیه در مرورگر خود شما ساخته می‌شود و ۱۲ کلمه‌ی آن هیچ‌جا روی سرور ما ذخیره نمی‌شود.</li>
          <li>پرداخت از کیف پول خودتان انجام می‌شود و ما هیچ دسترسی‌ای به موجودی شما نداریم.</li>
          <li>کارمزد سرویس ۰٫۵ دلار است و قبل از پرداخت دقیق نمایش داده می‌شود.</li>
        </ul>
      </section>
    </>
  );
}
