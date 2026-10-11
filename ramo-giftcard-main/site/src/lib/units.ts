export const toUnits = (value: string, decimals = 18): bigint | null => {
  const s = value.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,6})?$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt((frac + "0".repeat(decimals)).slice(0, decimals));
};

export const fromUnits = (units: bigint | string, decimals = 18, maxFrac = 4): string => {
  const s = BigInt(units).toString().padStart(decimals + 1, "0");
  const whole = s.slice(0, -decimals);
  const frac = s.slice(-decimals).replace(/0+$/, "").slice(0, maxFrac);
  return frac ? `${whole}.${frac}` : whole;
};

export const shortAddress = (a: string) => (a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);
