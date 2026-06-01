import { DataTable } from "@/components/DataTable";
import { DashboardShell } from "@/components/DashboardShell";
import { SectionHeader } from "@/components/ProductOps";
import { StatusBadge } from "@/components/StatusBadge";
import { apiGet, money } from "@/lib/api";

export const dynamic = "force-dynamic";

type Withdraw = {
  withdrawNo: string;
  amount: string;
  feeAmount: string;
  actualPayout: string;
  currency: string;
  status: string;
  createdAt?: string;
};

function displayStatus(status: string) {
  return status === "APPROVED" ? "REVIEWING" : status;
}

export default async function MerchantWithdrawRecordsPage() {
  const withdraws = await apiGet<Withdraw[]>("/api/merchant/withdraws", []);
  const rows = withdraws.map((item) => [
    item.withdrawNo,
    money(item.amount, item.currency),
    money(item.feeAmount ?? 0, item.currency),
    money(item.actualPayout ?? 0, item.currency),
    <StatusBadge key={item.withdrawNo} status={displayStatus(item.status)} />,
    item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
  ]);

  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="Withdraw Records" role="Merchant Admin">
      <SectionHeader
        eyebrow="Funds Center"
        title="提现记录"
        text="仅查看历史提现记录。新申请请前往“提现中心”。"
        status="ACTIVE"
        action={<a href="/merchant/withdraws" className="button">申请提现</a>}
      />
      <DataTable
        columns={["提现单号", "金额", "手续费", "实际到账", "状态", "创建时间"]}
        rows={rows}
        empty="暂无提现记录。"
      />
    </DashboardShell>
  );
}
