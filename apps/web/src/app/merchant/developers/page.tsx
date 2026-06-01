import { ApiKeyPanel } from "@/components/ApiKeyPanel";
import { DashboardShell } from "@/components/DashboardShell";
import { SectionHeader } from "@/components/ProductOps";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type ApiKey = { apiKey: string; status: string; createdAt: string };

export default async function MerchantDevelopersPage() {
  const apiKeys = await apiGet<ApiKey[]>("/api/merchant/api-keys", []);
  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="Developer Center" role="Merchant Admin">
      <SectionHeader
        eyebrow="Developer"
        title="API Keys"
        text="该页面只负责 API Key 管理。Webhook 请前往独立 Webhook 页面。"
        status="ACTIVE"
      />
      <ApiKeyPanel apiKeys={apiKeys} />
    </DashboardShell>
  );
}
