import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles-v2.css";

// Inside Telegram: tell the app we are ready and use the full height.
const wa = (window as any).Telegram?.WebApp;
if (wa) {
  wa.ready?.();
  wa.expand?.();
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<App />);
