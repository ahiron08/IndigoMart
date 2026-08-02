const searchCache = new Map();
const embeddingCache = new Map();

const SEARCH_TTL_MS = 60_000;
const EMBEDDING_TTL_MS = 1000 * 60 * 60;

const now = () => Date.now();

const buildSearchKey = (query) => {
  const parts = [
    query.q || query.keyword || '',
    query.category || '',
    query.brand || '',
    query.minPrice || '',
    query.maxPrice || '',
    query.inStock || '',
    query.minRating || '',
    query.tags || '',
    query.sort || '',
    query.page || '1',
    query.limit || '20',
  ];

  return parts.join('|');
};

const buildEmbeddingKey = (text) => `embedding:${text.toLowerCase().trim()}`;

export const getCachedSearch = (query) => {
  const key = buildSearchKey(query);
  const entry = searchCache.get(key);

  if (!entry) {
    return null;
  }

  if (now() - entry.cachedAt > SEARCH_TTL_MS) {
    searchCache.delete(key);
    return null;
  }

  return entry.value;
};

export const setCachedSearch = (query, value) => {
  const key = buildSearchKey(query);
  searchCache.set(key, { value, cachedAt: now() });

  if (searchCache.size > 1000) {
    const firstKey = searchCache.keys().next().value;
    searchCache.delete(firstKey);
  }
};

export const getCachedEmbedding = (text) => {
  const key = buildEmbeddingKey(text);
  const entry = embeddingCache.get(key);

  if (!entry) {
    return null;
  }

  if (now() - entry.cachedAt > EMBEDDING_TTL_MS) {
    embeddingCache.delete(key);
    return null;
  }

  return entry.value;
};

export const setCachedEmbedding = (text, value) => {
  const key = buildEmbeddingKey(text);
  embeddingCache.set(key, { value, cachedAt: now() });

  if (embeddingCache.size > 2000) {
    const firstKey = embeddingCache.keys().next().value;
    embeddingCache.delete(firstKey);
  }
};

export const clearSearchCache = () => {
  searchCache.clear();
};

export const clearEmbeddingCache = () => {
  embeddingCache.clear();
};

export const getCacheStats = () => ({
  searchEntries: searchCache.size,
  embeddingEntries: embeddingCache.size,
});