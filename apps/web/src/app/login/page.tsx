import { BrandLogo } from "@/components/BrandLogo";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_45%,#eef5ff_100%)]">
      <div className="absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="absolute right-[-5rem] top-20 h-96 w-96 rounded-full bg-violet-300/30 blur-3xl" />
      <header className="relative border-b border-line bg-white/45 px-5 py-4 backdrop-blur-xl">
        <BrandLogo priority />
      </header>
      <section className="relative mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.18em] text-cyan">Unified Login</p>
          <h1 className="mt-4 max-w-xl text-5xl font-black leading-tight text-slate-950">A clean command center for payment operations.</h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
            Sign in with a demo account to review Super Admin, Merchant Center, or Agent Center. The platform routes you automatically by role.
          </p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {["SUPER_ADMIN -> /admin", "MERCHANT_ADMIN -> /merchant", "AGENT_ADMIN -> /agent"].map((item) => (
              <div key={item} className="rounded-xl border border-blue-100 bg-white/70 p-3 text-xs font-bold text-blue-700 shadow-sm backdrop-blur">
                {item}
              </div>
            ))}
          </div>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
