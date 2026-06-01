import { MarketingPage } from "@/components/MarketingPage";

export default function CompliancePage() {
  return <MarketingPage eyebrow="Compliance" title="Compliance-ready operating model." text="FXpay does not implement complex AML in this phase, but presents auditability, webhook logs, route controls and withdrawal review surfaces." items={[
    { title: "Audit logs", text: "Admin and agent operational actions are recorded for review." },
    { title: "Withdrawal review", text: "Risk tags, approval states and wallet movement are visible." },
    { title: "API security", text: "HMAC headers, timestamp and nonce rules are documented." },
  ]} />;
}
