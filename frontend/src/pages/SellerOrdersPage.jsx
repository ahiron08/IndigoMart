import { Package, Loader2, ChevronRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getSellerOrders, updateOrderStatus } from '@/services/orders.js';
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

const statusActions = {
  'Order Placed': ['Confirmed', 'Cancelled'],
  'Confirmed': ['Packed', 'Cancelled'],
  'Packed': ['Picked Up'],
  'Picked Up': ['In Transit'],
  'In Transit': ['Out for Delivery'],
  'Out for Delivery': ['Delivered'],
  'Delivered': [],
  'Cancelled': [],
};

function SellerOrdersPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const data = await getSellerOrders(page);
      setOrders(data.orders || []);
      setPagination(data.pagination);
    } catch (err) {
      setError('Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrders(pagination?.page || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update status.');
    } finally {
      setUpdatingId(null);
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
        <p className="eyebrow text-clay">Seller Dashboard</p>
        <h1 className="mt-2 font-display text-4xl text-indigo">Orders</h1>
        <p className="mt-2 text-sm text-muted">Manage incoming orders and update shipping status.</p>
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
            <p className="mt-2 text-sm text-muted">When customers place orders, they will appear here.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="rounded-2xl border border-indigo/10 bg-canvas p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-display text-lg text-indigo">#{order.orderNumber}</p>
                    <span className={`status-pill text-xs ${statusColors[order.status] || 'bg-indigo/10 text-indigo'}`}>
                      {order.status}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                    <div>
                      <p className="text-xs text-muted">Buyer</p>
                      <p className="font-medium">{order.buyer?.name || 'N/A'}</p>
                      <p className="text-xs text-muted">{order.buyer?.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Delivery</p>
                      <p className="font-medium">{order.deliveryAddress?.city}, {order.deliveryAddress?.state}</p>
                      <p className="text-xs text-muted">{order.deliveryAddress?.pincode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Total</p>
                      <p className="font-medium text-indigo">{formatCurrency(order.pricing?.totalAmount)}</p>
                      <p className="text-xs text-muted">
                        Payment: <span className={order.payment?.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}>{order.payment?.status}</span>
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mt-3 space-y-1">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="h-10 w-10 rounded-lg object-cover bg-sand" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-sand" />
                        )}
                        <span className="flex-1">{item.title} × {item.quantity}</span>
                        <span className="text-muted">{formatCurrency(item.sellerPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-shrink-0 flex flex-col gap-2">
                  {order.shipping?.estimatedDelivery && (
                    <p className="text-xs text-muted text-right">
                      Est: {new Date(order.shipping.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                  {(statusActions[order.status] || []).length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {(statusActions[order.status] || []).map((action) => (
                        <button
                          key={action}
                          className="button-secondary text-xs px-3 py-1.5"
                          onClick={() => handleStatusUpdate(order._id, action)}
                          disabled={updatingId === order._id}
                        >
                          {updatingId === order._id ? '...' : `Mark ${action}`}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    className="text-xs text-indigo hover:underline mt-1"
                    onClick={() => navigate(`/orders/${order._id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
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

export default SellerOrdersPage;