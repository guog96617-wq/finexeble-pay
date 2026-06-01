import { MarketingPage } from "@/components/MarketingPage";

export default function TrustPage() {
  return <MarketingPage eyebrow="Trust" title="Trust center for payment operations." text="Clear operational controls for routing, wallet, withdrawal, webhook and API security workflows." items={[
    { title: "Routing controls", text: "Primary and backup channel roles are visible and configurable." },
    { title: "Financial clarity", text: "Wallet balance, frozen funds and settlement actions are readable." },
    { title: "Operational visibility", text: "Webhook logs, audit logs and smoke tests support ongoing verification." },
  ]} />;
}
