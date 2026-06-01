"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "./Toast";
import { ConfirmDialog } from "./ConfirmDialog";

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

function friendlyError(message: string) {
  if (message.includes("MERCHANT_FEE_TOO_LOW")) return "该费率低于平台允许的最低费率，请重新设置。";
  if (message.includes("CHANNEL_NOT_ALLOWED")) return "该通道不在当前允许范围内，请先为代理开通通道权限。";
  if (message.includes("not found")) return "没有找到对应记录，请刷新页面后重试。";
  return "操作失败，请检查填写内容后重试。";
}

function useAction() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function run(action: () => Promise<unknown>, success = "Saved") {
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await action();
      setMessage(success);
      router.refresh();
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : "Operation failed"));
    } finally {
      setLoading(false);
    }
  }
  return { message, error, loading, run };
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      {children}
      {hint ? <span className="text-xs font-medium text-muted">{hint}</span> : null}
    </label>
  );
}

export function CreatePspForm() {
  const { message, error, loading, run } = useAction();
  return (
    <form
      id="create-psp"
      className="surface grid gap-4 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        void run(() => post("/api/admin/suppliers", data), "PSP 创建成功");
      }}
    >
      <div>
        <h3 className="text-lg font-black text-slate-950">新增 PSP</h3>
        <p className="mt-1 text-sm text-muted">添加新的支付供应商，例如 Stripe、Airwallex、Sandbox PSP。</p>
      </div>
      <Field label="PSP 名称"><input name="name" placeholder="Sandbox PSP" required /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="国家/地区"><input name="country" placeholder="HK / SG / US" /></Field>
        <Field label="状态">
          <select name="status" defaultValue="ACTIVE">
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">禁用</option>
          </select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="联系人"><input name="contactName" placeholder="Operations contact" /></Field>
        <Field label="邮箱"><input name="email" type="email" placeholder="ops@example.com" /></Field>
      </div>
      <Field label="API Base URL"><input name="apiBaseUrl" placeholder="API base URL" defaultValue="https://sandbox-psp.local" /></Field>
      <Field label="描述"><textarea name="description" placeholder="备注 PSP 用途、支持地区或接入说明" rows={3} /></Field>
      <button type="submit" disabled={loading}>{loading ? "创建中..." : "新增 PSP"}</button>
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
    </form>
  );
}

export function CreateChannelForm({ suppliers }: { suppliers: { id: string; name: string }[] }) {
  const { message, error, loading, run } = useAction();
  return (
    <form
      id="create-channel"
      className="surface grid gap-4 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        void run(() => post("/api/admin/channels", data), "通道创建成功");
      }}
    >
      <div>
        <h3 className="text-lg font-black text-slate-950">新增通道</h3>
        <p className="mt-1 text-sm text-muted">为某个 PSP 新增支付方式，并设置成本费率、优先级和主备状态。</p>
      </div>
      <Field label="所属 PSP">
        <select name="supplierId" required>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
          ))}
        </select>
      </Field>
      <Field label="通道名称"><input name="name" placeholder="Sandbox Card Channel" required /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="支付方式">
          <select name="paymentMethod" defaultValue="CARD">
            <option value="CARD">银行卡 Card</option>
            <option value="LOCAL_PAYMENT">本地支付 Local Payment</option>
            <option value="BANK_TRANSFER">银行转账 Bank Transfer</option>
            <option value="SANDBOX_PAY">Sandbox Pay</option>
          </select>
        </Field>
        <Field label="状态">
          <select name="status" defaultValue="ACTIVE">
            <option value="ACTIVE">启用</option>
            <option value="DISABLED">禁用</option>
          </select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="国家/地区"><input name="country" placeholder="HK / SG / US" /></Field>
        <Field label="币种"><input name="currency" placeholder="Currency" defaultValue="USD" /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="PSP 成本费率" hint="例如 0.018 代表 1.8%"><input name="feeRate" placeholder="0.018" defaultValue="0.018" /></Field>
        <Field label="固定成本手续费"><input name="pspFixedFee" placeholder="0.30" defaultValue="0" /></Field>
        <Field label="优先级"><input name="priority" type="number" placeholder="100" defaultValue="100" /></Field>
      </div>
      <div className="grid gap-2 rounded-lg border border-line bg-slate-50 p-3 text-sm text-slate-700">
        <label className="flex items-center gap-2 font-bold"><input className="w-4" type="checkbox" name="isPrimary" /> 设为主通道</label>
        <label className="flex items-center gap-2 font-bold"><input className="w-4" type="checkbox" name="isBackup" /> 设为备用通道</label>
      </div>
      <button type="submit" disabled={loading}>{loading ? "创建中..." : "新增通道"}</button>
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
    </form>
  );
}

export function ChannelRoleButtons({ id }: { id: string }) {
  const { message, error, loading, run } = useAction();
  const [confirm, setConfirm] = useState<{ title: string; text: string; action: () => void } | null>(null);
  return (
    <div className="flex flex-wrap gap-2">
      <button disabled={loading} type="button" className="button secondary px-3 py-2 text-xs" onClick={() => run(() => post(`/api/admin/channels/${id}`, {}, "PATCH"), "通道已保存")}>编辑</button>
      <button disabled={loading} type="button" className="button secondary px-3 py-2 text-xs" onClick={() => setConfirm({ title: "设为主通道", text: "确认将该通道设为同币种主通道吗？", action: () => void run(() => post(`/api/admin/channels/${id}/primary`, undefined, "PATCH"), "已设为主通道") })}>设为主通道</button>
      <button disabled={loading} type="button" className="button secondary px-3 py-2 text-xs" onClick={() => setConfirm({ title: "设为备用通道", text: "确认将该通道设为同币种备用通道吗？", action: () => void run(() => post(`/api/admin/channels/${id}/backup`, undefined, "PATCH"), "已设为备用通道") })}>设为备用通道</button>
      <button disabled={loading} type="button" className="button secondary px-3 py-2 text-xs" onClick={() => run(() => post(`/api/admin/channels/${id}/enable`, undefined, "PATCH"), "通道已启用")}>启用</button>
      <button disabled={loading} type="button" className="button secondary px-3 py-2 text-xs" onClick={() => setConfirm({ title: "禁用通道", text: "禁用后商户将不能继续通过该通道收款。确认继续吗？", action: () => void run(() => post(`/api/admin/channels/${id}/disable`, undefined, "PATCH"), "通道已禁用") })}>禁用</button>
      <ConfirmDialog open={!!confirm} title={confirm?.title ?? ""} text={confirm?.text ?? ""} confirmLabel="确认" onConfirm={() => { confirm?.action(); setConfirm(null); }} onCancel={() => setConfirm(null)} />
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
    </div>
  );
}

export function SupplierActionButtons({ id }: { id: string }) {
  const { message, error, loading, run } = useAction();
  const [confirm, setConfirm] = useState<"enable" | "disable" | null>(null);
  return (
    <div className="flex flex-wrap gap-2">
      <button disabled={loading} type="button" className="button secondary px-3 py-2 text-xs" onClick={() => run(() => post(`/api/admin/suppliers/${id}`, {}, "PATCH"), "PSP 已保存")}>编辑</button>
      <button disabled={loading} type="button" className="button secondary px-3 py-2 text-xs" onClick={() => setConfirm("enable")}>启用</button>
      <button disabled={loading} type="button" className="button secondary px-3 py-2 text-xs" onClick={() => setConfirm("disable")}>禁用</button>
      <a className="button secondary px-3 py-2 text-xs" href="/admin/channels">管理通道</a>
      <ConfirmDialog
        open={!!confirm}
        title={confirm === "enable" ? "启用 PSP" : "禁用 PSP"}
        text={confirm === "enable" ? "确认启用该 PSP 吗？" : "禁用后该 PSP 下的通道可能无法继续用于收款。确认继续吗？"}
        confirmLabel="确认"
        onConfirm={() => {
          const action = confirm;
          setConfirm(null);
          if (action) void run(() => post(`/api/admin/suppliers/${id}/${action}`, undefined, "PATCH"), action === "enable" ? "PSP 已启用" : "PSP 已禁用");
        }}
        onCancel={() => setConfirm(null)}
      />
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
    </div>
  );
}

export function AgentFeeRuleForm({ agentId, channelIds }: { agentId: string; channelIds: string[] }) {
  const { message, error, loading, run } = useAction();
  return (
    <form
      className="surface grid gap-4 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = Object.fromEntries(new FormData(event.currentTarget));
        const body = {
          ...form,
          allowedPaymentMethods: ["CARD", "LOCAL_PAYMENT", "BANK_TRANSFER", "SANDBOX_PAY"],
          allowedChannelIds: channelIds,
        };
        void run(() => post(`/api/admin/agents/${agentId}/fee-rules`, body), "代理费率权限已保存");
      }}
    >
      <div>
        <h3 className="text-lg font-black text-slate-950">代理费率权限</h3>
        <p className="mt-1 text-sm text-muted">平台给代理设置最低费率。代理给商户设置费率时，不能低于这里的费率。</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="最低商户费率" hint="例如 0.10 代表 10%"><input name="minMerchantFeeRate" placeholder="0.10" defaultValue="0.10" /></Field>
        <Field label="最低提现费率" hint="例如 0.01 代表 1%"><input name="minWithdrawFeeRate" placeholder="0.01" defaultValue="0.01" /></Field>
      </div>
      <div className="grid gap-3 rounded-lg border border-line bg-slate-50 p-3 text-sm text-slate-700 sm:grid-cols-3">
        <div><p className="font-black">可管理 PSP</p><p className="mt-1 text-muted">默认开放当前平台 PSP。</p></div>
        <div><p className="font-black">可管理支付方式</p><p className="mt-1 text-muted">CARD / LOCAL / BANK / SANDBOX。</p></div>
        <div><p className="font-black">可管理通道</p><p className="mt-1 text-muted">当前 {channelIds.length} 个通道。</p></div>
      </div>
      <button type="submit" disabled={loading}>{loading ? "保存中..." : "保存代理费率权限"}</button>
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
    </form>
  );
}

export function MerchantChannelForm({ merchantId, channelId, agent = false }: { merchantId: string; channelId: string; agent?: boolean }) {
  const { message, error, loading, run } = useAction();
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
      <Field label="通道状态">
        <select name="role" defaultValue="enabled">
          <option value="enabled">启用</option>
          <option value="primary">设为主通道</option>
          <option value="backup">设为备用通道</option>
        </select>
      </Field>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="商户百分比手续费"><input name="merchantFeeRate" placeholder="0.12" defaultValue="0.12" /></Field>
        <Field label="商户固定手续费"><input name="merchantFixedFee" placeholder="0.30" defaultValue="0.30" /></Field>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="最低手续费"><input name="minFee" placeholder="0" defaultValue="0" /></Field>
        <Field label="最高手续费"><input name="maxFee" placeholder="可留空" /></Field>
      </div>
      <button type="submit" className="px-3 py-2 text-xs" disabled={loading}>{loading ? "保存中..." : "保存配置"}</button>
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
    </form>
  );
}

export function WithdrawRuleForm({ merchantId, agentId, agent = false }: { merchantId?: string; agentId?: string; agent?: boolean }) {
  const { message, error, loading, run } = useAction();
  const path = agent && merchantId ? `/api/agent/merchants/${merchantId}/withdraw-rule` : "/api/admin/withdraw-rules";
  return (
    <form
      className="surface grid gap-4 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        void run(() => post(path, { ...data, merchantId, agentId }), "提现规则已保存");
      }}
    >
      <div>
        <h3 className="text-lg font-black text-slate-950">提现规则</h3>
        <p className="mt-1 text-sm text-muted">设置提现范围、手续费、到账天数和是否需要人工审核。</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="币种"><input name="currency" defaultValue="USD" /></Field>
        <Field label="最低提现金额"><input name="minAmount" placeholder="Min amount" defaultValue="1" /></Field>
        <Field label="最高提现金额"><input name="maxAmount" placeholder="Max amount" defaultValue="5000" /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="提现百分比手续费"><input name="withdrawFeeRate" placeholder="0.015" defaultValue="0.015" /></Field>
        <Field label="提现固定手续费"><input name="withdrawFixedFee" placeholder="1" defaultValue="1" /></Field>
        <Field label="T+N 结算天数"><input name="settlementDays" placeholder="1" defaultValue="1" /></Field>
      </div>
      <label className="flex items-center gap-2 rounded-lg border border-line bg-slate-50 p-3 text-sm font-bold text-slate-700">
        <input className="w-4" type="checkbox" name="requireManualReview" defaultChecked />
        需要人工审核
      </label>
      <button type="submit" disabled={loading}>{loading ? "保存中..." : "保存提现规则"}</button>
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
