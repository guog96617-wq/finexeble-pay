"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "./BrandLogo";
import { Toast } from "./Toast";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const roleHome: Record<string, string> = {
  SUPER_ADMIN: "/admin",
  MERCHANT_ADMIN: "/merchant",
  AGENT_ADMIN: "/agent",
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@payhub.local");
  const [password, setPassword] = useState("Admin123!");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Login failed. Please check your email and password.");
        return;
      }
      localStorage.setItem("payhub.auth", JSON.stringify(payload.data));
      router.push(roleHome[payload.data.user.role] ?? "/");
    } catch {
      setError("Operation failed. Please try again later or contact the administrator.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mx-auto grid w-full max-w-md gap-4 rounded-2xl border border-white/75 bg-white/78 p-6 shadow-[0_28px_90px_rgba(37,99,235,.18)] backdrop-blur-2xl" onSubmit={login}>
      <div className="grid justify-items-center gap-3 pb-2 text-center">
        <BrandLogo />
        <div>
          <h2 className="text-xl font-black text-slate-950">Sign in to FXpay</h2>
          <p className="mt-1 text-sm text-muted">Your role decides which console opens after login.</p>
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700">Email</label>
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700">Password</label>
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
      </div>
      <label className="flex items-center justify-between rounded-lg border border-line bg-white/70 px-3 py-2 text-sm text-slate-600">
        <span className="font-semibold">Remember me</span>
        <input className="h-4 w-4 p-0" type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
      </label>
      <Toast message={error} type="error" />
      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </button>
      <div className="grid gap-2 border-t border-line pt-4 text-xs text-slate-600">
        {[
          ["Super Admin", "admin@payhub.local", "Admin123!"],
          ["Merchant", "merchant@payhub.local", "Merchant123!"],
          ["Agent", "agent@payhub.local", "Agent123!"],
        ].map(([role, demoEmail, demoPassword]) => (
          <button
            key={role}
            type="button"
            className="justify-between border-line bg-white text-left text-slate-700 hover:bg-blue-50"
            onClick={() => {
              setEmail(demoEmail);
              setPassword(demoPassword);
            }}
          >
            <span>{role}</span>
            <span className="font-mono text-[11px] text-muted">{demoEmail}</span>
          </button>
        ))}
      </div>
    </form>
  );
}
