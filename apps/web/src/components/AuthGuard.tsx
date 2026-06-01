"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth, isTokenExpired, readStoredAuth, roleHome, UserRole } from "@/lib/auth";
import { LoadingSkeleton } from "./LoadingSkeleton";

export function AuthGuard({ requiredRole, children }: { requiredRole: UserRole; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const auth = readStoredAuth();
    if (!auth?.accessToken || !auth.user?.role) {
      clearAuth();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (isTokenExpired(auth.accessToken)) {
      clearAuth();
      router.replace("/login?reason=expired");
      return;
    }

    if (auth.user.role !== requiredRole) {
      router.replace(roleHome[auth.user.role] ?? "/login");
      return;
    }

    setReady(true);
  }, [pathname, requiredRole, router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-ink p-6 lg:pl-72">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  return <>{children}</>;
}
