import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: `${brand.productName} | ${brand.shortName}`,
  description: brand.description,
  openGraph: {
    title: `${brand.productName} ${brand.shortName}`,
    description: brand.description,
    images: [brand.ogImage],
  },
  icons: {
    icon: "/favicon.png",
    other: [{ rel: "icon", url: "/favicon.ico" }],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
