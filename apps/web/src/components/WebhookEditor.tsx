"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "./Toast";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type Webhook = {
  id: string;
  url: string;
  secret: string;
  status: string;
};

export function WebhookEditor({ webhooks }: { webhooks: Webhook[] }) {
  const router = useRouter();
  const first = webhooks[0];
  const [url, setUrl] = useState(first?.url ?? "https://merchant.example.com/webhooks/payhub");
  const [secret, setSecret] = useState(first?.secret ?? "whsec_demo");
  const [status, setStatus] = useState(first?.status ?? "ACTIVE");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    const path = first ? `/api/merchant/webhooks/${first.id}` : "/api/merchant/webhooks";
    const method = first ? "PATCH" : "POST";
    try {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, secret, status }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error?.message ?? "Webhook save failed.");
        return;
      }
      setMessage("Webhook saved.");
      router.refresh();
    } catch {
      setError("Cannot connect to API. Please check the API service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="surface grid gap-3 p-5" onSubmit={save}>
      <div>
        <h2 className="text-lg font-black text-slate-950">Webhook Config</h2>
        <p className="mt-1 text-sm text-muted">Edit callback URL and secret for payment event notifications.</p>
      </div>
      <label className="text-sm font-semibold text-slate-700">Webhook URL</label>
      <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Webhook URL" />
      <label className="text-sm font-semibold text-slate-700">Webhook secret</label>
      <input value={secret} onChange={(event) => setSecret(event.target.value)} placeholder="Webhook secret" />
      <label className="text-sm font-semibold text-slate-700">Status</label>
      <select value={status} onChange={(event) => setStatus(event.target.value)}>
        <option>ACTIVE</option>
        <option>SUSPENDED</option>
      </select>
      <button type="submit" disabled={loading}>{loading ? "Saving..." : "Save webhook"}</button>
      <button type="button" className="button secondary" onClick={() => setMessage("Test send is reserved for the demo environment.")}>Test send</button>
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
    </form>
  );
}
