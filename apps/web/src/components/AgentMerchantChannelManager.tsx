"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "./Toast";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type AgentChannel = {
  channelId: string;
  agentFeeRate: string;
  agentFixedFee: string;
  channel: { id: string; name: string; paymentMethod: string; currency: string; rollingReserveRate?: string; rollingReserveDays?: number };
};

type MerchantChannel = {
  channelId: string;
  isEnabled: boolean;
  isPrimary: boolean;
  isBackup: boolean;
  merchantFeeRate: string;
  merchantFixedFee: string;
  channel: { id: string; name: string; paymentMethod: string; currency: string };
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

export function AgentMerchantChannelManager({ merchantId, agentChannels, merchantChannels }: { merchantId: string; agentChannels: AgentChannel[]; merchantChannels: MerchantChannel[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const currentByChannel = new Map(merchantChannels.map((item) => [item.channelId, item]));

  async function save(channelId: string, body: Record<string, unknown>) {
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await request(`/api/agent/merchants/${merchantId}/channels/${channelId}/fees`, { method: "POST", body: JSON.stringify(body) });
      setMessage("Merchant channel saved");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="surface p-5">
      <h2 className="text-xl font-black text-slate-950">Merchant available channels</h2>
      <p className="mt-1 text-sm text-muted">Choose only from channels authorized to your agent account. Merchant rate cannot be below your agent channel cost.</p>
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
      <div className="mt-4 grid gap-3">
        {agentChannels.map((agentChannel) => {
          const current = currentByChannel.get(agentChannel.channelId);
          return (
            <form
              key={agentChannel.channelId}
              className="grid gap-3 rounded-lg border border-line p-4 lg:grid-cols-[1fr_120px_120px_130px_130px_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                const form = Object.fromEntries(new FormData(event.currentTarget));
                void save(agentChannel.channelId, {
                  ...form,
                  isEnabled: form.status !== "disabled",
                  isPrimary: form.role === "primary",
                  isBackup: form.role === "backup",
                });
              }}
            >
              <div>
                <p className="font-black text-slate-950">{agentChannel.channel.name}</p>
                <p className="text-xs text-muted">
                  {agentChannel.channel.paymentMethod} / {agentChannel.channel.currency} / agent cost {rate(agentChannel.agentFeeRate)} + {agentChannel.agentFixedFee}
                </p>
                <p className="text-xs text-muted">Reserve {rate(agentChannel.channel.rollingReserveRate)} / {agentChannel.channel.rollingReserveDays ?? 0} days</p>
              </div>
              <select name="status" defaultValue={current?.isEnabled === false ? "disabled" : "enabled"}>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
              <select name="role" defaultValue={current?.isPrimary ? "primary" : current?.isBackup ? "backup" : "enabled"}>
                <option value="enabled">Normal</option>
                <option value="primary">Primary</option>
                <option value="backup">Backup</option>
              </select>
              <input name="merchantFeeRate" defaultValue={current?.merchantFeeRate ?? agentChannel.agentFeeRate} placeholder="0.12" />
              <input name="merchantFixedFee" defaultValue={current?.merchantFixedFee ?? "0"} placeholder="0.30" />
              <button type="submit" disabled={loading}>Save</button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
