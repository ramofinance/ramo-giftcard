export function generateCardSVG(params: { bgGradient: string; senderName: string; receiverName: string; message: string; amount: number }): string {
  const { bgGradient, senderName, receiverName, message, amount } = params;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#f5af19"/><stop offset="100%" style="stop-color:#f12711"/>
  </linearGradient></defs>
  <rect width="600" height="400" fill="url(#g)" rx="16"/>
  <circle cx="540" cy="60" r="90" fill="rgba(255,255,255,0.06)"/>
  <circle cx="60" cy="340" r="70" fill="rgba(255,255,255,0.06)"/>
  <text x="300" y="55" text-anchor="middle" font-family="Vazirmatn, sans-serif" font-size="16" fill="rgba(255,255,255,0.6)">RAMO Gift Card</text>
  <text x="300" y="140" text-anchor="middle" font-family="Vazirmatn, sans-serif" font-size="34" font-weight="bold" fill="#fff">${receiverName}</text>
  <line x1="200" y1="170" x2="400" y2="170" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <text x="300" y="210" text-anchor="middle" font-family="Vazirmatn, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)">از طرف ${senderName}</text>
  <text x="300" y="270" text-anchor="middle" font-family="Vazirmatn, sans-serif" font-size="38" font-weight="bold" fill="#fff">${amount} USDT</text>
  <text x="300" y="295" text-anchor="middle" font-family="Vazirmatn, sans-serif" font-size="13" fill="rgba(255,255,255,0.5)">روی شبکه BSC</text>
  ${message ? `<text x="300" y="340" text-anchor="middle" font-family="Vazirmatn, sans-serif" font-size="16" fill="rgba(255,255,255,0.9)">${message}</text>` : ""}
  <text x="300" y="385" text-anchor="middle" font-family="Vazirmatn, sans-serif" font-size="11" fill="rgba(255,255,255,0.35)">ramofinance.ir</text>
</svg>`;
}
