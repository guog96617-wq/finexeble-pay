import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#06111f",
        panel: "#0b1b31",
        line: "#1b3758",
        brand: "#2f80ed",
        cyan: "#20d4ff",
        success: "#2bd576",
        warn: "#ffba4a",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(47,128,237,.28), 0 24px 80px rgba(4,20,44,.55)",
      },
    },
  },
  plugins: [],
};

export default config;
