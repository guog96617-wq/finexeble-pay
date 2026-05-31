import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#f7f9fd",
        panel: "#ffffff",
        elevated: "#f8fbff",
        line: "#e5ebf4",
        brand: "#2563eb",
        brand2: "#7c3aed",
        cyan: "#0891b2",
        success: "#16a34a",
        warn: "#d97706",
        danger: "#dc2626",
        muted: "#64748b",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(37,99,235,.10), 0 24px 70px rgba(37,99,235,.16)",
        card: "0 18px 50px rgba(15,23,42,.08)",
      },
      borderRadius: {
        card: "10px",
        control: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
