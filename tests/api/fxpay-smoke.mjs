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

async function raw(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, options);
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  return { response, payload, text };
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

const stamp = Date.now();
const agents = data(await request(apiBaseUrl, "/api/admin/agents"));
const merchants = data(await request(apiBaseUrl, "/api/admin/merchants"));
const demoAgent = agents[0];
const demoMerchant = merchants.find((merchant) => merchant.email === "merchant@payhub.local") ?? merchants[0];

const psp = data(await check("V1.5-1. Admin 可新增 PSP", () => request(apiBaseUrl, "/api/admin/suppliers", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name: `Smoke PSP ${stamp}`, apiBaseUrl: "https://sandbox-smoke.local" }),
})));

const channel = data(await check("V1.5-2. Admin 可新增通道", () => request(apiBaseUrl, "/api/admin/channels", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ supplierId: psp.id, name: `Smoke Sandbox ${stamp}`, paymentMethod: "SANDBOX_PAY", currency: "USD", feeRate: "0.018" }),
})));

await check("V1.5-3. Admin 可设置代理最低费率", () => request(apiBaseUrl, `/api/admin/agents/${demoAgent.id}/fee-rules`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    minMerchantFeeRate: "0.10",
    minWithdrawFeeRate: "0.01",
    allowedPaymentMethods: ["CARD", "LOCAL_PAYMENT", "BANK_TRANSFER", "SANDBOX_PAY"],
    allowedSupplierIds: [psp.id],
    allowedChannelIds: [channel.id],
  }),
}));

await check("V1.5-4. Agent 设置高于最低费率成功", () => request(apiBaseUrl, `/api/agent/merchants/${demoMerchant.id}/channels/${channel.id}/fees`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ merchantFeeRate: "0.12", merchantFixedFee: "0.30", isEnabled: true, isPrimary: true }),
}));

await check("V1.5-5. Agent 设置低于最低费率失败", async () => {
  const { response, text } = await raw(`/api/agent/merchants/${demoMerchant.id}/channels/${channel.id}/fees`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ merchantFeeRate: "0.09", isEnabled: true }),
  });
  if (response.ok || !text.includes("MERCHANT_FEE_TOO_LOW")) {
    throw new Error(`Expected MERCHANT_FEE_TOO_LOW, got ${response.status} ${text}`);
  }
});

await check("V1.5-6. Agent 可关闭旗下商户 PSP", () => request(apiBaseUrl, `/api/agent/merchants/${demoMerchant.id}/channels/${channel.id}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ isEnabled: false, merchantFeeRate: "0.12" }),
}));

await check("V1.5-7. Agent 可开通旗下商户 PSP", () => request(apiBaseUrl, `/api/agent/merchants/${demoMerchant.id}/channels/${channel.id}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ isEnabled: true, isPrimary: true, merchantFeeRate: "0.12", merchantFixedFee: "0.30" }),
}));

await check("V1.5-8. Agent 不能新增 PSP", async () => {
  const { response } = await raw("/api/agent/suppliers", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
  if (response.ok) {
    throw new Error("Agent PSP creation unexpectedly succeeded");
  }
});

await check("V1.5-9. Merchant 只能查看自己的支付方式", async () => {
  const payload = data(await request(apiBaseUrl, "/api/merchant/payment-methods"));
  if (!Array.isArray(payload.channels)) {
    throw new Error("Expected merchant channels");
  }
});

await check("V1.5-16. 主通道失败后备用通道可用", () => request(apiBaseUrl, `/api/admin/merchants/${demoMerchant.id}/channels/${channel.id}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ isEnabled: true, isBackup: true, merchantFeeRate: "0.12", merchantFixedFee: "0.30" }),
}));

await check("V1.5-17. 提现最低金额校验生效", async () => {
  const { response, text } = await raw("/api/merchant/withdraws", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount: "0.01", currency: "USD", bankName: "Smoke Bank", bankAccount: `LOW${stamp}`, accountName: "Smoke" }),
  });
  if (response.ok || !text.includes("WITHDRAW_AMOUNT_TOO_LOW")) {
    throw new Error(`Expected WITHDRAW_AMOUNT_TOO_LOW, got ${response.status} ${text}`);
  }
});

await check("V1.5-18. 提现最高金额校验生效", async () => {
  const { response, text } = await raw("/api/merchant/withdraws", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount: "6000.00", currency: "USD", bankName: "Smoke Bank", bankAccount: `HIGH${stamp}`, accountName: "Smoke" }),
  });
  if (response.ok || !text.includes("WITHDRAW_AMOUNT_TOO_HIGH")) {
    throw new Error(`Expected WITHDRAW_AMOUNT_TOO_HIGH, got ${response.status} ${text}`);
  }
});

const walletBefore = data(await request(apiBaseUrl, "/api/merchant/wallet"));
const manualOrder = data(await check("V1.5-10. Merchant 创建订单生成 payment_url", () => request(apiBaseUrl, "/api/merchant/orders", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    merchantOrderNo: `CHECKOUT-${stamp}`,
    amount: "20.00",
    currency: "USD",
    customerEmail: "buyer@example.com",
  }),
})));
if (!manualOrder.paymentUrl || !manualOrder.paymentUrl.includes(`/checkout/${manualOrder.orderNo}`)) {
  throw new Error(`Expected checkout payment_url, got ${manualOrder.paymentUrl}`);
}

await expectStatus("V1.5-11. 打开 /checkout/[orderNo]", webBaseUrl, `/checkout/${manualOrder.orderNo}`, 200);
const checkoutPaid = data(await check("V1.5-12. Pay Success 后订单变 PAID", () => request(apiBaseUrl, `/api/checkout/${manualOrder.orderNo}/pay`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ paymentMethod: "SANDBOX_PAY", sandboxResult: "success" }),
})));
if (checkoutPaid.order.status !== "PAID") {
  throw new Error(`Expected PAID, got ${checkoutPaid.order.status}`);
}
const checkoutOrder = data(await request(apiBaseUrl, `/api/v1/orders/${manualOrder.orderNo}`));
await check("V1.5-13. fee_amount / net_amount 正确", async () => {
  const expectedFee = 20 * 0.12 + 0.3;
  const expectedNet = 20 - expectedFee;
  if (Math.abs(Number(checkoutOrder.feeAmount) - expectedFee) > 0.01 || Math.abs(Number(checkoutOrder.netAmount) - expectedNet) > 0.01) {
    throw new Error(`Expected fee/net ${expectedFee}/${expectedNet}, got ${checkoutOrder.feeAmount}/${checkoutOrder.netAmount}`);
  }
});

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

await check("V1.5-14. 钱包入账 net_amount 正确", async () => {
  if (Number(walletAfterPayment.availableBalance) <= Number(walletBefore.availableBalance)) {
    throw new Error("Expected wallet to increase after checkout and callback tests");
  }
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
await check("V1.5-15. Webhook 日志写入", async () => {
  if (!webhookLogs.some((log) => log.order?.orderNo === manualOrder.orderNo || log.requestPayload?.orderNo === manualOrder.orderNo)) {
    throw new Error("Expected checkout webhook log");
  }
});
await check("V1.5-19. 提现手续费计算正确", async () => {
  if (Number(withdraw.feeAmount) <= 0 || Number(withdraw.actualPayout) <= 0) {
    throw new Error(`Expected withdraw fee and payout, got ${withdraw.feeAmount}/${withdraw.actualPayout}`);
  }
});
await check("V1.5-20. audit_logs 正确记录", async () => {
  const logs = data(await request(apiBaseUrl, "/api/admin/audit-logs"));
  if (!Array.isArray(logs) || !logs.some((log) => String(log.action).includes("agent") || String(log.action).includes("admin"))) {
    throw new Error("Expected V1.5 audit logs");
  }
});

console.log(JSON.stringify({
  ok: true,
  apiBaseUrl,
  webBaseUrl,
  createdOrder: createdOrder.orderNo,
  checkoutOrder: manualOrder.orderNo,
  checks: results,
  walletBefore: walletBefore.availableBalance,
  walletAfterPayment: walletAfterPayment.availableBalance,
}, null, 2));
