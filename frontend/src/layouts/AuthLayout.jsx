import { ArrowLeft } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';

import Logo from '@/components/Logo.jsx';

function AuthLayout() {
  return (
    <main className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-indigo p-12 text-canvas lg:flex lg:flex-col lg:justify-between">
        <Logo inverse />
        <div className="relative z-10 max-w-xl">
          <p className="eyebrow text-accent">A closer kind of marketplace</p>
          <blockquote className="mt-6 font-display text-6xl leading-[.98] tracking-tight">
            Keep good things—and their stories—within reach.
          </blockquote>
        </div>
        <p className="relative z-10 text-xs text-canvas/45">Independent by design · IndigoMart</p>
        <div className="absolute -right-24 top-[12%] h-[42rem] w-[42rem] rounded-full border border-canvas/10" />
        <div className="absolute -right-2 top-[25%] h-72 w-72 rounded-[48%_52%_42%_58%] bg-clay/75" />
        <div className="absolute right-36 top-[15%] h-96 w-64 rotate-12 rounded-t-full rounded-b-[40%] bg-accent/80" />
      </section>
      <section className="flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:px-16 lg:py-10">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden"><Logo /></div>
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-indigo">
            <ArrowLeft size={15} /> Back to shop
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 items-center py-12"><Outlet /></div>
      </section>
    </main>
  );
}

export default AuthLayout;
