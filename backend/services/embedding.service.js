import OpenAI from 'openai';

import { env } from '../config/env.js';
import { getCachedEmbedding, setCachedEmbedding } from './cache.service.js';
import AppError from '../utils/app-error.js';

let openaiClient = null;

const getOpenAIClient = () => {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  return openaiClient;
};

const buildProductDocument = (product) => {
  const categoryName = typeof product.category === 'object' ? product.category?.name : '';
  const creatorName = typeof product.creator === 'object' ? product.creator?.name : '';

  const parts = [
    product.title,
    product.shortDescription || product.description,
    categoryName,
    product.brand,
    product.subcategory,
    creatorName,
    product.shopName || product.sellerName,
    product.productCondition,
    product.sku,
    product.tags?.join(' '),
    product.specifications?.map((spec) => `${spec.key}: ${spec.value}`).join(' '),
    product.shippingDetails?.shippingTime,
    product.metaTitle,
    product.metaDescription,
    product.searchKeywords,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim())
    .join(' ');

  return parts;
};

export const generateProductEmbedding = async (product) => {
  const client = getOpenAIClient();

  if (!client) {
    return null;
  }

  const document = buildProductDocument(product);

  if (!document || document.trim().length === 0) {
    return null;
  }

  try {
    const response = await client.embeddings.create({
      model: env.EMBEDDING_MODEL,
      input: document,
      dimensions: env.EMBEDDING_DIMENSIONS,
    });

    const embedding = response.data[0]?.embedding;

    if (!embedding || !Array.isArray(embedding) || embedding.length !== env.EMBEDDING_DIMENSIONS) {
      return null;
    }

    return {
      vector: embedding,
      document,
      model: env.EMBEDDING_MODEL,
      dimensions: env.EMBEDDING_DIMENSIONS,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Embedding generation failed:', error.message);
    return null;
  }
};

export const generateQueryEmbedding = async (query) => {
  const client = getOpenAIClient();

  if (!client || !query || query.trim().length === 0) {
    return null;
  }

  const trimmed = query.trim();
  const cached = getCachedEmbedding(trimmed);
  if (cached) {
    return cached;
  }

  try {
    const response = await client.embeddings.create({
      model: env.EMBEDDING_MODEL,
      input: trimmed,
      dimensions: env.EMBEDDING_DIMENSIONS,
    });

    const embedding = response.data[0]?.embedding;

    if (!embedding || !Array.isArray(embedding) || embedding.length !== env.EMBEDDING_DIMENSIONS) {
      return null;
    }

    setCachedEmbedding(trimmed, embedding);

    return embedding;
  } catch (error) {
    console.error('Query embedding generation failed:', error.message);
    return null;
  }
};

export const expandQuery = async (query) => {
  if (!env.QUERY_EXPANSION_ENABLED) {
    return query;
  }

  const client = getOpenAIClient();

  if (!client) {
    return query;
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a search query expansion assistant for an ecommerce platform.
Expand the user's search query into a richer search phrase by adding relevant synonyms, related terms, and descriptive keywords.
Keep it concise. Return ONLY the expanded query text. Do not include explanations.`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      max_tokens: 60,
      temperature: 0.2,
    });

    const expanded = completion.choices[0]?.message?.content?.trim();

    if (!expanded || expanded.toLowerCase() === query.toLowerCase()) {
      return query;
    }

    return expanded;
  } catch (error) {
    console.error('Query expansion failed:', error.message);
    return query;
  }
};

export const buildProductDocumentForEmbedding = buildProductDocument;