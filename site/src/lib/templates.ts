export type Pattern = "dots" | "rings" | "waves" | "grid" | "stripes" | "stars";
export type CardLayout = "split" | "poster";

export type Template = {
  id: number;
  name: string;
  category: string;
  categoryName: string;
  colors: [string, string, string];
  pattern: Pattern;
  emoji: string;
  design: string;
  layout: CardLayout;
  ink: string;
  accent: string;
  paper: boolean;
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

const patternOrder: Pattern[] = ["waves", "rings", "dots", "stripes", "stars", "grid"];
const byKey = new Map(CATEGORIES.map((category) => [category.key, category]));

function make(
  id: number,
  category: string,
  name: string,
  colors: [string, string, string],
  design: string,
  layout: CardLayout,
  ink: string,
  accent: string,
  paper = true
): Template {
  const info = byKey.get(category as (typeof CATEGORIES)[number]["key"]);
  if (!info) throw new Error(`Unknown gift-card category: ${category}`);
  return {
    id,
    name,
    category,
    categoryName: info.name,
    colors,
    pattern: patternOrder[(id - 1) % patternOrder.length],
    emoji: info.emoji,
    design,
    layout,
    ink,
    accent,
    paper
  };
}

export const TEMPLATES: Template[] = [
  make(1, "birthday", "کیک خامه‌ای", ["#f4d9bd", "#eeb6a5", "#d88da0"], "birthday-cake", "split", "#55384a", "#bc5267"),
  make(2, "birthday", "بادکنک‌های رنگی", ["#d6edfa", "#a8d7ec", "#f4c8ca"], "birthday-balloons", "poster", "#28465e", "#f07869"),
  make(11, "thanks", "شاخه‌ی زیتون", ["#f0eedf", "#d9e3c6", "#b6c6a3"], "thanks-olive", "split", "#3b574a", "#738a61"),
  make(12, "thanks", "دسته‌گل بهاری", ["#f5e1d8", "#eec9c5", "#d9b5cf"], "thanks-bouquet", "poster", "#604452", "#ba7185"),
  make(21, "congrats", "مدال افتخار", ["#f3e1b2", "#dbb96d", "#b77849"], "congrats-medal", "split", "#51402b", "#a77331"),
  make(22, "congrats", "جشن رنگ‌ها", ["#b9dbf2", "#8dafe0", "#cab8df"], "congrats-confetti", "poster", "#263d63", "#ed7b67"),
  make(31, "love", "پرنده‌های عاشق", ["#d8eff7", "#c5e4eb", "#f0d2c5"], "love-birds", "split", "#29445a", "#d96857"),
  make(32, "love", "نامه‌ی عاشقانه", ["#f4ded9", "#f0c4ca", "#d6b5ca"], "love-letter", "poster", "#603d4b", "#b24f67"),
  make(33, "love", "قولِ رزگلد", ["#542037", "#8a3547", "#efd6a7"], "love-rose-frame", "poster", "#56333a", "#b27c42"),
  make(34, "love", "باغِ خیال", ["#eee3d2", "#d8c5a7", "#87927a"], "love-garden-couple", "poster", "#3b342a", "#547451"),
  make(35, "love", "زیر شکوفه‌ها", ["#f2e2c8", "#e8d3b7", "#d4b8a5"], "love-blossoms", "poster", "#49382f", "#bc795e"),
  make(36, "love", "قلبِ ستاره‌ای", ["#351427", "#6d2639", "#dca78f"], "love-stardust-heart", "poster", "#fff0e7", "#f2c995", false),
  make(37, "love", "پیوند پارسی", ["#eee2ce", "#d8c6ab", "#839180"], "love-persian-wedding", "split", "#45392f", "#ac795b"),
  make(41, "eid", "ماه و فانوس", ["#173a43", "#0f5357", "#b7894e"], "eid-lanterns", "split", "#fff0cc", "#eac276", false),
  make(42, "eid", "باغ شبانه", ["#202742", "#35375b", "#956c67"], "eid-garden", "poster", "#fff0d2", "#e7bd72", false),
  make(51, "success", "کلاه و کتاب", ["#e1e8d3", "#bbd0b7", "#92b8b6"], "success-book", "split", "#344d49", "#b37843"),
  make(52, "success", "قله‌ی موفقیت", ["#f1d9b9", "#d5b88f", "#89aaa0"], "success-mountain", "poster", "#3c4c4b", "#b45d42"),
  make(61, "family", "حلقه و شکوفه", ["#f3e1d8", "#e4c5b7", "#c9a6a4"], "family-rings", "split", "#59444a", "#b27c61"),
  make(62, "family", "گهواره‌ی ستاره‌ها", ["#d8ebf4", "#d2d5eb", "#f3dfbf"], "family-mobile", "poster", "#3f4a62", "#c18c60"),
  make(71, "friend", "قرارِ قهوه", ["#e9d6bf", "#c59c7e", "#8c6d66"], "friend-coffee", "split", "#493936", "#b76e4e"),
  make(72, "friend", "هم‌مسیر", ["#d1e9e2", "#a8d1cb", "#91acd0"], "friend-walk", "poster", "#2f514e", "#d17e5f"),
  make(81, "minimal", "قوسِ روشن", ["#eee8dc", "#d9d3c7", "#b8b5ae"], "minimal-arch", "split", "#343638", "#aa7952"),
  make(82, "minimal", "خط و نقطه", ["#29313d", "#47505b", "#202630"], "minimal-lines", "poster", "#f5eee1", "#d7b36b", false),
  make(91, "crypto", "شبکه‌ی بلوکی", ["#10283b", "#15506a", "#343765"], "crypto-network", "split", "#eef7f8", "#54d5c0", false),
  make(92, "crypto", "نمودار ماه", ["#d7e9ef", "#a9c6db", "#9a9cc9"], "crypto-chart", "poster", "#243c55", "#d18f5e")
];

export const getTemplate = (id: number): Template => {
  const exact = TEMPLATES.find((template) => template.id === id);
  if (exact) return exact;

  // Old drafts used ten IDs per occasion; keep them on that occasion after the catalog is reduced.
  if (Number.isInteger(id) && id >= 1 && id <= 100) {
    const category = Math.floor((id - 1) / 10);
    const variant = (id - 1) % 10 >= 5 ? 1 : 0;
    const categoryTemplates = TEMPLATES.filter((template) => CATEGORIES[category]?.key === template.category);
    return categoryTemplates[variant] ?? categoryTemplates[0] ?? TEMPLATES[0];
  }
  return TEMPLATES[0];
};

export const gradientCss = (t: Template) => `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]} 55%, ${t.colors[2]})`;
