import { HashRouter, Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import CreatePage from "./components/CreatePage";
import HomePage from "./components/HomePage";
import MyGifts from "./components/MyGifts";
import TemplatesPage from "./components/TemplatesPage";
import { loadPending } from "./lib/flow";
import { currentUser } from "./lib/telegram";

function Layout() {
  useLocation(); // re-render on navigation so the banner below stays current
  const pending = loadPending();
  const user = currentUser();
  return (
    <div className="shell">
      <header className="top">
        <Link to="/" className="brand">🎁 RAMO Gift</Link>
        <nav>
          <NavLink to="/templates">قالب‌ها</NavLink>
          <NavLink to="/mine">هدیه‌های من</NavLink>
        </nav>
        {user && <span className="who">{user.first_name}</span>}
      </header>
      {pending && (
        <Link to={`/create/${pending.templateId}`} className="banner">یک هدیه‌ی نیمه‌کاره دارید؛ برای ادامه یا بازیابی اینجا بزنید</Link>
      )}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/create/:id" element={<CreatePage />} />
          <Route path="/mine" element={<MyGifts />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <footer className="foot">RAMO Finance • شبکه‌ی BNB Smart Chain • ۱۲ کلمه‌ی کیف هدیه روی سرور ما ذخیره نمی‌شود</footer>
    </div>
  );
}

// HashRouter works on GitHub Pages and inside the Telegram Mini App without server rewrites.
export default function App() {
  return (
    <HashRouter>
      <Layout />
    </HashRouter>
  );
}
