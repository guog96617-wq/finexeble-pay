export type UserRole = "SUPER_ADMIN" | "MERCHANT_ADMIN" | "AGENT_ADMIN";

export type StoredAuth = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    merchantId?: string | null;
    agentId?: string | null;
  };
};

export const AUTH_STORAGE_KEY = "payhub.auth";
export const AUTH_TOKEN_COOKIE = "fxpay_auth_token";
export const AUTH_ROLE_COOKIE = "fxpay_auth_role";

export const roleHome: Record<UserRole, string> = {
  SUPER_ADMIN: "/admin",
  MERCHANT_ADMIN: "/merchant",
  AGENT_ADMIN: "/agent",
};

export const routeRole: Record<string, UserRole> = {
  "/admin": "SUPER_ADMIN",
  "/merchant": "MERCHANT_ADMIN",
  "/agent": "AGENT_ADMIN",
};

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string) {
  const payload = decodeJwtPayload(token);
  return !!payload?.exp && payload.exp * 1000 <= Date.now();
}

export function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: string, maxAge?: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const age = typeof maxAge === "number" ? `; Max-Age=${maxAge}` : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${age}${secure}`;
}

export function saveAuth(auth: StoredAuth, remember: boolean) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  const maxAge = remember ? 60 * 60 * 8 : undefined;
  writeCookie(AUTH_TOKEN_COOKIE, auth.accessToken, maxAge);
  writeCookie(AUTH_ROLE_COOKIE, auth.user.role, maxAge);
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie = `${AUTH_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${AUTH_ROLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
