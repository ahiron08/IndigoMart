import { Heart, LayoutDashboard, LogOut, Menu, Search, ShoppingBag, UserRound, X, User, Package } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext.jsx';
import Logo from './Logo.jsx';

const links = [
  { label: 'Shop', to: '/shop' },
  { label: 'Categories', to: '/categories' },
  { label: 'Our story', to: '/about' },
];

const linkClass = ({ isActive }) =>
  `text-sm transition-colors hover:text-clay ${isActive ? 'text-clay' : 'text-indigo/75'}`;

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const dashboardPath = user?.role === 'admin' ? '/admin' : user?.role === 'seller' || user?.role === 'creator' ? '/seller/dashboard' : null;

  return (
    <header className="sticky top-0 z-40 border-b border-indigo/10 bg-canvas/90 backdrop-blur-xl">
      <div className="page-wrap flex h-18 items-center justify-between gap-6">
        <button
          type="button"
          className="icon-button md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Logo />

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {links.map((link) => <NavLink key={link.to} to={link.to} className={linkClass}>{link.label}</NavLink>)}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link className="icon-button" to="/search" aria-label="Search"><Search size={19} /></Link>
          <Link className="icon-button" to="/wishlist" aria-label="Wishlist"><Heart size={19} /></Link>
          <Link className="icon-button" to="/cart" aria-label="Shopping cart"><ShoppingBag size={19} /></Link>
          {user ? (
            <div className="relative hidden sm:block">
              <button className="icon-button" onClick={() => setUserMenuOpen((o) => !o)} aria-label="Account menu">
                <UserRound size={19} />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-2xl border border-indigo/10 bg-canvas p-2 shadow-lg">
                    <div className="border-b border-indigo/10 px-3 py-2">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted truncate">{user.email}</p>
                    </div>
                    <Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-indigo/5 transition" to="/profile" onClick={() => setUserMenuOpen(false)}>
                      <User size={16} /> My Profile
                    </Link>
                    <Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-indigo/5 transition" to="/orders" onClick={() => setUserMenuOpen(false)}>
                      <Package size={16} /> My Orders
                    </Link>
                    {dashboardPath && (
                      <Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-indigo/5 transition" to={dashboardPath} onClick={() => setUserMenuOpen(false)}>
                        <LayoutDashboard size={16} /> Dashboard
                      </Link>
                    )}
                    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-clay hover:bg-clay/5 transition" onClick={() => { logout(); setUserMenuOpen(false); }}>
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link className="icon-button hidden sm:grid" to="/login" aria-label="Account"><UserRound size={19} /></Link>
          )}
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-indigo/10 px-6 py-5 md:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass} onClick={() => setMenuOpen(false)}>
                {link.label}
              </NavLink>
            ))}
            <NavLink to="/wishlist" className={linkClass} onClick={() => setMenuOpen(false)}>Wishlist</NavLink>
            {user ? (
              <>
                <NavLink to="/profile" className={linkClass} onClick={() => setMenuOpen(false)}>My Profile</NavLink>
                <NavLink to="/orders" className={linkClass} onClick={() => setMenuOpen(false)}>My Orders</NavLink>
                {dashboardPath && (
                  <NavLink to={dashboardPath} className={linkClass} onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
                )}
                <button className={linkClass} onClick={logout}>Sign out</button>
              </>
            ) : (
              <NavLink to="/login" className={linkClass} onClick={() => setMenuOpen(false)}>Sign in</NavLink>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export default Navbar;
