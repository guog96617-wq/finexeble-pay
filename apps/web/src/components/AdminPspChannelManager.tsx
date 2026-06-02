"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Power, PowerOff } from "lucide-react";
import { SectionHeader } from "./ProductOps";
import { StatusBadge } from "./StatusBadge";
import { Toast } from "./Toast";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type SupplierStatus = "ACTIVE" | "DISABLED";
type PaymentMethod = "CARD" | "LOCAL_PAYMENT" | "BANK_TRANSFER" | "SANDBOX_PAY";

export type AdminSupplier = {
  id: string;
  name: string;
  country?: string | null;
  contactName?: string | null;
  email?: string | null;
  apiBaseUrl: string;
  status: SupplierStatus;
};

export type AdminChannel = {
  id: string;
  supplierId?: string | null;
  name: string;
  supplierName?: string | null;
  supplierContactName?: string | null;
  supplierApiBaseUrl?: string | null;
  supplierNote?: string | null;
  paymentMethod: PaymentMethod;
  country?: string | null;
  currency: string;
  feeRate?: string;
  pspCostRate?: string;
  pspFixedFee?: string;
  rollingReserveRate?: string;
  rollingReserveDays?: number;
  description?: string | null;
  priority: number;
  isPrimary: boolean;
  isBackup: boolean;
  status: SupplierStatus;
  agentChannels?: unknown[];
  merchantChannels?: unknown[];
  orders?: { amount: string; status: string }[];
};

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers ?? {}) },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error?.message ?? "Operation failed");
  }
  return (payload?.data ?? payload) as T;
}

function rate(value?: string) {
  return `${(Number(value ?? 0) * 100).toFixed(2)}%`;
}

function money(value?: string) {
  return `USD ${Number(value ?? 0).toFixed(2)}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      {children}
    </label>
  );
}

function ChannelForm({ channel, onSubmit, loading }: { channel?: AdminChannel; onSubmit: (data: Record<string, unknown>) => void; loading: boolean }) {
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSubmit({ ...Object.fromEntries(formData), isPrimary: formData.has("isPrimary"), isBackup: formData.has("isBackup") });
      }}
    >
      <Field label="Channel name">
        <input name="name" defaultValue={channel?.name ?? ""} required placeholder="Sandbox Card Channel" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Supplier name">
          <input name="supplierName" defaultValue={channel?.supplierName ?? ""} required placeholder="MockPay PSP" />
        </Field>
        <Field label="Supplier contact">
          <input name="supplierContactName" defaultValue={channel?.supplierContactName ?? ""} placeholder="Operations contact" />
        </Field>
      </div>
      <Field label="Supplier API Base URL">
        <input name="supplierApiBaseUrl" defaultValue={channel?.supplierApiBaseUrl ?? ""} placeholder="https://mockpay.local/api" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Payment method">
          <select name="paymentMethod" defaultValue={channel?.paymentMethod ?? "CARD"}>
            <option value="CARD">CARD</option>
            <option value="LOCAL_PAYMENT">LOCAL_PAYMENT</option>
            <option value="BANK_TRANSFER">BANK_TRANSFER</option>
            <option value="SANDBOX_PAY">SANDBOX_PAY</option>
          </select>
        </Field>
        <Field label="Country / region">
          <input name="country" defaultValue={channel?.country ?? "GLOBAL"} />
        </Field>
        <Field label="Currency">
          <input name="currency" defaultValue={channel?.currency ?? "USD"} required />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="PSP cost rate">
          <input name="pspCostRate" defaultValue={channel?.pspCostRate ?? channel?.feeRate ?? "0.05"} placeholder="0.05" />
        </Field>
        <Field label="PSP fixed fee">
          <input name="pspFixedFee" defaultValue={channel?.pspFixedFee ?? "0"} placeholder="0.30" />
        </Field>
        <Field label="Reserve rate">
          <input name="rollingReserveRate" defaultValue={channel?.rollingReserveRate ?? "0.05"} placeholder="0.05" />
        </Field>
        <Field label="Reserve days">
          <input name="rollingReserveDays" type="number" defaultValue={channel?.rollingReserveDays ?? 7} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Status">
          <select name="status" defaultValue={channel?.status ?? "ACTIVE"}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DISABLED">DISABLED</option>
          </select>
        </Field>
        <Field label="Priority">
          <input name="priority" type="number" defaultValue={channel?.priority ?? 100} />
        </Field>
      </div>
      <Field label="Description">
        <textarea name="description" defaultValue={channel?.description ?? ""} rows={3} placeholder="Operational note for non-technical ops review." />
      </Field>
      <div className="flex flex-wrap gap-4 rounded-lg border border-line bg-slate-50 p-3 text-sm font-bold text-slate-700">
        <label className="flex items-center gap-2"><input className="w-4" name="isPrimary" type="checkbox" defaultChecked={channel?.isPrimary ?? false} /> Primary route</label>
        <label className="flex items-center gap-2"><input className="w-4" name="isBackup" type="checkbox" defaultChecked={channel?.isBackup ?? false} /> Backup route</label>
      </div>
      <button type="submit" disabled={loading}>{loading ? "Saving..." : "Save channel"}</button>
    </form>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/25 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-3xl rounded-card border border-line bg-white p-5 shadow-card">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 className="text-xl font-black text-slate-950">{title}</h3>
          <button type="button" className="button secondary px-3 py-2 text-xs" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminChannelManager({ initialChannels }: { initialSuppliers?: AdminSupplier[]; initialChannels: AdminChannel[] }) {
  const router = useRouter();
  const [channels, setChannels] = useState(initialChannels);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<{ type: "create" | "edit"; channel?: AdminChannel } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string }>({ type: "success", message: "" });
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return channels.filter((channel) => `${channel.name} ${channel.supplierName ?? ""} ${channel.paymentMethod} ${channel.currency}`.toLowerCase().includes(keyword));
  }, [channels, query]);

  async function refresh() {
    const next = await apiRequest<AdminChannel[]>("/api/admin/channels");
    setChannels(next);
    router.refresh();
  }

  async function save(data: Record<string, unknown>, channel?: AdminChannel) {
    setLoading(true);
    setToast({ type: "success", message: "" });
    try {
      await apiRequest(channel ? `/api/admin/channels/${channel.id}` : "/api/admin/channels", {
        method: channel ? "PATCH" : "POST",
        body: JSON.stringify({ ...data, feeRate: data.pspCostRate }),
      });
      await refresh();
      setModal(null);
      setToast({ type: "success", message: "Channel saved" });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Operation failed" });
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(channel: AdminChannel, status: SupplierStatus) {
    await apiRequest(`/api/admin/channels/${channel.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    await refresh();
  }

  return (
    <>
      <SectionHeader
        eyebrow="Platform channel library"
        title="Payment Channels"
        text="Channels are the core operating object. Supplier information is stored inside each channel; agent authorization happens only inside an agent detail page."
        action={<button type="button" onClick={() => setModal({ type: "create" })}>New channel</button>}
      />
      <Toast message={toast.message} type={toast.type} />
      <div className="mb-4 rounded-card border border-line bg-white p-4 shadow-card">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search channel, supplier, method or currency" />
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        {filtered.map((channel) => {
          const todayVolume = channel.orders?.reduce((sum, order) => sum + Number(order.amount), 0) ?? 0;
          return (
            <article key={channel.id} className="surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-950">{channel.name}</h2>
                  <p className="mt-1 text-sm text-muted">{channel.supplierName ?? "Supplier not set"} / {channel.paymentMethod} / {channel.country ?? "GLOBAL"} / {channel.currency}</p>
                </div>
                <StatusBadge status={channel.status} />
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                <p><b>PSP cost:</b> {rate(channel.pspCostRate ?? channel.feeRate)} + {money(channel.pspFixedFee)}</p>
                <p><b>Rolling reserve:</b> {rate(channel.rollingReserveRate)} / {channel.rollingReserveDays ?? 0} days</p>
                <p><b>Today volume:</b> {money(String(todayVolume))}</p>
                <p><b>Success rate:</b> {channel.orders?.length ? "100.00%" : "0.00%"}</p>
                <p><b>Authorized agents:</b> {channel.agentChannels?.length ?? 0}</p>
                <p><b>Opened merchants:</b> {channel.merchantChannels?.length ?? 0}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="button secondary px-3 py-2 text-xs" onClick={() => setModal({ type: "edit", channel })}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                {channel.status === "ACTIVE" ? (
                  <button type="button" className="button secondary px-3 py-2 text-xs" onClick={() => void setStatus(channel, "DISABLED")}>
                    <PowerOff className="h-3.5 w-3.5" /> Disable
                  </button>
                ) : (
                  <button type="button" className="button secondary px-3 py-2 text-xs" onClick={() => void setStatus(channel, "ACTIVE")}>
                    <Power className="h-3.5 w-3.5" /> Enable
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>
      {modal ? (
        <Modal title={modal.type === "create" ? "New channel" : "Edit channel"} onClose={() => setModal(null)}>
          <ChannelForm channel={modal.channel} loading={loading} onSubmit={(data) => void save(data, modal.channel)} />
        </Modal>
      ) : null}
    </>
  );
}

export function AdminPspManager() {
  return (
    <SectionHeader
      eyebrow="PSP module removed"
      title="Use the channel library"
      text="V1.7 no longer has an independent PSP module. Supplier data lives inside each payment channel."
      action={<a className="button" href="/admin/channels">Open channels</a>}
    />
  );
}
