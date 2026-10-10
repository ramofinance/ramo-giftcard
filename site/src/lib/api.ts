import { authHeaders } from "./telegram";

const API = (import.meta.env.VITE_API_URL as string | undefined) || "https://ramo-giftcard-api.rahbarmohsen87.workers.dev";

export class ApiError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
  }
}

export async function api<T>(path: string, opts: { body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = opts.auth === false ? {} : authHeaders();
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(API + path, {
      method: opts.body !== undefined ? "POST" : "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
    });
  } catch {
    throw new ApiError("network", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(String((data as any).error || "server_error"), res.status);
  return data as T;
}

const MESSAGES: Record<string, string> = {
  network: "ارتباط با سرور برقرار نشد. اینترنت را بررسی کنید.",
  auth: "ابتدا با تلگرام وارد شوید.",
  receiver_not_started: "گیرنده هنوز ربات را استارت نکرده است.",
  bad_amount: "مبلغ مجاز نیست.",
  bad_receiver: "شناسه‌ی گیرنده درست نیست.",
  draft_expired: "مهلت این سفارش تمام شده است. عبارت بازیابی را ذخیره کنید و با پشتیبانی تماس بگیرید.",
  payment_failed: "یکی از تراکنش‌ها ناموفق بود.",
  gift_payment_mismatch: "تراکنش هدیه با سفارش نمی‌خواند.",
  fee_payment_mismatch: "تراکنش کارمزد با سفارش نمی‌خواند.",
  gas_payment_mismatch: "تراکنش BNB با سفارش نمی‌خواند.",
  tx_reused: "این تراکنش‌ها قبلاً برای سفارش دیگری استفاده شده‌اند.",
  rpc_unavailable: "شبکه‌ی BNB Chain الان پاسخ نمی‌دهد. کمی بعد دوباره امتحان کنید.",
  not_configured: "سرویس هنوز کامل راه‌اندازی نشده است."
};
export const errorText = (e: unknown) => (e instanceof ApiError ? MESSAGES[e.code] || `خطا (${e.code})` : e instanceof Error ? e.message : "خطای ناشناخته");
