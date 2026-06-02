"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "./ConfirmDialog";
import { DataTable } from "./DataTable";
import { StatusBadge } from "./StatusBadge";
import { Toast } from "./Toast";
import { money } from "@/lib/api";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const riskText = "请仔细核对钱包地址、币种和网络。区块链提现一旦提交，通常无法撤回。如果地址或网络填写错误，资金可能永久丢失。";

type Wallet = {
  availableBalance?: string;
  frozenBalance?: string;
  rollingReserveBalance?: string;
  balance?: string;
  currency?: string;
} | null;

type WithdrawAddress = {
  id: string;
  label: string;
  asset: "USDT" | "USDC";
  network: "ERC20" | "TRC20" | "BEP20";
  address: string;
  status: string;
  createdAt: string;
};

type Withdraw = {
  id: string;
  withdrawNo: string;
  amount: string;
  currency: string;
  asset?: string | null;
  network?: string | null;
  addressSnapshot?: string | null;
  addressLabelSnapshot?: string | null;
  status: string;
  createdAt: string;
};

type Settlement = {
  id: string;
  amount: string;
  status: string;
  settlementDays: number;
  releaseAt: string;
  releasedAt?: string | null;
  order?: { orderNo?: string | null } | null;
};

function tail(address?: string | null) {
  return address ? `****${address.slice(-4)}` : "-";
}

function friendlyError(message: string) {
  if (message.includes("WITHDRAW_ADDRESS_LIMIT_REACHED")) return "最多只能添加 5 个提现钱包地址。如需更换地址，请联系平台管理员。";
  if (message.includes("WITHDRAW_ADDRESS_REQUIRED")) return "请先添加并选择提现钱包地址。";
  if (message.includes("WITHDRAW_ADDRESS_INVALID")) return "提现地址无效或不属于当前用户。";
  if (message.includes("WITHDRAW_AMOUNT_TOO_LOW")) return "提现金额不能低于 USD 100.00。";
  if (message.includes("WITHDRAW_AMOUNT_TOO_HIGH")) return "提现金额不能高于 USD 50,000.00。";
  if (message.includes("Insufficient balance")) return "可提现余额不足。冻结余额和滚动储备金不能提现。";
  return "操作失败，请稍后重试。";
}

export function WalletCryptoPanel({
  owner,
  wallet,
  addresses,
  withdraws,
  settlements,
}: {
  owner: "merchant" | "agent";
  wallet: Wallet;
  addresses: WithdrawAddress[];
  withdraws: Withdraw[];
  settlements: Settlement[];
}) {
  const router = useRouter();
  const currency = wallet?.currency ?? "USD";
  const [addressForm, setAddressForm] = useState({
    label: "",
    asset: "USDT",
    network: "TRC20",
    address: "",
  });
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "100.00",
    withdrawAddressId: addresses[0]?.id ?? "",
  });
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedAddress = addresses.find((item) => item.id === withdrawForm.withdrawAddressId) ?? addresses[0];
  const amount = Number(withdrawForm.amount || 0);
  const available = Number(wallet?.availableBalance ?? 0);
  const addressLimitReached = addresses.length >= 5;

  const withdrawValidation = useMemo(() => {
    if (!addresses.length) return "你还没有提现钱包地址，请先添加提现地址。";
    if (!amount || Number.isNaN(amount)) return "请输入正确的提现金额。";
    if (amount < 100) return "提现金额不能低于 USD 100.00。";
    if (amount > 50000) return "提现金额不能高于 USD 50,000.00。";
    if (amount > available) return "可提现余额不足。冻结余额和滚动储备金不能提现。";
    if (!selectedAddress) return "请选择有效提现钱包。";
    return "";
  }, [addresses.length, amount, available, selectedAddress]);

  async function submitAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (addressLimitReached) {
      setError("最多只能添加 5 个提现钱包地址。如需更换地址，请联系平台管理员。");
      return;
    }
    setBusy("address");
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/${owner}/wallet/withdraw-addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(friendlyError(payload?.error?.message ?? "WITHDRAW_ADDRESS_FAILED"));
        return;
      }
      setMessage("提现钱包地址已新增。地址仅可新增，不支持编辑或删除。");
      setAddressForm({ label: "", asset: "USDT", network: "TRC20", address: "" });
      router.refresh();
    } catch {
      setError("无法连接 API 服务，请稍后重试。");
    } finally {
      setBusy("");
    }
  }

  async function submitWithdraw() {
    setBusy("withdraw");
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/${owner}/withdraws`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawForm.amount,
          currency,
          withdrawAddressId: selectedAddress?.id,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(friendlyError(payload?.error?.message ?? "WITHDRAW_FAILED"));
        return;
      }
      setMessage("提现申请已提交，等待 Admin 审核。");
      setWithdrawForm((current) => ({ ...current, amount: "100.00" }));
      router.refresh();
    } catch {
      setError("无法连接 API 服务，请稍后重试。");
    } finally {
      setBusy("");
      setConfirmOpen(false);
    }
  }

  const addressRows = addresses.map((item) => [
    item.label,
    item.asset,
    networkLabel(item.network),
    tail(item.address),
    new Date(item.createdAt).toLocaleString(),
    <StatusBadge key={item.id} status={item.status} />,
  ]);
  const withdrawRows = withdraws.map((item) => [
    item.withdrawNo,
    money(item.amount, item.currency),
    item.asset ?? "-",
    item.network ? networkLabel(item.network) : "-",
    tail(item.addressSnapshot),
    <StatusBadge key={item.id} status={item.status} />,
    new Date(item.createdAt).toLocaleString(),
  ]);
  const settlementRows = settlements.map((item) => [
    item.order?.orderNo ?? "-",
    money(item.amount, currency),
    `T+${item.settlementDays}`,
    <StatusBadge key={item.id} status={item.status} />,
    new Date(item.releaseAt).toLocaleString(),
    item.releasedAt ? new Date(item.releasedAt).toLocaleString() : "-",
  ]);

  return (
    <div className="grid gap-8">
      <Toast message={message} type="success" />
      <Toast message={error} type="error" />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form className="surface grid gap-3 p-5" onSubmit={submitAddress}>
          <div>
            <h2 className="text-lg font-black text-slate-950">新增提现地址</h2>
            <p className="mt-1 text-sm text-muted">每个账户最多 5 个地址。历史地址长期保留，不提供编辑、删除或软删除。</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-800">
            {riskText}
          </div>
          <label className="text-sm font-semibold text-slate-700">钱包名称</label>
          <input value={addressForm.label} onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })} placeholder="我的 USDT TRC20 钱包" disabled={addressLimitReached} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">币种</label>
              <select value={addressForm.asset} onChange={(event) => setAddressForm({ ...addressForm, asset: event.target.value })} disabled={addressLimitReached}>
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">网络</label>
              <select value={addressForm.network} onChange={(event) => setAddressForm({ ...addressForm, network: event.target.value })} disabled={addressLimitReached}>
                <option value="TRC20">TRON TRC20</option>
                <option value="ERC20">Ethereum ERC20</option>
                <option value="BEP20">BNB Chain BEP20</option>
              </select>
            </div>
          </div>
          <label className="text-sm font-semibold text-slate-700">真实钱包地址</label>
          <input value={addressForm.address} onChange={(event) => setAddressForm({ ...addressForm, address: event.target.value })} placeholder="Wallet address" disabled={addressLimitReached} required />
          {addressLimitReached ? (
            <p className="rounded-lg border border-line bg-slate-50 p-3 text-sm font-semibold text-slate-700">最多只能添加 5 个提现钱包地址。如需更换地址，请联系平台管理员。</p>
          ) : null}
          <button type="submit" disabled={addressLimitReached || busy === "address"}>{busy === "address" ? "新增中..." : "新增提现地址"}</button>
        </form>

        <form
          className="surface grid gap-3 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (withdrawValidation) {
              setError(withdrawValidation);
              return;
            }
            setConfirmOpen(true);
          }}
        >
          <div>
            <h2 className="text-lg font-black text-slate-950">申请提现</h2>
            <p className="mt-1 text-sm text-muted">提现只能从可提现余额扣除，不能使用冻结余额或滚动储备金。</p>
          </div>
          {!addresses.length ? (
            <div className="rounded-lg border border-line bg-slate-50 p-4">
              <p className="font-bold text-slate-900">你还没有提现钱包地址，请先添加提现地址。</p>
              <p className="mt-1 text-sm text-muted">添加后即可从已保存钱包中选择。</p>
            </div>
          ) : null}
          <label className="text-sm font-semibold text-slate-700">提现金额</label>
          <input value={withdrawForm.amount} onChange={(event) => setWithdrawForm({ ...withdrawForm, amount: event.target.value })} placeholder="100.00" />
          <label className="text-sm font-semibold text-slate-700">选择提现钱包</label>
          <select value={selectedAddress?.id ?? ""} onChange={(event) => setWithdrawForm({ ...withdrawForm, withdrawAddressId: event.target.value })} disabled={!addresses.length}>
            {addresses.map((item) => (
              <option key={item.id} value={item.id}>{item.label} · {item.asset} · {networkLabel(item.network)} · {tail(item.address)}</option>
            ))}
          </select>
          <div className="rounded-lg border border-line bg-slate-50 p-3 text-sm text-slate-700">
            <p>最低提现：{money(100, currency)}；最高提现：{money(50000, currency)}</p>
            <p className="mt-1">当前可提现余额：{money(wallet?.availableBalance ?? 0, currency)}</p>
            <p className="mt-1">冻结余额和滚动储备金不参与提现校验。</p>
          </div>
          <button type="submit" disabled={busy === "withdraw" || !addresses.length}>{busy === "withdraw" ? "提交中..." : "申请提现"}</button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-black text-slate-950">提现地址列表</h2>
        <DataTable columns={["钱包名称", "币种", "网络", "地址尾号", "创建时间", "状态"]} rows={addressRows} empty="暂无提现钱包地址。" />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-black text-slate-950">提现记录</h2>
        <DataTable columns={["提现单号", "金额", "币种", "网络", "地址尾号", "状态", "创建时间"]} rows={withdrawRows} empty="暂无提现记录。" />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-black text-slate-950">冻结资金明细</h2>
        <DataTable columns={["订单号", "金额", "结算类型", "状态", "预计释放时间", "实际释放时间"]} rows={settlementRows} empty="暂无冻结资金记录。" />
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="确认提现申请"
        text={`提现金额：${money(amount, currency)}；钱包：${selectedAddress?.label ?? "-"}；币种：${selectedAddress?.asset ?? "-"}；网络：${selectedAddress ? networkLabel(selectedAddress.network) : "-"}；地址尾号：${tail(selectedAddress?.address)}。请确认钱包地址和网络无误，链上转账通常无法撤回。`}
        confirmLabel={busy === "withdraw" ? "提交中..." : "确认提交"}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void submitWithdraw()}
      />
    </div>
  );
}

function networkLabel(network: string) {
  if (network === "ERC20") return "Ethereum ERC20";
  if (network === "TRC20") return "TRON TRC20";
  if (network === "BEP20") return "BNB Chain BEP20";
  return network;
}
