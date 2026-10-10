export type Pattern = "dots" | "rings" | "waves" | "grid" | "stripes" | "stars";

export type Template = {
  id: number;
  name: string;
  category: string;
  categoryName: string;
  colors: [string, string, string];
  pattern: Pattern;
  emoji: string;
};

export const CATEGORIES = [
  { key: "birthday", name: "تولد", emoji: "🎂" },
  { key: "thanks", name: "تشکر", emoji: "🙏" },
  { key: "congrats", name: "تبریک", emoji: "🎉" },
  { key: "love", name: "عاشقانه", emoji: "💝" },
  { key: "eid", name: "عید و مناسبت", emoji: "🌙" },
  { key: "success", name: "موفقیت و تحصیل", emoji: "🎓" },
  { key: "family", name: "ازدواج و نوزاد", emoji: "💍" },
  { key: "friend", name: "دوستانه", emoji: "🤝" },
  { key: "minimal", name: "مینیمال", emoji: "✨" },
  { key: "crypto", name: "کریپتو", emoji: "🚀" }
] as const;

const PALETTES: { name: string; colors: [string, string, string] }[] = [
  { name: "غروب", colors: ["#ffb347", "#ff5e62", "#8e2de2"] },
  { name: "اقیانوس", colors: ["#00c6ff", "#0072ff", "#1e1b4b"] },
  { name: "جنگل", colors: ["#a8e063", "#22a559", "#0b3d2e"] },
  { name: "یاقوت", colors: ["#ff6a88", "#e11d48", "#4c0519"] },
  { name: "بنفشه", colors: ["#c084fc", "#7c3aed", "#1e1b4b"] },
  { name: "شب", colors: ["#475569", "#1e293b", "#020617"] },
  { name: "طلا", colors: ["#fde68a", "#f59e0b", "#78350f"] },
  { name: "نعنا", colors: ["#99f6e4", "#14b8a6", "#134e4a"] },
  { name: "مرجان", colors: ["#fda4af", "#fb7185", "#9f1239"] },
  { name: "الماس", colors: ["#e0f2fe", "#38bdf8", "#312e81"] }
];

const PATTERNS: Pattern[] = ["dots", "rings", "waves", "grid", "stripes", "stars"];

// 10 categories x 10 palettes = 100 themes, generated so every id always means the same design.
export const TEMPLATES: Template[] = CATEGORIES.flatMap((c, ci) =>
  PALETTES.map((p, pi) => ({
    id: ci * 10 + pi + 1,
    name: `${c.name} ${p.name}`,
    category: c.key,
    categoryName: c.name,
    colors: p.colors,
    pattern: PATTERNS[(ci + pi) % PATTERNS.length],
    emoji: c.emoji
  }))
);

export const getTemplate = (id: number): Template => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
export const gradientCss = (t: Template) => `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]} 55%, ${t.colors[2]})`;
