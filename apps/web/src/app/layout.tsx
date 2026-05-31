import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Global Payment Hub Starter",
  description: "Payment aggregation operations platform starter",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
