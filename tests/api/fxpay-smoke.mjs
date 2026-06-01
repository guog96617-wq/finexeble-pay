import crypto from "node:crypto";

const apiBaseUrl = process.env.API_URL ?? process.env.API_BASE_URL ?? "http://localhost:4000";
const webBaseUrl = process.env.WEB_URL ?? process.env.WEB_BASE_URL ?? "http://localhost:3000";
const apiKey = process.env.DEMO_API_KEY ?? "pk_demo_global_shop";
const apiSecret = process.env.DEMO_API_SECRET ?? "local-demo-api-secret-change-before-production";
const results = [];

function sign(timestamp, nonce, body) {
  return crypto.createHmac("sha256", apiSecret).update(`${timestamp}${nonce}${body}`).digest("hex");
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
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

async function check(name, fn) {
  try {
    const value = await fn();
    results.push({ name, ok: true });
    console.log(`PASS ${name}`);
    return value;
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
    throw error;
  }
}

async function expectStatus(name, baseUrl, path, expectedStatus) {
  return check(name, async () => {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
    if (response.status !== expectedStatus) {
      throw new Error(`Expected ${expectedStatus}, got ${response.status}`);
    }
    return response;
  });
}

async function expectLoginRedirect(name, path) {
  return check(name, async () => {
    const response = await fetch(`${webBaseUrl}${path}`, { redirect: "manual" });
    const location = response.headers.get("location") ?? "";
    if (![302, 303, 307, 308].includes(response.status) || !location.includes("/login")) {
      throw new Error(`Expected redirect to /login, got ${response.status} ${location}`);
    }
  });
}

async function login(email, password, role) {
  const payload = await request(apiBaseUrl, "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const user = data(payload).user;
  if (user.email !== email || user.role !== role) {
    throw new Error(`Unexpected login result for ${email}: ${JSON.stringify(user)}`);
  }
}

await expectStatus("1. 首页可访问", webBaseUrl, "/", 200);
await expectStatus("2. 登录页可访问", webBaseUrl, "/login", 200);
await expectLoginRedirect("3. 未登录访问 /admin 应跳转 /login", "/admin");
await expectLoginRedirect("4. 未登录访问 /merchant 应跳转 /login", "/merchant");
await expectLoginRedirect("5. 未登录访问 /agent 应跳转 /login", "/agent");
await expectStatus("14. API /docs 可访问", apiBaseUrl, "/docs", 200);

await check("6. Admin 登录接口成功", () => login("admin@payhub.local", "Admin123!", "SUPER_ADMIN"));
await check("7. Merchant 登录接口成功", () => login("merchant@payhub.local", "Merchant123!", "MERCHANT_ADMIN"));
await check("8. Agent 登录接口成功", () => login("agent@payhub.local", "Agent123!", "AGENT_ADMIN"));

await request(apiBaseUrl, "/api/admin/orders");

const walletBefore = data(await request(apiBaseUrl, "/api/merchant/wallet"));
const orderBody = {
  merchantOrderNo: `AUTO-${Date.now()}`,
  amount: "12.34",
  currency: "USD",
  customerEmail: "buyer@example.com",
};
const body = JSON.stringify(orderBody);
const timestamp = String(Date.now());
const nonce = crypto.randomUUID();
const createdOrder = data(await check("9. Merchant 创建订单成功", () => request(apiBaseUrl, "/api/v1/payments/create", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": apiKey,
    "x-timestamp": timestamp,
    "x-nonce": nonce,
    "x-signature": sign(timestamp, nonce, body),
  },
  body,
})));

await check("10. 支付回调成功", () => request(apiBaseUrl, "/api/webhooks/payment/notify", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ orderNo: createdOrder.orderNo, status: "PAID", providerReference: "auto-smoke" }),
}));

const paidOrder = data(await request(apiBaseUrl, `/api/v1/orders/${createdOrder.orderNo}`));
if (paidOrder.status !== "PAID") {
  throw new Error(`Expected order ${createdOrder.orderNo} to be PAID, got ${paidOrder.status}`);
}

const walletAfterPayment = await check("11. 钱包入账成功", async () => {
  const wallet = data(await request(apiBaseUrl, "/api/merchant/wallet"));
  if (Number(wallet.availableBalance) <= Number(walletBefore.availableBalance)) {
    throw new Error("Expected wallet available balance to increase after payment callback");
  }
  return wallet;
});

const withdraw = data(await check("12. 提现申请成功", () => request(apiBaseUrl, "/api/merchant/withdraws", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    amount: "1.00",
    currency: "USD",
    bankName: "Automation Bank",
    bankAccount: `AUTO${Date.now()}`,
    accountName: "Demo Global Shop Ltd",
  }),
})));

await check("13. Admin 审核提现成功", async () => {
  await request(apiBaseUrl, `/api/admin/withdraws/${withdraw.id}/approve`, { method: "PATCH" });
  const paidWithdraw = data(await request(apiBaseUrl, `/api/admin/withdraws/${withdraw.id}/paid`, { method: "PATCH" }));
  if (paidWithdraw.status !== "PAID") {
    throw new Error(`Expected withdraw ${withdraw.withdrawNo} to be PAID, got ${paidWithdraw.status}`);
  }
  return paidWithdraw;
});

const webhookLogs = data(await request(apiBaseUrl, "/api/admin/webhook-logs"));
if (!Array.isArray(webhookLogs) || webhookLogs.length === 0) {
  throw new Error("Expected webhook logs to contain at least one entry");
}

console.log(JSON.stringify({
  ok: true,
  apiBaseUrl,
  webBaseUrl,
  createdOrder: createdOrder.orderNo,
  checks: results,
  walletBefore: walletBefore.availableBalance,
  walletAfterPayment: walletAfterPayment.availableBalance,
}, null, 2));
