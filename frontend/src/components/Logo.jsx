import { Link } from 'react-router-dom';

import brandLogo from '../logo.png';

function Logo({ inverse = false }) {
  return (
    <Link
      to="/"
      className="flex items-center gap-3 font-display text-2xl tracking-tight"
    >
      <img
        src={brandLogo}
        alt="IndigoMart logo"
        className={`h-12 w-12 shrink-0 rounded-md object-cover ${inverse ? 'ring-1 ring-canvas/30' : ''}`}
      />
      {/*
        Wordmark text is commented out for now — logo image only.
        <span className={inverse ? 'text-canvas' : 'text-indigo'}>
          Indigo<span className="text-accent">Mart</span>
        </span>
      */}
    </Link>
  );
}

export default Logo;
