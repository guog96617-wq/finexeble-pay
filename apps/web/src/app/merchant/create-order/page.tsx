import { DashboardShell } from "@/components/DashboardShell";
import { MerchantOrderForm } from "@/components/MerchantForms";
import { SectionHeader } from "@/components/ProductOps";

export default function MerchantCreateOrderPage() {
  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="Create Order" role="Merchant Admin">
      <SectionHeader
        eyebrow="Orders"
        title="创建订单"
        text="该页面只负责创建订单。创建后自动生成 Checkout 支付链接。"
        status="ACTIVE"
      />
      <MerchantOrderForm />
    </DashboardShell>
  );
}
