import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import HomePage from "./components/HomePage";
import TemplatesPage from "./components/TemplatesPage";
import CreatePage from "./components/CreatePage";
import OrderStatus from "./components/OrderStatus";
import "./styles.css";

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/create/:templateId" element={<CreatePage />} />
          <Route path="/order/:orderId" element={<OrderStatus />} />
        </Routes>
      </main>
      <SiteFooter />
    </BrowserRouter>
  );
}

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">🎁 RAMO Gift</Link>
        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>خانه</Link>
          <Link to="/templates" className={location.pathname === "/templates" ? "active" : ""}>قالب‌ها</Link>
          <a href="https://t.me/ramofinance_alerts_bot" target="_blank">ربات تلگرام</a>
        </div>
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "✕" : "☰"}</button>
      </div>
    </nav>
  );
}

function SiteFooter() {
  return (
    <footer className="footer">
      <p>ساخته شده با ❤️ توسط ramofinance | کارت هدیه رمزارز برای همه</p>
    </footer>
  );
}
