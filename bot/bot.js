require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const token = process.env.BOT_TOKEN;
const apiBase = process.env.API_BASE || "https://ramo-giftcard-api.YOUR-WORKER-NAME.workers.dev";
if (!token) { console.error("BOT_TOKEN required"); process.exit(1); }
const bot = new TelegramBot(token, { polling: true });
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
    "🎁 RAMO Gift Card\n\nبه کارت هدیه رمزارز خوش اومدی!\nبراي ساخت کارت هدیه از دکمه زیر استفاده کن:",
    { reply_markup: { inline_keyboard: [[{ text: "ساخت کارت هدیه", web_app: { url: process.env.MINIAPP_URL || "https://YOUR-SITE-URL.com" } }]] } }
  );
});
console.log("RAMO Gift Card Bot running...");
