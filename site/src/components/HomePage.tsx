import React from "react";
import { Link } from "react-router-dom";
const HOW = [
  { num: "۱", title: "تم رو انتخاب کن", desc: "از بین ۱۲+ تم مختلف یکی رو انتخاب می‌کنی" },
  { num: "۲", title: "اطلاعات رو پر کن", desc: "اسم طرف مقابل، پیام تبریک و مبلغ USDT" },
  { num: "۳", title: "پرداخت و ارسال", desc: "مبلغ رو به خزانه واریز می‌کنی، ما کیف جدید می‌سازیم" },
  { num: "۴", title: "گیرنده دریافت می‌کنه", desc: "کیف + موجودی + آموزش نصب توی تلگرام براش میاد" },
];
export default function HomePage() {
  return (
    <div>
      <section className="hero">
        <h1>کارت هدیه رمزارز<br />برای همه</h1>
        <p>با RAMO Gift Card می‌تونی به دوست و آشنا USDT هدیه بدی، حتی اگه هیچی از بلاکچین ندونه. ما براش کیف می‌سازیم، پول می‌ریزیم و آموزش می‌دیم. 🎁</p>
        <div className="hero-cta">
          <Link to="/templates" className="btn-primary">ساخت کارت هدیه</Link>
          <a href="https://t.me/ramofinance_alerts_bot" className="btn-secondary" target="_blank">ربات تلگرام</a>
        </div>
      </section>
      <section>
        <h2 className="page-title" style={{textAlign:"center"}}>چطور کار می‌کنه؟</h2>
        <div className="how">
          {HOW.map((h, i) => (
            <div className="how-card" key={i}>
              <div className="num">{h.num}</div>
              <h3>{h.title}</h3>
              <p>{h.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{textAlign:"center",padding:"30px 0"}}>
        <h2 style={{fontSize:20,marginBottom:8}}>چرا RAMO Gift Card؟</h