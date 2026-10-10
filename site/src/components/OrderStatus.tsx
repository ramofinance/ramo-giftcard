import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
const API = "https://ramo-giftcard-api.YOUR-WORKER-NAME.workers.dev";
const STATUS_MAP: Record<string, {icon:string,text:string,color:string}> = {
  pending_payment: {icon:"⏳",text:"در انتظار پرداخت",color:"#ff9800"},
  confirmed: {icon:"✅",text:"پرداخت تایید شد",color:"#4caf50"},
  completed: {icon:"🎉",text:"تحویل داده شد",color:"#4caf50"},
  failed: {icon:"❌",text:"ناموفق",color:"#f44336"},
};
export default function OrderStatus() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch(API + "/api/gift/status/" + orderId).then(r => r.json()).then(data => { setOrder(data); setLoading(false); }).catch(() => setLoading(false)); }, [orderId]);
  if (loading) return <div style={{textAlign:"center",padding:60,color:"#888"}}>در حال بررسی...</div>;
  if (!order) return (<div className="status-box"><div className="big-icon">❓</div><h2>سفارش یافت نشد</h2><Link to="/" className="btn-primary" style={{marginTop:16,display:"inline-block"}}>صفحه اصلی</Link></div>);
  const st = STATUS_MAP[order.status] || {icon:"❓",text:"نامشخص",color:"#888"};
  return (
    <div className="form-page">
      <div className="result-card">
        <div style={{fontSize:64,marginBottom:16}}>{st.icon}</div>
        <h2 style={{color:st.color}}>{st.text}</h2>
        <p style={{color:"#888",margin:"8px 0 16px",fontSize:13}}>کد سفارش: {order.orderId}</p>
        <div className="result-detail"><span className="label">فرستنده:</span> {order.sender?.name}</div>
        <div className="result-detail"><span className="label">گیرنده:</span> {order.receiver?.name}</div>
        <div className="result-detail"><span className="label">مبلغ:</span> {order.gift?.amountUSDT} USDT</div>
        {order.status === "completed" && <p style={{color:"#4caf50",marginTop:16}}>کارت هدیه به گیرنده تحویل داده شد! 🎉</p>}
        <Link to="/" style={{display:"inline-block",marginTop:20,color:"#4facfe",textDecoration:"none"}}>← ساخت کارت جدید</Link>
      </div>
    </div>
  );
}
