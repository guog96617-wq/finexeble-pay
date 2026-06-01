import { DashboardShell } from "@/components/DashboardShell";
import { SectionHeader } from "@/components/ProductOps";
import { WebhookEditor } from "@/components/WebhookEditor";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type Webhook = {
  id: string;
  url: string;
  secret: string;
  status: string;
};

export default async function MerchantWebhookPage() {
  const webhooks = await apiGet<Webhook[]>("/api/merchant/webhooks", []);
  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="Webhook" role="Merchant Admin">
      <SectionHeader
        eyebrow="Developer"
        title="Webhook 配置"
        text="该页面仅负责管理回调地址与签名密钥。"
        status="ACTIVE"
      />
      <WebhookEditor webhooks={webhooks} />
    </DashboardShell>
  );
}
