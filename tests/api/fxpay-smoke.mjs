import crypto from "node:crypto";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";
const apiKey = process.env.DEMO_API_KEY ?? "pk_demo_global_shop";
const apiSecret = process.env.DEMO_API_SECRET ?? "local-demo-api-secret-change-before-production";

function sign(timestamp, nonce, body) {
  return crypto.createHmac("sha256", apiSecret).update(`${timestamp}${nonce}${body}`).digest("hex");
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, options);
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} failed: ${response.status} ${text}`);
  }
  return payload;
}

function data(payload) {
  return payload?.data ?? payload;
}

async function login(email, password, role) {
  const payload = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const user = data(payload).user;
  if (user.email !== email || user.role !== role) {
    throw new Error(`Unexpected login result for ${email}: ${JSON.stringify(user)}`);
  }
}

await request("/docs");

await login("admin@payhub.local", "Admin123!", "SUPER_ADMIN");
await login("merchant@payhub.local", "Merchant123!", "MERCHANT_ADMIN");
await login("agent@payhub.local", "Agent123!", "AGENT_ADMIN");

await request("/api/admin/orders");

const walletBefore = data(await request("/api/merchant/wallet"));
const orderBody = {
  merchantOrderNo: `AUTO-${Date.now()}`,
  amount: "12.34",
  currency: "USD",
  customerEmail: "buyer@example.com",
};
const body = JSON.stringify(orderBody);
const timestamp = String(Date.now());
const nonce = crypto.randomUUID();
const createdOrder = data(await request("/api/v1/payments/create", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": apiKey,
    "x-timestamp": timestamp,
    "x-nonce": nonce,
    "x-signature": sign(timestamp, nonce, body),
  },
  body,
}));

await request("/api/webhooks/payment/notify", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ orderNo: createdOrder.orderNo, status: "PAID", providerReference: "auto-smoke" }),
});

const paidOrder = data(await request(`/api/v1/orders/${createdOrder.orderNo}`));
if (paidOrder.status !== "PAID") {
  throw new Error(`Expected order ${createdOrder.orderNo} to be PAID, got ${paidOrder.status}`);
}

const walletAfterPayment = data(await request("/api/merchant/wallet"));
if (Number(walletAfterPayment.availableBalance) <= Number(walletBefore.availableBalance)) {
  throw new Error("Expected wallet available balance to increase after payment callback");
}

const withdraw = data(await request("/api/merchant/withdraws", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    amount: "1.00",
    currency: "USD",
    bankName: "Automation Bank",
    bankAccount: `AUTO${Date.now()}`,
    accountName: "Demo Global Shop Ltd",
  }),
}));

await request(`/api/admin/withdraws/${withdraw.id}/approve`, { method: "PATCH" });
const paidWithdraw = data(await request(`/api/admin/withdraws/${withdraw.id}/paid`, { method: "PATCH" }));
if (paidWithdraw.status !== "PAID") {
  throw new Error(`Expected withdraw ${withdraw.withdrawNo} to be PAID, got ${paidWithdraw.status}`);
}

const webhookLogs = data(await request("/api/admin/webhook-logs"));
if (!Array.isArray(webhookLogs) || webhookLogs.length === 0) {
  throw new Error("Expected webhook logs to contain at least one entry");
}

console.log(JSON.stringify({
  ok: true,
  apiBaseUrl,
  createdOrder: createdOrder.orderNo,
  paidWithdraw: paidWithdraw.withdrawNo,
  walletBefore: walletBefore.availableBalance,
  walletAfterPayment: walletAfterPayment.availableBalance,
}, null, 2));
