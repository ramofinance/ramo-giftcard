import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
const API = "https://ramo-giftcard-api.YOUR-WORKER-NAME.workers.dev";
export default function CreatePage() {
  const { templateId } = useParams();
  const [form, setForm] = useState({ senderName: "", receiverName: "", receiverTgId: "", message: "", amountUSDT: "", senderWallet: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async () => {
    if (!form.senderName || !form.receiverName || !form.receiverTgId || !form.amountUSDT) { setError("لطفاً همه فیلدهای الزامی رو پر کن"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(API + "/api/gift/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, templateId: parseInt(templateId || "1"), amountUSDT: parseFloat(form.amountUSDT) })
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setResult(data);
    } catch { setError("خطا در ارتباط با سرور"); }
    setLoading(false);
  };
  if (result) {
    return (
      <div className="form-page">
        <Link to="/templates" style={{color:"#888",fontSize:14,textDecoration:"none"}}>← ساخت کارت جدید</Link>
        <div className="result-card" style={{marginTop:16}}>
          <div style={{fontSize:48,color:"#4caf50"}}>✅</div>
          <h2 style={{margin:"12px 0",fontSize:20}}>کارت هدیه ساخته شد!</h2>
          <p style={{color:"#888",fontSize:13}}>کد سفارش: {result.orderId}</p>
          <div style={{background:"#fff",borderRadius:10,overflow:"hidden",margin:"16px 0"}} dangerouslySetInnerHTML={{__html: result.cardSvg}} />
          <div className="result-detail"><div className="label">آدرس کیف جدید گیرنده:</div><div className="value" onClick={() => navigator.clipboard.writeText(result.walletAddress)}>{result.walletAddress} 📋</div></div>
          <div className="result-detail"><div className="label">برای پرداخت USDT به این آدرس بفرست:</div><div className="value" onClick={() => navigator.clipboard.writeText(result.treasuryAddress)}>{result.treasuryAddress} 📋</div></div>
          <div className="result-detail"><div className="label">آدرس توکن USDT (BSC):</div><div className="value" onClick={() => navigator.clipboard.writeText(result.usdtTokenAddress)}>{result.usdtTokenAddress} 📋</div></div>
          <div style={{background:"rgba(255,152,0,0.1)",borderRadius:10,padding:12,marginTop:12,fontSize:14,color:"#ff9800"}}>⏳ پس از پرداخت، صبر کن تا تراکنش تایید بشه. بات ما به صورت خودکار کیف رو به گیرنده تحویل میده.</div>
        </div>
      </div>
    );
  }
  return (
    <div className="form-page">
      <Link to="/templates" style={{color:"#888",fontSize:14,textDecoration:"none",display:"inline-block",marginBottom:16}}>← برگشت به قالب‌ها</Link>
      <h1 className="page-title">اطلاعات کارت هدیه</h1>
      <div className="form-group"><label>اسم شما *</label><input name="senderName" value={form.senderName} onChange={handleChange} placeholder="مثلاً محسن" /></div>
      <div className="form-group"><label>اسم گیرنده *</label><input name="receiverName" value={form.receiverName} onChange={handleChange} placeholder="مثلاً علی" /></div>
      <div className="form-group"><label>آیدی عددی تلگرام گیرنده *</label><input name="receiverTgId" value={form.receiverTgId} onChange={handleChange} placeholder="مثلاً 123456789" type="number" /></div>
      <div className="form-group"><label>پیام تبریک</label><textarea name="message" value={form.message} onChange={handleChange} placeholder="متن دلخواه روی کارت..." /></div>
      <div className="form-group"><label>مبلغ USDT *</label><input name="amountUSDT" value={form.amountUSDT} onChange={handleChange} placeholder="مثلاً ۵۰" type="number" /></div>
      <div className="form-group"><label>آدرس والت BSC شما (برای پرداخت)</label><input name="senderWallet" value={form.senderWallet} onChange={handleChange} placeholder="0x..." /></div>
      <p style={{fontSize:13,color:"#888",marginBottom:16}}>کارمزد: ۰.۵ USDT • پس از ساخت سفارش، مبلغ + کارمزد رو به آدرس خزانه می‌فرستی</p>
      {error && <p style={{color:"#f44336",fontSize:14,marginBottom:12}}>{error}</p>}
      <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:14,fontSize:16}}>{loading ? "در حال ساخت..." : "ساخت کارت هدیه"}</button>
    </div>
  );
}
