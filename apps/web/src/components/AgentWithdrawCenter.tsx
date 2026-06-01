"use client";

import { useMemo, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { DataTable } from "./DataTable";
import { Toast } from "./Toast";
import { StatusBadge } from "./StatusBadge";
import { money } from "@/lib/api";

type AgentWithdraw = {
  id: string;
  withdrawNo: string;
  amount: number;
  feeAmount: number;
  actualPayout: number;
  status: "PENDING" | "REVIEWING" | "APPROVED" | "REJECTED" | "PAID";
  createdAt: string;
  bankName: string;
  bankAccount: string;
};

const storageKey = "fxpay.agent.withdraw.requests";

function loadStoredRequests(): AgentWithdraw[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    const data = raw ? (JSON.parse(raw) as AgentWithdraw[]) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveStoredRequests(records: AgentWithdraw[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(records));
}

export function AgentWithdrawCenter({
  currency = "USD",
  availableBalance,
  frozenBalance,
  todayCommission,
}: {
  currency?: string;
  availableBalance: number;
  frozenBalance: number;
  todayCommission: number;
}) {
  const [records, setRecords] = useState<AgentWithdraw[]>(() => loadStoredRequests());
  const [form, setForm] = useState({
    amount: "20.00",
    bankName: "",
    bankAccount: "",
    remark: "",
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const amount = Number(form.amount || 0);
  const feeRate = 0.01;
  const fixedFee = 0.5;
  const fee = amount * feeRate + fixedFee;
  const payout = Math.max(0, amount - fee);
  const processingAmount = records.filter((item) => item.status === "PENDING" || item.status === "REVIEWING" || item.status === "APPROVED").reduce((sum, item) => sum + item.amount, 0);
  const paidToday = records.filter((item) => item.status === "PAID").reduce((sum, item) => sum + item.actualPayout, 0);

  const validation = useMemo(() => {
    if (!amount || Number.isNaN(amount)) return "请输入正确的提现金额。";
    if (amount < 1) return "提现金额不能低于 USD 1.00。";
    if (amount > 5000) return "提现金额不能高于 USD 5,000.00。";
    if (amount > availableBalance) return "可提现余额不足，请调整金额。";
    if (!form.bankName.trim() || !form.bankAccount.trim()) return "请填写收款银行和收款账户。";
    return "";
  }, [amount, availableBalance, form.bankAccount, form.bankName]);

  const rows = records.map((item) => [
    item.withdrawNo,
    money(item.amount, currency),
    money(item.feeAmount, currency),
    money(item.actualPayout, currency),
    <StatusBadge key={item.id} status={item.status} />,
    new Date(item.createdAt).toLocaleString(),
  ]);

  function createRequest() {
    const now = new Date();
    const withdrawNo = `AW${now.getFullYear()}${Math.random().toString().slice(2, 10)}`;
    const next: AgentWithdraw = {
      id: `local-${Date.now()}`,
      withdrawNo,
      amount,
      feeAmount: fee,
      actualPayout: payout,
      status: "PENDING",
      createdAt: now.toISOString(),
      bankName: form.bankName,
      bankAccount: form.bankAccount,
    };
    const merged = [next, ...records];
    setRecords(merged);
    saveStoredRequests(merged);
    setForm({ amount: "20.00", bankName: "", bankAccount: "", remark: "" });
    setMessage("提现申请已提交，等待平台审核。");
    setError("");
    setConfirmOpen(false);
  }

  return (
    <div className="grid gap-6">
      <section className="grid-fit">
        <div className="surface p-5">
          <p className="text-sm font-semibold text-muted">佣金余额</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{money(availableBalance, currency)}</p>
        </div>
        <div className="surface p-5">
          <p className="text-sm font-semibold text-muted">可提现余额</p>
          <p className="mt-2 text-3xl font-black text-success">{money(availableBalance, currency)}</p>
        </div>
        <div className="surface p-5">
          <p className="text-sm font-semibold text-muted">提现处理中</p>
          <p className="mt-2 text-3xl font-black text-warn">{money(processingAmount + frozenBalance, currency)}</p>
        </div>
        <div className="surface p-5">
          <p className="text-sm font-semibold text-muted">今日佣金</p>
          <p className="mt-2 text-3xl font-black text-brand">{money(todayCommission, currency)}</p>
        </div>
        <div className="surface p-5">
          <p className="text-sm font-semibold text-muted">今日到账</p>
          <p className="mt-2 text-3xl font-black text-cyan">{money(paidToday, currency)}</p>
        </div>
      </section>

      <form
        className="surface grid gap-3 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (validation) {
            setError(validation);
            return;
          }
          setError("");
          setConfirmOpen(true);
        }}
      >
        <div>
          <h2 className="text-lg font-black text-slate-950">提交提现申请</h2>
          <p className="mt-1 text-sm text-muted">该申请用于代理佣金结算，不会影响商户提现流程。</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">提现金额</label>
            <input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="20.00" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">收款银行</label>
            <input value={form.bankName} onChange={(event) => setForm({ ...form, bankName: event.target.value })} placeholder="Bank name" />
          </div>
        </div>
        <label className="text-sm font-semibold text-slate-700">收款账户</label>
        <input value={form.bankAccount} onChange={(event) => setForm({ ...form, bankAccount: event.target.value })} placeholder="Account number" />
        <label className="text-sm font-semibold text-slate-700">备注</label>
        <textarea value={form.remark} onChange={(event) => setForm({ ...form, remark: event.target.value })} rows={2} placeholder="可选备注" />
        <div className="rounded-lg border border-line bg-slate-50 p-3 text-sm text-slate-700">
          <p>手续费：{money(fee, currency)}（{feeRate * 100}% + {money(fixedFee, currency)}）</p>
          <p className="mt-1">预计到账：{money(payout, currency)}</p>
          <p className="mt-1">规则：最低 {money(1, currency)}，最高 {money(5000, currency)}，T+1 结算。</p>
        </div>
        <button type="submit">提交提现申请</button>
        <Toast message={message} type="success" />
        <Toast message={error} type="error" />
      </form>

      <section>
        <h2 className="mb-3 text-lg font-black text-slate-950">提现记录</h2>
        <DataTable
          columns={["提现单号", "金额", "手续费", "实际到账", "状态", "创建时间"]}
          rows={rows}
          empty="暂无提现记录。"
        />
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="确认提交提现申请"
        text={`确认提交 ${money(amount, currency)} 的代理提现申请吗？`}
        confirmLabel="确认提交"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => createRequest()}
      />
    </div>
  );
}
