import { useEffect, useRef } from "react";
import { BOT, saveLogin } from "../lib/telegram";

// The official "Log in with Telegram" button. It proves who the sender is; we never ask for a password.
export default function TelegramLogin({ onDone }: { onDone: () => void }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (window as any).ramoGiftOnAuth = (user: unknown) => {
      saveLogin(user);
      onDone();
    };
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.setAttribute("data-telegram-login", BOT);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-radius", "12");
    s.setAttribute("data-request-access", "write");
    s.setAttribute("data-userpic", "false");
    s.setAttribute("data-onauth", "ramoGiftOnAuth(user)");
    box.current?.appendChild(s);
    return () => { box.current?.replaceChildren(); };
  }, []);

  return <div ref={box} className="tg-login" />;
}
