import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import Logo from './Logo.jsx';

const groups = [
  { title: 'Discover', links: [['New arrivals', '/shop?sort=newest'], ['Categories', '/categories'], ['Creators', '/creators']] },
  { title: 'Help', links: [['Orders', '/orders'], ['Shipping & returns', '/shipping'], ['Contact', '/contact']] },
  { title: 'IndigoMart', links: [['Our story', '/about'], ['Sell with us', '/creator/apply'], ['Journal', '/journal']] },
];

function Footer() {
  return (
    <footer className="bg-indigo text-canvas">
      <div className="page-wrap py-16 lg:py-20">
        <div className="grid gap-12 border-b border-canvas/15 pb-14 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo inverse />
            <p className="mt-5 max-w-sm text-sm leading-6 text-canvas/60">
              Objects with a point of view, directly from the independent people who make them.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="eyebrow text-accent">{group.title}</p>
                <ul className="mt-5 space-y-3">
                  {group.links.map(([label, to]) => (
                    <li key={label}><Link className="text-sm text-canvas/65 transition hover:text-canvas" to={to}>{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-7 text-xs text-canvas/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} IndigoMart. Thoughtfully direct.</p>
          <a className="inline-flex items-center gap-1 hover:text-canvas" href="mailto:hello@indigomart.com">
            hello@indigomart.com <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
