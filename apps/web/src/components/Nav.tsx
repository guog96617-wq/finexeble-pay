import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

const links = [
  ["Product", "/product"],
  ["Developers", "/docs/api"],
  ["Plugins", "/plugins"],
  ["Pricing", "/payments"],
  ["Contact", "/contact"],
];

export function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <BrandLogo priority />
        <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-600 md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-brand">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="button secondary hidden sm:inline-flex">
            Login
          </Link>
          <Link href="/apply/merchant" className="button">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
