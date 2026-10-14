export type TgUser = { id: number; first_name: string; username?: string };

const KEY = "ramo_gift_login";
export const BOT = "ramofinance_alerts_bot";

// Inside the RAMO Finance Mini App this site runs in an iframe. The iframe cannot see the Telegram session by itself,
// so the Mini App sends it by message. We only accept that message from the Mini App's own origin.
const PARENT_ORIGIN = (import.meta.env.VITE_PARENT_ORIGIN as string | undefined) || "https://ramofinance.github.io";
export const embedded = (() => {
  try { return window.parent !== window; } catch { return true; }
})();

let bridgeInitData = "";
let bridgeLanguage = "";
let resolveBridge: () => void = () => {};
export const bridgeReady = new Promise<void>((resolve) => { resolveBridge = resolve; });

if (embedded) {
  window.addEventListener("message", (event) => {
    if (event.origin !== PARENT_ORIGIN || event.source !== window.parent) return;
    const data = event.data;
    if (!data || data.type !== "ramo-gift:init" || typeof data.initData !== "string") return;
    bridgeInitData = data.initData;
    bridgeLanguage = typeof data.language === "string" ? data.language : "";
    resolveBridge();
  });
  let tries = 0;
  const ping = () => {
    if (bridgeInitData || tries >= 8) return;
    tries += 1;
    window.parent.postMessage({ type: "ramo-gift:ready" }, PARENT_ORIGIN);
    setTimeout(ping, 500);
  };
  ping();
  setTimeout(resolveBridge, 4000); // not opened by our Mini App: carry on with the normal Telegram login
} else {
  resolveBridge();
}

export const parentLanguage = () => bridgeLanguage;

// Asks the Mini App to open this site in the phone's browser (where wallet apps can open).
export function openInBrowser() {
  const url = window.location.origin + "/";
  if (embedded) window.parent.postMessage({ type: "ramo-gift:open-link", url }, PARENT_ORIGIN);
  else window.open(url, "_blank", "noopener");
}

export const webApp = () => (window as any).Telegram?.WebApp;
export const inMiniApp = () => Boolean(webApp()?.initData || bridgeInitData);

type Stored = { user: TgUser; raw: string };

export function getLogin(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() / 1000 - Number(data.auth_date) > 86000) return null; // the server accepts a login for 24h
    return { user: { id: Number(data.id), first_name: String(data.first_name || ""), username: data.username }, raw };
  } catch {
    return null;
  }
}

// Called by the Telegram Login Widget after the user confirms.
export const saveLogin = (data: unknown) => localStorage.setItem(KEY, JSON.stringify(data));
export const logout = () => localStorage.removeItem(KEY);

function bridgeUser(): any {
  if (!bridgeInitData) return null;
  try { return JSON.parse(new URLSearchParams(bridgeInitData).get("user") || "null"); } catch { return null; }
}

export function currentUser(): TgUser | null {
  const wa = webApp();
  const u = wa?.initData ? wa.initDataUnsafe?.user : bridgeUser();
  if (u?.id) return { id: Number(u.id), first_name: u.first_name || "", username: u.username };
  return getLogin()?.user ?? null;
}

export function authHeaders(): Record<string, string> {
  const initData = webApp()?.initData || bridgeInitData;
  if (initData) return { "X-Tg-Init-Data": initData };
  const l = getLogin();
  return l ? { "X-Tg-Login": encodeURIComponent(l.raw) } : {};
}
