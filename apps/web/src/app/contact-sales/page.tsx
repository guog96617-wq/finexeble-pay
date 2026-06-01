import { MarketingPage } from "@/components/MarketingPage";

export default function ContactSalesPage() {
  return <MarketingPage eyebrow="Contact Sales" title="Talk to FXpay about your payment operation." text="Share your markets, PSP stack, merchants, agent model and settlement requirements. Our demo flow is ready for review." items={[
    { title: "Merchant onboarding", text: "Plan payment method enablement, API keys and webhook setup." },
    { title: "Agent network", text: "Map agent permissions, merchant fee floors and profit reporting." },
    { title: "Operations review", text: "Review routing, wallet, withdrawals and webhook observability." },
  ]} />;
}
