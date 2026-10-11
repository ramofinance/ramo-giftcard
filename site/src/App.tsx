import { HashRouter, Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import CreatePage from "./components/CreatePage";
import HomePage from "./components/HomePage";
import MyGifts from "./components/MyGifts";
import TemplatesPage from "./components/TemplatesPage";
import { loadPending } from "./lib/flow";
import { currentUser } from "./lib/telegram";
import { LANGUAGES, LanguageProvider, useLanguage } from "./lib/i18n";

function Layout() {
  useLocation(); // re-render on navigation so the banner below stays current
  const pending = loadPending();
  const user = currentUser();
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className="shell">
      <header className="top">
        <Link to="/" className="brand">
          <span className="brand-symbol" aria-hidden="true">R</span>
          <span className="brand-name">RAMO <i>GIFT</i></span>
        </Link>
        <nav>
          <NavLink to="/templates">{t("nav.templates")}</NavLink>
          <NavLink to="/mine">{t("nav.gifts")}</NavLink>
        </nav>
        <select className="language-select" aria-label={t("language.label")} value={language} onChange={(e) => setLanguage(e.target.value as typeof language)}>
          {LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
        </select>
        {user && <span className="who">{user.first_name}</span>}
      </header>
      {pending && (
        <Link to={`/create/${pending.templateId}`} className="banner">{t("banner.pending")}</Link>
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
      <footer className="foot">{t("footer")}</footer>
    </div>
  );
}

// HashRouter works on GitHub Pages and inside the Telegram Mini App without server rewrites.
export default function App() {
  return (
    <LanguageProvider>
      <HashRouter>
        <Layout />
      </HashRouter>
    </LanguageProvider>
  );
}
