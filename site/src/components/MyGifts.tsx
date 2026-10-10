import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TelegramLogin from "./TelegramLogin";
import { api, errorText } from "../lib/api";
import { currentUser, inMiniApp } from "../lib/telegram";
import type { OrderSummary } from "../lib/types";

export default function MyGifts() {
  const [user, setUser] = useState(currentUser());
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api<OrderSummary[]>("/api/orders/mine").then(setOrders).catch((e) => setError(errorText(e)));
  }, [user]);

  if (!user) {
    return (
      <div className="panel center">
        <h1 className="page-title">هدیه‌های من</h1>
        <p className="dim">برای دیدن هدیه‌هایتان با تلگرام وارد شوید.</p>
        {!inMiniApp() && <TelegramLogin onDone={() => setUser(currentUser())} />}
      </div>
    );
  }
  return (
    <>
      <h1 className="page-title">هدیه‌های من</h1>
      {error && <p className="error">{error}</p>}
      {orders && orders.length === 0 && <p className="dim">هنوز هدیه‌ای نفرستاده‌اید. <Link to="/templates">اولین هدیه را بسازید</Link></p>}
      <div className="list">
        {(orders || []).map((o) => (
          <div className="row-card" key={o.orderId}>
            <div>
              <strong>{o.receiverName}</strong>
              <div className="dim small">{new Date(o.createdAt).toLocaleDateString("fa-IR")} • {o.orderId}</div>
            </div>
            <div className="end">
              <strong dir="ltr">{o.amount} {o.token}</strong>
              <div className={o.status === "delivered" ? "ok small" : "error small"}>{o.status === "delivered" ? "تحویل شد" : "ارسال به گیرنده ناموفق"}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
