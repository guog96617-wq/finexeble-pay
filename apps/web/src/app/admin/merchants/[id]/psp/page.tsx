import { DashboardShell } from "@/components/DashboardShell";
import { MerchantChannelForm } from "@/components/V15Forms";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

type Channel = { id: string; name: string; paymentMethod: string; supplier?: { name: string } };
type Merchant = { id: string; name: string; merchantChannels?: { channelId: string; isEnabled: boolean; isPrimary: boolean; isBackup: boolean }[] };

export default async function AdminMerchantPspPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [merchant, channels] = await Promise.all([
    apiGet<Merchant | null>(`/api/admin/merchants/${id}/psp`, null),
    apiGet<Channel[]>("/api/admin/channels", []),
  ]);
  return (
    <DashboardShell requiredRole="SUPER_ADMIN" title="Merchant PSP" role="Super Admin">
      <h2 className="mb-4 text-xl font-black text-slate-950">{merchant?.name ?? "Merchant"}</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {channels.map((channel) => (
          <div key={channel.id} className="surface grid gap-3 p-4">
            <div>
              <h3 className="font-black text-slate-900">{channel.name}</h3>
              <p className="text-sm text-muted">{channel.supplier?.name} / {channel.paymentMethod}</p>
            </div>
            <MerchantChannelForm merchantId={id} channelId={channel.id} />
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
