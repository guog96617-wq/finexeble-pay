export const brand = {
  productName: "Finexeble",
  shortName: "FXpay",
  positioning: "Global Payment Aggregator Platform",
  tagline: "Global payments made simple for merchants and agents.",
  description:
    "A light fintech SaaS platform for global payment aggregation, merchant operations, PSP routing, wallet settlement and signed developer APIs.",
  logo: "/brand/logo.png",
  logoIcon: "/brand/logo-icon.png",
  ogImage: "/brand/og-image.png",
};

export const statusTone: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  ACTIVE: "success",
  PAID: "success",
  SUCCESS: "success",
  APPROVED: "info",
  PROCESSING: "info",
  PENDING: "warning",
  FAILED: "danger",
  REJECTED: "danger",
  SUSPENDED: "danger",
  DISABLED: "danger",
  REFUNDED: "neutral",
  CANCELLED: "neutral",
};
