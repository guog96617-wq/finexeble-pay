"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/api";
import { ConfirmDialog } from "./ConfirmDialog";
import { StatusBadge } from "./StatusBadge";
import { Toast } from "./Toast";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type Withdraw = {
  id: string;
  withdrawNo: string;
  ownerType?: "MERCHANT" | "AGENT";
  status: string;
  amount: string;
  currency: string;
  asset?: string | null;
  network?: string | null;
  addressSnapshot?: string | null;
  addressLabelSnapshot?: string | null;
  createdAt?: string;
  merchant?: { name: string } | null;
  agent?: { name: string } | null;
};

export function AdminWithdrawActions({ withdraws }: { withdraws: Withdraw[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"pending" | "processed">("pending");
  const [confirm, setConfirm] = useState<{ id: string; action: "approve" | "reject" | "paid"; label: string } | null>(null);
  const visibleWithdraws = withdraws.filter((withdraw) => (
    tab === "pending" ? withdraw.status === "PENDING" : ["APPROVED", "REJECTED", "PAID"].includes(withdraw.status)
  ));

  async function review(id: string, action: "approve" | "reject" | "paid") {
    setBusy(`${id}:${action}`);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/withdraws/${id}/${action}`, { method: "PATCH" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error?.message ?? "Withdraw review failed.");
        return;
      }
      setMessage(`Withdraw ${action} completed.`);
      router.refresh();
    } catch {
      setError("Cannot connect to API. Please try again.");
    } finally {
      setBusy("");
      setConfirm(null);
    }
  }

  return (
    <div className="surface overflow-hidden">
      <div className="grid gap-2 border-b border-line p-4">
        <div>
          <h3 className="font-black text-slate-950">提现审核工作台</h3>
          <p className="mt-1 text-sm text-muted">运营可查看用户类型、提现金额、币种网络和钱包地址快照后再审核。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={tab === "pending" ? "px-4 py-2 text-xs" : "button secondary px-4 py-2 text-xs"} onClick={() => setTab("pending")}>待处理</button>
          <button type="button" className={tab === "processed" ? "px-4 py-2 text-xs" : "button secondary px-4 py-2 text-xs"} onClick={() => setTab("processed")}>已处理</button>
        </div>
        <Toast message={message} type="success" />
        <Toast message={error} type="error" />
      </div>
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {["提现单", "用户类型", "用户名称", "金额", "币种", "网络", "钱包名称", "地址尾号", "状态", "创建时间", "操作"].map((column) => (
              <th key={column} className="px-4 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleWithdraws.length === 0 ? (
            <tr className="border-t border-line">
              <td className="px-4 py-5 text-muted" colSpan={11}>
                {tab === "pending" ? "暂无待处理提现申请。" : "暂无已处理提现申请。"}
              </td>
            </tr>
          ) : null}
          {visibleWithdraws.map((withdraw) => (
            <tr key={withdraw.id} className="border-t border-line">
              <td className="px-4 py-3 font-bold text-slate-900">{withdraw.withdrawNo}</td>
              <td className="px-4 py-3 text-slate-700">{withdraw.ownerType === "AGENT" ? "Agent" : "Merchant"}</td>
              <td className="px-4 py-3 text-slate-700">{withdraw.ownerType === "AGENT" ? withdraw.agent?.name ?? "-" : withdraw.merchant?.name ?? "-"}</td>
              <td className="px-4 py-3 text-slate-700">{money(withdraw.amount, withdraw.currency)}</td>
              <td className="px-4 py-3 text-slate-700">{withdraw.asset ?? "-"}</td>
              <td className="px-4 py-3 text-slate-700">{withdraw.network ?? "-"}</td>
              <td className="px-4 py-3 text-slate-700">{withdraw.addressLabelSnapshot ?? "-"}</td>
              <td className="px-4 py-3 font-mono text-slate-700">{withdraw.addressSnapshot ? `****${withdraw.addressSnapshot.slice(-4)}` : "-"}</td>
              <td className="px-4 py-3 text-slate-700"><StatusBadge status={withdraw.status} /></td>
              <td className="px-4 py-3 text-slate-700">{withdraw.createdAt ? new Date(withdraw.createdAt).toLocaleString() : "-"}</td>
              <td className="flex flex-wrap gap-2 px-4 py-3">
                {withdraw.status === "PENDING" ? (
                  <>
                    <button type="button" className="px-4 py-2 text-xs" disabled={!!busy} onClick={() => setConfirm({ id: withdraw.id, action: "approve", label: "批准提现" })}>
                      {busy === `${withdraw.id}:approve` ? "..." : "批准"}
                    </button>
                    <button type="button" className="button secondary px-4 py-2 text-xs" disabled={!!busy} onClick={() => setConfirm({ id: withdraw.id, action: "reject", label: "拒绝提现" })}>
                      拒绝
                    </button>
                  </>
                ) : withdraw.status === "APPROVED" ? (
                  <button type="button" className="button secondary px-4 py-2 text-xs" disabled={!!busy} onClick={() => setConfirm({ id: withdraw.id, action: "paid", label: "标记已支付" })}>
                    标记已支付
                  </button>
                ) : (
                  <span className="text-xs font-bold text-muted">已处理</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.label ?? "Confirm action"}
        text="此操作会更新提现状态、钱包流水和审计日志。请确认钱包地址快照和网络无误。"
        confirmLabel={confirm?.label ?? "Confirm"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            void review(confirm.id, confirm.action);
          }
        }}
      />
    </div>
  );
}
