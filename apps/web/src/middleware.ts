import { NextRequest, NextResponse } from "next/server";
import { AUTH_ROLE_COOKIE, AUTH_TOKEN_COOKIE, roleHome, routeRole, UserRole } from "./lib/auth";

function clearAndRedirect(request: NextRequest, pathname: string) {
  const response = NextResponse.redirect(new URL(pathname, request.url));
  response.cookies.delete(AUTH_TOKEN_COOKIE);
  response.cookies.delete(AUTH_ROLE_COOKIE);
  return response;
}

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

function isExpired(token: string) {
  const payload = decodeJwtPayload(token);
  return !!payload?.exp && payload.exp * 1000 <= Date.now();
}

function requiredRoleFor(pathname: string): UserRole | null {
  const route = Object.keys(routeRole).find((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return route ? routeRole[route] : null;
}

export function middleware(request: NextRequest) {
  const requiredRole = requiredRoleFor(request.nextUrl.pathname);
  if (!requiredRole) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const role = request.cookies.get(AUTH_ROLE_COOKIE)?.value as UserRole | undefined;

  if (!token || !role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isExpired(token)) {
    return clearAndRedirect(request, "/login?reason=expired");
  }

  if (role !== requiredRole) {
    return NextResponse.redirect(new URL(roleHome[role] ?? "/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/merchant/:path*", "/agent/:path*"],
};
