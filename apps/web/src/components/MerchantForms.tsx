"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "./Toast";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export function MerchantForms() {
  const router = useRouter();
  const [order, setOrder] = useState({ merchantOrderNo: `WEB-${Date.now()}`, amount: "100.00", currency: "USD", customerEmail: "buyer@example.com" });
  const [withdraw, setWithdraw] = useState({ amount: "10.00", currency: "USD", bankName: "Demo Bank", bankAccount: "000123456789", accountName: "Demo Global Shop Ltd" });
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");

  async function submit(path: string, body: unknown, key: string, success: string) {
    setLoading(key);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error?.message ?? "Request failed.");
        return;
      }
      const data = payload?.data ?? payload;
      if (key === "order" && data?.paymentUrl) {
        setPaymentUrl(data.paymentUrl);
      }
      setMessage(success);
      router.refresh();
    } catch {
      setError("Cannot connect to API. Please check the API service.");
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="grid gap-4">
      <form className="surface grid gap-3 p-5" onSubmit={(event) => { event.preventDefault(); void submit("/api/merchant/orders", order, "order", "Order created."); }}>
        <div>
          <h2 className="text-lg font-black text-slate-950">Create Payment Order</h2>
          <p className="mt-1 text-sm text-muted">Create a demo merchant order and refresh the live order table.</p>
        </div>
        <label className="text-sm font-semibold text-slate-700">Merchant order number</label>
        <input value={order.merchantOrderNo} onChange={(event) => setOrder({ ...order, merchantOrderNo: event.target.value })} placeholder="Merchant order number" />
        <label className="text-sm font-semibold text-slate-700">Amount</label>
        <input value={order.amount} onChange={(event) => setOrder({ ...order, amount: event.target.value })} placeholder="Amount" />
        <label className="text-sm font-semibold text-slate-700">Currency</label>
        <select value={order.currency} onChange={(event) => setOrder({ ...order, currency: event.target.value })}>
          <option>USD</option>
          <option>HKD</option>
          <option>EUR</option>
        </select>
        <label className="text-sm font-semibold text-slate-700">Customer email</label>
        <input value={order.customerEmail} onChange={(event) => setOrder({ ...order, customerEmail: event.target.value })} placeholder="Customer email" />
        <button type="submit" disabled={loading === "order"}>{loading === "order" ? "Creating..." : "Create order"}</button>
      </form>

      <form className="surface grid gap-3 p-5" onSubmit={(event) => { event.preventDefault(); void submit("/api/merchant/withdraws", withdraw, "withdraw", "Withdraw submitted."); }}>
        <div>
          <h2 className="text-lg font-black text-slate-950">Withdraw Request</h2>
          <p className="mt-1 text-sm text-muted">Submit a withdrawal for admin review using the existing finance flow.</p>
        </div>
        <label className="text-sm font-semibold text-slate-700">Amount</label>
        <input value={withdraw.amount} onChange={(event) => setWithdraw({ ...withdraw, amount: event.target.value })} placeholder="Amount" />
        <label className="text-sm font-semibold text-slate-700">Bank name</label>
        <input value={withdraw.bankName} onChange={(event) => setWithdraw({ ...withdraw, bankName: event.target.value })} placeholder="Bank name" />
        <label className="text-sm font-semibold text-slate-700">Bank account</label>
        <input value={withdraw.bankAccount} onChange={(event) => setWithdraw({ ...withdraw, bankAccount: event.target.value })} placeholder="Bank account" />
        <label className="text-sm font-semibold text-slate-700">Account name</label>
        <input value={withdraw.accountName} onChange={(event) => setWithdraw({ ...withdraw, accountName: event.target.value })} placeholder="Account name" />
        <button type="submit" disabled={loading === "withdraw"}>{loading === "withdraw" ? "Submitting..." : "Submit withdraw"}</button>
      </form>

      <Toast message={message} type="success" />
      <Toast message={error} type="error" />
      {paymentUrl ? (
        <a className="button secondary justify-center" href={paymentUrl} target="_blank" rel="noreferrer">
          Open Checkout
        </a>
      ) : null}
    </div>
  );
}
