"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "./Toast";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type Channel = {
  id: string;
  name: string;
  pspCostRate?: string;
  pspFixedFee?: string;
  paymentMethod: string;
  currency: string;
};

type AgentChannel = {
  id: string;
  channelId: string;
  isEnabled: boolean;
  agentFeeRate: string;
  agentFixedFee: string;
  note?: string | null;
  channel: Channel;
};

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers ?? {}) },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error?.message ?? "Operation failed");
  }
  return payload?.data ?? payload;
}

function rate(value?: string) {
  return `${(Number(value ?? 0) * 100).toFixed(2)}%`;
}

export function AgentChannelAuthorization({ agentId, channels, agentChannels }: { agentId: string; channels: Channel[]; agentChannels: AgentChannel[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const authorizedIds = new Set(agentChannels.map((item) => item.channelId));

  async function run(action: () => Promise<unknown>, success: string) {
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await action();
      setMessage(success);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-950">Agent available channels</h2>
          <p className="mt-1 text-sm text-muted">Authorize channels here only. Agent fee rate must be greater than or equal to the channel PSP cost rate.</p>
        </div>
      </div>
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
      <form
        className="mt-4 grid gap-3 rounded-lg border border-line bg-slate-50 p-4 lg:grid-cols-[1fr_130px_130px_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          const data = Object.fromEntries(new FormData(event.currentTarget));
          const channelId = String(data.channelId);
          void run(() => request(`/api/admin/agents/${agentId}/channels/${channelId}`, { method: "POST", body: JSON.stringify(data) }), "Agent channel authorized");
        }}
      >
        <select name="channelId" required>
          {channels.filter((channel) => !authorizedIds.has(channel.id)).map((channel) => (
            <option key={channel.id} value={channel.id}>{channel.name} ({rate(channel.pspCostRate)})</option>
          ))}
        </select>
        <input name="agentFeeRate" placeholder="0.10" defaultValue="0.10" />
        <input name="agentFixedFee" placeholder="0.00" defaultValue="0" />
        <input name="note" placeholder="Authorization note" />
        <button type="submit" disabled={loading}>Authorize</button>
      </form>
      <div className="mt-4 grid gap-3">
        {agentChannels.map((item) => (
          <form
            key={item.id}
            className="grid gap-3 rounded-lg border border-line p-4 lg:grid-cols-[1fr_110px_110px_110px_1fr_auto_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              const data = Object.fromEntries(new FormData(event.currentTarget));
              void run(() => request(`/api/admin/agents/${agentId}/channels/${item.channelId}`, { method: "PATCH", body: JSON.stringify({ ...data, isEnabled: data.isEnabled === "true" }) }), "Agent channel saved");
            }}
          >
            <div>
              <p className="font-black text-slate-950">{item.channel.name}</p>
              <p className="text-xs text-muted">{item.channel.paymentMethod} / {item.channel.currency} / PSP cost {rate(item.channel.pspCostRate)}</p>
            </div>
            <select name="isEnabled" defaultValue={String(item.isEnabled)}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
            <input name="agentFeeRate" defaultValue={item.agentFeeRate} />
            <input name="agentFixedFee" defaultValue={item.agentFixedFee} />
            <input name="note" defaultValue={item.note ?? ""} />
            <button type="submit" disabled={loading}>Save</button>
            <button
              type="button"
              className="button secondary"
              disabled={loading}
              onClick={() => void run(() => request(`/api/admin/agents/${agentId}/channels/${item.channelId}`, { method: "DELETE" }), "Agent channel removed")}
            >
              Remove
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
