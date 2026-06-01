import { MarketingPage } from "@/components/MarketingPage";

export default function FaqPage() {
  return <MarketingPage eyebrow="FAQ" title="Common questions before launching FXpay." text="A plain-language FAQ for operators, merchants, agents and developers." items={[
    { title: "Does Sandbox process real money?", text: "No. Sandbox Pay is only used to verify checkout, wallet and webhook workflows." },
    { title: "Can agents manage merchant fees?", text: "Yes, within the platform minimum fee rules set by Admin." },
    { title: "Can merchants use API keys?", text: "Yes. Merchant developer UX includes HMAC rules, Curl and webhook examples." },
  ]} />;
}
