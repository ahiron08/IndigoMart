import { QdrantClient } from '@qdrant/js-client-rest';

import { env } from '../config/env.js';
import { generateProductEmbedding } from './embedding.service.js';

let qdrantClient = null;

const getQdrantClient = () => {
  if (!qdrantClient) {
    qdrantClient = new QdrantClient({
      url: env.QDRANT_URL,
      apiKey: env.QDRANT_API_KEY || undefined,
    });
  }

  return qdrantClient;
};

const getCollectionName = () => env.QDRANT_COLLECTION_NAME;

export const ensureCollection = async () => {
  const client = getQdrantClient();
  const collectionName = getCollectionName();

  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some((collection) => collection.name === collectionName);

    if (!exists) {
      await client.createCollection(collectionName, {
        vectors: {
          size: env.EMBEDDING_DIMENSIONS,
          distance: 'Cosine',
        },
        optimizers_config: {
          default_segment_number: 2,
          indexing_threshold: 20000,
        },
      });

      console.log(`Qdrant collection created: ${collectionName}`);
    }

    return true;
  } catch (error) {
    console.error('Failed to ensure Qdrant collection:', error.message);
    return false;
  }
};

export const indexProduct = async (product) => {
  const client = getQdrantClient();
  const collectionName = getCollectionName();

  if (!env.ENABLE_SEMANTIC_SEARCH) {
    return { success: true, skipped: true };
  }

  try {
    const embeddingResult = await generateProductEmbedding(product);

    if (!embeddingResult) {
      return { success: false, reason: 'embedding_failed' };
    }

    const payload = {
      productId: String(product._id),
      title: product.title,
      brand: product.brand,
      category: typeof product.category === 'object' ? String(product.category._id) : String(product.category),
      categoryName: typeof product.category === 'object' ? product.category?.name || '' : '',
      price: product.price,
      discountPrice: product.discountPrice || null,
      discountPercentage: product.discountPercentage || 0,
      stock: product.stock,
      stockStatus: product.stockStatus,
      ratingsAverage: product.ratings?.average || 0,
      ratingsCount: product.ratings?.count || 0,
      views: product.views || 0,
      orderCount: product.orderCount || 0,
      isApproved: product.isApproved,
      status: product.status,
      tags: product.tags || [],
      sellerId: product.sellerId ? String(product.sellerId) : null,
      sellerName: product.sellerName || '',
      shopName: product.shopName || '',
      createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : new Date().toISOString(),
      document: embeddingResult.document,
      model: embeddingResult.model,
      generatedAt: embeddingResult.generatedAt,
    };

    await client.upsert(collectionName, {
      wait: true,
      points: [
        {
          id: String(product._id),
          vector: embeddingResult.vector,
          payload,
        },
      ],
    });

    return { success: true, indexed: true };
  } catch (error) {
    console.error(`Failed to index product ${product._id}:`, error.message);
    return { success: false, reason: error.message };
  }
};

export const deleteProductIndex = async (productId) => {
  const client = getQdrantClient();
  const collectionName = getCollectionName();

  try {
    await client.delete(collectionName, {
      wait: true,
      points: [String(productId)],
    });

    return { success: true };
  } catch (error) {
    console.error(`Failed to delete product index ${productId}:`, error.message);
    return { success: false, reason: error.message };
  }
};

export const searchSimilarProducts = async (queryVector, options = {}) => {
  const client = getQdrantClient();
  const collectionName = getCollectionName();

  const {
    limit = 20,
    offset = 0,
    scoreThreshold = 0.3,
    filter = {},
  } = options;

  try {
    const qdrantFilter = {
      must: [
        { key: 'isApproved', match: { value: true } },
        { key: 'status', match: { value: 'published' } },
      ],
    };

    if (filter.category) {
      qdrantFilter.must.push({ key: 'category', match: { value: String(filter.category) } });
    }

    if (filter.brand) {
      qdrantFilter.must.push({ key: 'brand', match: { value: filter.brand } });
    }

    if (filter.minPrice != null || filter.maxPrice != null) {
      const range = {};
      if (filter.minPrice != null) range.gte = filter.minPrice;
      if (filter.maxPrice != null) range.lte = filter.maxPrice;
      qdrantFilter.must.push({ key: 'price', range });
    }

    if (filter.inStock) {
      qdrantFilter.must.push({ key: 'stock', range: { gt: 0 } });
    }

    if (filter.minRating != null) {
      qdrantFilter.must.push({ key: 'ratingsAverage', range: { gte: filter.minRating } });
    }

    if (filter.tags && filter.tags.length > 0) {
      qdrantFilter.must.push({ key: 'tags', match: { any: filter.tags } });
    }

    const result = await client.search(collectionName, {
      vector: queryVector,
      limit: limit + offset,
      offset,
      score_threshold: scoreThreshold,
      with_payload: true,
      filter: qdrantFilter.must.length > 0 ? qdrantFilter : undefined,
    });

    return result.map((item) => ({
      productId: item.payload?.productId,
      score: item.score,
      payload: item.payload,
    }));
  } catch (error) {
    console.error('Vector search failed:', error.message);
    return [];
  }
};

export const getProductEmbeddingStatus = async (productId) => {
  const client = getQdrantClient();
  const collectionName = getCollectionName();

  try {
    const points = await client.retrieve(collectionName, {
      ids: [String(productId)],
      with_payload: true,
      with_vector: false,
    });

    if (points.length === 0) {
      return { exists: false };
    }

    const point = points[0];
    return {
      exists: true,
      model: point.payload?.model,
      generatedAt: point.payload?.generatedAt,
      document: point.payload?.document,
    };
  } catch (error) {
    console.error('Failed to get embedding status:', error.message);
    return { exists: false, error: error.message };
  }
};

export const getIndexingStats = async () => {
  const client = getQdrantClient();
  const collectionName = getCollectionName();

  try {
    const info = await client.getCollection(collectionName);
    return {
      exists: true,
      pointsCount: info.points_count || 0,
      vectorsCount: info.vectors_count || 0,
      status: info.status,
    };
  } catch (error) {
    console.error('Failed to get indexing stats:', error.message);
    return { exists: false, error: error.message };
  }
};

export const rebuildProductEmbedding = async (product) => {
  const client = getQdrantClient();
  const collectionName = getCollectionName();

  try {
    await client.delete(collectionName, {
      wait: true,
      points: [String(product._id)],
    });
  } catch {
    // Ignore delete errors - point may not exist
  }

  return indexProduct(product);
};

export const batchIndexProducts = async (products) => {
  const client = getQdrantClient();
  const collectionName = getCollectionName();

  if (!env.ENABLE_SEMANTIC_SEARCH) {
    return { success: 0, failed: 0, skipped: products.length };
  }

  const points = [];

  for (const product of products) {
    const embeddingResult = await generateProductEmbedding(product);

    if (!embeddingResult) {
      continue;
    }

    const payload = {
      productId: String(product._id),
      title: product.title,
      brand: product.brand,
      category: typeof product.category === 'object' ? String(product.category._id) : String(product.category),
      categoryName: typeof product.category === 'object' ? product.category?.name || '' : '',
      price: product.price,
      discountPrice: product.discountPrice || null,
      discountPercentage: product.discountPercentage || 0,
      stock: product.stock,
      stockStatus: product.stockStatus,
      ratingsAverage: product.ratings?.average || 0,
      ratingsCount: product.ratings?.count || 0,
      views: product.views || 0,
      orderCount: product.orderCount || 0,
      isApproved: product.isApproved,
      status: product.status,
      tags: product.tags || [],
      sellerId: product.sellerId ? String(product.sellerId) : null,
      sellerName: product.sellerName || '',
      shopName: product.shopName || '',
      createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : new Date().toISOString(),
      document: embeddingResult.document,
      model: embeddingResult.model,
      generatedAt: embeddingResult.generatedAt,
    };

    points.push({
      id: String(product._id),
      vector: embeddingResult.vector,
      payload,
    });
  }

  if (points.length === 0) {
    return { success: 0, failed: products.length, skipped: 0 };
  }

  try {
    await client.upsert(collectionName, {
      wait: true,
      points,
    });

    return { success: points.length, failed: products.length - points.length, skipped: 0 };
  } catch (error) {
    console.error('Batch indexing failed:', error.message);
    return { success: 0, failed: products.length, skipped: 0 };
  }
};