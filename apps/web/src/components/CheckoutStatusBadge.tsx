import clsx from "clsx";

const checkoutToneClass = {
  success: "border-green-200 bg-green-50 text-green-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
};

export function getCheckoutStatusLabel(status: string, isTimeout = false) {
  if (isTimeout || ["CANCELLED", "EXPIRED", "TIMEOUT", "TIMED_OUT"].includes(status)) {
    return "已超时";
  }
  if (["PAID", "SUCCESS"].includes(status)) {
    return "支付成功";
  }
  if (["FAILED", "REJECTED"].includes(status)) {
    return "支付失败";
  }
  return "待支付";
}

export function CheckoutStatusBadge({ status, isTimeout = false }: { status: string; isTimeout?: boolean }) {
  const label = getCheckoutStatusLabel(status, isTimeout);
  const tone = label === "支付成功" ? "success" : label === "支付失败" ? "danger" : label === "已超时" ? "neutral" : "warning";
  return <span className={clsx("inline-flex rounded-full border px-2.5 py-1 text-xs font-bold", checkoutToneClass[tone])}>{label}</span>;
}
