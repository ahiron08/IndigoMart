import { BarChart3, Boxes, CircleDollarSign, Home, Package, Settings, ShoppingBag, Tags, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import Logo from '@/components/Logo.jsx';
import { useAuth } from '@/context/AuthContext.jsx';

const creatorLinks = [
  ['Overview', '.', Home], ['Inventory', 'inventory', Boxes],
  ['Orders', 'orders', ShoppingBag], ['Analytics', 'analytics', BarChart3], ['Revenue', 'revenue', CircleDollarSign],
  ['Coupons', 'coupons', Tags], ['Settings', 'settings', Settings],
];
const sellerLinks = [
  ['Overview', '.', Home], ['My Products', 'my-products', Package], ['Orders', 'orders', ShoppingBag],
  ['Analytics', 'analytics', BarChart3], ['Revenue', 'revenue', CircleDollarSign],
  ['Settings', 'settings', Settings],
];
const adminLinks = [
  ['Overview', '.', Home],
  ['Sellers', 'sellers', Users], ['Products', 'products', Package],
  ['Orders', 'orders', ShoppingBag], ['Categories', 'categories', Boxes],
  ['Analytics', 'analytics', BarChart3],
  ['Coupons', 'coupons', Tags], ['Settings', 'settings', Settings],
];

function DashboardLayout() {
  const { user, logout } = useAuth();
  const links = user?.role === 'admin' ? adminLinks : user?.role === 'seller' ? sellerLinks : creatorLinks;

  return (
    <div className="min-h-dvh bg-sand/55 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-indigo/10 bg-canvas px-5 py-5 lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between lg:block"><Logo /><span className="status-pill">{user?.role}</span></div>
        <nav className="mt-6 flex gap-2 overflow-x-auto lg:mt-12 lg:flex-col" aria-label="Dashboard">
          {links.map(([label, to, Icon]) => (
            <NavLink
              key={label}
              to={to}
              end={to === '.'}
              className={({ isActive }) => `dashboard-link ${isActive ? 'dashboard-link-active' : ''}`}
            >
              <Icon size={17} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 hidden border-t border-indigo/10 pt-6 lg:block">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="mt-1 truncate text-xs text-muted">{user?.email}</p>
          <button className="mt-5 text-xs font-medium text-clay" type="button" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="min-w-0 p-5 sm:p-8 lg:p-12"><Outlet /></main>
    </div>
  );
}

export default DashboardLayout;