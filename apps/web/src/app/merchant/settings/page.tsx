import { DashboardShell } from "@/components/DashboardShell";
import { SectionHeader } from "@/components/ProductOps";

export default function MerchantSettingsPage() {
  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="Account Settings" role="Merchant Admin">
      <SectionHeader
        eyebrow="Account"
        title="账户设置"
        text="该页面用于管理商户联系人、通知偏好与基础安全设置。"
        status="ACTIVE"
      />
      <section className="surface p-5">
        <p className="text-sm text-slate-700">
          当前演示环境默认使用种子账号。正式环境建议在此页面配置二次验证、通知邮箱和联系人资料。
        </p>
      </section>
    </DashboardShell>
  );
}
