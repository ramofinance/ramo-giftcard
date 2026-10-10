import type { Template } from "./templates";

export const CARD_W = 1000;
export const CARD_H = 625;
const FONT = "Vazirmatn, Tahoma, sans-serif";

export type CardParams = {
  template: Template;
  senderName: string;
  receiverName: string;
  amount: string;
  token: string;
  cardText: string;
};

export async function ensureFont() {
  try {
    await Promise.all([document.fonts.load("800 40px Vazirmatn"), document.fonts.load("400 30px Vazirmatn")]);
  } catch {
    // fall back to the system font
  }
}

function drawPattern(ctx: CanvasRenderingContext2D, kind: Template["pattern"]) {
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#fff";
  ctx.lineWidth = 3;
  if (kind === "dots") {
    for (let y = 30; y < CARD_H; y += 50) for (let x = 30 + ((y / 50) % 2) * 25; x < CARD_W; x += 50) { ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); }
  } else if (kind === "rings") {
    for (let r = 70; r < 1100; r += 75) { ctx.beginPath(); ctx.arc(CARD_W * 0.88, CARD_H * 0.1, r, 0, 7); ctx.stroke(); }
  } else if (kind === "waves") {
    for (let k = 0; k < 9; k += 1) { ctx.beginPath(); for (let x = 0; x <= CARD_W; x += 10) ctx.lineTo(x, 80 + k * 70 + Math.sin(x / 70 + k) * 22); ctx.stroke(); }
  } else if (kind === "grid") {
    for (let x = 0; x < CARD_W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CARD_H); ctx.stroke(); }
    for (let y = 0; y < CARD_H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CARD_W, y); ctx.stroke(); }
  } else if (kind === "stripes") {
    for (let x = -CARD_H; x < CARD_W; x += 50) { ctx.beginPath(); ctx.moveTo(x, CARD_H); ctx.lineTo(x + CARD_H, 0); ctx.stroke(); }
  } else {
    for (let y = 40; y < CARD_H; y += 90) for (let x = 40 + ((y / 90) % 2) * 45; x < CARD_W; x += 90) { ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.moveTo(x, y - 9); ctx.lineTo(x, y + 9); ctx.stroke(); }
  }
  ctx.restore();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

export function drawCard(canvas: HTMLCanvasElement, p: CardParams) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const t = p.template;
  const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  g.addColorStop(0, t.colors[0]);
  g.addColorStop(0.55, t.colors[1]);
  g.addColorStop(1, t.colors[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  drawPattern(ctx, t.pattern);
  ctx.fillStyle = "rgba(0,0,0,0.22)"; // keeps white text readable on light themes
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const put = (s: string, x: number, y: number, size: number, weight: number, alpha: number, dir: "rtl" | "ltr") => {
    ctx.direction = dir;
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillText(s, x, y);
  };

  put("RAMO Gift Card", 80, 70, 26, 600, 0.75, "ltr");
  ctx.textAlign = "right";
  put(t.emoji, CARD_W - 50, 90, 64, 400, 1, "ltr");
  ctx.textAlign = "center";

  ctx.font = `800 54px ${FONT}`;
  ctx.direction = "rtl";
  const to = `برای ${p.receiverName || "..."}`;
  put(to.length > 26 ? to.slice(0, 26) + "…" : to, CARD_W / 2, 215, 54, 800, 1, "rtl");
  put(`از طرف ${p.senderName || "..."}`, CARD_W / 2, 275, 30, 400, 0.85, "rtl");
  put(`${p.amount || "0"} ${p.token}`, CARD_W / 2, 395, 92, 800, 1, "ltr");

  ctx.font = `400 34px ${FONT}`;
  ctx.direction = "rtl";
  wrapLines(ctx, p.cardText, CARD_W - 200, 3).forEach((line, i) => put(line, CARD_W / 2, 470 + i * 48, 34, 400, 0.95, "rtl"));
  put("BNB Smart Chain", CARD_W / 2, 596, 22, 400, 0.6, "ltr");
}

export async function cardPngBase64(p: CardParams): Promise<string> {
  await ensureFont();
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  drawCard(canvas, p);
  return canvas.toDataURL("image/png").split(",")[1];
}
