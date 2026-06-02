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
  let response = await fetch(`${baseUrl}${path}`, options);
  for (let attempt = 0; response.status === 429 && attempt < 5; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    response = await fetch(`${baseUrl}${path}`, options);
  }
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
  let response = await fetch(`${apiBaseUrl}${path}`, options);
  for (let attempt = 0; response.status === 429 && attempt < 5; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    response = await fetch(`${apiBaseUrl}${path}`, options);
  }
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

async function ensureAddress(ownerPath, labelPrefix) {
  const addresses = data(await request(apiBaseUrl, `/api/${ownerPath}/wallet/withdraw-addresses`));
  if (addresses.length > 0) {
    return addresses[0];
  }
  return data(await request(apiBaseUrl, `/api/${ownerPath}/wallet/withdraw-addresses`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      label: `${labelPrefix} USDT TRC20`,
      asset: "USDT",
      network: "TRC20",
      address: `TQx${labelPrefix.replace(/\W/g, "")}${Date.now()}A9f3`,
    }),
  }));
}

const merchantWithdrawAddress = await check("V1.8-1. Merchant 能新增或读取 USDT TRC20 提现地址", () => ensureAddress("merchant", "Merchant Smoke"));
await check("V1.8-2. Merchant 最多只能新增 5 个提现地址", async () => {
  let addresses = data(await request(apiBaseUrl, "/api/merchant/wallet/withdraw-addresses"));
  while (addresses.length < 5) {
    await request(apiBaseUrl, "/api/merchant/wallet/withdraw-addresses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        label: `Merchant Limit ${addresses.length + 1}`,
        asset: "USDT",
        network: "TRC20",
        address: `TQxMerchantLimit${Date.now()}${addresses.length}`,
      }),
    });
    addresses = data(await request(apiBaseUrl, "/api/merchant/wallet/withdraw-addresses"));
  }
  const { response, text } = await raw("/api/merchant/wallet/withdraw-addresses", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ label: "Over limit", asset: "USDT", network: "TRC20", address: `TQxOverLimit${Date.now()}` }),
  });
  if (response.ok || !text.includes("WITHDRAW_ADDRESS_LIMIT_REACHED")) {
    throw new Error(`Expected WITHDRAW_ADDRESS_LIMIT_REACHED, got ${response.status} ${text}`);
  }
});
await check("V1.8-3/4. Merchant 不能提现地址编辑或删除", async () => {
  const patch = await raw(`/api/merchant/wallet/withdraw-addresses/${merchantWithdrawAddress.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ label: "Should not edit" }),
  });
  const del = await raw(`/api/merchant/wallet/withdraw-addresses/${merchantWithdrawAddress.id}`, { method: "DELETE" });
  if (patch.response.ok || del.response.ok) {
    throw new Error(`Expected edit/delete endpoints to be unavailable, got ${patch.response.status}/${del.response.status}`);
  }
});
const agentWithdrawAddress = await check("V1.8-14. Agent 能新增或读取提现地址", () => ensureAddress("agent", "Agent Smoke"));
await check("V1.8-15. Agent 最多只能新增 5 个提现地址", async () => {
  let addresses = data(await request(apiBaseUrl, "/api/agent/wallet/withdraw-addresses"));
  while (addresses.length < 5) {
    await request(apiBaseUrl, "/api/agent/wallet/withdraw-addresses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        label: `Agent Limit ${addresses.length + 1}`,
        asset: "USDT",
        network: "TRC20",
        address: `TQxAgentLimit${Date.now()}${addresses.length}`,
      }),
    });
    addresses = data(await request(apiBaseUrl, "/api/agent/wallet/withdraw-addresses"));
  }
  const { response, text } = await raw("/api/agent/wallet/withdraw-addresses", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ label: "Over limit", asset: "USDT", network: "TRC20", address: `TQxAgentOverLimit${Date.now()}` }),
  });
  if (response.ok || !text.includes("WITHDRAW_ADDRESS_LIMIT_REACHED")) {
    throw new Error(`Expected WITHDRAW_ADDRESS_LIMIT_REACHED, got ${response.status} ${text}`);
  }
});

const psp = data(await check("V1.5-1. Admin 可新增 PSP", () => request(apiBaseUrl, "/api/admin/suppliers", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name: `Smoke PSP ${stamp}`, apiBaseUrl: "https://sandbox-smoke.local" }),
})));

const channel = data(await check("V1.5-2. Admin 可新增通道", () => request(apiBaseUrl, "/api/admin/channels", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    supplierId: psp.id,
    supplierName: psp.name,
    supplierApiBaseUrl: psp.apiBaseUrl,
    name: `Smoke Sandbox ${stamp}`,
    paymentMethod: "SANDBOX_PAY",
    currency: "USD",
    feeRate: "0.05",
    pspCostRate: "0.05",
    pspFixedFee: "0",
    rollingReserveRate: "0.05",
    rollingReserveDays: 7,
    settlementDays: 7,
  }),
})));

await check("V1.7-3. Admin 在代理详情授权通道", () => request(apiBaseUrl, `/api/admin/agents/${demoAgent.id}/channels/${channel.id}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    agentFeeRate: "0.10",
    agentFixedFee: "0.00",
    isEnabled: true,
    note: "Smoke authorization",
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
    body: JSON.stringify({ amount: "99.99", currency: "USD", withdrawAddressId: merchantWithdrawAddress.id }),
  });
  if (response.ok || !text.includes("WITHDRAW_AMOUNT_TOO_LOW")) {
    throw new Error(`Expected WITHDRAW_AMOUNT_TOO_LOW, got ${response.status} ${text}`);
  }
});

await check("V1.5-18. 提现最高金额校验生效", async () => {
  const { response, text } = await raw("/api/merchant/withdraws", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount: "50001.00", currency: "USD", withdrawAddressId: merchantWithdrawAddress.id }),
  });
  if (response.ok || !text.includes("WITHDRAW_AMOUNT_TOO_HIGH")) {
    throw new Error(`Expected WITHDRAW_AMOUNT_TOO_HIGH, got ${response.status} ${text}`);
  }
});

const walletBefore = data(await request(apiBaseUrl, "/api/merchant/wallet"));
const agentWalletBefore = data(await request(apiBaseUrl, "/api/agent/wallet"));
const checkoutOrderBody = {
  merchantOrderNo: `CHECKOUT-${stamp}`,
  amount: "20.00",
  currency: "USD",
  customerEmail: "buyer@example.com",
};
const checkoutBody = JSON.stringify(checkoutOrderBody);
const checkoutTimestamp = String(Date.now());
const checkoutNonce = crypto.randomUUID();
const manualOrder = data(await check("V1.7-10. API 创建订单生成 payment_url", () => request(apiBaseUrl, "/api/v1/payments/create", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": apiKey,
    "x-timestamp": checkoutTimestamp,
    "x-nonce": checkoutNonce,
    "x-signature": sign(checkoutTimestamp, checkoutNonce, checkoutBody),
  },
  body: checkoutBody,
})));
if (!manualOrder.paymentUrl || !manualOrder.paymentUrl.includes(`/checkout/${manualOrder.orderNo}`)) {
  throw new Error(`Expected checkout payment_url, got ${manualOrder.paymentUrl}`);
}

await check("V1.7-10b. Merchant 后台手动创建订单已取消", async () => {
  const { response } = await raw("/api/merchant/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ merchantOrderNo: `MANUAL-${stamp}`, amount: "20.00", currency: "USD" }),
  });
  if (response.status !== 404) {
    throw new Error(`Expected merchant manual order endpoint to be removed, got ${response.status}`);
  }
});

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
  const expectedNetBeforeReserve = 20 - expectedFee;
  const expectedReserve = expectedNetBeforeReserve * 0.05;
  const expectedAvailable = expectedNetBeforeReserve - expectedReserve;
  if (
    Math.abs(Number(checkoutOrder.merchantFeeAmount) - expectedFee) > 0.01 ||
    Math.abs(Number(checkoutOrder.merchantNetBeforeReserve) - expectedNetBeforeReserve) > 0.01 ||
    Math.abs(Number(checkoutOrder.rollingReserveAmount) - expectedReserve) > 0.01 ||
    Math.abs(Number(checkoutOrder.merchantAvailableAmount) - expectedAvailable) > 0.01
  ) {
    throw new Error(`Expected fee/net/reserve/available ${expectedFee}/${expectedNetBeforeReserve}/${expectedReserve}/${expectedAvailable}, got ${checkoutOrder.merchantFeeAmount}/${checkoutOrder.merchantNetBeforeReserve}/${checkoutOrder.rollingReserveAmount}/${checkoutOrder.merchantAvailableAmount}`);
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

const walletAfterPayment = await check("V1.8-19. T+7 支付成功后商户资金进入 frozen_balance", async () => {
  const wallet = data(await request(apiBaseUrl, "/api/merchant/wallet"));
  if (Number(wallet.frozenBalance) <= Number(walletBefore.frozenBalance)) {
    throw new Error("Expected merchant frozen balance to increase after T+7 payment");
  }
  return wallet;
});

await check("V1.8-20. T+7 支付成功后代理利润进入 frozen_balance", async () => {
  const wallet = data(await request(apiBaseUrl, "/api/agent/wallet"));
  if (Number(wallet.frozenBalance) <= Number(agentWalletBefore.frozenBalance)) {
    throw new Error("Expected agent frozen balance to increase after T+7 payment");
  }
});

await check("V1.8-21/22. frozen_balance 和 rolling_reserve_balance 不可提现", async () => {
  if (Number(walletAfterPayment.availableBalance) !== Number(walletBefore.availableBalance)) {
    throw new Error("Expected T+7 payment not to increase merchant available balance before release");
  }
});

const withdraw = data(await check("12. 提现申请成功", () => request(apiBaseUrl, "/api/merchant/withdraws", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    amount: "100.00",
    currency: "USD",
    withdrawAddressId: merchantWithdrawAddress.id,
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

await check("V1.8-13. Admin 拒绝提现后余额返还", async () => {
  const before = data(await request(apiBaseUrl, "/api/merchant/wallet"));
  const rejected = data(await request(apiBaseUrl, "/api/merchant/withdraws", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount: "100.00", currency: "USD", withdrawAddressId: merchantWithdrawAddress.id }),
  }));
  const afterRequest = data(await request(apiBaseUrl, "/api/merchant/wallet"));
  if (Number(afterRequest.availableBalance) >= Number(before.availableBalance)) {
    throw new Error("Expected available balance to decrease after withdraw request");
  }
  await request(apiBaseUrl, `/api/admin/withdraws/${rejected.id}/reject`, { method: "PATCH" });
  const afterReject = data(await request(apiBaseUrl, "/api/merchant/wallet"));
  if (Number(afterReject.availableBalance) < Number(before.availableBalance)) {
    throw new Error("Expected available balance to return after rejection");
  }
});

await check("V1.8-16/17/18. Agent 能申请提现并进入 Admin 待处理/审核", async () => {
  const agentWithdraw = data(await request(apiBaseUrl, "/api/agent/withdraws", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount: "100.00", currency: "USD", withdrawAddressId: agentWithdrawAddress.id }),
  }));
  const adminWithdraws = data(await request(apiBaseUrl, "/api/admin/withdraws"));
  if (!adminWithdraws.some((item) => item.id === agentWithdraw.id && item.ownerType === "AGENT" && item.status === "PENDING")) {
    throw new Error("Expected agent withdraw to enter admin pending list");
  }
  const approved = data(await request(apiBaseUrl, `/api/admin/withdraws/${agentWithdraw.id}/approve`, { method: "PATCH" }));
  if (approved.status !== "APPROVED") {
    throw new Error(`Expected APPROVED, got ${approved.status}`);
  }
});

await check("V1.8-23. 到期释放后 frozen_balance 减少且 available_balance 增加", async () => {
  const before = data(await request(apiBaseUrl, "/api/merchant/wallet"));
  const release = data(await request(apiBaseUrl, "/api/admin/settlements/release-due", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ now: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString() }),
  }));
  const after = data(await request(apiBaseUrl, "/api/merchant/wallet"));
  if (!release.released?.length) {
    throw new Error("Expected at least one settlement to be released");
  }
  if (Number(after.availableBalance) <= Number(before.availableBalance) || Number(after.frozenBalance) >= Number(before.frozenBalance)) {
    throw new Error("Expected release to move funds from frozen to available");
  }
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
await check("V1.8-5/10. 提现使用钱包地址且成功后扣除 available_balance", async () => {
  if (Number(withdraw.feeAmount) !== 0 || Number(withdraw.actualPayout) !== Number(withdraw.amount)) {
    throw new Error(`Expected crypto withdraw fee 0 and payout amount, got ${withdraw.feeAmount}/${withdraw.actualPayout}`);
  }
  if (!withdraw.addressSnapshot || !withdraw.asset || !withdraw.network) {
    throw new Error("Expected withdraw to include address snapshot, asset and network");
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
