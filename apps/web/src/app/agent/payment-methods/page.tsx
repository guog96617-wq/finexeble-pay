import { DashboardShell } from "@/components/DashboardShell";
import { MerchantChannelForm } from "@/components/V15Forms";
import { SectionHeader } from "@/components/ProductOps";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type MerchantGroup = {
  id: string;
  name: string;
  merchantChannels?: {
    channelId: string;
    isEnabled?: boolean;
    isPrimary?: boolean;
    isBackup?: boolean;
    channel: { name: string; paymentMethod: string; supplier?: { name: string } };
  }[];
};

export default async function AgentPaymentMethodsPage() {
  const groups = await apiGet<MerchantGroup[]>("/api/agent/payment-methods", []);
  return (
    <DashboardShell requiredRole="AGENT_ADMIN" title="Merchant PSP Settings" role="Agent Admin">
      <SectionHeader
        eyebrow="Merchant Operations"
        title="商户 PSP 开关"
        text="该页面只负责为名下商户管理 PSP / 通道开关、主备通道。"
        status="ACTIVE"
      />
      <div className="grid gap-4">
        {groups.map((merchant) => (
          <section key={merchant.id} className="surface p-4">
            <h2 className="text-lg font-black text-slate-950">{merchant.name}</h2>
            <p className="mt-1 text-sm text-muted">可按商户逐个通道管理启用状态与主备角色。</p>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {merchant.merchantChannels?.map((item) => (
                <div key={item.channelId} className="rounded-xl border border-line p-3">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{item.channel.name}</p>
                      <p className="text-sm text-muted">{item.channel.supplier?.name ?? "Unknown PSP"} / {item.channel.paymentMethod}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                      {item.isPrimary ? "主通道" : item.isBackup ? "备用通道" : (item.isEnabled ? "已启用" : "已停用")}
                    </span>
                  </div>
                  <MerchantChannelForm merchantId={merchant.id} channelId={item.channelId} agent />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}
