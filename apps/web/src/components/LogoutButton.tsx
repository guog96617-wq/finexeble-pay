"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  function logout() {
    localStorage.removeItem("payhub.auth");
    router.push("/login");
  }

  return (
    <button type="button" className={compact ? "button secondary px-3 py-2" : "button secondary w-full"} onClick={logout}>
      <LogOut className="h-4 w-4" />
      {compact ? null : "Logout"}
    </button>
  );
}
