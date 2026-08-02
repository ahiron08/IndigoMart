import { Store, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

function RegisterTypePage() {
  return (
    <div className="w-full py-4">
      <p className="eyebrow text-clay">Join the marketplace</p>
      <h1 className="mt-4 font-display text-5xl tracking-tight text-indigo">Choose account type.</h1>
      <p className="mt-4 text-sm leading-6 text-muted">Are you here to shop or to sell?</p>

      <div className="mt-10 space-y-4">
        <Link
          to="/signup/customer"
          className="flex items-center gap-5 rounded-2xl border border-indigo/10 bg-canvas p-6 transition hover:border-indigo/30 hover:bg-sand/50"
        >
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-sand">
            <UserRound size={24} className="text-indigo" />
          </div>
          <div>
            <h2 className="font-display text-2xl text-indigo">Customer</h2>
            <p className="mt-1 text-sm text-muted">Browse, shop, and discover independent makers.</p>
          </div>
        </Link>

        <Link
          to="/signup/seller"
          className="flex items-center gap-5 rounded-2xl border border-indigo/10 bg-canvas p-6 transition hover:border-indigo/30 hover:bg-sand/50"
        >
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-sand">
            <Store size={24} className="text-indigo" />
          </div>
          <div>
            <h2 className="font-display text-2xl text-indigo">Seller</h2>
            <p className="mt-1 text-sm text-muted">List products, manage orders, and grow your business.</p>
          </div>
        </Link>
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        Already have an account?{' '}
        <Link className="font-semibold text-indigo hover:underline" to="/login">Sign in</Link>
      </p>
    </div>
  );
}

export default RegisterTypePage;