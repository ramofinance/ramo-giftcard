import type { CardFont, CardTextColors, CardTextField, CardTextPosition, CardTextPositions, CardTextStyle, CardTextStyles, Template } from "./templates";
import { translate, type Language } from "./i18n";
import romanticBirdsUrl from "../assets/love-birds.png";
import roseFrameUrl from "../assets/love-rose-frame.jpg";
import gardenCoupleUrl from "../assets/love-garden-couple.jpg";
import blossomsUrl from "../assets/love-blossoms.jpg";
import stardustHeartUrl from "../assets/love-stardust-heart.jpg";
import persianWeddingUrl from "../assets/love-persian-wedding.jpg";
import birthdayPhoto1Url from "../assets/birthday-photo-1.jpg";
import birthdayPhoto2Url from "../assets/birthday-photo-2.jpg";
import birthdayPhoto3Url from "../assets/birthday-photo-3.jpg";
import birthdayPhoto4Url from "../assets/birthday-photo-4.jpg";
import birthdayPhoto5Url from "../assets/birthday-photo-5.jpg";
import birthdayPhoto6Url from "../assets/birthday-photo-6.jpg";
import birthdayPhoto7Url from "../assets/birthday-photo-7.jpg";

export const CARD_W = 1000;
export const CARD_H = 625;
const FONT = "Vazirmatn, Tahoma, sans-serif";
const ARTWORK_URLS: Record<string, string> = {
  "love-birds": romanticBirdsUrl,
  "love-rose-frame": roseFrameUrl,
  "love-garden-couple": gardenCoupleUrl,
  "love-blossoms": blossomsUrl,
  "love-stardust-heart": stardustHeartUrl,
  "love-persian-wedding": persianWeddingUrl,
  "birthday-photo-1": birthdayPhoto1Url,
  "birthday-photo-2": birthdayPhoto2Url,
  "birthday-photo-3": birthdayPhoto3Url,
  "birthday-photo-4": birthdayPhoto4Url,
  "birthday-photo-5": birthdayPhoto5Url,
  "birthday-photo-6": birthdayPhoto6Url,
  "birthday-photo-7": birthdayPhoto7Url
};
const artwork = new Map<string, HTMLImageElement>();
const artworkLoading = new Map<string, Promise<void>>();
const FONT_FAMILIES: Record<CardFont, string> = {
  modern: "Vazirmatn, 'Noto Sans SC', Tahoma, sans-serif",
  classic: "'Noto Serif', 'Noto Serif SC', Georgia, serif",
  clean: "Arial, 'Noto Sans SC', Tahoma, sans-serif"
};

export type CardParams = {
  template: Template;
  senderName: string;
  receiverName: string;
  amount: string;
  token: string;
  cardText: string;
  cardFont: CardFont;
  cardTextSize: number;
  cardTextRotation: number;
  language: Language;
  cardTextPositions?: CardTextPositions;
  cardTextColors?: CardTextColors;
  cardTextStyles?: CardTextStyles;
};

export async function ensureFont(template?: Template) {
  try {
    await Promise.all([
      document.fonts.load("800 40px Vazirmatn"),
      document.fonts.load("400 30px Vazirmatn"),
      document.fonts.load("400 30px 'Noto Sans SC'"),
      document.fonts.load("400 30px 'Noto Serif SC'"),
      template ? loadArtwork(template.design) : Promise.resolve()
    ]);
  } catch {
    // fall back to the system font
  }
}

function loadArtwork(design: string): Promise<void> {
  const source = ARTWORK_URLS[design];
  if (!source) return Promise.resolve();
  if (artwork.get(design)?.complete && artwork.get(design)?.naturalWidth) return Promise.resolve();
  if (!artworkLoading.has(design)) {
    artworkLoading.set(design, new Promise((resolve) => {
      const image = new Image();
      image.onload = () => { artwork.set(design, image); resolve(); };
      image.onerror = () => resolve();
      image.src = source;
    }));
  }
  return artworkLoading.get(design)!;
}

function drawReferenceBirds(ctx: CanvasRenderingContext2D) {
  const romanticBirds = artwork.get("love-birds");
  if (!romanticBirds?.naturalWidth) return false;
  const art = document.createElement("canvas");
  art.width = 430;
  art.height = 355;
  const artCtx = art.getContext("2d");
  if (!artCtx) return false;
  artCtx.drawImage(romanticBirds, 6, 53, 430, 355, 0, 0, art.width, art.height);
  const mask = artCtx.createRadialGradient(215, 178, 72, 215, 178, 242);
  mask.addColorStop(0, "rgba(255,255,255,1)");
  mask.addColorStop(0.65, "rgba(255,255,255,.96)");
  mask.addColorStop(1, "rgba(255,255,255,0)");
  artCtx.globalCompositeOperation = "destination-in";
  artCtx.fillStyle = mask;
  artCtx.fillRect(0, 0, art.width, art.height);
  const horizontal = artCtx.createLinearGradient(0, 0, art.width, 0);
  horizontal.addColorStop(0, "rgba(255,255,255,0)"); horizontal.addColorStop(0.14, "#fff"); horizontal.addColorStop(0.86, "#fff"); horizontal.addColorStop(1, "rgba(255,255,255,0)");
  artCtx.fillStyle = horizontal;
  artCtx.fillRect(0, 0, art.width, art.height);
  const vertical = artCtx.createLinearGradient(0, 0, 0, art.height);
  vertical.addColorStop(0, "rgba(255,255,255,0)"); vertical.addColorStop(0.14, "#fff"); vertical.addColorStop(0.86, "#fff"); vertical.addColorStop(1, "rgba(255,255,255,0)");
  artCtx.fillStyle = vertical;
  artCtx.fillRect(0, 0, art.width, art.height);
  ctx.save();
  ctx.globalAlpha = 0.96;
  ctx.drawImage(art, 530, 116, 450, 372);
  ctx.restore();
  return true;
}

function drawPhotoArtwork(ctx: CanvasRenderingContext2D, design: string) {
  const image = artwork.get(design);
  if (!image?.naturalWidth) return false;
  if (design === "love-persian-wedding") {
    const size = 420;
    ctx.save();
    ctx.shadowColor = "rgba(34,22,17,.3)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = "#f5ead7";
    ctx.beginPath();
    ctx.roundRect(522, 92, size, size, 26);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.beginPath();
    ctx.roundRect(522, 92, size, size, 26);
    ctx.clip();
    const inset = 8;
    ctx.drawImage(image, 522 + inset, 92 + inset, size - inset * 2, size - inset * 2);
    ctx.restore();
    return true;
  }
  const scale = Math.max(CARD_W / image.naturalWidth, CARD_H / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  ctx.drawImage(image, (CARD_W - width) / 2, (CARD_H - height) / 2, width, height);
  return true;
}

function rgba(color: string, alpha: number) {
  const hex = color.replace("#", "");
  const value = Number.parseInt(hex.length === 3 ? hex.split("").map((part) => part + part).join("") : hex, 16);
  return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha})`;
}

function wash(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, alpha = 0.3) {
  const radius = Math.max(rx, ry);
  const gradient = ctx.createRadialGradient(x, y, 2, x, y, radius);
  gradient.addColorStop(0, rgba(color, alpha));
  gradient.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPaper(ctx: CanvasRenderingContext2D, t: Template) {
  ctx.save();
  ctx.globalAlpha = t.paper ? 0.18 : 0.08;
  ctx.fillStyle = t.paper ? "#fff" : "#d9f3ff";
  for (let i = 0; i < 120; i += 1) {
    const x = (i * 197 + 43) % CARD_W;
    const y = (i * 113 + 27) % CARD_H;
    ctx.beginPath();
    ctx.arc(x, y, i % 5 === 0 ? 1.8 : 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  wash(ctx, 760, 300, 360, 330, t.accent, t.paper ? 0.13 : 0.2);
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const angle = -Math.PI / 2 + i * Math.PI / points;
    const r = i % 2 === 0 ? radius : radius * 0.42;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, outline: string) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.42);
  ctx.bezierCurveTo(x - size * 0.8, y - size * 0.05, x - size * 0.36, y - size * 0.7, x, y - size * 0.3);
  ctx.bezierCurveTo(x + size * 0.36, y - size * 0.7, x + size * 0.8, y - size * 0.05, x, y + size * 0.42);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();
}

function drawLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number, fill: string, outline: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.25, -size * 0.55, size * 0.9, -size * 0.48, size, 0);
  ctx.bezierCurveTo(size * 0.76, size * 0.46, size * 0.22, size * 0.34, 0, 0);
  ctx.fillStyle = fill;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.quadraticCurveTo(size * 0.48, 0, size * 0.88, 0);
  ctx.strokeStyle = rgba(outline, 0.56);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawFlower(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, petal: string, center: string, outline: string) {
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 8; i += 1) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 4);
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.48, radius * 0.27, radius * 0.53, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgba(petal, 0.82);
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.23, 0, Math.PI * 2);
  ctx.fillStyle = center;
  ctx.fill();
  ctx.restore();
}

function drawBranch(ctx: CanvasRenderingContext2D, x: number, y: number, length: number, angle: number, leafColor: string, outline: string, count = 7) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(length * 0.28, -length * 0.16, length * 0.68, length * 0.1, length, -length * 0.06);
  ctx.strokeStyle = outline;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.stroke();
  for (let i = 0; i < count; i += 1) {
    const f = (i + 0.55) / count;
    const px = length * f;
    const py = -length * 0.12 * Math.sin(f * Math.PI) + length * 0.035 * f;
    const side = i % 2 ? 1 : -1;
    drawLeaf(ctx, px, py, side * (0.75 + (i % 3) * 0.08), length * (0.12 + (i % 2) * 0.015), leafColor, outline);
  }
  ctx.restore();
}

function drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, flip: number, body: string, wing: string, outline: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * flip, scale);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-61, 9);
  ctx.lineTo(-151, -20);
  ctx.quadraticCurveTo(-116, 27, -71, 31);
  ctx.ellipse(-4, 1, 81, 49, -0.11, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 5;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(48, -43, 36, 36, -0.16, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-59, -6);
  ctx.bezierCurveTo(-33, -52, 28, -48, 47, -4);
  ctx.bezierCurveTo(14, 31, -27, 33, -59, -6);
  ctx.fillStyle = wing;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(80, -50);
  ctx.lineTo(115, -39);
  ctx.lineTo(82, -28);
  ctx.closePath();
  ctx.fillStyle = "#db8b61";
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(58, -50, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = "#172432";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-2, 40); ctx.lineTo(-6, 56); ctx.moveTo(17, 41); ctx.lineTo(18, 56);
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;
  ctx.stroke();
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-42 + i * 9, -15 + i * 5);
    ctx.quadraticCurveTo(-16 + i * 7, 3 + i * 8, 14 + i * 6, 9 + i * 6);
    ctx.strokeStyle = rgba(outline, 0.47);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawBalloon(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, outline: string, sway: number) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, sway * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = rgba(color, 0.83);
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x - rx * 0.28, y - ry * 0.25, rx * 0.16, ry * 0.34, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,.35)";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y + ry);
  ctx.lineTo(x - 5, y + ry + 8);
  ctx.bezierCurveTo(x + sway, y + ry + 44, x - sway, y + ry + 71, x + sway * 0.4, y + ry + 108);
  ctx.strokeStyle = rgba(outline, 0.72);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawLantern(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, fill: string, outline: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = outline;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -116); ctx.lineTo(0, -70); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-39, -61); ctx.lineTo(0, -83); ctx.lineTo(39, -61); ctx.lineTo(31, -45); ctx.lineTo(31, 39); ctx.lineTo(0, 64); ctx.lineTo(-31, 39); ctx.lineTo(-31, -45); ctx.closePath();
  ctx.fillStyle = rgba(fill, 0.77);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-29, -43); ctx.lineTo(29, -43); ctx.moveTo(-31, 35); ctx.lineTo(31, 35);
  ctx.moveTo(-12, -38); ctx.lineTo(-12, 33); ctx.moveTo(12, -38); ctx.lineTo(12, 33);
  ctx.strokeStyle = rgba(outline, 0.64);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -2, 13, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,239,181,.7)"; ctx.fill();
  ctx.restore();
}

function drawRose(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, petal: string, outline: string) {
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 5; i += 1) {
    ctx.save();
    ctx.rotate(i * 1.25);
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.27, radius * 0.44, radius * 0.33, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = rgba(petal, 0.64 + i * 0.05);
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = petal;
  ctx.fill();
  ctx.restore();
}

function drawArtwork(ctx: CanvasRenderingContext2D, t: Template) {
  const { ink, accent } = t;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  switch (t.design) {
    case "birthday-cake": {
      ctx.save(); ctx.translate(790, 365); ctx.scale(1.35, 1.35); ctx.translate(-790, -365);
      wash(ctx, 792, 328, 270, 270, "#fff3cf", 0.65);
      ctx.beginPath(); ctx.ellipse(790, 501, 163, 31, 0, 0, Math.PI * 2); ctx.fillStyle = "#f7ead9"; ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(674, 397, 232, 103, 24); ctx.fillStyle = "#f9ecd5"; ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(674, 416); ctx.bezierCurveTo(700, 438, 720, 405, 745, 428); ctx.bezierCurveTo(770, 450, 794, 407, 820, 428); ctx.bezierCurveTo(849, 449, 876, 405, 906, 423); ctx.lineTo(906, 442); ctx.bezierCurveTo(878, 463, 855, 432, 829, 453); ctx.bezierCurveTo(796, 476, 772, 433, 744, 455); ctx.bezierCurveTo(714, 478, 693, 442, 674, 457); ctx.closePath(); ctx.fillStyle = "#f8b9b2"; ctx.fill();
      ctx.beginPath(); ctx.roundRect(712, 326, 156, 75, 19); ctx.fillStyle = "#fff5df"; ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(712, 347); ctx.bezierCurveTo(736, 364, 755, 338, 778, 356); ctx.bezierCurveTo(802, 376, 825, 338, 846, 359); ctx.bezierCurveTo(857, 369, 863, 360, 868, 356); ctx.lineTo(868, 375); ctx.bezierCurveTo(843, 393, 821, 366, 799, 384); ctx.bezierCurveTo(768, 407, 744, 370, 712, 390); ctx.closePath(); ctx.fillStyle = accent; ctx.fill();
      for (const [x, h, color] of [[746, 56, "#f2bf68"], [790, 73, "#fff0c8"], [834, 54, "#93afa0"]] as [number, number, string][]) {
        ctx.fillStyle = "#fff7dd"; ctx.fillRect(x - 4, 326 - h, 8, h);
        ctx.beginPath(); ctx.moveTo(x, 326 - h - 19); ctx.bezierCurveTo(x - 13, 326 - h - 3, x - 7, 326 - h + 7, x, 326 - h + 8); ctx.bezierCurveTo(x + 9, 326 - h - 3, x + 12, 326 - h - 12, x, 326 - h - 19); ctx.fillStyle = color; ctx.fill();
      }
      drawFlower(ctx, 908, 286, 17, "#f3a19a", "#f6d77f", ink);
      ctx.restore();
      break;
    }
    case "birthday-balloons": {
      ctx.save(); ctx.translate(200, 50); ctx.scale(0.6, 0.6);
      wash(ctx, 500, 218, 450, 230, "#fff", 0.48);
      drawBalloon(ctx, 235, 208, 55, 72, "#ee8875", ink, 18);
      drawBalloon(ctx, 472, 143, 49, 65, "#93b9d8", ink, -15);
      drawBalloon(ctx, 705, 197, 57, 77, "#e9bd69", ink, 20);
      drawBalloon(ctx, 865, 306, 40, 54, "#b586b3", ink, -18);
      for (const [x, y, c] of [[135, 123, "#e79e64"], [332, 323, "#688fb5"], [590, 91, "#d78073"], [784, 104, "#6d9887"], [938, 157, "#d68a91"], [590, 308, "#d6a956"]] as [number, number, string][]) {
        drawStar(ctx, x, y, 8, c, 4);
      }
      ctx.restore();
      break;
    }
    case "thanks-olive": {
      wash(ctx, 790, 310, 250, 300, "#a7b98c", 0.32);
      drawBranch(ctx, 637, 502, 370, -1.18, "#829b69", ink, 8);
      drawBranch(ctx, 736, 518, 325, -1.86, "#b0bd82", ink, 7);
      drawBranch(ctx, 680, 305, 205, -0.18, "#95a777", ink, 5);
      ctx.beginPath(); ctx.arc(850, 167, 63, 0, Math.PI * 2); ctx.strokeStyle = rgba(accent, 0.5); ctx.lineWidth = 2; ctx.stroke();
      break;
    }
    case "thanks-bouquet": {
      ctx.save(); ctx.translate(200, 0); ctx.scale(0.58, 0.58);
      wash(ctx, 500, 190, 390, 230, "#fff5f0", 0.75);
      ctx.beginPath(); ctx.moveTo(350, 310); ctx.lineTo(500, 575); ctx.lineTo(654, 310); ctx.closePath(); ctx.fillStyle = "#d5a9a2"; ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(384, 366); ctx.quadraticCurveTo(500, 425, 620, 366); ctx.strokeStyle = "rgba(255,255,255,.62)"; ctx.lineWidth = 10; ctx.stroke();
      for (const [x, y, c, r] of [[397, 250, "#da8f9d", 41], [489, 204, "#f1c479", 47], [584, 244, "#c597b0", 42], [440, 318, "#f2a99b", 34], [551, 321, "#e0b676", 32]] as [number, number, string, number][]) {
        ctx.beginPath(); ctx.moveTo(500, 400); ctx.quadraticCurveTo(x - 15, 343, x, y + 10); ctx.strokeStyle = "#617b61"; ctx.lineWidth = 4; ctx.stroke();
        drawFlower(ctx, x, y, r, c, "#efcf7c", ink);
      }
      drawBranch(ctx, 366, 382, 95, -0.6, "#8ba77c", ink, 2);
      drawBranch(ctx, 625, 380, 98, -2.55, "#8ba77c", ink, 2);
      ctx.restore();
      break;
    }
    case "congrats-medal": {
      ctx.save(); ctx.translate(784, 309); ctx.scale(1.24, 1.24); ctx.translate(-784, -309);
      wash(ctx, 792, 303, 270, 280, "#ffe8a1", 0.5);
      ctx.beginPath(); ctx.moveTo(705, 338); ctx.lineTo(680, 536); ctx.lineTo(782, 475); ctx.lineTo(850, 541); ctx.lineTo(847, 340); ctx.closePath(); ctx.fillStyle = "#b86c48"; ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(748, 345); ctx.lineTo(785, 530); ctx.lineTo(821, 345); ctx.closePath(); ctx.fillStyle = "#e59a5e"; ctx.fill();
      ctx.beginPath(); ctx.arc(784, 288, 126, 0, Math.PI * 2); ctx.fillStyle = "#e7bc61"; ctx.strokeStyle = ink; ctx.lineWidth = 6; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(784, 288, 104, 0, Math.PI * 2); ctx.strokeStyle = "#fff0c6"; ctx.lineWidth = 4; ctx.stroke();
      drawStar(ctx, 784, 287, 61, "#fff2c8", 6);
      for (let i = 0; i < 18; i += 1) { const a = i * Math.PI / 9; drawStar(ctx, 784 + Math.cos(a) * 92, 288 + Math.sin(a) * 92, 5, "#a87738", 4); }
      ctx.restore();
      break;
    }
    case "congrats-confetti": {
      wash(ctx, 500, 227, 455, 252, "#fff", 0.35);
      for (let i = 0; i < 18; i += 1) {
        const x = 140 + ((i * 173) % 720);
        const y = 90 + ((i * 83) % 205);
        ctx.save(); ctx.translate(x, y); ctx.rotate(i * 0.74);
        ctx.fillStyle = ["#df7d69", "#d5a955", "#769eb4", "#a37dab"][i % 4];
        ctx.fillRect(-5, -17, 10, 34); ctx.restore();
      }
      for (const [x, y, color] of [[284, 196, "#d67869"], [515, 167, "#bd944d"], [747, 205, "#7a91b6"]] as [number, number, string][]) {
        for (let i = 0; i < 12; i += 1) {
          const a = i * Math.PI / 6;
          ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 28, y + Math.sin(a) * 28); ctx.lineTo(x + Math.cos(a) * 84, y + Math.sin(a) * 84); ctx.strokeStyle = rgba(color, 0.68); ctx.lineWidth = 5; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
      }
      break;
    }
    case "love-birds": {
      wash(ctx, 730, 295, 360, 240, "#f7ffff", 0.82);
      if (!drawReferenceBirds(ctx)) {
        wash(ctx, 795, 353, 296, 156, "#81a7bd", 0.19);
        ctx.beginPath(); ctx.moveTo(526, 465); ctx.bezierCurveTo(652, 422, 806, 499, 966, 440); ctx.strokeStyle = "#638548"; ctx.lineWidth = 22; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(526, 458); ctx.bezierCurveTo(650, 420, 806, 485, 965, 434); ctx.strokeStyle = "#92b770"; ctx.lineWidth = 14; ctx.stroke();
        drawBranch(ctx, 630, 466, 150, -0.4, "#7d9f59", "#587546", 3);
        drawBranch(ctx, 816, 469, 135, -2.84, "#9aaf68", "#587546", 3);
        drawBird(ctx, 651, 365, 0.84, 1, "#8eb4d3", "#6383ad", "#253b53");
        drawBird(ctx, 834, 344, 0.92, -1, "#e99065", "#cf6f4f", "#523a37");
        drawHeart(ctx, 746, 237, 27, "#de655d", "#7c3f49");
      }
      break;
    }
    case "love-letter": {
      ctx.save(); ctx.translate(175, 0); ctx.scale(0.65, 0.65);
      wash(ctx, 500, 231, 420, 239, "#fff6f1", 0.7);
      ctx.save(); ctx.translate(500, 363); ctx.rotate(-0.06);
      ctx.beginPath(); ctx.roundRect(-196, -113, 392, 230, 13); ctx.fillStyle = "#f5d9c8"; ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-193, -106); ctx.lineTo(0, 24); ctx.lineTo(193, -106); ctx.moveTo(-193, 110); ctx.lineTo(-46, -10); ctx.moveTo(193, 110); ctx.lineTo(46, -10); ctx.strokeStyle = rgba(ink, 0.7); ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
      drawHeart(ctx, 500, 356, 75, accent, ink);
      drawRose(ctx, 745, 204, 50, "#cb6571", ink);
      drawBranch(ctx, 743, 221, 104, 1.7, "#789477", ink, 2);
      drawFlower(ctx, 327, 244, 22, "#d798a2", "#e6bd73", ink);
      ctx.restore();
      break;
    }
    case "love-rose-frame":
    case "love-garden-couple":
    case "love-blossoms":
    case "love-stardust-heart":
      if (!drawPhotoArtwork(ctx, t.design)) drawHeart(ctx, 760, 310, 112, accent, ink);
      break;
    case "birthday-photo-1":
    case "birthday-photo-2":
    case "birthday-photo-3":
    case "birthday-photo-4":
    case "birthday-photo-5":
    case "birthday-photo-6":
    case "birthday-photo-7":
      drawPhotoArtwork(ctx, t.design);
      ctx.fillStyle = "rgba(8,10,18,.08)";
      ctx.fillRect(0, 0, CARD_W, CARD_H);
      break;
    case "love-persian-wedding":
      if (!drawPhotoArtwork(ctx, t.design)) {
        wash(ctx, 745, 310, 236, 220, "#fff1dc", 0.55);
        drawFlower(ctx, 785, 310, 96, "#d68c9b", "#e6c477", ink);
      }
      break;
    case "eid-lanterns": {
      wash(ctx, 760, 223, 265, 237, "#e6ca7e", 0.22);
      ctx.beginPath(); ctx.arc(779, 212, 115, 0, Math.PI * 2); ctx.fillStyle = "#f2d892"; ctx.fill();
      ctx.beginPath(); ctx.arc(826, 168, 111, 0, Math.PI * 2); ctx.fillStyle = "#17444d"; ctx.fill();
      drawStar(ctx, 908, 140, 19, "#f7e6ae", 5);
      drawStar(ctx, 669, 149, 9, "#f7e6ae", 4); drawStar(ctx, 877, 322, 8, "#f7e6ae", 4);
      drawLantern(ctx, 709, 404, 0.72, "#e3aa5d", "#fff0c5");
      drawLantern(ctx, 869, 414, 0.96, "#c4804c", "#fff0c5");
      ctx.beginPath(); ctx.moveTo(625, 120); ctx.lineTo(625, 233); ctx.strokeStyle = "#e6cc90"; ctx.lineWidth = 2; ctx.stroke();
      drawLantern(ctx, 625, 289, 0.52, "#d8aa61", "#fff0c5");
      break;
    }
    case "eid-garden": {
      ctx.save(); ctx.translate(220, 70); ctx.scale(0.55, 0.55);
      wash(ctx, 500, 174, 408, 211, "#d7a55c", 0.19);
      ctx.beginPath(); ctx.moveTo(270, 468); ctx.lineTo(270, 291); ctx.quadraticCurveTo(500, 38, 730, 291); ctx.lineTo(730, 468); ctx.closePath(); ctx.fillStyle = "#33405b"; ctx.strokeStyle = "#e0bd7b"; ctx.lineWidth = 5; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(330, 468); ctx.lineTo(330, 307); ctx.quadraticCurveTo(500, 121, 670, 307); ctx.lineTo(670, 468); ctx.closePath(); ctx.fillStyle = "#1b3544"; ctx.fill();
      ctx.beginPath(); ctx.moveTo(411, 355); ctx.quadraticCurveTo(500, 266, 589, 355); ctx.lineTo(589, 468); ctx.lineTo(411, 468); ctx.closePath(); ctx.fillStyle = "#a37c5b"; ctx.fill();
      ctx.beginPath(); ctx.arc(500, 249, 68, Math.PI, 0); ctx.lineTo(568, 268); ctx.lineTo(432, 268); ctx.closePath(); ctx.fillStyle = "#c7a369"; ctx.strokeStyle = "#f1d69b"; ctx.lineWidth = 4; ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#1d3341"; ctx.fillRect(481, 195, 38, 58);
      for (const x of [310, 690]) { ctx.beginPath(); ctx.moveTo(x, 280); ctx.lineTo(x, 156); ctx.lineTo(x - 27, 183); ctx.lineTo(x + 27, 183); ctx.closePath(); ctx.fillStyle = "#b48e5e"; ctx.fill(); ctx.strokeStyle = "#f0d69d"; ctx.lineWidth = 3; ctx.stroke(); drawStar(ctx, x, 136, 7, "#f3d78f", 4); }
      ctx.restore();
      break;
    }
    case "success-book": {
      wash(ctx, 772, 288, 252, 260, "#fff1cf", 0.42);
      ctx.save(); ctx.translate(790, 405); ctx.rotate(-0.08);
      ctx.beginPath(); ctx.moveTo(-10, -46); ctx.quadraticCurveTo(-96, -91, -188, -55); ctx.lineTo(-188, 99); ctx.quadraticCurveTo(-91, 67, -10, 109); ctx.closePath(); ctx.fillStyle = "#f4e7c9"; ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, -46); ctx.quadraticCurveTo(96, -91, 188, -55); ctx.lineTo(188, 99); ctx.quadraticCurveTo(91, 67, 10, 109); ctx.closePath(); ctx.fillStyle = "#e5d9bd"; ctx.strokeStyle = ink; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -37); ctx.lineTo(0, 96); ctx.strokeStyle = accent; ctx.lineWidth = 7; ctx.stroke();
      for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.moveTo(-163, -20 + i * 34); ctx.quadraticCurveTo(-89, -40 + i * 34, -29, -18 + i * 34); ctx.moveTo(29, -18 + i * 34); ctx.quadraticCurveTo(89, -40 + i * 34, 163, -20 + i * 34); ctx.strokeStyle = rgba(ink, 0.22); ctx.lineWidth = 2; ctx.stroke(); }
      ctx.restore();
      ctx.save(); ctx.translate(812, 169); ctx.rotate(-0.12);
      ctx.beginPath(); ctx.moveTo(-98, 5); ctx.lineTo(0, -55); ctx.lineTo(98, 5); ctx.lineTo(0, 56); ctx.closePath(); ctx.fillStyle = "#344d4c"; ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-59, 26); ctx.lineTo(-59, 72); ctx.lineTo(59, 72); ctx.lineTo(59, 26); ctx.stroke(); ctx.beginPath(); ctx.moveTo(88, 7); ctx.lineTo(88, 65); ctx.stroke(); drawStar(ctx, 88, 79, 10, accent);
      ctx.restore();
      break;
    }
    case "success-mountain": {
      ctx.save(); ctx.translate(170, 0); ctx.scale(0.6, 0.6);
      wash(ctx, 784, 200, 230, 198, "#fff0bb", 0.64);
      ctx.beginPath(); ctx.arc(795, 214, 64, 0, Math.PI * 2); ctx.fillStyle = "#f3d183"; ctx.fill();
      ctx.beginPath(); ctx.moveTo(478, 484); ctx.lineTo(650, 266); ctx.lineTo(757, 387); ctx.lineTo(850, 280); ctx.lineTo(997, 485); ctx.closePath(); ctx.fillStyle = "#92aaa1"; ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(580, 355); ctx.lineTo(650, 266); ctx.lineTo(696, 316); ctx.lineTo(664, 306); ctx.lineTo(644, 329); ctx.closePath(); ctx.fillStyle = "#f4ead5"; ctx.fill();
      ctx.beginPath(); ctx.moveTo(780, 360); ctx.lineTo(850, 280); ctx.lineTo(905, 354); ctx.lineTo(869, 344); ctx.lineTo(843, 363); ctx.closePath(); ctx.fillStyle = "#f4ead5"; ctx.fill();
      ctx.beginPath(); ctx.moveTo(600, 475); ctx.bezierCurveTo(679, 418, 739, 493, 796, 407); ctx.bezierCurveTo(827, 360, 840, 345, 858, 322); ctx.strokeStyle = "#f0d39a"; ctx.lineWidth = 7; ctx.setLineDash([8, 12]); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(857, 317); ctx.lineTo(857, 260); ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(857, 263); ctx.lineTo(910, 280); ctx.lineTo(857, 299); ctx.closePath(); ctx.fillStyle = accent; ctx.fill();
      ctx.restore();
      break;
    }
    case "family-rings": {
      wash(ctx, 760, 310, 281, 245, "#fff1e6", 0.7);
      ctx.beginPath(); ctx.ellipse(715, 323, 122, 126, -0.32, 0, Math.PI * 2); ctx.strokeStyle = "#b99160"; ctx.lineWidth = 22; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(845, 323, 122, 126, 0.32, 0, Math.PI * 2); ctx.strokeStyle = "#e4c585"; ctx.lineWidth = 22; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(715, 315, 107, 111, -0.32, 4.2, 5.7); ctx.strokeStyle = "#f3e2bb"; ctx.lineWidth = 5; ctx.stroke();
      drawFlower(ctx, 657, 169, 28, "#dc9293", "#edcf81", ink); drawFlower(ctx, 892, 462, 22, "#d3a6b5", "#ebcf7b", ink);
      drawBranch(ctx, 865, 164, 135, 1.8, "#8aa07c", ink, 3); drawBranch(ctx, 663, 481, 112, -0.5, "#8aa07c", ink, 2);
      break;
    }
    case "family-mobile": {
      ctx.save(); ctx.translate(160, 85); ctx.scale(0.68, 0.68);
      wash(ctx, 500, 218, 405, 225, "#fff8e9", 0.83);
      ctx.beginPath(); ctx.moveTo(290, 175); ctx.quadraticCurveTo(500, 10, 710, 175); ctx.strokeStyle = "#9c8b78"; ctx.lineWidth = 7; ctx.stroke();
      for (const [x, top, length] of [[352, 126, 130], [450, 94, 176], [548, 94, 176], [647, 127, 130]] as [number, number, number][]) {
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top + length); ctx.strokeStyle = "#a99888"; ctx.lineWidth = 3; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(352, 292, 42, 0.6, Math.PI * 2 - 0.55); ctx.lineTo(366, 286); ctx.arc(352, 292, 30, Math.PI * 2 - 0.55, 0.6, true); ctx.closePath(); ctx.fillStyle = "#d7a65e"; ctx.fill();
      drawStar(ctx, 450, 278, 35, "#f0cc82"); drawStar(ctx, 647, 279, 35, "#d7a5af");
      ctx.beginPath(); ctx.arc(548, 313, 40, Math.PI, 0); ctx.lineTo(588, 354); ctx.lineTo(508, 354); ctx.closePath(); ctx.fillStyle = "#93b8c5"; ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.fill(); ctx.stroke();
      for (let i = 0; i < 3; i += 1) { ctx.beginPath(); ctx.arc(523 + i * 25, 336, 3, 0, Math.PI * 2); ctx.fillStyle = "#fff3d7"; ctx.fill(); }
      ctx.restore();
      break;
    }
    case "friend-coffee": {
      ctx.save(); ctx.translate(780, 365); ctx.scale(1.18, 1.18); ctx.translate(-780, -365);
      wash(ctx, 750, 317, 290, 260, "#fff1d8", 0.55);
      ctx.beginPath(); ctx.ellipse(774, 474, 184, 43, 0, 0, Math.PI * 2); ctx.fillStyle = "#d4b7a2"; ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.fill(); ctx.stroke();
      for (const [x, y, fill] of [[698, 347, "#f6e7d2"], [858, 326, "#b97d5c"]] as [number, number, string][]) {
        ctx.beginPath(); ctx.roundRect(x - 61, y - 66, 122, 145, 18); ctx.fillStyle = fill; ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, y - 63, 61, 20, 0, 0, Math.PI * 2); ctx.fillStyle = "#71564b"; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x + 67, y - 4, 25, 34, 0, -1.2, 1.2); ctx.strokeStyle = ink; ctx.lineWidth = 7; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 23, y + 3); ctx.bezierCurveTo(x - 8, y - 13, x + 8, y + 20, x + 25, y - 2); ctx.strokeStyle = rgba(accent, 0.85); ctx.lineWidth = 4; ctx.stroke();
      }
      for (const x of [696, 858]) for (let i = 0; i < 2; i += 1) { ctx.beginPath(); ctx.moveTo(x + i * 19, 228); ctx.bezierCurveTo(x - 12 + i * 19, 203, x + 25 + i * 19, 190, x + 9 + i * 19, 163); ctx.strokeStyle = rgba(ink, 0.32); ctx.lineWidth = 4; ctx.stroke(); }
      break;
    }
    case "friend-walk": {
      ctx.save(); ctx.translate(75, -20); ctx.scale(0.65, 0.65);
      wash(ctx, 508, 208, 390, 190, "#fff9e2", 0.65);
      ctx.beginPath(); ctx.moveTo(420, 490); ctx.quadraticCurveTo(540, 362, 660, 490); ctx.lineTo(660, 542); ctx.lineTo(420, 542); ctx.closePath(); ctx.fillStyle = "#769b8a"; ctx.fill();
      ctx.beginPath(); ctx.moveTo(655, 489); ctx.quadraticCurveTo(766, 346, 880, 489); ctx.lineTo(880, 542); ctx.lineTo(655, 542); ctx.closePath(); ctx.fillStyle = "#94ad8a"; ctx.fill();
      ctx.beginPath(); ctx.moveTo(424, 500); ctx.bezierCurveTo(520, 451, 599, 512, 679, 444); ctx.bezierCurveTo(748, 386, 793, 416, 862, 365); ctx.strokeStyle = "#f3d9aa"; ctx.lineWidth = 19; ctx.stroke();
      for (const [x, y, color] of [[615, 343, "#d88670"], [738, 326, "#627e99"]] as [number, number, string][]) {
        ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI * 2); ctx.fillStyle = "#e6b58f"; ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y + 28); ctx.lineTo(x - 14, y + 105); ctx.lineTo(x + 21, y + 108); ctx.closePath(); ctx.fillStyle = color; ctx.strokeStyle = ink; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 8, y + 104); ctx.lineTo(x - 27, y + 155); ctx.moveTo(x + 12, y + 104); ctx.lineTo(x + 36, y + 150); ctx.strokeStyle = ink; ctx.lineWidth = 8; ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(622, 398); ctx.quadraticCurveTo(670, 421, 728, 390); ctx.strokeStyle = "#e6b58f"; ctx.lineWidth = 10; ctx.stroke();
      drawStar(ctx, 870, 204, 17, "#e0b76f"); drawFlower(ctx, 483, 403, 18, "#e1a6a1", "#f3d47f", ink);
      ctx.restore();
      break;
    }
    case "minimal-arch": {
      ctx.save(); ctx.translate(790, 380); ctx.scale(1.25, 1.25); ctx.translate(-790, -380);
      ctx.fillStyle = "rgba(255,255,255,.2)";
      ctx.beginPath(); ctx.moveTo(642, 520); ctx.lineTo(642, 285); ctx.arc(782, 285, 140, Math.PI, 0); ctx.lineTo(922, 520); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(ink, 0.55); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(686, 520); ctx.lineTo(686, 300); ctx.arc(782, 300, 96, Math.PI, 0); ctx.lineTo(878, 520); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(790, 505, 77, 20, 0, 0, Math.PI * 2); ctx.fillStyle = "#a9a49a"; ctx.fill();
      ctx.beginPath(); ctx.moveTo(735, 484); ctx.quadraticCurveTo(737, 419, 758, 364); ctx.quadraticCurveTo(790, 340, 823, 364); ctx.quadraticCurveTo(845, 424, 845, 484); ctx.closePath(); ctx.fillStyle = "#c5aa8c"; ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(787, 352); ctx.lineTo(787, 239); ctx.strokeStyle = "#607b69"; ctx.lineWidth = 5; ctx.stroke();
      drawBranch(ctx, 787, 321, 78, -0.8, "#829579", ink, 2); drawFlower(ctx, 788, 235, 20, "#d08d84", "#e5c277", ink);
      ctx.restore();
      break;
    }
    case "minimal-lines": {
      ctx.save(); ctx.translate(120, 55); ctx.scale(0.5, 0.5);
      ctx.strokeStyle = "rgba(248,235,207,.55)"; ctx.lineWidth = 2;
      for (let r = 50; r <= 230; r += 36) { ctx.beginPath(); ctx.arc(760, 302, r, 0.16, Math.PI * 1.82); ctx.stroke(); }
      ctx.fillStyle = accent; ctx.fillRect(744, 283, 198, 4);
      ctx.beginPath(); ctx.arc(842, 285, 7, 0, Math.PI * 2); ctx.fillStyle = "#fff1d6"; ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.38)"; ctx.lineWidth = 1;
      for (let i = 0; i < 5; i += 1) { ctx.beginPath(); ctx.moveTo(675 + i * 42, 430); ctx.lineTo(675 + i * 42, 514); ctx.stroke(); }
      ctx.fillStyle = accent; ctx.fillRect(675, 514, 168, 4);
      ctx.restore();
      break;
    }
    case "crypto-network": {
      ctx.save(); ctx.translate(770, 330); ctx.scale(1.2, 1.2); ctx.translate(-770, -330);
      wash(ctx, 762, 319, 286, 267, "#32d6c1", 0.17);
      const nodes = [[674, 162], [833, 190], [923, 308], [762, 374], [617, 329], [866, 475], [704, 502]];
      ctx.strokeStyle = "rgba(131,239,224,.52)"; ctx.lineWidth = 3;
      [[0,1],[1,2],[2,3],[3,4],[4,0],[3,5],[5,6],[6,4],[0,3],[1,3]].forEach(([a,b]) => { ctx.beginPath(); ctx.moveTo(nodes[a][0],nodes[a][1]); ctx.lineTo(nodes[b][0],nodes[b][1]); ctx.stroke(); });
      nodes.forEach(([x,y], i) => { ctx.beginPath(); ctx.arc(x,y,i === 3 ? 18 : 10,0,Math.PI*2); ctx.fillStyle = i === 3 ? accent : "#b7f6e7"; ctx.fill(); ctx.strokeStyle = "#efffff"; ctx.lineWidth = 3; ctx.stroke(); });
      ctx.strokeStyle = "#9cebdd"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(772, 257); ctx.lineTo(839, 294); ctx.lineTo(839, 370); ctx.lineTo(772, 407); ctx.lineTo(705, 370); ctx.lineTo(705, 294); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(772, 257); ctx.lineTo(772, 333); ctx.lineTo(839, 370); ctx.moveTo(772, 333); ctx.lineTo(705, 370); ctx.moveTo(705, 294); ctx.lineTo(772, 333); ctx.lineTo(839, 294); ctx.stroke();
      ctx.restore();
      break;
    }
    case "crypto-chart": {
      ctx.save(); ctx.translate(200, 35); ctx.scale(0.55, 0.55);
      wash(ctx, 770, 250, 295, 230, "#fff", 0.55);
      ctx.strokeStyle = "rgba(36,60,85,.18)"; ctx.lineWidth = 2;
      for (let y = 240; y < 524; y += 48) { ctx.beginPath(); ctx.moveTo(556, y); ctx.lineTo(951, y); ctx.stroke(); }
      const bars = [[594, 401, 23, 101], [645, 358, 23, 144], [696, 378, 23, 124], [747, 302, 23, 200], [798, 323, 23, 179], [849, 244, 23, 258], [900, 270, 23, 232]];
      bars.forEach(([x, y, w, h], i) => { ctx.fillStyle = i > 4 ? rgba(accent, 0.86) : "#7caeaf"; ctx.fillRect(x, y, w, h); ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h); ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + w + 6, y); ctx.moveTo(x - 6, y + h); ctx.lineTo(x + w + 6, y + h); ctx.stroke(); });
      ctx.beginPath(); ctx.moveTo(580, 413); ctx.lineTo(657, 368); ctx.lineTo(708, 389); ctx.lineTo(759, 311); ctx.lineTo(810, 329); ctx.lineTo(867, 253); ctx.lineTo(941, 224); ctx.strokeStyle = "#bd704f"; ctx.lineWidth = 6; ctx.stroke();
      ctx.beginPath(); ctx.arc(773, 171, 59, 0, Math.PI * 2); ctx.fillStyle = "#e8c879"; ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.fill(); ctx.stroke();
      ctx.font = "700 43px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = ink; ctx.fillText("₿", 773, 171);
      ctx.restore();
      break;
    }
  }
  ctx.restore();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number, language: Language): string[] {
  if (language === "zh") {
    const lines: string[] = [];
    let line = "";
    for (const character of Array.from(text.trim())) {
      const next = line + character;
      if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = character; }
      else line = next;
    }
    if (line) lines.push(line);
    return lines.slice(0, maxLines);
  }
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

export function defaultCardTextPositions(template: Template): CardTextPositions {
  const split = template.layout === "split";
  const rightText = template.design === "love-garden-couple" || template.design === "love-blossoms";
  const center = split ? 290 : rightText ? 776 : CARD_W / 2;
  return {
    brand: { x: 52, y: 66 },
    category: { x: CARD_W - 54, y: 66 },
    receiver: { x: center, y: split ? 226 : rightText ? 229 : 337 },
    sender: { x: center, y: split ? 278 : rightText ? 275 : 379 },
    amount: { x: center, y: split ? 375 : rightText ? 351 : 462 },
    message: { x: center, y: split ? 438 : rightText ? 416 : 518 },
    network: { x: CARD_W / 2, y: 584 }
  };
}

export function defaultCardTextStyles(template: Template): Record<CardTextField, CardTextStyle> {
  const split = template.layout === "split";
  return {
    brand: { font: "modern", size: 21, rotation: 0 },
    category: { font: "modern", size: 19, rotation: 0 },
    receiver: { font: "modern", size: split ? 42 : 34, rotation: 0 },
    sender: { font: "modern", size: 21, rotation: 0 },
    amount: { font: "modern", size: split ? 72 : 66, rotation: 0 },
    message: { font: "modern", size: 23, rotation: 0 },
    network: { font: "modern", size: 16, rotation: 0 }
  };
}

export function getCardTextStyles(p: CardParams): Record<CardTextField, CardTextStyle> {
  const styles = { ...defaultCardTextStyles(p.template), ...p.cardTextStyles } as Record<CardTextField, CardTextStyle>;
  styles.message = {
    ...styles.message,
    font: p.cardTextStyles?.message?.font ?? p.cardFont,
    size: p.cardTextStyles?.message?.size ?? p.cardTextSize,
    rotation: p.cardTextStyles?.message?.rotation ?? p.cardTextRotation
  };
  return styles;
}

export function defaultCardTextColors(template: Template): CardTextColors {
  const main = template.ink;
  const light = template.paper ? template.ink : "#fff0d3";
  return { brand: light, category: light, receiver: main, sender: main, amount: main, message: main, network: light };
}

type TextLayer = {
  field: CardTextField;
  lines: string[];
  position: CardTextPosition;
  font: string;
  align: CanvasTextAlign;
  direction: CanvasDirection;
  maxWidth: number;
  size: number;
  lineHeight: number;
  rotation: number;
  color: string;
};

export type CardTextGeometry = { left: number; top: number; width: number; height: number; pivotX: number; pivotY: number; rotation: number };
export type CardTextHandle = "resize" | "rotate";

function cardTextLayers(ctx: CanvasRenderingContext2D, p: CardParams): TextLayer[] {
  const t = p.template;
  const rtl = p.language === "fa" || p.language === "ar";
  const split = t.layout === "split";
  const rightText = t.design === "love-garden-couple" || t.design === "love-blossoms";
  const maxWidth = split ? 465 : rightText ? 380 : 760;
  const positions = { ...defaultCardTextPositions(t), ...p.cardTextPositions };
  const colors = { ...defaultCardTextColors(t), ...p.cardTextColors };
  const styles = getCardTextStyles(p);
  const size = (field: CardTextField) => Math.max(10, Math.min(100, Number(styles[field].size) || 20));
  const rotation = (field: CardTextField) => Math.max(-180, Math.min(180, Number(styles[field].rotation) || 0));
  const font = (field: CardTextField, weight: number) => `${weight} ${size(field)}px ${FONT_FAMILIES[styles[field].font] || FONT_FAMILIES.modern}`;
  const direction: CanvasDirection = rtl ? "rtl" : "ltr";
  const layers: TextLayer[] = [
    { field: "brand", lines: ["RAMO  /  GIFT CARD"], position: positions.brand!, font: font("brand", 700), align: "left", direction: "ltr", maxWidth: 290, size: size("brand"), lineHeight: size("brand") * 1.2, rotation: rotation("brand"), color: colors.brand! },
    { field: "category", lines: [translate(p.language, `cat.${t.category}`)], position: positions.category!, font: font("category", 600), align: "right", direction, maxWidth: 240, size: size("category"), lineHeight: size("category") * 1.2, rotation: rotation("category"), color: colors.category! },
    { field: "receiver", lines: [p.receiverName ? translate(p.language, "card.for", { name: p.receiverName }) : translate(p.language, "card.toEmpty")], position: positions.receiver!, font: font("receiver", 800), align: "center", direction, maxWidth, size: size("receiver"), lineHeight: size("receiver") * 1.14, rotation: rotation("receiver"), color: colors.receiver! },
    { field: "sender", lines: [p.senderName ? translate(p.language, "card.from", { name: p.senderName }) : translate(p.language, "card.fromEmpty")], position: positions.sender!, font: font("sender", 500), align: "center", direction, maxWidth, size: size("sender"), lineHeight: size("sender") * 1.2, rotation: rotation("sender"), color: colors.sender! },
    { field: "amount", lines: [`${p.amount || "0"} ${p.token}`], position: positions.amount!, font: font("amount", 800), align: "center", direction: "ltr", maxWidth, size: size("amount"), lineHeight: size("amount") * 1.18, rotation: rotation("amount"), color: colors.amount! }
  ];
  ctx.font = font("message", 400);
  ctx.direction = direction;
  const messageLines = wrapLines(ctx, p.cardText || translate(p.language, "card.default"), maxWidth - 30, 2, p.language);
  layers.push(
    { field: "message", lines: messageLines, position: positions.message!, font: font("message", 400), align: "center", direction, maxWidth: maxWidth - 30, size: size("message"), lineHeight: size("message") * 1.42, rotation: rotation("message"), color: colors.message! },
    { field: "network", lines: ["BNB SMART CHAIN"], position: positions.network!, font: font("network", 500), align: "center", direction: "ltr", maxWidth: 270, size: size("network"), lineHeight: size("network") * 1.25, rotation: rotation("network"), color: colors.network! }
  );
  return layers;
}

function textGeometry(ctx: CanvasRenderingContext2D, layer: TextLayer): CardTextGeometry {
  ctx.font = layer.font;
  const textWidth = Math.min(layer.maxWidth, Math.max(1, ...layer.lines.map((line) => ctx.measureText(line).width)));
  const width = textWidth + 24;
  const height = (layer.lines.length - 1) * layer.lineHeight + layer.size * 1.3 + 12;
  const left = layer.align === "left" ? -12 : layer.align === "right" ? -textWidth - 12 : -width / 2;
  const top = -((layer.lines.length - 1) * layer.lineHeight) / 2 - layer.size - 6;
  return { left, top, width, height, pivotX: layer.position.x, pivotY: layer.position.y, rotation: layer.rotation };
}

export function getCardTextGeometry(p: CardParams, field: CardTextField): CardTextGeometry | undefined {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return undefined;
  const layer = cardTextLayers(ctx, p).find((item) => item.field === field);
  return layer ? textGeometry(ctx, layer) : undefined;
}

function pointInLayer(x: number, y: number, geometry: CardTextGeometry, padding = 0) {
  const angle = (-geometry.rotation * Math.PI) / 180;
  const dx = x - geometry.pivotX;
  const dy = y - geometry.pivotY;
  const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
  const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
  return localX >= geometry.left - padding && localX <= geometry.left + geometry.width + padding && localY >= geometry.top - padding && localY <= geometry.top + geometry.height + padding;
}

export function hitTestCardText(p: CardParams, x: number, y: number): CardTextField | undefined {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return undefined;
  const layers = cardTextLayers(ctx, p);
  for (const layer of layers.reverse()) {
    if (pointInLayer(x, y, textGeometry(ctx, layer), 8)) return layer.field;
  }
  return undefined;
}

export function hitTestCardTextHandle(p: CardParams, field: CardTextField, x: number, y: number): CardTextHandle | undefined {
  const geometry = getCardTextGeometry(p, field);
  if (!geometry) return undefined;
  const angle = (-geometry.rotation * Math.PI) / 180;
  const dx = x - geometry.pivotX;
  const dy = y - geometry.pivotY;
  const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
  const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
  const corners = [[geometry.left, geometry.top], [geometry.left + geometry.width, geometry.top], [geometry.left, geometry.top + geometry.height], [geometry.left + geometry.width, geometry.top + geometry.height]];
  if (corners.some(([cx, cy]) => Math.hypot(localX - cx, localY - cy) <= 44)) return "resize";
  if (Math.hypot(localX - geometry.left - geometry.width / 2, localY - geometry.top + 30) <= 44) return "rotate";
  return undefined;
}

function drawTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayer, selected: boolean) {
  const geometry = textGeometry(ctx, layer);
  ctx.save();
  ctx.translate(layer.position.x, layer.position.y);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  if (selected) {
    ctx.beginPath();
    ctx.roundRect(geometry.left, geometry.top, geometry.width, geometry.height, 8);
    ctx.fillStyle = "rgba(8,17,31,.24)";
    ctx.fill();
    ctx.setLineDash([8, 5]);
    ctx.strokeStyle = "rgba(125,211,252,.98)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    const handles = [[geometry.left, geometry.top], [geometry.left + geometry.width, geometry.top], [geometry.left, geometry.top + geometry.height], [geometry.left + geometry.width, geometry.top + geometry.height]];
    for (const [x, y] of handles) {
      ctx.beginPath();
      ctx.roundRect(x - 14, y - 14, 28, 28, 6);
      ctx.fillStyle = "#07111f";
      ctx.fill();
      ctx.strokeStyle = "#7dd3fc";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    const rotateX = geometry.left + geometry.width / 2;
    const rotateY = geometry.top - 30;
    ctx.beginPath();
    ctx.moveTo(rotateX, geometry.top);
    ctx.lineTo(rotateX, rotateY);
    ctx.strokeStyle = "#7dd3fc";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rotateX, rotateY, 15, 0, Math.PI * 2);
    ctx.fillStyle = "#07111f";
    ctx.fill();
    ctx.strokeStyle = "#7dd3fc";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.font = layer.font;
  ctx.textAlign = layer.align;
  ctx.textBaseline = "alphabetic";
  ctx.direction = layer.direction;
  ctx.fillStyle = layer.color;
  layer.lines.forEach((line, index) => ctx.fillText(line, 0, (index - (layer.lines.length - 1) / 2) * layer.lineHeight, layer.maxWidth));
  ctx.restore();
}

export function drawCard(canvas: HTMLCanvasElement, p: CardParams, selectedText?: CardTextField) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const t = p.template;
  const background = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  background.addColorStop(0, t.colors[0]);
  background.addColorStop(0.52, t.colors[1]);
  background.addColorStop(1, t.colors[2]);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  drawPaper(ctx, t);
  drawArtwork(ctx, t);

  ctx.beginPath();
  ctx.roundRect(20, 20, CARD_W - 40, CARD_H - 40, 28);
  ctx.strokeStyle = rgba(t.paper ? t.ink : t.accent, 0.28);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(50, 89);
  ctx.lineTo(CARD_W - 50, 89);
  ctx.strokeStyle = rgba(t.paper ? t.ink : t.accent, 0.17);
  ctx.lineWidth = 1;
  ctx.stroke();

  const photoHeader = ["love-rose-frame", "love-garden-couple", "love-blossoms", "love-stardust-heart", "birthday-photo-1", "birthday-photo-2", "birthday-photo-3", "birthday-photo-4", "birthday-photo-5", "birthday-photo-6", "birthday-photo-7"].includes(t.design);
  if (photoHeader) {
    ctx.fillStyle = t.paper ? "rgba(255,255,255,.82)" : "rgba(7,15,28,.62)";
    ctx.beginPath();
    ctx.roundRect(39, 37, 270, 40, 12);
    ctx.roundRect(CARD_W - 279, 37, 240, 40, 12);
    ctx.fill();
  }

  for (const layer of cardTextLayers(ctx, p)) drawTextLayer(ctx, layer, layer.field === selectedText);
}

export async function cardPngBase64(p: CardParams): Promise<string> {
  await ensureFont(p.template);
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  drawCard(canvas, p);
  return canvas.toDataURL("image/png").split(",")[1];
}
