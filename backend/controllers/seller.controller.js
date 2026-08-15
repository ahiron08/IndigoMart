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

  const filter = { seller: request.user.id, isDeleted: { $ne: true } };
  if (request.query.status) filter.status = request.query.status;

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
    Order.countDocuments({ seller: sellerId, status: { $in: ['Order Placed', 'Confirmed'] } }),
    Order.countDocuments({ seller: sellerId, status: { $in: ['Packed', 'Picked Up', 'In Transit', 'Out for Delivery'] } }),
    Order.countDocuments({ seller: sellerId, isDeleted: { $ne: true } }),
    Order.aggregate([
      { $match: { seller: sellerId, status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
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
  const validStatuses = ['Confirmed', 'Packed', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'];

  if (!validStatuses.includes(status)) {
    response.status(400).json({ success: false, message: 'Invalid status.' });
    return;
  }

  const order = await Order.findOne({
    _id: request.params.id,
    seller: request.user.id,
    isDeleted: { $ne: true },
  });

  if (!order) {
    response.status(404).json({ success: false, message: 'Order not found.' });
    return;
  }

  order.status = status;

  if (status === 'Delivered') order.shipping.deliveredAt = new Date();
  if (status === 'Picked Up') order.shipping.shippedAt = new Date();
  if (status === 'Cancelled') {
    order.cancellation = {
      cancelled: true,
      reason: order.cancellation?.reason || 'Cancelled by seller',
      comments: order.cancellation?.comments || '',
      cancelledBy: 'seller',
      cancelledAt: new Date(),
    };
  }

  await order.save();

  response.status(200).json({
    success: true,
    message: `Order ${status}.`,
    data: { order },
  });
});