import crypto from 'node:crypto';

import mongoose from 'mongoose';

import Category from '../models/category.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/app-error.js';
import { createSlug } from '../utils/slug.js';
import { deleteImages, uploadImage } from './image.service.js';
import { indexProduct } from './vector.service.js';
import { enrichWithCustomerPrice, calculateDisplayPrice } from './pricing.service.js';
import { env } from '../config/env.js';

const uniqueProductSlug = async (title, excludedId) => {
  const base = createSlug(title) || `product-${crypto.randomBytes(4).toString('hex')}`;
  let slug = base;

  while (await Product.exists({ slug, ...(excludedId ? { _id: { $ne: excludedId } } : {}) })) {
    slug = `${base}-${crypto.randomBytes(3).toString('hex')}`;
  }
  return slug;
};

const ensureCategory = async (categoryId) => {
  let category;
  // Try to find by ObjectId first
  if (mongoose.isValidObjectId(categoryId)) {
    category = await Category.findOne({ _id: categoryId, isActive: true });
  }
  // If not found, try to find by slug or name
  if (!category) {
    category = await Category.findOne({ 
      $or: [
        { slug: categoryId },
        { name: { $regex: new RegExp(`^${categoryId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ], 
      isActive: true 
    });
  }
  if (!category) throw new AppError('Selected category does not exist or is inactive.', 422);
  return category;
};

// Build marketplace filter for public products
const buildMarketplaceFilter = (query) => {
  const filter = { isApproved: true, status: 'published', isDeleted: { $ne: true } };

  if (query.search) {
    // Use text search for full-text indexing
    filter.$text = { $search: query.search };
  }

  if (query.category) {
    const categoryMatch = mongoose.isValidObjectId(query.category)
      ? { _id: query.category }
      : { slug: query.category };
    filter.category = categoryMatch;
  }

  if (query.subcategory) {
    filter.subcategory = { $regex: query.subcategory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }

  if (query.brand) {
    filter.brand = { $regex: query.brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }

  if (query.inStock === 'true') filter.stock = { $gt: 0 };
  if (query.inStock === 'false') filter.stock = 0;

  if (query.minPrice != null || query.maxPrice != null) {
    filter.price = {
      ...(query.minPrice != null ? { $gte: Number(query.minPrice) } : {}),
      ...(query.maxPrice != null ? { $lte: Number(query.maxPrice) } : {}),
    };
  }

  if (query.minRating != null) {
    filter['ratings.average'] = { $gte: Number(query.minRating) };
  }

  if (query.availability === 'in_stock') filter.stock = { $gt: 0 };
  if (query.availability === 'out_of_stock') filter.stock = 0;

  if (query.discount === 'true') {
    filter.discountPrice = { $exists: true, $ne: null };
  }

  if (query.productCondition) {
    filter.productCondition = query.productCondition;
  }

  if (query.seller) {
    filter.sellerId = query.seller;
  }

  if (query.tags) {
    const searchTags = query.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (searchTags.length > 0) {
      filter.tags = { $in: searchTags };
    }
  }

  // Handle category lookup by slug for text search queries
  if (filter.category && typeof filter.category === 'object' && filter.category.slug) {
    // Already handled above
  }

  return filter;
};

export const listProducts = async (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const filter = buildMarketplaceFilter(query);

  // Resolve category slug to ObjectId
  if (filter.category && typeof filter.category === 'object' && filter.category.slug) {
    const category = await Category.findOne({ slug: filter.category.slug, isActive: true });
    if (!category) {
      return { products: [], pagination: { page, limit, total: 0, pages: 0 } };
    }
    filter.category = category._id;
  }

  // If search is provided, don't use text search when combined with tag filter (text + tag queries conflict)
  if (query.search && query.tags) {
    delete filter.$text;
    const searchRegex = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: searchRegex, $options: 'i' } },
      { tags: { $regex: searchRegex, $options: 'i' } },
      { description: { $regex: searchRegex, $options: 'i' } },
      { brand: { $regex: searchRegex, $options: 'i' } },
      { shopName: { $regex: searchRegex, $options: 'i' } },
      { sellerName: { $regex: searchRegex, $options: 'i' } },
    ];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    popularity: { orderCount: -1, views: -1 },
    rating: { 'ratings.average': -1, 'ratings.count': -1 },
    views: { views: -1 },
    'best-selling': { orderCount: -1 },
  };

  let sort;
  if (query.search && !query.tags) {
    sort = { score: { $meta: 'textScore' } };
  } else {
    sort = sortMap[query.sort] || { createdAt: -1 };
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('creator', 'name profileImage isVerified shopName')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  const enrichedProducts = await enrichWithCustomerPrice(products);

  return { products: enrichedProducts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const getProduct = async (identifier) => {
  const identifierFilter = mongoose.isValidObjectId(identifier) ? { _id: identifier } : { slug: identifier };
  const product = await Product.findOne({ ...identifierFilter, isApproved: true, isDeleted: { $ne: true } })
    .populate('category', 'name slug description')
    .populate('creator', 'name profileImage isVerified shopName shopLogo shopDescription sellerRating');
  if (!product) throw new AppError('Product was not found.', 404);

  // Increment view count (fire and forget)
  Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } }).catch(() => {});

  const enriched = await enrichWithCustomerPrice([product.toObject()]);
  return enriched[0];
};

export const getMyProduct = async (id, userId) => {
  const product = await Product.findOne({ _id: id, creator: userId, isDeleted: { $ne: true } })
    .populate('category', 'name slug description')
    .populate('creator', 'name profileImage isVerified shopName shopLogo shopDescription sellerRating');
  if (!product) throw new AppError('Product was not found.', 404);
  return product;
};

export const listCreatorProducts = (creatorId) =>
  Product.find({ creator: creatorId, isDeleted: { $ne: true } })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 });

export const createProduct = async (data, files, creatorId) => {
  if (!files?.length) throw new AppError('At least one product image is required.', 422);
  const category = await ensureCategory(data.category);
  data.category = category._id;

  const images = await Promise.all(files.map((file) => uploadImage(file, `indigomart/products/${creatorId}`)));
  try {
    // Get seller info if the creator is a seller
    let sellerName = '';
    let shopName = '';
    if (data.sellerName || data.shopName) {
      sellerName = data.sellerName || '';
      shopName = data.shopName || '';
    } else {
      const user = await User.findById(creatorId).select('name shopName role');
      if (user && (user.role === 'seller' || user.shopName)) {
        sellerName = user.name;
        shopName = user.shopName || '';
      }
    }

    // Calculate discount price if discount percentage is provided
    let discountPrice = data.discountPrice;
    if (data.discountPercentage && !discountPrice) {
      discountPrice = data.price - (data.price * data.discountPercentage) / 100;
    }

    // Calculate platform fee and display price from seller price (backend-controlled)
    const sellerPrice = data.sellerPrice ?? data.price;
    const { platformFee, displayPrice } = await calculateDisplayPrice(sellerPrice);
    data.sellerPrice = sellerPrice;
    data.platformFee = platformFee;
    data.displayPrice = displayPrice;
    data.price = sellerPrice; // Keep `price` in sync with seller price for backward compatibility

    // Auto-set stock status based on stock quantity
    let stockStatus = data.stockStatus || 'in_stock';
    if (data.stock === 0) stockStatus = 'out_of_stock';
    else if (data.stock <= 5) stockStatus = 'limited_stock';

    // Process tags
    const tags = data.tags
      ? (Array.isArray(data.tags) ? data.tags : JSON.parse(data.tags))
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      : [];

    // Remove duplicates
    const uniqueTags = [...new Set(tags)];

    // Process specifications
    let specifications = [];
    if (data.specifications) {
      try {
        specifications = typeof data.specifications === 'string' ? JSON.parse(data.specifications) : data.specifications;
      } catch {
        specifications = [];
      }
    }

    // Process shipping details
    let shippingDetails = {};
    if (data.shippingDetails) {
      try {
        shippingDetails = typeof data.shippingDetails === 'string' ? JSON.parse(data.shippingDetails) : data.shippingDetails;
      } catch {
        shippingDetails = {};
      }
    }

    const product = await Product.create({
      ...data,
      slug: await uniqueProductSlug(data.title),
      creator: creatorId,
      sellerId: data.sellerId || creatorId,
      sellerName: data.sellerName || sellerName,
      shopName: data.shopName || shopName,
      images: images.map((image) => ({ ...image, alt: data.title })),
      tags: uniqueTags,
      specifications,
      shippingDetails,
      discountPrice: discountPrice || undefined,
      discountPercentage: data.discountPercentage || 0,
      stockStatus,
      status: data.status || 'draft',
      isApproved: data.status === 'published' ? true : false,
      minOrderQuantity: data.minOrderQuantity || 1,
      maxOrderQuantity: data.maxOrderQuantity || 99,
    });

    // Index product for semantic search asynchronously
    if (env.ENABLE_SEMANTIC_SEARCH) {
      indexProduct(product.toObject()).catch((error) => {
        console.error(`Async indexing failed for product ${product._id}:`, error.message);
      });
    }

    return product;
  } catch (error) {
    await deleteImages(images.map((image) => image.publicId));
    throw error;
  }
};

const findOwnedProduct = async (id, user) => {
  const filter = { _id: id, ...(user.role === 'admin' ? {} : { creator: user.id }) };
  const product = await Product.findOne(filter);
  if (!product) throw new AppError('Product was not found or is not owned by you.', 404);
  return product;
};

export const updateProduct = async (id, data, files, user) => {
  const product = await findOwnedProduct(id, user);
  if (data.category) {
    const category = await ensureCategory(data.category);
    data.category = category._id;
  }
  if (data.title && data.title !== product.title) data.slug = await uniqueProductSlug(data.title, product.id);

  const newImages = files?.length
    ? await Promise.all(files.map((file) => uploadImage(file, `indigomart/products/${product.creator}`)))
    : [];
  if (product.images.length + newImages.length > 10) {
    await deleteImages(newImages.map((image) => image.publicId));
    throw new AppError('A product can contain at most 10 images.', 422);
  }

  // Calculate discount price if discount percentage is provided
  if (data.discountPercentage && !data.discountPrice) {
    const price = data.price || product.price;
    data.discountPrice = price - (price * data.discountPercentage) / 100;
  }

  // Recalculate platform fee and display price when seller price changes
  if (data.sellerPrice !== undefined || data.price !== undefined) {
    const sellerPrice = data.sellerPrice ?? data.price ?? product.sellerPrice ?? product.price;
    const { platformFee, displayPrice } = await calculateDisplayPrice(sellerPrice);
    data.sellerPrice = sellerPrice;
    data.platformFee = platformFee;
    data.displayPrice = displayPrice;
    data.price = sellerPrice; // Keep `price` in sync with seller price for backward compatibility
  }

  // Auto-set stock status
  const stock = data.stock !== undefined ? data.stock : product.stock;
  if (data.stock !== undefined || !data.stockStatus) {
    if (stock === 0) data.stockStatus = 'out_of_stock';
    else if (stock <= 5) data.stockStatus = 'limited_stock';
    else data.stockStatus = 'in_stock';
  }

  // Process tags
  if (data.tags) {
    const tags = (Array.isArray(data.tags) ? data.tags : JSON.parse(data.tags))
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    data.tags = [...new Set(tags)];
  }

  // Process specifications
  if (data.specifications) {
    try {
      data.specifications = typeof data.specifications === 'string' ? JSON.parse(data.specifications) : data.specifications;
    } catch {
      delete data.specifications;
    }
  }

  // Process shipping details
  if (data.shippingDetails) {
    try {
      data.shippingDetails = typeof data.shippingDetails === 'string' ? JSON.parse(data.shippingDetails) : data.shippingDetails;
    } catch {
      delete data.shippingDetails;
    }
  }

  Object.assign(product, data);
  product.images.push(...newImages.map((image) => ({ ...image, alt: data.title || product.title })));

  // Update approval status based on visibility
  if (data.status === 'published') product.isApproved = true;
  else if (data.status === 'draft' || data.status === 'hidden') product.isApproved = false;

  if (user.role !== 'admin' && !data.status) product.isApproved = false;

  try {
    await product.save();

    // Re-index product for semantic search asynchronously
    if (env.ENABLE_SEMANTIC_SEARCH) {
      indexProduct(product.toObject()).catch((error) => {
        console.error(`Async re-indexing failed for product ${product._id}:`, error.message);
      });
    }

    return product;
  } catch (error) {
    await deleteImages(newImages.map((image) => image.publicId));
    throw error;
  }
};

export const deleteProduct = async (id, user) => {
  const product = await findOwnedProduct(id, user);
  // Soft delete - mark as deleted instead of removing
  product.isDeleted = true;
  product.isApproved = false;
  product.status = 'hidden';
  await product.save();
};

export const softDeleteProduct = async (id, user) => {
  const product = await findOwnedProduct(id, user);
  product.isDeleted = true;
  product.isApproved = false;
  product.status = 'hidden';
  await product.save();
  return product;
};

export const hideProduct = async (id, user) => {
  const product = await findOwnedProduct(id, user);
  product.status = 'hidden';
  product.isApproved = false;
  await product.save();
  return product;
};

export const unhideProduct = async (id, user) => {
  const product = await findOwnedProduct(id, user);
  product.status = 'published';
  product.isApproved = true;
  await product.save();
  return product;
};

export const duplicateProduct = async (id, user) => {
  const product = await findOwnedProduct(id, user);
  const duplicateData = product.toObject();
  delete duplicateData._id;
  delete duplicateData.__v;
  delete duplicateData.slug;
  delete duplicateData.createdAt;
  delete duplicateData.updatedAt;
  delete duplicateData.views;
  delete duplicateData.favorites;
  delete duplicateData.orderCount;
  delete duplicateData.ratings;
  delete duplicateData.reviews;
  delete duplicateData.reviewCount;

  duplicateData.title = `${duplicateData.title} (Copy)`;
  duplicateData.status = 'draft';
  duplicateData.isApproved = false;
  duplicateData.isDeleted = false;

  return await Product.create({
    ...duplicateData,
    slug: await uniqueProductSlug(duplicateData.title),
  });
};

export const listCategories = () =>
  Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();

// Search products with ranking
export const searchProducts = async (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const filter = { isApproved: true, status: 'published', isDeleted: { $ne: true } };

  if (query.keyword) {
    const searchRegex = query.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: searchRegex, $options: 'i' } },
      { tags: { $regex: searchRegex, $options: 'i' } },
      { description: { $regex: searchRegex, $options: 'i' } },
      { brand: { $regex: searchRegex, $options: 'i' } },
      { shopName: { $regex: searchRegex, $options: 'i' } },
      { sellerName: { $regex: searchRegex, $options: 'i' } },
    ];
  }

  // Apply additional filters
  if (query.category) {
    const category = mongoose.isValidObjectId(query.category)
      ? await Category.findById(query.category)
      : await Category.findOne({ slug: query.category });
    if (category) filter.category = category._id;
  }
  if (query.subcategory) filter.subcategory = { $regex: query.subcategory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (query.brand) filter.brand = { $regex: query.brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (query.minPrice != null || query.maxPrice != null) {
    filter.price = {
      ...(query.minPrice != null ? { $gte: Number(query.minPrice) } : {}),
      ...(query.maxPrice != null ? { $lte: Number(query.maxPrice) } : {}),
    };
  }
  if (query.minRating != null) filter['ratings.average'] = { $gte: Number(query.minRating) };
  if (query.availability === 'in_stock') filter.stock = { $gt: 0 };
  if (query.tags) {
    const searchTags = query.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (searchTags.length > 0) filter.tags = { $in: searchTags };
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    popularity: { orderCount: -1, views: -1 },
    rating: { 'ratings.average': -1, 'ratings.count': -1 },
    views: { views: -1 },
    'best-selling': { orderCount: -1 },
  };

  const sort = sortMap[query.sort] || { createdAt: -1 };
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('creator', 'name profileImage isVerified shopName')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  const enrichedProducts = await enrichWithCustomerPrice(products);

  return { products: enrichedProducts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

// Get related products
export const getRelatedProducts = async (productId, limit = 6) => {
  const product = await Product.findById(productId);
  if (!product) return [];

  const related = await Product.find({
    _id: { $ne: productId },
    isApproved: true,
    status: 'published',
    isDeleted: { $ne: true },
    $or: [
      { category: product.category },
      { tags: { $in: product.tags } },
      { brand: product.brand },
    ],
  })
    .populate('category', 'name slug')
    .populate('creator', 'name profileImage')
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  return enrichWithCustomerPrice(related);
};
