import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';
import Category from '../models/category.model.js';
import Coupon from '../models/coupon.model.js';
import { getIndexingStats, batchIndexProducts, getProductEmbeddingStatus } from '../services/vector.service.js';
import asyncHandler from '../utils/async-handler.js';

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboardStats = asyncHandler(async (_request, response) => {
  const [totalUsers, totalSellers, totalProducts, totalOrders, totalRevenue, totalCoupons, totalCategories, pendingSellers, pendingProducts, pendingOrders] = await Promise.all([
    User.countDocuments({ role: { $in: ['customer', 'user'] } }),
    User.countDocuments({ role: 'seller' }),
    Product.countDocuments({ isDeleted: { $ne: true } }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
    ]),
    Coupon.countDocuments(),
    Category.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'seller', isSellerVerified: false }),
    Product.countDocuments({ isApproved: false, isDeleted: { $ne: true } }),
    Order.countDocuments({ status: { $in: ['Order Placed', 'Confirmed'] } }),
  ]);

  const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

  response.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      revenue,
      totalCoupons,
      totalCategories,
      pendingSellers,
      pendingProducts,
      pendingOrders,
    },
  });
});

// ─── Users ────────────────────────────────────────────────────────────────────

export const getUsers = asyncHandler(async (request, response) => {
  const page = parseInt(request.query.page, 10) || 1;
  const limit = parseInt(request.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = { role: { $in: ['customer', 'user'] } };
  if (request.query.search) {
    filter.$or = [
      { name: { $regex: request.query.search, $options: 'i' } },
      { email: { $regex: request.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-sessions'),
    User.countDocuments(filter),
  ]);

  response.status(200).json({
    success: true,
    data: {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

export const banUser = asyncHandler(async (request, response) => {
  const user = await User.findByIdAndUpdate(
    request.params.id,
    { isBlocked: true },
    { new: true, runValidators: true },
  );

  if (!user) {
    response.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'User has been banned.',
    data: { user },
  });
});

export const unbanUser = asyncHandler(async (request, response) => {
  const user = await User.findByIdAndUpdate(
    request.params.id,
    { isBlocked: false },
    { new: true, runValidators: true },
  );

  if (!user) {
    response.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'User has been unbanned.',
    data: { user },
  });
});

export const deleteUser = asyncHandler(async (request, response) => {
  const user = await User.findByIdAndDelete(request.params.id);
  if (!user) {
    response.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  response.status(200).json({ success: true, message: 'User deleted.' });
});

// ─── Sellers ──────────────────────────────────────────────────────────────────

export const getSellers = asyncHandler(async (request, response) => {
  const page = parseInt(request.query.page, 10) || 1;
  const limit = parseInt(request.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = { role: 'seller' };
  if (request.query.search) {
    filter.$or = [
      { name: { $regex: request.query.search, $options: 'i' } },
      { email: { $regex: request.query.search, $options: 'i' } },
      { shopName: { $regex: request.query.search, $options: 'i' } },
    ];
  }
  if (request.query.isSellerVerified !== undefined) {
    filter.isSellerVerified = request.query.isSellerVerified === 'true';
  }
  if (request.query.isSellerActive !== undefined) {
    filter.isSellerActive = request.query.isSellerActive === 'true';
  }

  const [sellers, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-sessions'),
    User.countDocuments(filter),
  ]);

  response.status(200).json({
    success: true,
    data: {
      sellers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

// Fetch a single seller's full details (for admin review/approval)
export const getSeller = asyncHandler(async (request, response) => {
  const seller = await User.findOne({ _id: request.params.id, role: 'seller' }).select('-sessions');

  if (!seller) {
    response.status(404).json({ success: false, message: 'Seller not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    data: { seller },
  });
});

export const approveSeller = asyncHandler(async (request, response) => {
  const seller = await User.findByIdAndUpdate(
    request.params.id,
    { isSellerVerified: true, isSellerActive: true },
    { new: true, runValidators: true },
  );

  if (!seller || seller.role !== 'seller') {
    response.status(404).json({ success: false, message: 'Seller not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Seller approved successfully.',
    data: { seller },
  });
});

export const rejectSeller = asyncHandler(async (request, response) => {
  const seller = await User.findByIdAndUpdate(
    request.params.id,
    { isSellerVerified: false, isSellerActive: false },
    { new: true, runValidators: true },
  );

  if (!seller || seller.role !== 'seller') {
    response.status(404).json({ success: false, message: 'Seller not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Seller rejected.',
    data: { seller },
  });
});

export const suspendSeller = asyncHandler(async (request, response) => {
  const seller = await User.findByIdAndUpdate(
    request.params.id,
    { isSellerActive: false },
    { new: true, runValidators: true },
  );

  if (!seller || seller.role !== 'seller') {
    response.status(404).json({ success: false, message: 'Seller not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Seller suspended.',
    data: { seller },
  });
});

export const activateSeller = asyncHandler(async (request, response) => {
  const seller = await User.findByIdAndUpdate(
    request.params.id,
    { isSellerActive: true },
    { new: true, runValidators: true },
  );

  if (!seller || seller.role !== 'seller') {
    response.status(404).json({ success: false, message: 'Seller not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Seller activated.',
    data: { seller },
  });
});

export const deleteSeller = asyncHandler(async (request, response) => {
  const seller = await User.findByIdAndDelete(request.params.id);
  if (!seller) {
    response.status(404).json({ success: false, message: 'Seller not found.' });
    return;
  }

  response.status(200).json({ success: true, message: 'Seller deleted.' });
});

// ─── Products ─────────────────────────────────────────────────────────────────

export const getAllProducts = asyncHandler(async (request, response) => {
  const page = parseInt(request.query.page, 10) || 1;
  const limit = parseInt(request.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (request.query.search) {
    filter.title = { $regex: request.query.search, $options: 'i' };
  }
  if (request.query.isApproved !== undefined) {
    filter.isApproved = request.query.isApproved === 'true';
  }
  if (request.query.status) {
    filter.status = request.query.status;
  }
  if (request.query.isDeleted !== undefined) {
    filter.isDeleted = request.query.isDeleted === 'true';
  }
  if (request.query.sellerId) {
    filter.sellerId = request.query.sellerId;
  }
  if (request.query.category) {
    filter.category = request.query.category;
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', 'name email')
      .populate('category', 'name')
      .lean(),
    Product.countDocuments(filter),
  ]);

  response.status(200).json({
    success: true,
    data: {
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

export const adminDeleteProduct = asyncHandler(async (request, response) => {
  const product = await Product.findByIdAndUpdate(
    request.params.id,
    { isDeleted: true, status: 'hidden' },
    { new: true, runValidators: true },
  );

  if (!product) {
    response.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Product has been removed.',
    data: { product },
  });
});

export const adminRestoreProduct = asyncHandler(async (request, response) => {
  const product = await Product.findByIdAndUpdate(
    request.params.id,
    { isDeleted: false },
    { new: true, runValidators: true },
  );

  if (!product) {
    response.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Product has been restored.',
    data: { product },
  });
});

export const adminApproveProduct = asyncHandler(async (request, response) => {
  const product = await Product.findByIdAndUpdate(
    request.params.id,
    { isApproved: true, status: 'published' },
    { new: true, runValidators: true },
  );

  if (!product) {
    response.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Product approved and published.',
    data: { product },
  });
});

export const adminRejectProduct = asyncHandler(async (request, response) => {
  const product = await Product.findByIdAndUpdate(
    request.params.id,
    { isApproved: false, status: 'hidden' },
    { new: true, runValidators: true },
  );

  if (!product) {
    response.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Product has been rejected.',
    data: { product },
  });
});

export const adminFeatureProduct = asyncHandler(async (request, response) => {
  const product = await Product.findByIdAndUpdate(
    request.params.id,
    { featured: true },
    { new: true, runValidators: true },
  );

  if (!product) {
    response.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Product marked as featured.',
    data: { product },
  });
});

export const adminUnfeatureProduct = asyncHandler(async (request, response) => {
  const product = await Product.findByIdAndUpdate(
    request.params.id,
    { featured: false },
    { new: true, runValidators: true },
  );

  if (!product) {
    response.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Product unmarked as featured.',
    data: { product },
  });
});

// ─── Orders ───────────────────────────────────────────────────────────────────

export const getAllOrders = asyncHandler(async (request, response) => {
  const page = parseInt(request.query.page, 10) || 1;
  const limit = parseInt(request.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (request.query.status) {
    filter.status = request.query.status;
  }
  if (request.query.orderNumber) {
    filter.orderNumber = { $regex: request.query.orderNumber, $options: 'i' };
  }
  if (request.query.buyer) {
    filter.buyer = request.query.buyer;
  }
  if (request.query.seller) {
    filter.seller = request.query.seller;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('buyer', 'name email phone')
      .populate('seller', 'name email shopName')
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

export const adminUpdateOrderStatus = asyncHandler(async (request, response) => {
  const { status, trackingNumber, courierName, awbNumber } = request.body;

  const updateData = {};
  if (status) updateData.status = status;
  if (trackingNumber) updateData['shipping.trackingNumber'] = trackingNumber;
  if (courierName) updateData['shipping.courierName'] = courierName;
  if (awbNumber) updateData['shipping.awbNumber'] = awbNumber;

  if (status === 'Shipped' && !updateData['shipping.shippedAt']) {
    updateData['shipping.shippedAt'] = new Date();
  }
  if (status === 'Delivered' && !updateData['shipping.deliveredAt']) {
    updateData['shipping.deliveredAt'] = new Date();
  }

  const order = await Order.findByIdAndUpdate(request.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!order) {
    response.status(404).json({ success: false, message: 'Order not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Order status updated.',
    data: { order },
  });
});

// ─── Categories ───────────────────────────────────────────────────────────────

export const adminGetCategories = asyncHandler(async (request, response) => {
  const page = parseInt(request.query.page, 10) || 1;
  const limit = parseInt(request.query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const filter = {};
  if (request.query.isActive !== undefined) {
    filter.isActive = request.query.isActive === 'true';
  }
  if (request.query.search) {
    filter.name = { $regex: request.query.search, $options: 'i' };
  }

  const [categories, total] = await Promise.all([
    Category.find(filter).sort({ sortOrder: 1, name: 1 }).skip(skip).limit(limit),
    Category.countDocuments(filter),
  ]);

  response.status(200).json({
    success: true,
    data: {
      categories,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

export const adminCreateCategory = asyncHandler(async (request, response) => {
  const { name, description, image, isActive, sortOrder } = request.body;

  const existing = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
  if (existing) {
    response.status(409).json({ success: false, message: 'A category with this name already exists.' });
    return;
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const category = await Category.create({
    name,
    slug,
    description: description || '',
    image: image || { url: '', publicId: '' },
    isActive: isActive !== undefined ? isActive : true,
    sortOrder: sortOrder || 0,
  });

  response.status(201).json({
    success: true,
    message: 'Category created successfully.',
    data: { category },
  });
});

export const adminUpdateCategory = asyncHandler(async (request, response) => {
  const { name, description, image, isActive, sortOrder } = request.body;

  const updateData = {};
  if (name !== undefined) {
    const existing = await Category.findOne({
      name: { $regex: `^${name}$`, $options: 'i' },
      _id: { $ne: request.params.id },
    });
    if (existing) {
      response.status(409).json({ success: false, message: 'A category with this name already exists.' });
      return;
    }
    updateData.name = name;
    updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (description !== undefined) updateData.description = description;
  if (image !== undefined) updateData.image = image;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

  const category = await Category.findByIdAndUpdate(request.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    response.status(404).json({ success: false, message: 'Category not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Category updated successfully.',
    data: { category },
  });
});

export const adminDeleteCategory = asyncHandler(async (request, response) => {
  const productCount = await Product.countDocuments({ category: request.params.id, isDeleted: { $ne: true } });
  if (productCount > 0) {
    response.status(400).json({
      success: false,
      message: `Cannot delete category. ${productCount} product(s) are associated with it.`,
    });
    return;
  }

  const category = await Category.findByIdAndDelete(request.params.id);
  if (!category) {
    response.status(404).json({ success: false, message: 'Category not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Category deleted successfully.',
  });
});

// ─── Embedding / Search ───────────────────────────────────────────────────────

export const getEmbeddingStats = asyncHandler(async (_request, response) => {
  const stats = await getIndexingStats();
  response.status(200).json({ success: true, data: stats });
});

export const getMissingEmbeddings = asyncHandler(async (request, response) => {
  const page = parseInt(request.query.page, 10) || 1;
  const limit = parseInt(request.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find({ isApproved: true, status: 'published', isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments({ isApproved: true, status: 'published', isDeleted: { $ne: true } }),
  ]);

  const missing = [];
  for (const product of products) {
    const status = await getProductEmbeddingStatus(product._id);
    if (!status.exists) {
      missing.push({
        _id: product._id,
        title: product.title,
        status: product.status,
        createdAt: product.createdAt,
        embeddingStatus: status,
      });
    }
  }

  response.status(200).json({
    success: true,
    data: {
      missing,
      pagination: { page, limit, total: missing.length, pages: Math.ceil(missing.length / limit) },
    },
  });
});

export const rebuildAllEmbeddings = asyncHandler(async (_request, response) => {
  const products = await Product.find({ isDeleted: { $ne: true } }).lean();

  const result = await batchIndexProducts(products);

  response.status(200).json({
    success: true,
    message: 'Embedding rebuild completed.',
    data: result,
  });
});

export const rebuildProductEmbedding = asyncHandler(async (request, response) => {
  const product = await Product.findById(request.params.productId);
  if (!product) {
    response.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  const result = await getProductEmbeddingStatus(product._id);
  // Force rebuild by deleting existing index first
  const { deleteProductIndex, indexProduct } = await import('../services/vector.service.js');
  await deleteProductIndex(product._id);
  const indexResult = await indexProduct(product.toObject());

  response.status(200).json({
    success: true,
    message: 'Product embedding rebuilt.',
    data: { productId: product._id, previousStatus: result, result: indexResult },
  });
});