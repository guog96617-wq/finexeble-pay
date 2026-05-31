import { StatsCard } from "./StatsCard";

export function MetricCard({ label, value, tone = "brand" }: { label: string; value: string; tone?: string }) {
  return <StatsCard label={label} value={value} tone={tone} />;
}
