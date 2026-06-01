import { MarketingPage } from "@/components/MarketingPage";

export default function ChangelogPage() {
  return <MarketingPage eyebrow="Changelog" title="Product updates for Finexeble FXpay." text="Track productization improvements across Admin, Agent, Merchant, Checkout and Developer UX." items={[
    { title: "V1.6 Productization", text: "Dashboard metrics, Merchant 360, wallet, webhook, checkout and commercial pages." },
    { title: "V1.5 PSP Fees Checkout", text: "PSP/channel routing, merchant channel fees and sandbox checkout." },
    { title: "V1.4 Route Protection", text: "Role-based route protection and smoke test coverage." },
  ]} />;
}
