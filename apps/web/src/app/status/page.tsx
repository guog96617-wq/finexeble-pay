import { MarketingPage } from "@/components/MarketingPage";

export default function StatusPage() {
  return <MarketingPage eyebrow="Status" title="FXpay platform status." text="Public-facing operational status for PSP routing, API, checkout, wallet and webhooks." items={[
    { title: "API", text: "Operational. Swagger and smoke tests are online." },
    { title: "Checkout", text: "Operational. Sandbox success, failed and timeout flows available." },
    { title: "Webhooks", text: "Operational. Delivery logs are visible in Admin." },
  ]} />;
}
