import { env } from '../config/env.js';

const NORMALIZE = (value, min, max) => {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
};

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export const rankSearchResults = (results, query = '') => {
  if (!results || results.length === 0) {
    return [];
  }

  const normalized = results.map((item) => {
    const payload = item.payload || {};
    const score = item.score || 0;

    const semanticScore = clamp(score, 0, 1);

    const title = (payload.title || '').toLowerCase();
    const queryLower = (query || '').toLowerCase().trim();
    const queryTerms = queryLower.split(/\s+/).filter(Boolean);

    let exactTitleMatch = 0;
    let keywordMatchScore = 0;

    if (queryTerms.length > 0 && title) {
      if (title === queryLower) {
        exactTitleMatch = 1;
      } else {
        const matchedTerms = queryTerms.filter((term) => title.includes(term));
        keywordMatchScore = matchedTerms.length / queryTerms.length;
      }
    }

    const popularity = clamp(
      NORMALIZE(payload.orderCount || 0, 0, Math.max(payload.orderCount || 0, 100)),
    );

    const rating = clamp(NORMALIZE(payload.ratingsAverage || 0, 0, 5));

    const sales = clamp(
      NORMALIZE(payload.orderCount || 0, 0, Math.max(payload.orderCount || 0, 100)),
    );

    const finalScore =
      semanticScore * 0.4 +
      exactTitleMatch * 0.25 +
      keywordMatchScore * 0.25 +
      popularity * 0.1 +
      rating * 0.1 +
      sales * 0.1;

    return {
      ...item,
      scores: {
        semantic: semanticScore,
        exactTitleMatch,
        keywordMatch: keywordMatchScore,
        popularity,
        rating,
        sales,
        final: finalScore,
      },
    };
  });

  normalized.sort((a, b) => b.scores.final - a.scores.final);

  return normalized;
};

export const getSearchSuggestions = (products, query) => {
  if (!products || products.length === 0) {
    return [];
  }

  const queryLower = (query || '').toLowerCase().trim();
  const suggestions = new Map();

  for (const product of products) {
    const title = product.payload?.title || product.title || '';
    const titleLower = title.toLowerCase();

    if (!titleLower.includes(queryLower)) {
      continue;
    }

    const key = titleLower;

    if (!suggestions.has(key)) {
      suggestions.set(key, {
        text: title,
        productId: product.payload?.productId || product.productId,
        score: product.score || product.scores?.final || 0,
        type: 'product',
      });
    }
  }

  return Array.from(suggestions.values()).slice(0, 10);
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