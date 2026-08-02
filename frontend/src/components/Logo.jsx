import { Link } from 'react-router-dom';

function Logo({ inverse = false }) {
  return (
    <Link to="/" className={`font-display text-2xl tracking-tight ${inverse ? 'text-canvas' : 'text-indigo'}`}>
      Indigo<span className="text-accent">Mart</span>
    </Link>
  );
}

export default Logo;
