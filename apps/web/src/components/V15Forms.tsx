"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "./Toast";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function post(path: string, body?: Record<string, unknown>, method = "POST") {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error?.message ?? "Operation failed");
  }
  return payload?.data ?? payload;
}

function useAction() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function run(action: () => Promise<unknown>, success = "Saved") {
    setMessage("");
    setError("");
    try {
      await action();
      setMessage(success);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    }
  }
  return { message, error, run };
}

export function CreatePspForm() {
  const { message, error, run } = useAction();
  return (
    <form
      className="surface grid gap-3 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        void run(() => post("/api/admin/suppliers", data), "PSP created");
      }}
    >
      <h3 className="font-black text-slate-950">New PSP</h3>
      <input name="name" placeholder="PSP name" required />
      <input name="apiBaseUrl" placeholder="API base URL" defaultValue="https://sandbox-psp.local" />
      <button type="submit">Create PSP</button>
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
    </form>
  );
}

export function CreateChannelForm({ suppliers }: { suppliers: { id: string; name: string }[] }) {
  const { message, error, run } = useAction();
  return (
    <form
      className="surface grid gap-3 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        void run(() => post("/api/admin/channels", data), "Channel created");
      }}
    >
      <h3 className="font-black text-slate-950">New Channel</h3>
      <select name="supplierId" required>
        {suppliers.map((supplier) => (
          <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
        ))}
      </select>
      <input name="name" placeholder="Channel name" required />
      <select name="paymentMethod" defaultValue="CARD">
        <option value="CARD">Card</option>
        <option value="LOCAL_PAYMENT">Local Payment</option>
        <option value="BANK_TRANSFER">Bank Transfer</option>
        <option value="SANDBOX_PAY">Sandbox Pay</option>
      </select>
      <input name="currency" placeholder="Currency" defaultValue="USD" />
      <input name="feeRate" placeholder="PSP cost rate, e.g. 0.018" defaultValue="0.018" />
      <button type="submit">Create Channel</button>
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
    </form>
  );
}

export function ChannelRoleButtons({ id }: { id: string }) {
  const { message, error, run } = useAction();
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="button secondary px-3 py-2 text-xs" onClick={() => run(() => post(`/api/admin/channels/${id}/primary`, undefined, "PATCH"), "Primary set")}>Primary</button>
      <button type="button" className="button secondary px-3 py-2 text-xs" onClick={() => run(() => post(`/api/admin/channels/${id}/backup`, undefined, "PATCH"), "Backup set")}>Backup</button>
      <button type="button" className="button secondary px-3 py-2 text-xs" onClick={() => run(() => post(`/api/admin/channels/${id}/disable`, undefined, "PATCH"), "Disabled")}>Disable</button>
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
    </div>
  );
}

export function AgentFeeRuleForm({ agentId, channelIds }: { agentId: string; channelIds: string[] }) {
  const { message, error, run } = useAction();
  return (
    <form
      className="surface grid gap-3 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = Object.fromEntries(new FormData(event.currentTarget));
        const body = {
          ...form,
          allowedPaymentMethods: ["CARD", "LOCAL_PAYMENT", "BANK_TRANSFER", "SANDBOX_PAY"],
          allowedChannelIds: channelIds,
        };
        void run(() => post(`/api/admin/agents/${agentId}/fee-rules`, body), "Agent fee rule saved");
      }}
    >
      <h3 className="font-black text-slate-950">Agent Minimum Fees</h3>
      <input name="minMerchantFeeRate" placeholder="Min merchant fee rate" defaultValue="0.10" />
      <input name="minWithdrawFeeRate" placeholder="Min withdraw fee rate" defaultValue="0.01" />
      <button type="submit">Save Fee Rule</button>
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
    </form>
  );
}

export function MerchantChannelForm({ merchantId, channelId, agent = false }: { merchantId: string; channelId: string; agent?: boolean }) {
  const { message, error, run } = useAction();
  const base = agent ? `/api/agent/merchants/${merchantId}/channels/${channelId}/fees` : `/api/admin/merchants/${merchantId}/channels/${channelId}`;
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = Object.fromEntries(new FormData(event.currentTarget));
        void run(() => post(base, { ...form, isEnabled: true, isPrimary: form.role === "primary", isBackup: form.role === "backup" }), "Merchant channel saved");
      }}
    >
      <select name="role" defaultValue="enabled">
        <option value="enabled">Enabled</option>
        <option value="primary">Primary</option>
        <option value="backup">Backup</option>
      </select>
      <input name="merchantFeeRate" placeholder="Merchant fee rate" defaultValue="0.12" />
      <input name="merchantFixedFee" placeholder="Fixed fee" defaultValue="0.30" />
      <button type="submit" className="px-3 py-2 text-xs">Save</button>
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
    </form>
  );
}

export function WithdrawRuleForm({ merchantId, agentId, agent = false }: { merchantId?: string; agentId?: string; agent?: boolean }) {
  const { message, error, run } = useAction();
  const path = agent && merchantId ? `/api/agent/merchants/${merchantId}/withdraw-rule` : "/api/admin/withdraw-rules";
  return (
    <form
      className="surface grid gap-3 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        void run(() => post(path, { ...data, merchantId, agentId }), "Withdraw rule saved");
      }}
    >
      <h3 className="font-black text-slate-950">Withdraw Rule</h3>
      <input name="currency" defaultValue="USD" />
      <input name="minAmount" placeholder="Min amount" defaultValue="1" />
      <input name="maxAmount" placeholder="Max amount" defaultValue="5000" />
      <input name="withdrawFeeRate" placeholder="Fee rate" defaultValue="0.015" />
      <input name="withdrawFixedFee" placeholder="Fixed fee" defaultValue="1" />
      <input name="settlementDays" placeholder="Settlement days" defaultValue="1" />
      <button type="submit">Save Rule</button>
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
    </form>
  );
}

export function CheckoutPayBox({ orderNo }: { orderNo: string }) {
  const [result, setResult] = useState("");
  const { message, error, run } = useAction();
  async function pay(sandboxResult: "success" | "failed" | "timeout") {
    await run(async () => {
      const payload = await post(`/api/checkout/${orderNo}/pay`, { paymentMethod: "SANDBOX_PAY", sandboxResult });
      setResult(payload?.order?.status ?? "PROCESSING");
    }, `Sandbox ${sandboxResult}`);
  }
  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <button type="button" onClick={() => void pay("success")}>Pay Success</button>
        <button type="button" className="button secondary" onClick={() => void pay("failed")}>Pay Failed</button>
        <button type="button" className="button secondary" onClick={() => void pay("timeout")}>Pay Timeout</button>
      </div>
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
      {result ? <p className="text-sm font-bold text-slate-700">Current status: {result}</p> : null}
    </div>
  );
}
