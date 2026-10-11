import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TelegramLogin from "./TelegramLogin";
import { api, errorText } from "../lib/api";
import { currentUser, inMiniApp } from "../lib/telegram";
import type { OrderSummary } from "../lib/types";
import { useLanguage } from "../lib/i18n";

export default function MyGifts() {
  const { language, t } = useLanguage();
  const [user, setUser] = useState(currentUser());
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
     api<OrderSummary[]>("/api/orders/mine").then(setOrders).catch((e) => setError(errorText(e, language)));
  }, [user, language]);

  if (!user) {
    return (
      <div className="panel center">
        <h1 className="page-title">{t("gifts.title")}</h1>
        <p className="dim">{t("gifts.login")}</p>
        {!inMiniApp() && <TelegramLogin onDone={() => setUser(currentUser())} />}
      </div>
    );
  }
  return (
    <>
      <h1 className="page-title">{t("gifts.title")}</h1>
      {error && <p className="error">{error}</p>}
      {orders && orders.length === 0 && <p className="dim">{t("gifts.empty")} <Link to="/templates">{t("gifts.first")}</Link></p>}
      <div className="list">
        {(orders || []).map((o) => (
          <div className="row-card" key={o.orderId}>
            <div>
              <strong>{o.receiverName}</strong>
              <div className="dim small">{new Date(o.createdAt).toLocaleDateString(language === "fa" ? "fa-IR" : language === "zh" ? "zh-CN" : language)} • {o.orderId}</div>
            </div>
            <div className="end">
              <strong dir="ltr">{o.amount} {o.token}</strong>
              <div className={o.status === "delivered" ? "ok small" : "error small"}>{o.status === "delivered" ? t("gifts.delivered") : t("gifts.failed")}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
