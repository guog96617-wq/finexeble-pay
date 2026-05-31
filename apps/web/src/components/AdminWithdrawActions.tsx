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
  status: string;
  amount: string;
  currency: string;
  merchant?: { name: string } | null;
};

export function AdminWithdrawActions({ withdraws }: { withdraws: Withdraw[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState<{ id: string; action: "approve" | "reject" | "paid"; label: string } | null>(null);

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
      <div className="grid gap-2 border-b border-line p-3">
        <Toast message={message} type="success" />
        <Toast message={error} type="error" />
      </div>
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-[#0f2745] text-slate-300">
          <tr>
            {["Withdraw", "Merchant", "Status", "Amount", "Actions"].map((column) => (
              <th key={column} className="px-4 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {withdraws.length === 0 ? (
            <tr className="border-t border-line">
              <td className="px-4 py-5 text-slate-400" colSpan={5}>
                No withdraws found.
              </td>
            </tr>
          ) : null}
          {withdraws.map((withdraw) => (
            <tr key={withdraw.id} className="border-t border-line">
              <td className="px-4 py-3 text-slate-200">{withdraw.withdrawNo}</td>
              <td className="px-4 py-3 text-slate-200">{withdraw.merchant?.name ?? "-"}</td>
              <td className="px-4 py-3 text-slate-200"><StatusBadge status={withdraw.status} /></td>
              <td className="px-4 py-3 text-slate-200">{money(withdraw.amount, withdraw.currency)}</td>
              <td className="flex flex-wrap gap-2 px-4 py-3">
                <button type="button" className="px-3 py-2 text-xs" disabled={!!busy} onClick={() => setConfirm({ id: withdraw.id, action: "approve", label: "Approve withdraw" })}>
                  {busy === `${withdraw.id}:approve` ? "..." : "Approve"}
                </button>
                <button type="button" className="button secondary px-3 py-2 text-xs" disabled={!!busy} onClick={() => setConfirm({ id: withdraw.id, action: "reject", label: "Reject withdraw" })}>
                  Reject
                </button>
                <button type="button" className="button secondary px-3 py-2 text-xs" disabled={!!busy} onClick={() => setConfirm({ id: withdraw.id, action: "paid", label: "Mark withdraw paid" })}>
                  Paid
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.label ?? "Confirm action"}
        text="This updates the withdraw status and wallet ledger. Continue?"
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
