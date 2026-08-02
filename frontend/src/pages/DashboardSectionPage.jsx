import { useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, Ban, Trash2, Search, ChevronLeft, ChevronRight,
  Plus, Edit2, Eye, EyeOff, Star, Trophy, Package, ShoppingBag, Users,
  Tags, Boxes, BarChart3, Loader2, AlertTriangle, TrendingUp,
} from 'lucide-react';

import {
  getDashboardStats,
  getUsers, banUser, unbanUser, deleteUser,
  getAllProducts, adminDeleteProduct, adminRestoreProduct,
  adminApproveProduct, adminRejectProduct, adminFeatureProduct, adminUnfeatureProduct,
  getAllOrders, adminUpdateOrderStatus,
  getSellers, getSeller, approveSeller, rejectSeller, suspendSeller, activateSeller, deleteSeller,
  adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory,
  getCoupons, createCoupon, updateCoupon, deleteCoupon,
} from '@/services/admin.js';

// ─── Utility ──────────────────────────────────────────────────────────────────

const notify = (message, type = 'success') => {
  console.log(`[${type}] ${message}`);
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const formatCurrency = (amount) =>
  amount != null ? `₹${Number(amount).toLocaleString('en-IN')}` : '₹0';

const statusPill = (active) =>
  active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-between border-t border-indigo/10 pt-4">
      <p className="text-xs text-muted">
        Page {pagination.page} of {pagination.pages} ({pagination.total} total)
      </p>
      <div className="flex gap-2">
        <button
          className="btn-secondary btn-sm"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          <ChevronLeft size={15} /> Prev
        </button>
        <button
          className="btn-secondary btn-sm"
          disabled={pagination.page >= pagination.pages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Next <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────

function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative mb-6">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-indigo/10 bg-canvas py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo/30"
      />
    </div>
  );
}

// ─── Loading / Empty ──────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-muted" size={32} />
    </div>
  );
}

function EmptyState({ message = 'No data found.' }) {
  return (
    <div className="rounded-2xl border border-dashed border-indigo/20 bg-canvas p-10 text-center">
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-canvas p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl">{title}</h2>
          <button className="text-muted hover:text-clay" onClick={onClose}><XCircle size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Users
// ═══════════════════════════════════════════════════════════════════════════════

function UsersSection() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    getUsers({ page, limit: 20, search })
      .then(({ data }) => {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      })
      .catch(() => notify('Failed to fetch users.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const handleBan = async (id) => {
    try {
      await banUser(id);
      notify('User banned.');
      fetchUsers();
    } catch { notify('Failed to ban user.', 'error'); }
  };

  const handleUnban = async (id) => {
    try {
      await unbanUser(id);
      notify('User unbanned.');
      fetchUsers();
    } catch { notify('Failed to unban user.', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(id);
      notify('User deleted.');
      fetchUsers();
    } catch { notify('Failed to delete user.', 'error'); }
  };

  return (
    <div>
      <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or email..." />
      {loading ? <LoadingState /> : users.length === 0 ? <EmptyState message="No users found." /> : (
        <div className="overflow-x-auto rounded-2xl border border-indigo/10 bg-canvas">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-indigo/10 bg-sand/30">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Joined</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-indigo/5 hover:bg-sand/20">
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-muted">{user.email}</td>
                  <td className="p-4 text-muted">{formatDate(user.createdAt)}</td>
                  <td className="p-4">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPill(!user.isBlocked)}`}>
                      {user.isBlocked ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex gap-1.5">
                      {user.isBlocked ? (
                        <button className="btn-icon" title="Unban" onClick={() => handleUnban(user._id)}><CheckCircle size={15} /></button>
                      ) : (
                        <button className="btn-icon" title="Ban" onClick={() => handleBan(user._id)}><Ban size={15} /></button>
                      )}
                      <button className="btn-icon text-red-500" title="Delete" onClick={() => handleDelete(user._id)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Products
// ═══════════════════════════════════════════════════════════════════════════════

function ProductsSection() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = () => {
    setLoading(true);
    getAllProducts({ page, limit: 20, search })
      .then(({ data }) => {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      })
      .catch(() => notify('Failed to fetch products.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this product?')) return;
    try {
      await adminDeleteProduct(id);
      notify('Product removed.');
      fetchProducts();
    } catch { notify('Failed to remove product.', 'error'); }
  };

  const handleRestore = async (id) => {
    try {
      await adminRestoreProduct(id);
      notify('Product restored.');
      fetchProducts();
    } catch { notify('Failed to restore product.', 'error'); }
  };

  const handleApprove = async (id) => {
    try {
      await adminApproveProduct(id);
      notify('Product approved.');
      fetchProducts();
    } catch { notify('Failed to approve product.', 'error'); }
  };

  const handleReject = async (id) => {
    try {
      await adminRejectProduct(id);
      notify('Product rejected.');
      fetchProducts();
    } catch { notify('Failed to reject product.', 'error'); }
  };

  const handleFeature = async (id) => {
    try {
      await adminFeatureProduct(id);
      notify('Product featured.');
      fetchProducts();
    } catch { notify('Failed to feature product.', 'error'); }
  };

  const handleUnfeature = async (id) => {
    try {
      await adminUnfeatureProduct(id);
      notify('Product unfeatured.');
      fetchProducts();
    } catch { notify('Failed to unfeature product.', 'error'); }
  };

  return (
    <div>
      <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search products..." />
      {loading ? <LoadingState /> : products.length === 0 ? <EmptyState message="No products found." /> : (
        <div className="overflow-x-auto rounded-2xl border border-indigo/10 bg-canvas">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-indigo/10 bg-sand/30">
              <tr>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Seller</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Approved</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="border-b border-indigo/5 hover:bg-sand/20">
                  <td className="p-4">
                    <p className="max-w-[200px] truncate font-medium">{product.title}</p>
                  </td>
                  <td className="p-4 text-muted">{product.sellerName || product.creator?.name || '—'}</td>
                  <td className="p-4">{formatCurrency(product.price)}</td>
                  <td className="p-4">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPill(product.status === 'published')}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {product.isApproved ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <XCircle size={16} className="text-red-400" />
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex gap-1.5">
                      {product.isDeleted ? (
                        <button className="btn-icon" title="Restore" onClick={() => handleRestore(product._id)}><Eye size={15} /></button>
                      ) : (
                        <>
                          <button className="btn-icon" title="Delete" onClick={() => handleDelete(product._id)}><Trash2 size={15} /></button>
                          {product.isApproved ? (
                            <button className="btn-icon" title="Reject" onClick={() => handleReject(product._id)}><XCircle size={15} /></button>
                          ) : (
                            <button className="btn-icon text-green-600" title="Approve" onClick={() => handleApprove(product._id)}><CheckCircle size={15} /></button>
                          )}
                          {product.featured ? (
                            <button className="btn-icon" title="Unfeature" onClick={() => handleUnfeature(product._id)}><EyeOff size={15} /></button>
                          ) : (
                            <button className="btn-icon text-amber-500" title="Feature" onClick={() => handleFeature(product._id)}><Trophy size={15} /></button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Orders
// ═══════════════════════════════════════════════════════════════════════════════

const ORDER_STATUSES = ['Order Placed', 'Confirmed', 'Packed', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'];

const statusBadgeColor = (status) =>
  status === 'Delivered' ? 'bg-green-100 text-green-800' :
  status === 'Cancelled' ? 'bg-red-100 text-red-800' :
  'bg-amber-100 text-amber-800';

function OrderDetailsModal({ order, onClose, onStatusChange, updating }) {
  if (!order) return null;

  return (
    <Modal isOpen={Boolean(order)} onClose={onClose} title={`Order ${order.orderNumber}`}>
      <div className="max-h-[70vh] space-y-5 overflow-y-auto">
        {/* Status & Date */}
        <div className="flex items-center justify-between">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeColor(order.status)}`}>
            {order.status}
          </span>
          <span className="text-xs text-muted">{formatDate(order.createdAt)}</span>
        </div>

        {/* Buyer & Seller */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-medium text-muted">Buyer</p>
            <p className="mt-0.5">{order.buyer?.name || '—'}</p>
            <p className="text-xs text-muted">{order.buyer?.email || '—'}</p>
            <p className="text-xs text-muted">{order.buyer?.phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Seller</p>
            <p className="mt-0.5">{order.seller?.shopName || order.seller?.name || '—'}</p>
            <p className="text-xs text-muted">{order.seller?.email || '—'}</p>
          </div>
        </div>

        {/* Items */}
        <div className="rounded-xl border border-indigo/10 bg-sand/20 p-4">
          <p className="mb-2 text-xs font-semibold text-indigo">Items</p>
          <div className="space-y-2">
            {order.items?.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-xs text-muted">Qty: {item.quantity} × {formatCurrency(item.sellerPrice)}</p>
                </div>
                <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pickup Address */}
        <div className="rounded-xl border border-indigo/10 bg-sand/20 p-4">
          <p className="mb-2 text-xs font-semibold text-indigo">Pickup Address</p>
          <div className="text-sm text-muted space-y-0.5">
            <p>{order.pickupAddress?.fullName || '—'}</p>
            <p>{order.pickupAddress?.phone || '—'}</p>
            <p>{order.pickupAddress?.address || '—'}</p>
            {order.pickupAddress?.landmark && <p>Landmark: {order.pickupAddress.landmark}</p>}
            <p>{[order.pickupAddress?.city, order.pickupAddress?.state, order.pickupAddress?.pincode].filter(Boolean).join(', ') || '—'}</p>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="rounded-xl border border-indigo/10 bg-sand/20 p-4">
          <p className="mb-2 text-xs font-semibold text-indigo">Delivery Address</p>
          <div className="text-sm text-muted space-y-0.5">
            <p>{order.deliveryAddress?.recipientName || '—'}</p>
            <p>{order.deliveryAddress?.phone || '—'}</p>
            <p>{order.deliveryAddress?.line1 || '—'}</p>
            {order.deliveryAddress?.line2 && <p>{order.deliveryAddress.line2}</p>}
            {order.deliveryAddress?.landmark && <p>Landmark: {order.deliveryAddress.landmark}</p>}
            <p>{[order.deliveryAddress?.city, order.deliveryAddress?.state, order.deliveryAddress?.pincode].filter(Boolean).join(', ') || '—'}</p>
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-xl border border-indigo/10 bg-sand/20 p-4">
          <p className="mb-2 text-xs font-semibold text-indigo">Payment</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted">Method</p>
              <p className="mt-0.5">{order.payment?.method || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Status</p>
              <p className="mt-0.5">{order.payment?.status || '—'}</p>
            </div>
            {order.payment?.utrNumber && (
              <div>
                <p className="text-xs text-muted">UTR Number</p>
                <p className="mt-0.5 font-mono">{order.payment.utrNumber}</p>
              </div>
            )}
            {order.payment?.qrReference && (
              <div>
                <p className="text-xs text-muted">QR Reference</p>
                <p className="mt-0.5 font-mono">{order.payment.qrReference}</p>
              </div>
            )}
            {order.payment?.paidAt && (
              <div>
                <p className="text-xs text-muted">Paid At</p>
                <p className="mt-0.5">{formatDate(order.payment.paidAt)}</p>
              </div>
            )}
          </div>
          {order.payment?.paymentScreenshot && (
            <div className="mt-3 overflow-hidden rounded-lg border border-indigo/10 bg-canvas">
              <p className="px-3 pt-2 text-xs font-medium text-muted">Payment Screenshot</p>
              <img
                src={order.payment.paymentScreenshot}
                alt="Payment screenshot"
                className="max-h-72 w-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Shipping */}
        <div className="rounded-xl border border-indigo/10 bg-sand/20 p-4">
          <p className="mb-2 text-xs font-semibold text-indigo">Shipping</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted">Courier</p>
              <p className="mt-0.5">{order.shipping?.courierName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Tracking Number</p>
              <p className="mt-0.5 font-mono">{order.shipping?.trackingNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted">AWB Number</p>
              <p className="mt-0.5 font-mono">{order.shipping?.awbNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Estimated Delivery</p>
              <p className="mt-0.5">{formatDate(order.shipping?.estimatedDelivery)}</p>
            </div>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="rounded-xl border border-indigo/10 bg-sand/20 p-4">
          <p className="mb-2 text-xs font-semibold text-indigo">Pricing Breakdown</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatCurrency(order.pricing?.subtotal)}</span>
            </div>
            {order.pricing?.platformMargin > 0 && (
              <div className="flex justify-between">
                <span className="text-muted">Platform Margin</span>
                <span>{formatCurrency(order.pricing?.platformMargin)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted">Shipping</span>
              <span>{formatCurrency(order.pricing?.shippingCost)}</span>
            </div>
            {order.pricing?.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted">Discount</span>
                <span className="text-green-600">-{formatCurrency(order.pricing?.discountAmount)}</span>
              </div>
            )}
            {order.coupon?.code && (
              <div className="flex justify-between">
                <span className="text-muted">Coupon</span>
                <span className="font-mono">{order.coupon.code}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-indigo/10 pt-1.5 font-medium">
              <span>Total</span>
              <span>{formatCurrency(order.pricing?.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div>
            <p className="text-xs font-medium text-muted">Notes</p>
            <p className="mt-0.5 text-sm">{order.notes}</p>
          </div>
        )}

        {/* Status Update */}
        <div className="flex items-center justify-between border-t border-indigo/10 pt-4">
          <span className="text-xs font-medium text-muted">Update Status</span>
          <select
            className="rounded-lg border border-indigo/10 bg-canvas px-3 py-1.5 text-sm outline-none focus:border-indigo/30"
            value={order.status}
            onChange={(e) => onStatusChange(order._id, e.target.value)}
            disabled={updating === order._id}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}

function OrdersSection() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    if (search) params.orderNumber = search;
    getAllOrders(params)
      .then(({ data }) => {
        setOrders(data.data.orders);
        setPagination(data.data.pagination);
      })
      .catch(() => notify('Failed to fetch orders.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter, search]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await adminUpdateOrderStatus(orderId, { status: newStatus });
      notify(`Order status updated to ${newStatus}.`);
      fetchOrders();
      if (viewingOrder?._id === orderId) {
        setViewingOrder({ ...viewingOrder, status: newStatus });
      }
    } catch { notify('Failed to update order.', 'error'); }
    finally { setUpdating(null); }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by order number..."
            className="w-full rounded-xl border border-indigo/10 bg-canvas py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo/30"
          />
        </div>
        <select
          className="rounded-xl border border-indigo/10 bg-canvas px-4 py-2.5 text-sm outline-none focus:border-indigo/30"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {loading ? <LoadingState /> : orders.length === 0 ? <EmptyState message="No orders found." /> : (
        <div className="overflow-x-auto rounded-2xl border border-indigo/10 bg-canvas">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-indigo/10 bg-sand/30">
              <tr>
                <th className="p-4 font-medium">Order #</th>
                <th className="p-4 font-medium">Buyer</th>
                <th className="p-4 font-medium">Seller</th>
                <th className="p-4 font-medium">Total</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b border-indigo/5 hover:bg-sand/20">
                  <td className="p-4 font-mono text-xs">{order.orderNumber}</td>
                  <td className="p-4 text-muted">{order.buyer?.name || '—'}</td>
                  <td className="p-4 text-muted">{order.seller?.shopName || order.seller?.name || '—'}</td>
                  <td className="p-4 font-medium">{formatCurrency(order.pricing?.totalAmount)}</td>
                  <td className="p-4">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted text-xs">{formatDate(order.createdAt)}</td>
                  <td className="p-4 text-right">
                    <div className="inline-flex gap-1.5">
                      <button className="btn-icon" title="View Details" onClick={() => setViewingOrder(order)}><Eye size={15} /></button>
                      <select
                        className="rounded-lg border border-indigo/10 bg-canvas px-2 py-1 text-xs outline-none"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        disabled={updating === order._id}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />
      <OrderDetailsModal
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
        onStatusChange={handleStatusChange}
        updating={updating}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Categories
// ═══════════════════════════════════════════════════════════════════════════════

function CategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', isActive: true, sortOrder: 0 });

  const fetchCategories = () => {
    setLoading(true);
    adminGetCategories({ limit: 100 })
      .then(({ data }) => setCategories(data.data.categories))
      .catch(() => notify('Failed to fetch categories.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', isActive: true, sortOrder: 0 });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || '', isActive: cat.isActive, sortOrder: cat.sortOrder || 0 });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return notify('Name is required.', 'error');
    try {
      if (editing) {
        await adminUpdateCategory(editing._id, form);
        notify('Category updated.');
      } else {
        await adminCreateCategory(form);
        notify('Category created.');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save category.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await adminDeleteCategory(id);
      notify('Category deleted.');
      fetchCategories();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to delete category.', 'error');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button className="btn-primary btn-sm" onClick={openCreate}><Plus size={15} /> Add Category</button>
      </div>
      {loading ? <LoadingState /> : categories.length === 0 ? <EmptyState message="No categories yet." /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat._id} className="rounded-2xl border border-indigo/10 bg-canvas p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{cat.name}</h3>
                  <p className="mt-1 text-xs text-muted">{cat.description || 'No description'}</p>
                </div>
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusPill(cat.isActive)}`}>
                  {cat.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted">
                <span>Slug: {cat.slug}</span>
                <span>·</span>
                <span>Order: {cat.sortOrder}</span>
              </div>
              <div className="mt-3 flex gap-1.5">
                <button className="btn-icon" onClick={() => openEdit(cat)}><Edit2 size={14} /></button>
                <button className="btn-icon text-red-500" onClick={() => handleDelete(cat._id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Create Category'}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Name *</label>
            <input
              type="text"
              className="w-full rounded-xl border border-indigo/10 bg-canvas px-4 py-2.5 text-sm outline-none focus:border-indigo/30"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Description</label>
            <textarea
              className="w-full rounded-xl border border-indigo/10 bg-canvas px-4 py-2.5 text-sm outline-none focus:border-indigo/30"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted">Sort Order</label>
              <input
                type="number"
                className="w-full rounded-xl border border-indigo/10 bg-canvas px-4 py-2.5 text-sm outline-none focus:border-indigo/30"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-indigo/20"
                />
                Active
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary btn-sm" onClick={handleSave}>
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Coupons
// ═══════════════════════════════════════════════════════════════════════════════

function CouponsSection() {
  const [coupons, setCoupons] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    code: '', description: '', discountType: 'percentage', discountValue: '',
    minOrderAmount: 0, maxDiscountAmount: 0, usageLimit: 0, isActive: true, expiresAt: '',
  });

  const fetchCoupons = () => {
    setLoading(true);
    getCoupons({ page, limit: 20 })
      .then(({ data }) => {
        setCoupons(data.data.coupons);
        setPagination(data.data.pagination);
      })
      .catch(() => notify('Failed to fetch coupons.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCoupons(); }, [page]);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', description: '', discountType: 'percentage', discountValue: '', minOrderAmount: 0, maxDiscountAmount: 0, usageLimit: 0, isActive: true, expiresAt: '' });
    setModalOpen(true);
  };

  const openEdit = (coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      usageLimit: coupon.usageLimit || 0,
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.discountValue) return notify('Code and value are required.', 'error');
    try {
      if (editing) {
        await updateCoupon(editing._id, form);
        notify('Coupon updated.');
      } else {
        await createCoupon(form);
        notify('Coupon created.');
      }
      setModalOpen(false);
      fetchCoupons();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save coupon.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await deleteCoupon(id);
      notify('Coupon deleted.');
      fetchCoupons();
    } catch { notify('Failed to delete coupon.', 'error'); }
  };

  const isExpired = (coupon) => coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  const isExhausted = (coupon) => coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;

  return (
    <div>
      <div className="mb-6">
        <button className="btn-primary btn-sm" onClick={openCreate}><Plus size={15} /> Add Coupon</button>
      </div>
      {loading ? <LoadingState /> : coupons.length === 0 ? <EmptyState message="No coupons yet." /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => {
            const invalid = isExpired(coupon) || isExhausted(coupon) || !coupon.isActive;
            return (
              <div key={coupon._id} className={`rounded-2xl border p-5 ${invalid ? 'border-red-200 bg-red-50/30' : 'border-indigo/10 bg-canvas'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-mono text-lg font-bold tracking-wider">{coupon.code}</h3>
                    <p className="mt-1 text-xs text-muted">{coupon.description || 'No description'}</p>
                  </div>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted">
                  <p>Discount: {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue)}</p>
                  {coupon.minOrderAmount > 0 && <p>Min order: {formatCurrency(coupon.minOrderAmount)}</p>}
                  {coupon.maxDiscountAmount > 0 && <p>Max discount: {formatCurrency(coupon.maxDiscountAmount)}</p>}
                  {coupon.usageLimit > 0 && <p>Used: {coupon.usedCount}/{coupon.usageLimit}</p>}
                  {coupon.expiresAt && <p>Expires: {formatDate(coupon.expiresAt)}</p>}
                </div>
                {invalid && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                    <AlertTriangle size={12} /> {isExpired(coupon) ? 'Expired' : isExhausted(coupon) ? 'Fully used' : 'Disabled'}
                  </p>
                )}
                <div className="mt-3 flex gap-1.5">
                  <button className="btn-icon" onClick={() => openEdit(coupon)}><Edit2 size={14} /></button>
                  <button className="btn-icon text-red-500" onClick={() => handleDelete(coupon._id)}><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Coupon' : 'Create Coupon'}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Code *</label>
            <input
              type="text"
              className="w-full rounded-xl border border-indigo/10 bg-canvas px-4 py-2.5 font-mono text-sm uppercase outline-none focus:border-indigo/30"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="SAVE20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Description</label>
            <input
              type="text"
              className="w-full rounded-xl border border-indigo/10 bg-canvas px-4 py-2.5 text-sm outline-none focus:border-indigo/30"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted">Discount Type</label>
              <select
                className="w-full rounded-xl border border-indigo/10 bg-canvas px-4 py-2.5 text-sm outline-none"
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted">Value *</label>
              <input
                type="number"
                className="w-full rounded-xl border border-indigo/10 bg-canvas px-4 py-2.5 text-sm outline-none focus:border-indigo/30"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted">Min Order Amount</label>
              <input
                type="number"
                className="w-full rounded-xl border border-indigo/10 bg-canvas px-4 py-2.5 text-sm outline-none focus:border-indigo/30"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: parseFloat(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted">Max Discount</label>
              <input
                type="number"
                className="w-full rounded-xl border border-indigo/10 bg-canvas px-4 py-2.5 text-sm outline-none focus:border-indigo/30"
                value={form.maxDiscountAmount}
                onChange={(e) => setForm({ ...form, maxDiscountAmount: parseFloat(e.target.value) || 0 })}
                min="0"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted">Usage Limit (0 = unlimited)</label>
              <input
                type="number"
                className="w-full rounded-xl border border-indigo/10 bg-canvas px-4 py-2.5 text-sm outline-none focus:border-indigo/30"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted">Expires At</label>
              <input
                type="date"
                className="w-full rounded-xl border border-indigo/10 bg-canvas px-4 py-2.5 text-sm outline-none focus:border-indigo/30"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-indigo/20"
              id="coupon-active"
            />
            <label htmlFor="coupon-active" className="text-sm">Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary btn-sm" onClick={handleSave}>
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Analytics
// ═══════════════════════════════════════════════════════════════════════════════

function AnalyticsSection() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (!stats) return <EmptyState message="Unable to load analytics." />;

  const metrics = [
    ['Total Revenue', formatCurrency(stats.revenue), TrendingUp],
    ['Total Orders', stats.totalOrders, ShoppingBag],
    ['Active Products', stats.totalProducts, Package],
    ['Customers', stats.totalUsers, Users],
    ['Total Sellers', stats.totalSellers, Users],
    ['Active Coupons', stats.totalCoupons, Tags],
    ['Categories', stats.totalCategories, Boxes],
    ['Pending Sellers', stats.pendingSellers, AlertTriangle],
    ['Pending Products', stats.pendingProducts, AlertTriangle],
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map(([label, value, Icon]) => (
        <article key={label} className="rounded-2xl border border-indigo/10 bg-canvas p-6">
          <div className="flex items-start justify-between">
            <p className="text-sm text-muted">{label}</p>
            <Icon size={17} className="text-clay" />
          </div>
          <p className="mt-7 font-display text-3xl">{value}</p>
        </article>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Sellers (for admin)
// ═══════════════════════════════════════════════════════════════════════════════

function SellerDetailsModal({ sellerId, onClose, onAction }) {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    setLoading(true);
    getSeller(sellerId)
      .then(({ data }) => setSeller(data.data.seller))
      .catch(() => notify('Failed to load seller details.', 'error'))
      .finally(() => setLoading(false));
  }, [sellerId]);

  const handleApprove = async () => {
    try { await approveSeller(sellerId); notify('Seller approved.'); onAction(); }
    catch { notify('Failed to approve seller.', 'error'); }
  };

  const handleReject = async () => {
    try { await rejectSeller(sellerId); notify('Seller rejected.'); onAction(); }
    catch { notify('Failed to reject seller.', 'error'); }
  };

  return (
    <Modal isOpen={Boolean(sellerId)} onClose={onClose} title="Seller Details">
      {loading ? (
        <LoadingState />
      ) : !seller ? (
        <EmptyState message="Seller not found." />
      ) : (
        <div className="max-h-[70vh] space-y-5 overflow-y-auto">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPill(seller.isSellerVerified)}`}>
              {seller.isSellerVerified ? 'Verified' : 'Pending Verification'}
            </span>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPill(seller.isSellerActive)}`}>
              {seller.isSellerActive ? 'Active' : 'Suspended'}
            </span>
          </div>

          {/* Personal & Business Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-medium text-muted">Owner Name</p>
              <p className="mt-0.5">{seller.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Email</p>
              <p className="mt-0.5">{seller.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Phone</p>
              <p className="mt-0.5">{seller.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Shop Name</p>
              <p className="mt-0.5">{seller.shopName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Business Type</p>
              <p className="mt-0.5">{seller.businessType || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">GST Number</p>
              <p className="mt-0.5">{seller.gstNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">PAN Number</p>
              <p className="mt-0.5">{seller.panNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Joined</p>
              <p className="mt-0.5">{formatDate(seller.createdAt)}</p>
            </div>
          </div>

          {/* Shop Address */}
          <div>
            <p className="text-xs font-medium text-muted">Shop Address</p>
            <p className="mt-0.5 text-sm">{[seller.shopAddress, seller.city, seller.state, seller.pinCode].filter(Boolean).join(', ') || '—'}</p>
          </div>

          {/* Bank Details */}
          <div className="rounded-xl border border-indigo/10 bg-sand/20 p-4">
            <p className="mb-2 text-xs font-semibold text-indigo">Bank Details</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted">Account Holder</p>
                <p className="mt-0.5">{seller.accountHolderName || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Bank Name</p>
                <p className="mt-0.5">{seller.bankName || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Account Number</p>
                <p className="mt-0.5 font-mono">{seller.accountNumber || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted">IFSC Code</p>
                <p className="mt-0.5 font-mono">{seller.ifscCode || '—'}</p>
              </div>
            </div>
          </div>

          {/* Government ID Verification */}
          <div className="rounded-xl border border-indigo/10 bg-sand/20 p-4">
            <p className="mb-2 text-xs font-semibold text-indigo">Government ID Verification</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted">ID Type</p>
                <p className="mt-0.5">{seller.govtIdType || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted">ID Number</p>
                <p className="mt-0.5 font-mono">{seller.govtIdNumber || '—'}</p>
              </div>
            </div>
            {seller.govtIdImage?.url ? (
              <div className="mt-3 overflow-hidden rounded-lg border border-indigo/10 bg-canvas">
                <img
                  src={seller.govtIdImage.url}
                  alt="Government ID"
                  className="max-h-72 w-full object-contain"
                />
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted">No ID image uploaded.</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 border-t border-indigo/10 pt-4">
            <button className="btn-secondary btn-sm" onClick={onClose}>Close</button>
            {!seller.isSellerVerified ? (
              <button className="btn-primary btn-sm" onClick={handleApprove}>
                <CheckCircle size={15} /> Approve Seller
              </button>
            ) : (
              <button className="btn-secondary btn-sm text-red-600" onClick={handleReject}>
                <XCircle size={15} /> Reject
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function SellersSection() {
  const [sellers, setSellers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewingSellerId, setViewingSellerId] = useState(null);

  const fetchSellers = () => {
    setLoading(true);
    getSellers({ page, limit: 20 })
      .then(({ data }) => {
        setSellers(data.data.sellers);
        setPagination(data.data.pagination);
      })
      .catch(() => notify('Failed to fetch sellers.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSellers(); }, [page]);

  const handleApprove = async (id) => {
    try { await approveSeller(id); notify('Seller approved.'); fetchSellers(); }
    catch { notify('Failed to approve seller.', 'error'); }
  };

  const handleReject = async (id) => {
    try { await rejectSeller(id); notify('Seller rejected.'); fetchSellers(); }
    catch { notify('Failed to reject seller.', 'error'); }
  };

  const handleSuspend = async (id) => {
    try { await suspendSeller(id); notify('Seller suspended.'); fetchSellers(); }
    catch { notify('Failed to suspend seller.', 'error'); }
  };

  const handleActivate = async (id) => {
    try { await activateSeller(id); notify('Seller activated.'); fetchSellers(); }
    catch { notify('Failed to activate seller.', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this seller account?')) return;
    try { await deleteSeller(id); notify('Seller deleted.'); fetchSellers(); }
    catch { notify('Failed to delete seller.', 'error'); }
  };

  const handleModalAction = () => {
    setViewingSellerId(null);
    fetchSellers();
  };

  return (
    <div>
      {loading ? <LoadingState /> : sellers.length === 0 ? <EmptyState message="No sellers found." /> : (
        <div className="overflow-x-auto rounded-2xl border border-indigo/10 bg-canvas">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-indigo/10 bg-sand/30">
              <tr>
                <th className="p-4 font-medium">Shop</th>
                <th className="p-4 font-medium">Owner</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Verified</th>
                <th className="p-4 font-medium">Active</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller) => (
                <tr key={seller._id} className="border-b border-indigo/5 hover:bg-sand/20">
                  <td className="p-4 font-medium">{seller.shopName || '—'}</td>
                  <td className="p-4 text-muted">{seller.name}</td>
                  <td className="p-4 text-muted">{seller.email}</td>
                  <td className="p-4">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPill(seller.isSellerVerified)}`}>
                      {seller.isSellerVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPill(seller.isSellerActive)}`}>
                      {seller.isSellerActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex gap-1.5">
                      <button className="btn-icon" title="View Details" onClick={() => setViewingSellerId(seller._id)}><Eye size={15} /></button>
                      {!seller.isSellerVerified && (
                        <button className="btn-icon text-green-600" title="Approve" onClick={() => handleApprove(seller._id)}><CheckCircle size={15} /></button>
                      )}
                      {seller.isSellerVerified && (
                        <button className="btn-icon text-red-500" title="Reject" onClick={() => handleReject(seller._id)}><XCircle size={15} /></button>
                      )}
                      {seller.isSellerActive ? (
                        <button className="btn-icon text-amber-500" title="Suspend" onClick={() => handleSuspend(seller._id)}><Ban size={15} /></button>
                      ) : (
                        <button className="btn-icon text-green-600" title="Activate" onClick={() => handleActivate(seller._id)}><CheckCircle size={15} /></button>
                      )}
                      <button className="btn-icon text-red-500" title="Delete" onClick={() => handleDelete(seller._id)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />
      <SellerDetailsModal
        sellerId={viewingSellerId}
        onClose={() => setViewingSellerId(null)}
        onAction={handleModalAction}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN: DashboardSectionPage
// ═══════════════════════════════════════════════════════════════════════════════

function DashboardSectionPage({ title }) {
  const renderSection = () => {
    switch (title?.toLowerCase()) {
      case 'users':
        return <UsersSection />;
      case 'products':
        return <ProductsSection />;
      case 'orders':
        return <OrdersSection />;
      case 'categories':
        return <CategoriesSection />;
      case 'coupons':
        return <CouponsSection />;
      case 'analytics':
        return <AnalyticsSection />;
      case 'sellers':
        return <SellersSection />;
      default:
        return (
          <div className="mt-10 rounded-2xl border border-dashed border-indigo/20 bg-canvas p-10 text-center">
            <p className="text-sm text-muted">This workspace is routed and ready for its feature module.</p>
          </div>
        );
    }
  };

  return (
    <div>
      <p className="eyebrow text-clay">Workspace</p>
      <h1 className="mt-3 font-display text-5xl text-indigo">{title}</h1>
      <div className="mt-10">{renderSection()}</div>
    </div>
  );
}

export default DashboardSectionPage;