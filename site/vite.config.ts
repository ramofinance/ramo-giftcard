import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://<owner>.github.io/ramo-giftcard/ (GitHub Pages) and later inside the Telegram Mini App.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/",
  build: { outDir: "dist" }
});
