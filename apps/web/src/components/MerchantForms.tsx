"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "./ConfirmDialog";
import { Toast } from "./Toast";
import { money } from "@/lib/api";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type WithdrawRule = {
  minAmount: string;
  maxAmount: string;
  withdrawFeeRate: string;
  withdrawFixedFee: string;
  settlementDays?: number;
  requireManualReview?: boolean;
  currency?: string;
};

function friendlyError(message: string) {
  if (message.includes("WITHDRAW_AMOUNT_TOO_LOW")) return "提现金额低于最低提现金额，请调整后重试。";
  if (message.includes("WITHDRAW_AMOUNT_TOO_HIGH")) return "提现金额高于最高提现金额，请调整后重试。";
  if (message.includes("Insufficient balance")) return "可提现余额不足，请先确认账户余额。";
  return "操作失败，请稍后重试。";
}

export function MerchantOrderForm() {
  const router = useRouter();
  const [order, setOrder] = useState({
    merchantOrderNo: `WEB-${Date.now()}`,
    amount: "100.00",
    currency: "USD",
    customerEmail: "buyer@example.com",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/merchant/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error?.message ?? "创建订单失败，请检查输入信息。");
        return;
      }
      const data = payload?.data ?? payload;
      if (data?.paymentUrl) {
        setPaymentUrl(data.paymentUrl);
      }
      setMessage("订单创建成功。");
      setOrder((current) => ({ ...current, merchantOrderNo: `WEB-${Date.now()}` }));
      router.refresh();
    } catch {
      setError("无法连接 API 服务，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="surface grid gap-3 p-5" onSubmit={submit}>
      <div>
        <h2 className="text-lg font-black text-slate-950">创建订单</h2>
        <p className="mt-1 text-sm text-muted">创建订单后会自动生成 Checkout 支付链接。</p>
      </div>
      <label className="text-sm font-semibold text-slate-700">商户订单号</label>
      <input value={order.merchantOrderNo} onChange={(event) => setOrder({ ...order, merchantOrderNo: event.target.value })} placeholder="商户订单号" required />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-slate-700">金额</label>
          <input value={order.amount} onChange={(event) => setOrder({ ...order, amount: event.target.value })} placeholder="金额" required />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">币种</label>
          <select value={order.currency} onChange={(event) => setOrder({ ...order, currency: event.target.value })}>
            <option>USD</option>
            <option>HKD</option>
            <option>EUR</option>
          </select>
        </div>
      </div>
      <label className="text-sm font-semibold text-slate-700">客户邮箱</label>
      <input value={order.customerEmail} onChange={(event) => setOrder({ ...order, customerEmail: event.target.value })} placeholder="buyer@example.com" />
      <button type="submit" disabled={loading}>{loading ? "创建中..." : "提交订单"}</button>
      {paymentUrl ? (
        <a className="button secondary justify-center" href={paymentUrl} target="_blank" rel="noreferrer">
          打开 Checkout
        </a>
      ) : null}
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
    </form>
  );
}

export function MerchantWithdrawForm({
  rule,
  availableBalance,
  currency = "USD",
}: {
  rule?: WithdrawRule | null;
  availableBalance: string;
  currency?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    amount: "10.00",
    bankAccount: "",
    bankName: "",
    accountName: "",
    remark: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const withdrawFeeRate = Number(rule?.withdrawFeeRate ?? 0.01);
  const withdrawFixedFee = Number(rule?.withdrawFixedFee ?? 0);
  const amount = Number(form.amount || 0);
  const fee = amount * withdrawFeeRate + withdrawFixedFee;
  const payout = Math.max(0, amount - fee);
  const minAmount = Number(rule?.minAmount ?? 1);
  const maxAmount = Number(rule?.maxAmount ?? 10000);
  const exceedBalance = amount > Number(availableBalance || 0);

  const validationMessage = useMemo(() => {
    if (!amount || Number.isNaN(amount)) return "请输入正确的提现金额。";
    if (amount < minAmount) return `提现金额不能低于 ${money(minAmount, currency)}。`;
    if (amount > maxAmount) return `提现金额不能高于 ${money(maxAmount, currency)}。`;
    if (exceedBalance) return "可提现余额不足，请调整金额。";
    if (!form.bankAccount.trim() || !form.bankName.trim() || !form.accountName.trim()) return "请完整填写收款账户信息。";
    return "";
  }, [amount, currency, exceedBalance, form.accountName, form.bankAccount, form.bankName, maxAmount, minAmount]);

  async function submitWithdraw() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/merchant/withdraws`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: form.amount,
          currency,
          bankName: form.bankName,
          bankAccount: form.bankAccount,
          accountName: form.accountName,
          remark: form.remark,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(friendlyError(payload?.error?.message ?? "操作失败"));
        return;
      }
      setMessage("提现申请已提交。");
      setForm((current) => ({ ...current, amount: "10.00", remark: "" }));
      router.refresh();
    } catch {
      setError("无法连接 API 服务，请稍后重试。");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  return (
    <form
      className="surface grid gap-3 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!validationMessage) {
          setConfirmOpen(true);
        } else {
          setError(validationMessage);
        }
      }}
    >
      <div>
        <h2 className="text-lg font-black text-slate-950">提现申请</h2>
        <p className="mt-1 text-sm text-muted">提交提现后，系统会根据规则计算手续费并进入审核流程。</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-slate-700">提现金额</label>
          <input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="10.00" />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">收款账户</label>
          <input value={form.bankAccount} onChange={(event) => setForm({ ...form, bankAccount: event.target.value })} placeholder="银行卡号/账户号" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-slate-700">收款银行</label>
          <input value={form.bankName} onChange={(event) => setForm({ ...form, bankName: event.target.value })} placeholder="银行名称" />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">收款户名</label>
          <input value={form.accountName} onChange={(event) => setForm({ ...form, accountName: event.target.value })} placeholder="账户户名" />
        </div>
      </div>
      <label className="text-sm font-semibold text-slate-700">收款备注</label>
      <textarea value={form.remark} onChange={(event) => setForm({ ...form, remark: event.target.value })} rows={2} placeholder="可选备注" />
      <div className="rounded-lg border border-line bg-slate-50 p-3 text-sm text-slate-700">
        <p>手续费：{money(fee, currency)}</p>
        <p className="mt-1">预计到账：{money(payout, currency)}</p>
        <p className="mt-1">当前规则：最低 {money(minAmount, currency)}，最高 {money(maxAmount, currency)}</p>
        <p className="mt-1">结算周期：T+{rule?.settlementDays ?? 1}（{rule?.requireManualReview ? "人工审核" : "自动处理"}）</p>
      </div>
      <button type="submit" disabled={loading}>{loading ? "提交中..." : "提交提现申请"}</button>
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
      <ConfirmDialog
        open={confirmOpen}
        title="确认提现申请"
        text={`确认提交 ${money(amount, currency)} 的提现申请吗？`}
        confirmLabel={loading ? "提交中..." : "确认提交"}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void submitWithdraw()}
      />
    </form>
  );
}

export function MerchantForms() {
  return (
    <div className="grid gap-4">
      <MerchantOrderForm />
      <div className="surface p-5">
        <h2 className="text-lg font-black text-slate-950">提现入口已独立</h2>
        <p className="mt-2 text-sm text-muted">请前往“资金中心 / 提现”使用完整提现模块。</p>
        <a href="/merchant/withdraws" className="button secondary mt-4">前往提现中心</a>
      </div>
    </div>
  );
}
