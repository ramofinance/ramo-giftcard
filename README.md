# RAMO Gift Card | کارت هدیه رمزارز

## ساختار پروژه

```
ramo-giftcard/
├── api/               # Cloudflare Worker - بک‌اند API
│   └── src/
│       ├── index.ts      # Main server
│       ├── wallet.ts     # کیف پول + USDT
│       ├── card.ts       # تولید SVG کارت
│       ├── templates.ts  # تم‌های کارت
│       └── types.ts      # types
├── site/              # React SPA (سایت اول، مینی‎اپ بعداً)
│   └── src/
│       ├── components/
│       │   ├── HomePage.tsx
│       │   ├── TemplatesPage.tsx
│       │   ├── CreatePage.tsx
│       │   └── OrderStatus.tsx
│       └── styles.css
├── bot/               # ربات تلگرام
└── .env.example
```

## راه‌اندازی سریع

```bash
cd api && npm install && npx wrangler deploy
cd ../site && npm install && npm run build && npx wrangler pages deploy dist
cd ../bot && npm install && npm start
```

## API

| Method | Path | توضیح |
|--------|------|-------|
| GET | /api/templates | لیست تم‌ها |
| POST | /api/gift/create | ساخت سفارش |
| GET | /api/gift/status/:orderId | وضعیت سفارش |
| POST | /api/gift/confirm | تایید و تحویل |
| GET | /api/admin/recent | سفارشات اخیر |
