import asyncHandler from '../utils/async-handler.js';

import { semanticSearch, getSimilarProducts, getSearchSuggestions, getTrendingSearches } from '../services/search.service.js';

export const searchProducts = asyncHandler(async (request, response) => {
  const result = await semanticSearch(request.query);

  response.status(200).json({
    success: true,
    data: result.products,
    pagination: result.pagination,
    meta: {
      mode: result.mode,
      expandedQuery: result.expandedQuery,
    },
  });
});

export const getProductSimilar = asyncHandler(async (request, response) => {
  const products = await getSimilarProducts(request.params.id, request.query.limit);

  response.status(200).json({ success: true, data: { products } });
});

export const getSuggestions = asyncHandler(async (request, response) => {
  const suggestions = await getSearchSuggestions(request.query);

  response.status(200).json({ success: true, data: { suggestions } });
});

export const getTrending = asyncHandler(async (_request, response) => {
  const trending = getTrendingSearches();

  response.status(200).json({ success: true, data: { trending } });
});