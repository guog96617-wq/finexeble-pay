import clsx from "clsx";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, TrendingUp } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

type Tone = "brand" | "success" | "warn" | "danger" | "cyan" | "neutral";

const toneText: Record<Tone, string> = {
  brand: "text-brand",
  success: "text-success",
  warn: "text-warn",
  danger: "text-danger",
  cyan: "text-cyan",
  neutral: "text-slate-700",
};

const toneBg: Record<Tone, string> = {
  brand: "bg-blue-50 text-blue-700",
  success: "bg-green-50 text-green-700",
  warn: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  cyan: "bg-cyan-50 text-cyan-700",
  neutral: "bg-slate-50 text-slate-700",
};

export function SectionHeader({ eyebrow, title, text, action }: { eyebrow?: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="text-sm font-bold uppercase tracking-[.16em] text-brand">{eyebrow}</p> : null}
        <h2 className="mt-1 text-2xl font-black text-slate-950">{title}</h2>
        {text ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{text}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function OpsMetricCard({ label, value, caption, tone = "brand", trend = "+8.4%" }: { label: string; value: string; caption?: string; tone?: Tone; trend?: string }) {
  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-muted">{label}</p>
        <span className={clsx("rounded-full px-2 py-1 text-xs font-black", toneBg[tone])}>{trend}</span>
      </div>
      <p className={clsx("mt-3 text-3xl font-black", toneText[tone])}>{value}</p>
      <MiniTrend tone={tone} />
      <p className="mt-3 text-xs font-semibold text-muted">{caption ?? "今日 / 7天 / 30天"}</p>
    </div>
  );
}

export function MiniTrend({ tone = "brand" }: { tone?: Tone }) {
  const color = tone === "success" ? "bg-green-400" : tone === "warn" ? "bg-amber-400" : tone === "danger" ? "bg-red-400" : tone === "cyan" ? "bg-cyan-400" : "bg-blue-400";
  return (
    <div className="mt-4 flex h-8 items-end gap-1">
      {[34, 42, 38, 54, 48, 66, 72, 61, 78, 84].map((height, index) => (
        <span key={index} className={clsx("w-full rounded-t opacity-75", color)} style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

export function PeriodSwitch() {
  return (
    <div className="inline-flex rounded-lg border border-line bg-white p-1 text-xs font-black text-slate-600 shadow-sm">
      {["今日", "7天", "30天"].map((item, index) => (
        <span key={item} className={clsx("rounded-md px-3 py-2", index === 0 && "bg-blue-50 text-brand")}>{item}</span>
      ))}
    </div>
  );
}

export function RiskPanel({ risks }: { risks: { title: string; text: string; level: "INFO" | "WARNING" | "CRITICAL" }[] }) {
  const icon = { INFO: Info, WARNING: AlertTriangle, CRITICAL: AlertTriangle };
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-950">风险与告警</h3>
          <p className="mt-1 text-sm text-muted">优先处理会影响收款、回调或提现的运营风险。</p>
        </div>
        <StatusBadge status={risks.length ? "WARNING" : "ACTIVE"} />
      </div>
      <div className="mt-4 grid gap-3">
        {risks.map((risk) => {
          const Icon = icon[risk.level];
          return (
            <div key={risk.title} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-line bg-slate-50 p-3">
              <div className="flex gap-3">
                <Icon className={clsx("mt-0.5 h-4 w-4", risk.level === "CRITICAL" ? "text-danger" : risk.level === "WARNING" ? "text-warn" : "text-brand")} />
                <div>
                  <p className="font-black text-slate-900">{risk.title}</p>
                  <p className="mt-1 text-sm text-muted">{risk.text}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="button secondary px-3 py-2 text-xs">查看详情</button>
                <button type="button" className="button secondary px-3 py-2 text-xs">标记已处理</button>
              </div>
            </div>
          );
        })}
        {risks.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-green-100 bg-green-50 p-3 text-sm font-bold text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            暂无风险告警。
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function InsightCard({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="surface p-5">
      <div className="flex items-start gap-3">
        <TrendingUp className="mt-1 h-5 w-5 text-brand" />
        <div>
          <h3 className="font-black text-slate-950">{title}</h3>
          {text ? <p className="mt-2 text-sm leading-6 text-muted">{text}</p> : null}
        </div>
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export function SimpleBars({ labels }: { labels: string[] }) {
  return (
    <div className="grid gap-3">
      {labels.map((label, index) => (
        <div key={label}>
          <div className="mb-1 flex justify-between text-xs font-bold text-slate-600">
            <span>{label}</span>
            <span>{[72, 64, 88, 51, 79][index % 5]}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-blue-500" style={{ width: `${[72, 64, 88, 51, 79][index % 5]}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
