import { DashboardShell } from "@/components/DashboardShell";
import { SectionHeader } from "@/components/ProductOps";

export default function AgentSettingsPage() {
  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Profile Settings" role="Agent Admin">
      <SectionHeader
        eyebrow="Account & Security"
        title="个人设置"
        text="该页面用于代理账号资料与通知设置。"
        status="ACTIVE"
      />
      <section className="surface p-5">
        <p className="text-sm text-slate-700">
          当前为演示环境。建议在生产环境中开启二次验证并完善联系人信息。
        </p>
      </section>
    </DashboardShell>
  );
}
