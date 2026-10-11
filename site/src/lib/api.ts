import { authHeaders } from "./telegram";
import { translate, type Language } from "./i18n";

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

export const errorText = (e: unknown, language: Language = "fa") => {
  if (e instanceof ApiError) {
    const message = translate(language, `error.${e.code}`);
    return message.startsWith("error.") ? translate(language, "error.unknown") : message;
  }
  return translate(language, "error.unknown");
};
