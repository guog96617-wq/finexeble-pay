"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearAuth } from "@/lib/auth";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  function logout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <button type="button" className={compact ? "button secondary px-3 py-2" : "button secondary w-full"} onClick={logout}>
      <LogOut className="h-4 w-4" />
      {compact ? null : "Logout"}
    </button>
  );
}
