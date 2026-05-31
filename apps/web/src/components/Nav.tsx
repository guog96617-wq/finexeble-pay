import Link from "next/link";

const links = [
  ["Product", "/product"],
  ["Payments", "/payments"],
  ["API Docs", "/docs/api"],
  ["SDK", "/sdk"],
  ["Plugins", "/plugins"],
  ["Admin", "/admin"],
];

export function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/88 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-black tracking-wide">
          Global Payment Hub
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-slate-300 md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/apply/merchant" className="button">
          Apply
        </Link>
      </div>
    </header>
  );
}
