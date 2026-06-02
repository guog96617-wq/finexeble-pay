"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Pencil, Power, PowerOff, Route, ShieldCheck, Shuffle, SlidersHorizontal } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState } from "./EmptyState";
import { LoadingSkeleton } from "./LoadingSkeleton";
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
  createdAt?: string;
  updatedAt?: string;
  channels?: AdminChannel[];
};

export type AdminChannel = {
  id: string;
  supplierId: string;
  name: string;
  paymentMethod: PaymentMethod;
  country?: string | null;
  currency: string;
  feeRate?: string;
  priority: number;
  isPrimary: boolean;
  isBackup: boolean;
  status: SupplierStatus;
  createdAt?: string;
  updatedAt?: string;
  supplier?: Pick<AdminSupplier, "id" | "name" | "status">;
};

type ConfirmState = {
  title: string;
  text: string;
  confirmLabel?: string;
  action: () => Promise<void>;
} | null;

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error?.message ?? "操作失败，请检查填写内容后重试。");
  }
  return (payload?.data ?? payload) as T;
}

function friendlyError(message: string) {
  if (message.includes("required")) return "请先填写必填信息。";
  if (message.includes("not found")) return "没有找到对应记录，请刷新页面后重试。";
  if (message.includes("select a PSP")) return "请先选择所属 PSP。";
  return "操作失败，请检查填写内容后重试。";
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-";
}

function rateLabel(value?: string) {
  return `${Number(value ?? 0) * 100}%`;
}

function Modal({ title, text, children, onClose }: { title: string; text?: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/25 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-3xl rounded-card border border-line bg-white p-5 shadow-card">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-950">{title}</h3>
            {text ? <p className="mt-2 text-sm leading-6 text-muted">{text}</p> : null}
          </div>
          <button type="button" className="button secondary px-3 py-2 text-xs" onClick={onClose}>
            关闭
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      {children}
      {hint ? <span className="text-xs font-medium text-muted">{hint}</span> : null}
    </label>
  );
}

function ActionButton({ children, icon: Icon, onClick, danger = false }: { children: string; icon: React.ElementType; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold shadow-sm ${danger ? "border-red-200 bg-red-50 text-red-700" : "border-line bg-white text-slate-700 hover:bg-blue-50 hover:text-brand"}`}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function SupplierForm({ supplier, onSubmit, loading }: { supplier?: AdminSupplier; onSubmit: (data: Record<string, unknown>) => void; loading: boolean }) {
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = Object.fromEntries(new FormData(event.currentTarget));
        onSubmit(form);
      }}
    >
      <Field label="PSP 名称">
        <input name="name" defaultValue={supplier?.name ?? ""} placeholder="Sandbox PSP" required />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="国家/地区">
          <input name="country" defaultValue={supplier?.country ?? ""} placeholder="HK / SG / US" />
        </Field>
        <Field label="状态">
          <select name="status" defaultValue={supplier?.status ?? "ACTIVE"}>
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">禁用</option>
          </select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="联系人">
          <input name="contactName" defaultValue={supplier?.contactName ?? ""} placeholder="Operations contact" />
        </Field>
        <Field label="邮箱">
          <input name="email" type="email" defaultValue={supplier?.email ?? ""} placeholder="ops@example.com" />
        </Field>
      </div>
      <Field label="API Base URL">
        <input name="apiBaseUrl" defaultValue={supplier?.apiBaseUrl ?? "https://sandbox-psp.local"} placeholder="https://sandbox-psp.local" required />
      </Field>
      <Field label="描述" hint="当前用于运营备注展示；不会影响支付路由。">
        <textarea name="description" defaultValue="" placeholder="记录 PSP 用途、支持地区或接入说明" rows={3} />
      </Field>
      <div className="flex justify-end">
        <button type="submit" disabled={loading}>{loading ? "保存中..." : supplier ? "保存 PSP" : "创建 PSP"}</button>
      </div>
    </form>
  );
}

function ChannelForm({ suppliers, channel, onSubmit, loading }: { suppliers: AdminSupplier[]; channel?: AdminChannel; onSubmit: (data: Record<string, unknown>) => void; loading: boolean }) {
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData);
        onSubmit({
          ...data,
          isPrimary: formData.has("isPrimary"),
          isBackup: formData.has("isBackup"),
        });
      }}
    >
      <Field label="所属 PSP">
        <select name="supplierId" defaultValue={channel?.supplierId ?? suppliers[0]?.id ?? ""} required>
          <option value="" disabled>请选择 PSP</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
          ))}
        </select>
      </Field>
      <Field label="通道名称">
        <input name="name" defaultValue={channel?.name ?? ""} placeholder="Sandbox Card Channel" required />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="支付方式">
          <select name="paymentMethod" defaultValue={channel?.paymentMethod ?? "CARD"}>
            <option value="CARD">银行卡 Card</option>
            <option value="LOCAL_PAYMENT">本地支付 Local Payment</option>
            <option value="BANK_TRANSFER">银行转账 Bank Transfer</option>
            <option value="SANDBOX_PAY">Sandbox Pay</option>
          </select>
        </Field>
        <Field label="状态">
          <select name="status" defaultValue={channel?.status ?? "ACTIVE"}>
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">禁用</option>
          </select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="国家/地区">
          <input name="country" defaultValue={channel?.country ?? ""} placeholder="HK / SG / US" />
        </Field>
        <Field label="币种">
          <input name="currency" defaultValue={channel?.currency ?? "USD"} placeholder="USD" required />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="PSP 成本费率" hint="例如 0.018 代表 1.8%">
          <input name="feeRate" defaultValue={channel?.feeRate ?? "0.018"} placeholder="0.018" />
        </Field>
        <Field label="固定成本手续费" hint="当前按商户通道配置参与结算">
          <input name="pspFixedFee" defaultValue="0" placeholder="0.30" />
        </Field>
        <Field label="优先级">
          <input name="priority" type="number" defaultValue={channel?.priority ?? 100} placeholder="100" />
        </Field>
      </div>
      <div className="grid gap-2 rounded-lg border border-line bg-slate-50 p-3 text-sm text-slate-700">
        <label className="flex items-center gap-2 font-bold">
          <input className="w-4" type="checkbox" name="isPrimary" defaultChecked={channel?.isPrimary ?? false} />
          是否主通道
        </label>
        <label className="flex items-center gap-2 font-bold">
          <input className="w-4" type="checkbox" name="isBackup" defaultChecked={channel?.isBackup ?? false} />
          是否备用通道
        </label>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={loading}>{loading ? "保存中..." : channel ? "保存通道" : "创建通道"}</button>
      </div>
    </form>
  );
}

export function AdminPspManager({ initialSuppliers }: { initialSuppliers: AdminSupplier[] }) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [modal, setModal] = useState<{ type: "create" | "edit" | "detail"; supplier?: AdminSupplier } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string }>({ type: "success", message: "" });
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      const matchStatus = status === "all" || supplier.status === status;
      const text = `${supplier.name} ${supplier.country ?? ""} ${supplier.apiBaseUrl} ${supplier.contactName ?? ""}`.toLowerCase();
      return matchStatus && (!keyword || text.includes(keyword));
    });
  }, [query, status, suppliers]);

  async function refresh() {
    const next = await apiRequest<AdminSupplier[]>("/api/admin/psp");
    setSuppliers(next);
    router.refresh();
  }

  async function run(action: () => Promise<void>, success: string) {
    setLoading(true);
    setToast({ type: "success", message: "" });
    try {
      await action();
      await refresh();
      setToast({ type: "success", message: success });
      setModal(null);
    } catch (err) {
      setToast({ type: "error", message: friendlyError(err instanceof Error ? err.message : "") });
    } finally {
      setLoading(false);
    }
  }

  function saveSupplier(data: Record<string, unknown>, supplier?: AdminSupplier) {
    void run(
      () => apiRequest(supplier ? `/api/admin/psp/${supplier.id}` : "/api/admin/psp", {
        method: supplier ? "PATCH" : "POST",
        body: JSON.stringify(data),
      }),
      supplier ? "PSP 已保存" : "PSP 创建成功",
    );
  }

  function changeStatus(supplier: AdminSupplier, nextStatus: SupplierStatus) {
    setConfirm({
      title: nextStatus === "ACTIVE" ? "启用 PSP" : "禁用 PSP",
      text: nextStatus === "ACTIVE" ? "启用后，该 PSP 下的可用通道可以继续参与收款。" : "禁用后，该 PSP 下的通道可能无法继续用于收款。确认继续吗？",
      confirmLabel: nextStatus === "ACTIVE" ? "确认启用" : "确认禁用",
      action: () => run(
        () => apiRequest(`/api/admin/psp/${supplier.id}/status`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) }),
        nextStatus === "ACTIVE" ? "PSP 已启用" : "PSP 已禁用",
      ),
    });
  }

  return (
    <>
      <SectionHeader
        eyebrow="PSP Operations"
        title="PSP 管理"
        text="管理平台接入的支付供应商。运营人员可以新增、编辑、启用或禁用 PSP，并跳转管理该 PSP 下的通道。"
        action={<button type="button" onClick={() => setModal({ type: "create" })}>新增 PSP</button>}
      />
      <Toast message={toast.message} type={toast.type} />
      <section className="mb-6 grid-fit">
        <Metric label="在线 PSP" value={String(suppliers.filter((item) => item.status === "ACTIVE").length)} />
        <Metric label="禁用 PSP" value={String(suppliers.filter((item) => item.status === "DISABLED").length)} />
        <Metric label="通道数量" value={String(suppliers.reduce((sum, item) => sum + (item.channels?.length ?? 0), 0))} />
      </section>
      <div className="mb-4 grid gap-3 rounded-card border border-line bg-white p-4 shadow-card lg:grid-cols-[1fr_180px]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索 PSP 名称、国家或 API 地址" />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">全部状态</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="DISABLED">DISABLED</option>
        </select>
      </div>
      {loading ? <LoadingSkeleton rows={3} /> : null}
      {filtered.length === 0 ? (
        <EmptyState title="暂无 PSP" text="点击右上角新增 PSP，添加新的支付供应商。" />
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {["PSP 名称", "国家/地区", "状态", "API 地址", "通道数量", "创建时间", "操作"].map((column) => (
                    <th key={column} className="px-4 py-3 font-bold">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((supplier) => (
                  <tr key={supplier.id} className="border-t border-line align-top hover:bg-blue-50/40">
                    <td className="px-4 py-3 font-bold text-slate-900">{supplier.name}</td>
                    <td className="px-4 py-3 text-slate-700">{supplier.country ?? "-"}</td>
                    <td className="px-4 py-3"><StatusBadge status={supplier.status} /></td>
                    <td className="max-w-[280px] truncate px-4 py-3 text-slate-700">{supplier.apiBaseUrl}</td>
                    <td className="px-4 py-3 text-slate-700">{supplier.channels?.length ?? 0}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(supplier.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <ActionButton icon={Eye} onClick={() => setModal({ type: "detail", supplier })}>查看详情</ActionButton>
                        <ActionButton icon={Pencil} onClick={() => setModal({ type: "edit", supplier })}>编辑</ActionButton>
                        {supplier.status === "ACTIVE" ? (
                          <ActionButton icon={PowerOff} danger onClick={() => changeStatus(supplier, "DISABLED")}>禁用</ActionButton>
                        ) : (
                          <ActionButton icon={Power} onClick={() => changeStatus(supplier, "ACTIVE")}>启用</ActionButton>
                        )}
                        <Link className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-blue-50 hover:text-brand" href={`/admin/channels?supplierId=${supplier.id}`}>
                          <Route className="h-3.5 w-3.5" />
                          管理通道
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {modal?.type === "create" ? (
        <Modal title="新增 PSP" text="添加新的支付供应商，例如 Stripe、Airwallex、Sandbox PSP。" onClose={() => setModal(null)}>
          <SupplierForm loading={loading} onSubmit={(data) => saveSupplier(data)} />
        </Modal>
      ) : null}
      {modal?.type === "edit" && modal.supplier ? (
        <Modal title="编辑 PSP" text="修改 PSP 基本信息、API 地址和启用状态。" onClose={() => setModal(null)}>
          <SupplierForm supplier={modal.supplier} loading={loading} onSubmit={(data) => saveSupplier(data, modal.supplier)} />
        </Modal>
      ) : null}
      {modal?.type === "detail" && modal.supplier ? (
        <Modal title="PSP 详情" text="查看 PSP 基本信息、状态和关联通道。" onClose={() => setModal(null)}>
          <DetailGrid rows={[
            ["PSP 名称", modal.supplier.name],
            ["国家/地区", modal.supplier.country ?? "-"],
            ["联系人", modal.supplier.contactName ?? "-"],
            ["邮箱", modal.supplier.email ?? "-"],
            ["状态", modal.supplier.status],
            ["API 地址", modal.supplier.apiBaseUrl],
            ["关联通道数", String(modal.supplier.channels?.length ?? 0)],
            ["最近更新时间", formatDate(modal.supplier.updatedAt)],
          ]} />
        </Modal>
      ) : null}
      <ConfirmDialog open={!!confirm} title={confirm?.title ?? ""} text={confirm?.text ?? ""} confirmLabel={confirm?.confirmLabel ?? "确认"} onConfirm={() => { const action = confirm?.action; setConfirm(null); void action?.(); }} onCancel={() => setConfirm(null)} />
    </>
  );
}

export function AdminChannelManager({ initialSuppliers, initialChannels }: { initialSuppliers: AdminSupplier[]; initialChannels: AdminChannel[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSupplierId = searchParams.get("supplierId") ?? "all";
  const [channels, setChannels] = useState(initialChannels);
  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [method, setMethod] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<{ type: "create" | "edit" | "detail"; channel?: AdminChannel } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string }>({ type: "success", message: "" });
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return channels.filter((channel) => {
      const matchSupplier = supplierId === "all" || channel.supplierId === supplierId;
      const matchMethod = method === "all" || channel.paymentMethod === method;
      const matchStatus = status === "all" || channel.status === status;
      const text = `${channel.name} ${channel.supplier?.name ?? ""} ${channel.country ?? ""} ${channel.currency}`.toLowerCase();
      return matchSupplier && matchMethod && matchStatus && (!keyword || text.includes(keyword));
    });
  }, [channels, method, query, status, supplierId]);

  async function refresh() {
    const next = await apiRequest<AdminChannel[]>("/api/admin/channels");
    setChannels(next);
    router.refresh();
  }

  async function run(action: () => Promise<void>, success: string) {
    setLoading(true);
    setToast({ type: "success", message: "" });
    try {
      await action();
      await refresh();
      setToast({ type: "success", message: success });
      setModal(null);
    } catch (err) {
      setToast({ type: "error", message: friendlyError(err instanceof Error ? err.message : "") });
    } finally {
      setLoading(false);
    }
  }

  function saveChannel(data: Record<string, unknown>, channel?: AdminChannel) {
    void run(
      () => apiRequest(channel ? `/api/admin/channels/${channel.id}` : "/api/admin/channels", {
        method: channel ? "PATCH" : "POST",
        body: JSON.stringify(data),
      }),
      channel ? "通道已保存" : "通道创建成功",
    );
  }

  function changeChannelStatus(channel: AdminChannel, nextStatus: SupplierStatus) {
    setConfirm({
      title: nextStatus === "ACTIVE" ? "启用通道" : "禁用通道",
      text: nextStatus === "ACTIVE" ? "启用后，该通道可以继续参与收款路由。" : "禁用后，订单不会继续优先使用该通道。确认继续吗？",
      confirmLabel: nextStatus === "ACTIVE" ? "确认启用" : "确认禁用",
      action: () => run(
        () => apiRequest(`/api/admin/channels/${channel.id}/status`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) }),
        nextStatus === "ACTIVE" ? "通道已启用" : "通道已禁用",
      ),
    });
  }

  function setRouteRole(channel: AdminChannel, role: "primary" | "backup") {
    setConfirm({
      title: role === "primary" ? "设为主通道" : "设为备用通道",
      text: role === "primary" ? "设置为主通道后，订单会优先使用该通道。" : "主通道失败时会尝试备用通道。",
      confirmLabel: role === "primary" ? "设为主通道" : "设为备用通道",
      action: () => run(
        () => apiRequest(`/api/admin/channels/${channel.id}/${role}`, { method: "PATCH" }),
        role === "primary" ? "已设为主通道" : "已设为备用通道",
      ),
    });
  }

  return (
    <>
      <SectionHeader
        eyebrow="Channel Operations"
        title="支付通道管理"
        text="管理每个 PSP 下的支付方式与主备通道。运营人员可以新增、编辑、启停通道，并设置全局主通道或备用通道。"
        action={<button type="button" onClick={() => setModal({ type: "create" })}>新增通道</button>}
      />
      <Toast message={toast.message} type={toast.type} />
      <section className="mb-6 grid-fit">
        <Metric label="在线通道" value={String(channels.filter((item) => item.status === "ACTIVE").length)} />
        <Metric label="主通道" value={String(channels.filter((item) => item.isPrimary).length)} />
        <Metric label="备用通道" value={String(channels.filter((item) => item.isBackup).length)} />
      </section>
      <div className="mb-4 grid gap-3 rounded-card border border-line bg-white p-4 shadow-card lg:grid-cols-[1fr_180px_180px_180px]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索通道名称、PSP 或币种" />
        <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
          <option value="all">全部 PSP</option>
          {initialSuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
        </select>
        <select value={method} onChange={(event) => setMethod(event.target.value)}>
          <option value="all">全部支付方式</option>
          <option value="CARD">CARD</option>
          <option value="LOCAL_PAYMENT">LOCAL_PAYMENT</option>
          <option value="BANK_TRANSFER">BANK_TRANSFER</option>
          <option value="SANDBOX_PAY">SANDBOX_PAY</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">全部状态</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="DISABLED">DISABLED</option>
        </select>
      </div>
      {supplierId !== "all" ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
          <SlidersHorizontal className="h-4 w-4" />
          当前已按 PSP 筛选：{initialSuppliers.find((item) => item.id === supplierId)?.name ?? supplierId}
          <button type="button" className="button secondary px-3 py-2 text-xs" onClick={() => setSupplierId("all")}>清除筛选</button>
        </div>
      ) : null}
      {loading ? <LoadingSkeleton rows={3} /> : null}
      {filtered.length === 0 ? (
        <EmptyState title="暂无通道" text="点击右上角新增通道，添加 PSP 下的支付方式。" />
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {["通道名称", "所属 PSP", "支付方式", "国家/地区", "币种", "成本费率", "状态", "主通道", "备用通道", "操作"].map((column) => (
                    <th key={column} className="px-4 py-3 font-bold">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((channel) => (
                  <tr key={channel.id} className="border-t border-line align-top hover:bg-blue-50/40">
                    <td className="px-4 py-3 font-bold text-slate-900">{channel.name}</td>
                    <td className="px-4 py-3 text-slate-700">{channel.supplier?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{channel.paymentMethod}</td>
                    <td className="px-4 py-3 text-slate-700">{channel.country ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{channel.currency}</td>
                    <td className="px-4 py-3 text-slate-700">{rateLabel(channel.feeRate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={channel.status} /></td>
                    <td className="px-4 py-3">{channel.isPrimary ? <StatusBadge status="PRIMARY" /> : "-"}</td>
                    <td className="px-4 py-3">{channel.isBackup ? <StatusBadge status="BACKUP" /> : "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <ActionButton icon={Eye} onClick={() => setModal({ type: "detail", channel })}>查看详情</ActionButton>
                        <ActionButton icon={Pencil} onClick={() => setModal({ type: "edit", channel })}>编辑</ActionButton>
                        {channel.status === "ACTIVE" ? (
                          <ActionButton icon={PowerOff} danger onClick={() => changeChannelStatus(channel, "DISABLED")}>禁用</ActionButton>
                        ) : (
                          <ActionButton icon={Power} onClick={() => changeChannelStatus(channel, "ACTIVE")}>启用</ActionButton>
                        )}
                        <ActionButton icon={ShieldCheck} onClick={() => setRouteRole(channel, "primary")}>设为主通道</ActionButton>
                        <ActionButton icon={Shuffle} onClick={() => setRouteRole(channel, "backup")}>设为备用通道</ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {modal?.type === "create" ? (
        <Modal title="新增通道" text="为 PSP 添加支付方式，并设置成本费率、优先级和主备角色。" onClose={() => setModal(null)}>
          <ChannelForm suppliers={initialSuppliers} loading={loading} onSubmit={(data) => saveChannel(data)} />
        </Modal>
      ) : null}
      {modal?.type === "edit" && modal.channel ? (
        <Modal title="编辑通道" text="修改通道基础信息、支付方式、成本费率和状态。" onClose={() => setModal(null)}>
          <ChannelForm suppliers={initialSuppliers} channel={modal.channel} loading={loading} onSubmit={(data) => saveChannel(data, modal.channel)} />
        </Modal>
      ) : null}
      {modal?.type === "detail" && modal.channel ? (
        <Modal title="通道详情" text="查看通道基础信息、路由角色和最近更新时间。" onClose={() => setModal(null)}>
          <DetailGrid rows={[
            ["通道名称", modal.channel.name],
            ["所属 PSP", modal.channel.supplier?.name ?? "-"],
            ["支付方式", modal.channel.paymentMethod],
            ["国家/地区", modal.channel.country ?? "-"],
            ["币种", modal.channel.currency],
            ["PSP 成本费率", rateLabel(modal.channel.feeRate)],
            ["优先级", String(modal.channel.priority)],
            ["状态", modal.channel.status],
            ["主通道", modal.channel.isPrimary ? "是" : "否"],
            ["备用通道", modal.channel.isBackup ? "是" : "否"],
            ["最近更新时间", formatDate(modal.channel.updatedAt)],
          ]} />
        </Modal>
      ) : null}
      <ConfirmDialog open={!!confirm} title={confirm?.title ?? ""} text={confirm?.text ?? ""} confirmLabel={confirm?.confirmLabel ?? "确认"} onConfirm={() => { const action = confirm?.action; setConfirm(null); void action?.(); }} onCancel={() => setConfirm(null)} />
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-card">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-3 text-3xl font-black text-brand">{value}</p>
    </div>
  );
}

function DetailGrid({ rows }: { rows: [string, string][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-line bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">{label}</p>
          <p className="mt-1 break-words text-sm font-bold text-slate-900">{value}</p>
        </div>
      ))}
    </div>
  );
}
