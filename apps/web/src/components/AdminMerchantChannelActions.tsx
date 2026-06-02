"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "./Toast";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function request(path: string, method: "PATCH") {
  const response = await fetch(`${apiBaseUrl}${path}`, { method });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error?.message ?? "Operation failed");
  }
}

export function AdminMerchantChannelActions({ merchantId }: { merchantId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(path: string, success: string) {
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await request(path, "PATCH");
      setMessage(success);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="button secondary px-3 py-2 text-xs" disabled={loading} onClick={() => void run(`/api/admin/merchants/${merchantId}/channels/disable-all`, "All merchant channels disabled")}>
        Emergency disable all channels
      </button>
      <button type="button" className="button secondary px-3 py-2 text-xs" disabled={loading} onClick={() => void run(`/api/admin/merchants/${merchantId}/channels/enable-all`, "All merchant channels restored")}>
        Restore all channels
      </button>
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
    </div>
  );
}
