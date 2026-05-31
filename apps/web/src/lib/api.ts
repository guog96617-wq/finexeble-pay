const API_BASE_URL = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: { message: string };
};

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
    if (!response.ok) {
      return fallback;
    }
    const payload = (await response.json()) as ApiEnvelope<T>;
    return payload.data ?? fallback;
  } catch {
    return fallback;
  }
}

export function money(value: unknown, currency = "USD") {
  if (value === null || value === undefined) {
    return `${currency} 0.00`;
  }
  return `${currency} ${Number(value).toFixed(2)}`;
}
