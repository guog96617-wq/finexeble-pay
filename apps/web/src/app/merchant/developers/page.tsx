import { ApiKeyPanel } from "@/components/ApiKeyPanel";
import { DashboardShell } from "@/components/DashboardShell";
import { SectionHeader } from "@/components/ProductOps";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type ApiKey = { apiKey: string; status: string; createdAt: string };

export default async function MerchantDevelopersPage() {
  const apiKeys = await apiGet<ApiKey[]>("/api/merchant/api-keys", []);
  return (
    <DashboardShell requiredRole="MERCHANT_ADMIN" title="API Developer UX" role="Merchant Admin">
      <SectionHeader eyebrow="Developer UX" title="API Key / Developer UX" text="提供 Sandbox / Production 标签、一键复制、Curl、SDK、HMAC 和 Webhook 示例。" />
      <ApiKeyPanel apiKeys={apiKeys} />
    </DashboardShell>
  );
}
