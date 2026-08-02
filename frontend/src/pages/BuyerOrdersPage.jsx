import { Package, Loader2, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getMyOrders } from '@/services/orders.js';
import { formatCurrency } from '@/utils/format.js';

const statusColors = {
  'Order Placed': 'bg-indigo/10 text-indigo',
  'Confirmed': 'bg-emerald-100 text-emerald-700',
  'Packed': 'bg-blue-100 text-blue-700',
  'Picked Up': 'bg-amber-100 text-amber-700',
  'In Transit': 'bg-purple-100 text-purple-700',
  'Out for Delivery': 'bg-orange-100 text-orange-700',
  'Delivered': 'bg-emerald-100 text-emerald-700',
  'Cancelled': 'bg-clay/10 text-clay',
};

function BuyerOrdersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyOrders(page);
      setOrders(data.orders || []);
      setPagination(data.pagination);
    } catch (err) {
      setError('Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="mx-auto animate-spin text-indigo" size={40} />
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-indigo/10 pb-6">
        <p className="eyebrow text-clay">Account</p>
        <h1 className="mt-2 font-display text-4xl text-indigo">My Orders</h1>
        <p className="mt-2 text-sm text-muted">Track your orders and view order history.</p>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-clay/20 bg-clay/10 p-4">
          <p className="text-sm font-medium text-clay">{error}</p>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-indigo/10 bg-canvas p-12 text-center">
            <Package size={48} className="mx-auto text-muted" />
            <h3 className="mt-4 font-display text-xl text-indigo">No orders yet</h3>
            <p className="mt-2 text-sm text-muted">When you place an order, it will appear here.</p>
            <button className="button-primary mt-6" onClick={() => navigate('/shop')}>Start Shopping</button>
          </div>
        ) : (
          orders.map((order) => (
            <button
              key={order._id}
              className="w-full text-left rounded-2xl border border-indigo/10 bg-canvas p-5 hover:border-indigo/30 transition cursor-pointer"
              onClick={() => navigate(`/orders/${order._id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-display text-lg text-indigo">#{order.orderNumber}</p>
                    <span className={`status-pill text-xs ${statusColors[order.status] || 'bg-indigo/10 text-indigo'}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    {order.items?.map((item, i) => (
                      <p key={i} className="text-muted">
                        {item.title} × {item.quantity}
                      </p>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                    <span>Total: <span className="font-medium text-indigo">{formatCurrency(order.pricing?.totalAmount)}</span></span>
                    <span>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {order.shipping?.estimatedDelivery && (
                      <span>Est: {new Date(order.shipping.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={20} className="text-muted flex-shrink-0 mt-1" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`h-8 w-8 rounded-lg text-sm font-medium ${page === pagination.page ? 'bg-indigo text-canvas' : 'bg-sand text-muted hover:bg-indigo/10'}`}
              onClick={() => loadOrders(page)}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default BuyerOrdersPage;