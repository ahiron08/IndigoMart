import mongoose from 'mongoose';

import { env } from '../config/env.js';
import { expandQuery, generateQueryEmbedding } from './embedding.service.js';
import { searchSimilarProducts } from './vector.service.js';
import { rankSearchResults } from './search-ranking.service.js';
import { getCachedSearch, setCachedSearch } from './cache.service.js';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';

const buildMongoFilter = (query) => {
  const filter = { isApproved: true, status: 'published', isDeleted: { $ne: true } };

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

  return filter;
};

const resolveCategoryId = async (categoryQuery) => {
  if (!categoryQuery) return null;

  if (mongoose.isValidObjectId(categoryQuery)) {
    const category = await Category.findById(categoryQuery);
    return category ? category._id : null;
  }

  const category = await Category.findOne({ slug: categoryQuery });
  return category ? category._id : null;
};

export const semanticSearch = async (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const keyword = (query.q || query.keyword || '').trim();

  const cachedResult = getCachedSearch(query);
  if (cachedResult) {
    const start = (page - 1) * limit;
    const paginatedProducts = cachedResult.products.slice(start, start + limit);

    return {
      products: paginatedProducts,
      pagination: cachedResult.pagination,
      mode: cachedResult.mode,
      expandedQuery: cachedResult.expandedQuery,
      cached: true,
    };
  }

  const mongoFilter = buildMongoFilter(query);
  const categoryId = await resolveCategoryId(query.category);
  if (categoryId) mongoFilter.category = categoryId;

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

  if (!keyword) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(mongoFilter)
        .populate('category', 'name slug')
        .populate('creator', 'name profileImage isVerified shopName')
        .sort(sortMap[query.sort] || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(mongoFilter),
    ]);

    return { products, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, mode: 'filter' };
  }

  // Fall back to MongoDB text search when semantic search is not configured
  if (!env.OPENAI_API_KEY || !env.QDRANT_URL) {
    if (keyword) {
      mongoFilter.$text = { $search: keyword };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(mongoFilter)
        .populate('category', 'name slug')
        .populate('creator', 'name profileImage isVerified shopName')
        .sort(sortMap[query.sort] || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(mongoFilter),
    ]);

    return { products, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, mode: 'text' };
  }

  const expandedQuery = await expandQuery(keyword);
  const queryVector = await generateQueryEmbedding(expandedQuery);

  const vectorFilter = {
    category: query.category ? await resolveCategoryId(query.category) : null,
    brand: query.brand || null,
    minPrice: query.minPrice != null ? Number(query.minPrice) : null,
    maxPrice: query.maxPrice != null ? Number(query.maxPrice) : null,
    inStock: query.inStock === 'true',
    minRating: query.minRating != null ? Number(query.minRating) : null,
    tags: query.tags ? query.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
  };

  const vectorResults = queryVector
    ? await searchSimilarProducts(queryVector, {
        limit: 100,
        scoreThreshold: 0.25,
        filter: vectorFilter,
      })
    : [];

  const ranked = rankSearchResults(vectorResults, keyword);

  const productIds = ranked
    .filter((item) => item.payload?.productId)
    .map((item) => item.payload.productId);

  let products = [];

  if (productIds.length > 0) {
    const mongoFilter = buildMongoFilter(query);
    const categoryId = await resolveCategoryId(query.category);
    if (categoryId) mongoFilter.category = categoryId;
    mongoFilter._id = { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) };

    const dbProducts = await Product.find(mongoFilter)
      .populate('category', 'name slug')
      .populate('creator', 'name profileImage isVerified shopName')
      .lean();

    const productMap = new Map(dbProducts.map((product) => [String(product._id), product]));

    products = ranked
      .filter((item) => productMap.has(item.payload?.productId))
      .map((item) => {
        const product = productMap.get(item.payload.productId);
        return {
          ...product,
          _score: item.scores?.final || item.score || 0,
          _scores: item.scores,
        };
      });
  }

  const total = products.length;
  const start = (page - 1) * limit;
  const paginatedProducts = products.slice(start, start + limit);

  const result = {
    products: paginatedProducts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    mode: 'semantic',
    expandedQuery: env.NODE_ENV === 'development' ? expandedQuery : undefined,
  };

  setCachedSearch(query, result);

  return result;
};

export const getSimilarProducts = async (productId, limit = 6) => {
  const product = await Product.findById(productId);
  if (!product) return [];

  // Fall back to same-category products when semantic search is not configured
  if (!env.OPENAI_API_KEY || !env.QDRANT_URL) {
    const category = typeof product.category === 'object' ? product.category._id : product.category;
    return Product.find({
      category,
      _id: { $ne: productId },
      isApproved: true,
      status: 'published',
      isDeleted: { $ne: true },
    })
      .populate('category', 'name slug')
      .populate('creator', 'name profileImage')
      .limit(Number(limit) || 6)
      .lean();
  }

  const queryVector = await generateQueryEmbedding(
    [product.title, product.shortDescription || product.description, product.tags?.join(' ')].filter(Boolean).join(' '),
  );

  if (!queryVector) {
    return [];
  }

  const results = await searchSimilarProducts(queryVector, {
    limit: limit + 1,
    scoreThreshold: 0.2,
    filter: {
      category: typeof product.category === 'object' ? String(product.category._id) : String(product.category),
    },
  });

  const ranked = rankSearchResults(results, product.title);

  const productIds = ranked
    .filter((item) => item.payload?.productId && item.payload.productId !== String(productId))
    .map((item) => item.payload.productId);

  if (productIds.length === 0) {
    return [];
  }

  const similarProducts = await Product.find({
    _id: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) },
    isApproved: true,
    status: 'published',
    isDeleted: { $ne: true },
  })
    .populate('category', 'name slug')
    .populate('creator', 'name profileImage')
    .lean();

  const productMap = new Map(similarProducts.map((p) => [String(p._id), p]));

  return ranked
    .filter((item) => productMap.has(item.payload?.productId))
    .map((item) => {
      const p = productMap.get(item.payload.productId);
      return {
        ...p,
        _score: item.scores?.final || item.score || 0,
        _scores: item.scores,
      };
    });
};

export const getSearchSuggestions = async (query) => {
  const keyword = (query.q || query.keyword || '').trim();

  if (!keyword || keyword.length < 2) {
    return [];
  }

  // Fall back to Mongo text search suggestions when semantic search is not configured
  if (!env.OPENAI_API_KEY || !env.QDRANT_URL) {
    const products = await Product.find({
      $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { brand: { $regex: keyword, $options: 'i' } },
        { tags: keyword.toLowerCase() },
      ],
      isApproved: true,
      status: 'published',
      isDeleted: { $ne: true },
    })
      .select('title _id')
      .limit(10)
      .lean();

    return products.map((product) => ({
      text: product.title,
      productId: String(product._id),
      score: 1,
      type: 'product',
    }));
  }

  const queryVector = await generateQueryEmbedding(keyword);

  if (!queryVector) {
    return [];
  }

  const results = await searchSimilarProducts(queryVector, {
    limit: 10,
    scoreThreshold: 0.2,
  });

  const suggestions = results
    .filter((item) => item.payload?.title)
    .map((item) => ({
      text: item.payload.title,
      productId: item.payload.productId,
      score: item.score,
      type: 'product',
    }));

  return suggestions;
};

export const getTrendingSearches = () => {
  return [
    { text: 'black oversized anime hoodie', count: 245 },
    { text: 'gifts for programmers', count: 189 },
    { text: 'aesthetic desk accessories', count: 156 },
    { text: 'minimal white sneakers', count: 134 },
    { text: 'gaming headphones', count: 128 },
    { text: 'wireless mouse', count: 112 },
    { text: 'winter clothing', count: 98 },
    { text: 'mechanical keyboard', count: 87 },
  ];
};