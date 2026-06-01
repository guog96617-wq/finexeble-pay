import { MarketingPage } from "@/components/MarketingPage";

export default function PricingPage() {
  return <MarketingPage eyebrow="Pricing" title="Simple platform pricing for payment operators." text="Use FXpay to package PSP routing, merchant operations, wallet reporting and agent management into one SaaS commercial offer." items={[
    { title: "Starter", text: "For sandbox demos and early merchant onboarding." },
    { title: "Growth", text: "For operators managing multiple PSPs, agents and settlement rules." },
    { title: "Enterprise", text: "For global payment teams needing compliance, reporting and dedicated support." },
  ]} />;
}
