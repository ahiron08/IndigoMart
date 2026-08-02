import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function RoutePage({ eyebrow = 'IndigoMart', title, description, actionLabel = 'Explore products', actionTo = '/shop' }) {
  return (
    <main className="page-wrap grid min-h-[70dvh] place-items-center py-20">
      <div className="max-w-3xl text-center">
        <p className="eyebrow text-clay">{eyebrow}</p>
        <h1 className="mt-6 font-display text-6xl leading-[.95] tracking-tight text-indigo md:text-8xl">{title}</h1>
        <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-muted">{description}</p>
        <Link className="button-primary mt-9" to={actionTo}>{actionLabel} <ArrowRight size={16} /></Link>
      </div>
    </main>
  );
}

export default RoutePage;
