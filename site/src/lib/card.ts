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

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const radius = i % 2 === 0 ? r : r * 0.42;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.35);
  ctx.bezierCurveTo(x - size * 0.72, y - size * 0.05, x - size * 0.38, y - size * 0.62, x, y - size * 0.28);
  ctx.bezierCurveTo(x + size * 0.38, y - size * 0.62, x + size * 0.72, y - size * 0.05, x, y + size * 0.35);
  ctx.closePath();
}

function drawBalloon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tone: string) {
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.72, r, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = tone;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  ctx.quadraticCurveTo(x + 10, y + r * 1.55, x - 3, y + r * 2.15);
  ctx.stroke();
}

function drawBranch(ctx: CanvasRenderingContext2D, x: number, y: number, direction: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);
  ctx.strokeStyle = "rgba(224,255,245,.46)";
  ctx.fillStyle = "rgba(220,255,240,.17)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 90);
  ctx.quadraticCurveTo(32, 38, 8, -25);
  ctx.stroke();
  for (let i = 0; i < 5; i += 1) {
    const yy = 68 - i * 22;
    ctx.save();
    ctx.translate(14 + (i % 2) * 11, yy);
    ctx.rotate(i % 2 ? -0.72 : 0.72);
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawCategoryArt(ctx: CanvasRenderingContext2D, t: Template) {
  const [a, b] = t.colors;
  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(239,248,255,.42)";
  ctx.fillStyle = "rgba(239,248,255,.13)";

  if (t.category === "birthday") {
    drawBalloon(ctx, 105, 165, 44, a);
    drawBalloon(ctx, 884, 190, 56, b);
    drawBalloon(ctx, 930, 355, 34, a);
    ctx.fillStyle = "rgba(255,255,255,.18)";
    ctx.fillRect(780, 490, 150, 26);
    ctx.fillRect(802, 458, 106, 34);
    ctx.fillRect(824, 430, 62, 30);
    ctx.strokeRect(780, 490, 150, 26);
    ctx.beginPath(); ctx.moveTo(854, 430); ctx.lineTo(854, 406); ctx.stroke();
    ctx.fillStyle = a; drawStar(ctx, 854, 399, 12);
  } else if (t.category === "thanks") {
    drawBranch(ctx, 90, 460, 1);
    drawBranch(ctx, 910, 150, -1);
    ctx.strokeStyle = "rgba(255,255,255,.3)";
    ctx.beginPath(); ctx.arc(500, 312, 226, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  } else if (t.category === "congrats") {
    ctx.save(); ctx.translate(850, 150); ctx.rotate(-0.48);
    ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(-28, -120, 56, 260);
    ctx.fillStyle = a; ctx.fillRect(-11, -120, 22, 260); ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,.52)";
    [[115,130,18],[905,430,24],[160,490,13],[780,100,12],[940,275,15]].forEach(([x,y,r]) => drawStar(ctx,x,y,r));
    ctx.strokeStyle = "rgba(255,255,255,.34)";
    for (let i = 0; i < 4; i += 1) { ctx.beginPath(); ctx.arc(500, 310, 205 + i * 20, .15, .55); ctx.stroke(); }
  } else if (t.category === "love") {
    ctx.lineWidth = 6; ctx.strokeStyle = "rgba(255,235,248,.38)";
    [[860,150,94],[145,465,54],[910,480,38]].forEach(([x,y,r]) => { drawHeart(ctx,x,y,r); ctx.stroke(); });
    ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.beginPath(); ctx.arc(500, 310, 235, 0, Math.PI * 2); ctx.stroke();
  } else if (t.category === "eid") {
    ctx.fillStyle = "rgba(255,241,190,.78)";
    ctx.beginPath(); ctx.arc(850, 145, 68, 0, Math.PI * 2); ctx.arc(880, 116, 68, 0, Math.PI * 2); ctx.fill("evenodd");
    ctx.fillStyle = "rgba(255,255,255,.76)";
    [[750,92,15],[937,180,13],[780,250,9],[930,330,10],[720,390,8]].forEach(([x,y,r]) => drawStar(ctx,x,y,r));
    for (const x of [115, 905]) {
      ctx.strokeStyle = "rgba(255,226,156,.36)"; ctx.beginPath(); ctx.moveTo(x, 310); ctx.lineTo(x, 420); ctx.stroke();
      ctx.strokeRect(x - 26, 346, 52, 70); ctx.beginPath(); ctx.moveTo(x - 26, 350); ctx.lineTo(x, 321); ctx.lineTo(x + 26, 350); ctx.stroke();
      ctx.fillStyle = "rgba(255,235,180,.38)"; ctx.fillRect(x - 9, 367, 18, 49);
    }
  } else if (t.category === "success") {
    drawBranch(ctx, 118, 430, 1); drawBranch(ctx, 882, 430, -1);
    ctx.save(); ctx.translate(855, 155); ctx.rotate(-.06);
    ctx.fillStyle = "rgba(245,250,255,.28)"; ctx.strokeStyle = "rgba(255,255,255,.58)";
    ctx.beginPath(); ctx.moveTo(-74, -8); ctx.lineTo(0, -50); ctx.lineTo(74, -8); ctx.lineTo(0, 31); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-42, 14); ctx.lineTo(-42, 52); ctx.lineTo(42, 52); ctx.lineTo(42, 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(65, -2); ctx.lineTo(65, 43); ctx.stroke(); ctx.fillStyle = a; drawStar(ctx,65,52,10);
    ctx.restore();
  } else if (t.category === "family") {
    ctx.lineWidth = 14; ctx.strokeStyle = "rgba(255,250,235,.64)";
    ctx.beginPath(); ctx.arc(832, 173, 65, .18, Math.PI * 2 + .18); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.arc(893, 173, 65, Math.PI + .18, Math.PI * 3 + .18); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.68)"; drawStar(ctx, 845, 150, 12);
    ctx.strokeStyle = "rgba(255,255,255,.24)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(500, 313, 235, .15, 2.95); ctx.stroke();
  } else if (t.category === "friend") {
    const bubble = (x: number, y: number, w: number, h: number) => {
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 24); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 28, y + h - 2); ctx.lineTo(x + 15, y + h + 25); ctx.lineTo(x + 60, y + h - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.5)"; for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.arc(x + 36 + i * 25, y + h / 2, 5, 0, Math.PI * 2); ctx.fill(); }
    };
    bubble(85, 145, 135, 82); ctx.fillStyle = a; bubble(785, 390, 145, 88);
    ctx.fillStyle = "rgba(255,255,255,.45)"; drawStar(ctx, 885, 125, 16); drawStar(ctx, 142, 420, 12);
  } else if (t.category === "minimal") {
    ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.beginPath(); ctx.arc(875, 145, 112, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(875, 145, 80, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeRect(66, 65, 185, 490); ctx.fillStyle = a; ctx.fillRect(66, 65, 4, 490);
    ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); ctx.arc(875, 145, 10, 0, Math.PI * 2); ctx.fill();
  } else if (t.category === "crypto") {
    ctx.strokeStyle = "rgba(215,240,255,.32)"; ctx.lineWidth = 2;
    for (let y = 360; y <= 550; y += 38) { ctx.beginPath(); ctx.moveTo(690, y); ctx.lineTo(954, y); ctx.stroke(); }
    const bars = [55, 95, 72, 138, 119, 176];
    bars.forEach((h, i) => { ctx.fillStyle = i % 2 ? "rgba(255,255,255,.2)" : a; ctx.fillRect(708 + i * 39, 540 - h, 18, h); });
    ctx.strokeStyle = b; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(710, 432); ctx.lineTo(756, 410); ctx.lineTo(796, 423); ctx.lineTo(840, 377); ctx.lineTo(887, 394); ctx.lineTo(931, 350); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.54)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(870, 178, 55, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.beginPath(); ctx.arc(870, 178, 40, 0, Math.PI * 2); ctx.fill();
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
  drawCategoryArt(ctx, t);
  ctx.strokeStyle = "rgba(226,242,255,.26)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(22, 22, CARD_W - 44, CARD_H - 44, 30);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const put = (s: string, x: number, y: number, size: number, weight: number, alpha: number, dir: "rtl" | "ltr") => {
    ctx.direction = dir;
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillText(s, x, y);
  };

  ctx.textAlign = "left";
  put("RAMO Gift Card", 50, 70, 26, 600, 0.75, "ltr");
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
