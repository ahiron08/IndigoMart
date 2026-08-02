import Order from '../models/order.model.js';
import Payment from '../models/payment.model.js';
import Shipment from '../models/shipment.model.js';
import AppError from '../utils/app-error.js';

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

export default {
  getOrderById,
  getBuyerOrders,
  getSellerOrders,
  getAllOrders,
  updateOrderStatus,
  updateShipmentTracking,
};