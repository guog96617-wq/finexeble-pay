"use client";

import { useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export function MerchantActions() {
  const [message, setMessage] = useState("");

  async function createOrder() {
    setMessage("Creating order...");
    const response = await fetch(`${apiBaseUrl}/api/merchant/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchantOrderNo: `WEB-${Date.now()}`,
        amount: "100.00",
        currency: "USD",
        customerEmail: "buyer@example.com",
      }),
    });
    setMessage(response.ok ? "Order created. Refresh to see it in the table." : "Order creation failed.");
  }

  async function createWithdraw() {
    setMessage("Submitting withdraw...");
    const response = await fetch(`${apiBaseUrl}/api/merchant/withdraws`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: "10.00",
        currency: "USD",
        bankName: "Demo Bank",
        bankAccount: "000123456789",
        accountName: "Demo Global Shop Ltd",
      }),
    });
    setMessage(response.ok ? "Withdraw submitted. Refresh to see frozen balance." : "Withdraw failed.");
  }

  return (
    <div className="surface p-5">
      <h2 className="text-lg font-black">Merchant Actions</h2>
      <div className="mt-4 grid gap-3">
        <button type="button" onClick={createOrder}>
          Create test order
        </button>
        <button type="button" className="secondary button" onClick={createWithdraw}>
          Submit $10 withdraw
        </button>
        {message ? <p className="text-sm text-slate-300">{message}</p> : null}
      </div>
    </div>
  );
}
