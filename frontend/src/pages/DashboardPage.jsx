import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, Package, ShoppingBag, Tags, TrendingUp, Users, Boxes,
  AlertCircle, Loader2, ChevronRight,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext.jsx';
import { getAllOrders, getDashboardStats, getAllProducts } from '@/services/admin.js';

const adminStatCards = [
  ['Total Revenue', 'revenue', TrendingUp, '₹'],
  ['Total Orders', 'totalOrders', ShoppingBag, ''],
  ['Pending Orders', 'pendingOrders', ShoppingBag, ''],
  ['Active Products', 'totalProducts', Package, ''],
  ['Customers', 'totalUsers', Users, ''],
  ['Total Sellers', 'totalSellers', Users, ''],
  ['Active Coupons', 'totalCoupons', Tags, ''],
  ['Categories', 'totalCategories', Boxes, ''],
  ['Pending Sellers', 'pendingSellers', AlertCircle, ''],
  ['Pending Products', 'pendingProducts', AlertCircle, ''],
];

const sellerStatCards = [
  ['Revenue', 'revenue', TrendingUp, '₹'],
  ['Open orders', 'totalOrders', ShoppingBag, ''],
  ['Live products', 'totalProducts', Package, ''],
  ['Profile visits', 'totalUsers', Users, ''],
];

const formatCurrency = (amount) =>
  amount != null ? `₹${Number(amount).toLocaleString('en-IN')}` : '₹0';

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const statusColors = {
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  'Order Placed': 'bg-blue-100 text-blue-800',
  Confirmed: 'bg-amber-100 text-amber-800',
};

function OrderQueue({ orders, loading }) {
  return (
    <article className="rounded-2xl border border-indigo/10 bg-canvas p-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl">Order Queue</h2>
          <p className="mt-1 text-xs text-muted">Latest orders placed across all sellers</p>
        </div>
        <Link className="text-sm text-clay hover:underline" to="orders">
          View all <ChevronRight size={14} className="inline" />
        </Link>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-muted" size={28} />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-indigo/20 py-16 text-center">
          <p className="text-sm text-muted">No orders yet. Orders will appear here as they are placed.</p>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-indigo/10 bg-sand/30">
              <tr>
                <th className="p-3 font-medium">Order #</th>
                <th className="p-3 font-medium">Buyer</th>
                <th className="p-3 font-medium">Seller</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b border-indigo/5 hover:bg-sand/20">
                  <td className="p-3 font-mono text-xs">{order.orderNumber}</td>
                  <td className="p-3 text-muted">{order.buyer?.name || '—'}</td>
                  <td className="p-3 text-muted">{order.seller?.shopName || order.seller?.name || '—'}</td>
                  <td className="p-3 font-medium">{formatCurrency(order.pricing?.totalAmount)}</td>
                  <td className="p-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status] || 'bg-amber-100 text-amber-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function RecentProducts({ products, loading }) {
  return (
    <article className="rounded-2xl border border-indigo/10 bg-canvas p-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl">Recent Products</h2>
          <p className="mt-1 text-xs text-muted">Latest products from all sellers</p>
        </div>
        <Link className="text-sm text-clay hover:underline" to="products">
          View all <ChevronRight size={14} className="inline" />
        </Link>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-muted" size={28} />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-indigo/20 py-16 text-center">
          <p className="text-sm text-muted">No products yet. Products from all sellers will appear here.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {products.map((product) => (
            <div key={product._id} className="flex items-center justify-between gap-3 rounded-xl border border-indigo/5 p-3 hover:bg-sand/20">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {product.sellerName || product.creator?.name || '—'} · {product.brand}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{formatCurrency(product.price)}</span>
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${product.isApproved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                  {product.isApproved ? 'Approved' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      getDashboardStats()
        .then(({ data }) => setStats(data.data))
        .catch(() => {})
        .finally(() => setLoading(false));

      getAllOrders({ page: 1, limit: 8 })
        .then(({ data }) => setOrders(data.data.orders))
        .catch(() => setOrders([]))
        .finally(() => setOrdersLoading(false));

      getAllProducts({ page: 1, limit: 6 })
        .then(({ data }) => setProducts(data.data.products))
        .catch(() => setProducts([]))
        .finally(() => setProductsLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, isAdmin]);

  const statCards = isAdmin ? adminStatCards : sellerStatCards;

  return (
    <div>
      <p className="eyebrow text-clay">{user?.role} workspace</p>
      <h1 className="mt-3 font-display text-5xl text-indigo">Good to see you, {user?.name?.split(' ')[0]}.</h1>
      <p className="mt-3 text-sm text-muted">Here is the shape of your marketplace today.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {statCards.map(([label, key, Icon, prefix]) => {
          const value = stats && stats[key] !== undefined
            ? `${prefix}${stats[key].toLocaleString('en-IN')}`
            : prefix === '₹' ? '₹0' : '0';
          return (
            <article key={label} className="rounded-2xl border border-indigo/10 bg-canvas p-6">
              <div className="flex items-start justify-between">
                <p className="text-sm text-muted">{label}</p>
                <Icon size={17} className="text-clay" />
              </div>
              <p className="mt-7 font-display text-4xl">
                {loading ? (
                  <span className="text-muted/50">Loading...</span>
                ) : value}
              </p>
            </article>
          );
        })}
      </div>

      {isAdmin ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <OrderQueue orders={orders} loading={ordersLoading} />
          <RecentProducts products={products} loading={productsLoading} />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <article className="min-h-80 rounded-2xl border border-indigo/10 bg-canvas p-7">
            <div className="flex justify-between">
              <h2 className="font-display text-2xl">Performance</h2>
              <span className="status-pill">Last 30 days</span>
            </div>
            <div className="mt-12 flex h-40 items-end gap-3 border-b border-indigo/10">
              {[28, 45, 35, 62, 48, 75, 58, 83, 68, 91, 77, 88].map((height, index) => (
                <div key={index} className="flex-1 rounded-t bg-indigo/80" style={{ height: `${height}%` }} />
              ))}
            </div>
          </article>
          <article className="rounded-2xl bg-indigo p-7 text-canvas">
            <h2 className="font-display text-2xl">Next steps</h2>
            <p className="mt-3 text-sm leading-6 text-canvas/60">
              Your operational tools are ready to connect as the remaining marketplace modules come online.
            </p>
            <button className="mt-8 inline-flex items-center gap-2 text-sm text-accent" type="button">
              View setup guide <ArrowUpRight size={15} />
            </button>
          </article>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;