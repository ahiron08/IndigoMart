import Order from '../models/order.model.js';
import Payment from '../models/payment.model.js';
import Shipment from '../models/shipment.model.js';
import AppError from '../utils/app-error.js';

// Reasons a customer may select when cancelling an order.
export const CANCELLATION_REASONS = [
  'Changed my mind',
  'Ordered by mistake',
  'Found a better price',
  'Delivery is taking too long',
  'Product is no longer needed',
  'Payment issue',
  'Other',
];

// Order statuses from which a customer may still cancel their own order.
const CANCELLABLE_STATUSES = new Set(['Order Placed', 'Confirmed', 'Packed']);

export const getOrderById = async (orderId, userId, role) => {
  const filter = { _id: orderId, isDeleted: { $ne: true } };
  if (role !== 'admin') {
    filter.$or = [{ buyer: userId }, { seller: userId }];
  }

  const order = await Order.findOne(filter)
    .populate('buyer', 'name email phone')
    .populate('seller', 'name shopName phone')
    .populate('items.product', 'title images price slug')
    .lean();

  if (!order) throw new AppError('Order not found.', 404);

  const shipment = await Shipment.findOne({ order: orderId }).lean();
  const payment = await Payment.findOne({ order: orderId }).lean();

  return { order, shipment, payment };
};

export const getBuyerOrders = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const filter = { buyer: userId, isDeleted: { $ne: true } };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('seller', 'name shopName')
      .populate('items.product', 'title images slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const getSellerOrders = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const filter = { seller: userId, isDeleted: { $ne: true } };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('buyer', 'name email phone')
      .populate('items.product', 'title images slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const getAllOrders = async (page = 1, limit = 50, status) => {
  const skip = (page - 1) * limit;
  const filter = { isDeleted: { $ne: true } };
  if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('buyer', 'name email')
      .populate('seller', 'name shopName')
      .populate('items.product', 'title images slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return { orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const updateOrderStatus = async (orderId, status, userId, role) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found.', 404);

  if (role !== 'admin' && order.seller.toString() !== userId) {
    throw new AppError('Not authorized to update this order.', 403);
  }

  const validTransitions = {
    'Order Placed': ['Confirmed', 'Cancelled'],
    'Confirmed': ['Packed', 'Cancelled'],
    'Packed': ['Picked Up'],
    'Picked Up': ['In Transit'],
    'In Transit': ['Out for Delivery'],
    'Out for Delivery': ['Delivered'],
    'Delivered': [],
    'Cancelled': [],
  };

  const allowed = validTransitions[order.status] || [];
  if (!allowed.includes(status)) {
    throw new AppError(`Cannot transition from ${order.status} to ${status}.`, 400);
  }

  order.status = status;
  if (status === 'Delivered') {
    order.shipping.deliveredAt = new Date();
  }
  if (status === 'Picked Up') {
    order.shipping.shippedAt = new Date();
  }
  if (status === 'Cancelled') {
    order.cancellation = {
      cancelled: true,
      reason: order.cancellation?.reason || 'Seller/Admin cancellation',
      comments: order.cancellation?.comments || '',
      cancelledBy: role === 'admin' ? 'admin' : 'seller',
      cancelledAt: new Date(),
    };
  }

  await order.save();
  return order;
};

export const updateShipmentTracking = async (orderId, { trackingNumber, courierName, awbNumber }) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found.', 404);

  if (trackingNumber) order.shipping.trackingNumber = trackingNumber;
  if (courierName) order.shipping.courierName = courierName;
  if (awbNumber) order.shipping.awbNumber = awbNumber;
  await order.save();

  await Shipment.findOneAndUpdate(
    { order: orderId },
    { $set: { trackingNumber, courierName, awbNumber } },
  );

  return order;
};

/**
 * Cancel an order as its owning customer.
 * 1. Authenticate (handled by middleware).
 * 2. Verify the order belongs to the customer.
 * 3. Verify the order is still cancellable.
 * 4. Validate the cancellation reason.
 * 5. Persist cancellation info (server-side timestamp).
 * 6. Update the order status to 'Cancelled'.
 * 7. Handle QR refund request when the order was paid via QR.
 */
export const cancelOrder = async ({ orderId, userId, reason, comments }) => {
  const order = await Order.findOne({ _id: orderId, buyer: userId, isDeleted: { $ne: true } });
  if (!order) throw new AppError('Order not found.', 404);

  if (order.status === 'Cancelled') {
    throw new AppError('This order has already been cancelled.', 400);
  }

  if (!CANCELLABLE_STATUSES.has(order.status)) {
    throw new AppError(`This order cannot be cancelled once its status is "${order.status}".`, 400);
  }

  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    throw new AppError('Cancellation reason is required.', 400);
  }

  const trimmedReason = reason.trim();
  const normalized = CANCELLATION_REASONS.includes(trimmedReason) ? trimmedReason : 'Other';

  if (normalized === 'Other') {
    const custom = (comments || '').trim();
    if (!custom) {
      throw new AppError('Please provide a custom reason when selecting "Other".', 400);
    }
  }

  const cancelledAt = new Date();

  order.status = 'Cancelled';
  order.cancellation = {
    cancelled: true,
    reason: normalized,
    comments: (comments || '').trim(),
    cancelledBy: 'customer',
    cancelledAt,
  };

  await order.save();

  // Create a QR refund request when the order was paid via QR (only when money was received).
  let refund = null;
  if (order.payment?.method === 'QR') {
    const { createRefundRequest } = await import('./refund.service.js');
    refund = await createRefundRequest({
      order,
      cancelledBy: 'customer',
      reason: normalized,
      comments: (comments || '').trim(),
    });
  }

  // Return the refreshed order plus any refund created.
  const refreshedOrder = await Order.findById(orderId)
    .populate('buyer', 'name email phone')
    .populate('seller', 'name shopName phone')
    .populate('items.product', 'title images price slug')
    .lean();

  // Best-effort cancellation notification via the existing email system.
  try {
    const User = (await import('../models/user.model.js')).default;
    const buyerUser = await User.findById(order.buyer).select('name email').lean();
    const { sendOrderCancellationEmail } = await import('./email.service.js');
    await sendOrderCancellationEmail({
      email: buyerUser?.email || '',
      name: buyerUser?.name || 'there',
      orderNumber: order.orderNumber,
      reason: normalized,
      comments: (comments || '').trim(),
    });
  } catch (emailError) {
    // Never let an email failure block a completed cancellation.
    console.error('Failed to send cancellation email:', emailError.message);
  }

  return { order: refreshedOrder, refund };
};

export default {
  getOrderById,
  getBuyerOrders,
  getSellerOrders,
  getAllOrders,
  updateOrderStatus,
  updateShipmentTracking,
  cancelOrder,
};