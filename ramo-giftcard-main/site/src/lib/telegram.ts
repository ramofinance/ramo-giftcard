export type TgUser = { id: number; first_name: string; username?: string };

const KEY = "ramo_gift_login";
export const BOT = "ramofinance_alerts_bot";

export const webApp = () => (window as any).Telegram?.WebApp;
export const inMiniApp = () => Boolean(webApp()?.initData);

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

export function currentUser(): TgUser | null {
  const u = webApp()?.initDataUnsafe?.user;
  if (inMiniApp() && u) return { id: u.id, first_name: u.first_name || "", username: u.username };
  return getLogin()?.user ?? null;
}

export function authHeaders(): Record<string, string> {
  const wa = webApp();
  if (wa?.initData) return { "X-Tg-Init-Data": wa.initData };
  const l = getLogin();
  return l ? { "X-Tg-Login": encodeURIComponent(l.raw) } : {};
}
