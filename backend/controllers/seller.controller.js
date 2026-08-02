import Product from '../models/product.model.js';
import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import asyncHandler from '../utils/async-handler.js';

export const getSellerProfile = asyncHandler(async (request, response) => {
  const seller = await User.findById(request.user.id).select('-sessions');
  response.status(200).json({ success: true, data: { seller } });
});

export const updateSellerProfile = asyncHandler(async (request, response) => {
  const allowedFields = [
    'shopName', 'shopDescription', 'shopLogo', 'shopBanner',
    'shopAddress', 'city', 'state', 'pinCode',
    'accountHolderName', 'bankName', 'accountNumber', 'ifscCode',
    'returnPolicy', 'shippingPolicy',
    'socialLinks',
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (request.body[field] !== undefined) {
      updates[field] = request.body[field];
    }
  }

  const seller = await User.findByIdAndUpdate(request.user.id, updates, {
    new: true,
    runValidators: true,
  }).select('-sessions');

  response.status(200).json({
    success: true,
    message: 'Profile updated.',
    data: { seller },
  });
});

export const getSellerProducts = asyncHandler(async (request, response) => {
  const products = await Product.find({ creator: request.user.id })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 });

  response.status(200).json({ success: true, data: { products } });
});

export const getSellerOrders = asyncHandler(async (request, response) => {
  const page = parseInt(request.query.page, 10) || 1;
  const limit = parseInt(request.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = { 'items.creator': request.user.id };
  if (request.query.status) filter.status = request.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  response.status(200).json({
    success: true,
    data: {
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

export const getSellerDashboard = asyncHandler(async (request, response) => {
  const sellerId = request.user.id;

  const [totalProducts, pendingOrders, processingOrders, totalOrders, revenueResult] = await Promise.all([
    Product.countDocuments({ creator: sellerId }),
    Order.countDocuments({ 'items.creator': sellerId, status: 'pending' }),
    Order.countDocuments({ 'items.creator': sellerId, status: { $in: ['confirmed', 'processing', 'shipped'] } }),
    Order.countDocuments({ 'items.creator': sellerId }),
    Order.aggregate([
      { $match: { 'items.creator': sellerId, status: 'delivered' } },
      { $unwind: '$items' },
      { $match: { 'items.creator': sellerId } },
      { $group: { _id: null, total: { $sum: '$items.lineTotal' } } },
    ]),
  ]);

  const revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  response.status(200).json({
    success: true,
    data: {
      totalProducts,
      pendingOrders,
      processingOrders,
      totalOrders,
      revenue,
    },
  });
});

export const updateOrderStatus = asyncHandler(async (request, response) => {
  const { status } = request.body;
  const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    response.status(400).json({ success: false, message: 'Invalid status.' });
    return;
  }

  const order = await Order.findOne({
    _id: request.params.id,
    'items.creator': request.user.id,
  });

  if (!order) {
    response.status(404).json({ success: false, message: 'Order not found.' });
    return;
  }

  order.status = status;
  order.tracking.push({
    status,
    message: `Order status updated to ${status} by seller.`,
    actor: request.user.id,
    occurredAt: new Date(),
  });

  if (status === 'delivered') order.deliveredAt = new Date();
  if (status === 'cancelled') order.cancelledAt = new Date();

  await order.save();

  response.status(200).json({
    success: true,
    message: `Order ${status}.`,
    data: { order },
  });
});