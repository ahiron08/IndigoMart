import {
  createProduct,
  deleteProduct,
  duplicateProduct,
  getProduct,
  getMyProduct,
  hideProduct,
  listCategories,
  listCreatorProducts,
  listProducts,
  softDeleteProduct,
  unhideProduct,
  updateProduct,
} from '../services/product.service.js';
import { getSimilarProducts as getRelatedProducts, semanticSearch } from '../services/search.service.js';
import asyncHandler from '../utils/async-handler.js';

export const getProducts = asyncHandler(async (request, response) => {
  const result = await listProducts(request.query);
  response.status(200).json({ success: true, data: result });
});

export const getProductByIdentifier = asyncHandler(async (request, response) => {
  const product = await getProduct(request.params.identifier);
  response.status(200).json({ success: true, data: { product } });
});

export const getMyProducts = asyncHandler(async (request, response) => {
  const products = await listCreatorProducts(request.user.id);
  response.status(200).json({ success: true, data: { products } });
});

export const getMyProductById = asyncHandler(async (request, response) => {
  const product = await getMyProduct(request.params.id, request.user.id);
  response.status(200).json({ success: true, data: { product } });
});

export const createMyProduct = asyncHandler(async (request, response) => {
  const product = await createProduct(request.body, request.files, request.user.id);
  response.status(201).json({
    success: true,
    message: product.status === 'published' ? 'Product published successfully.' : 'Product saved as draft.',
    data: { product },
  });
});

export const updateMyProduct = asyncHandler(async (request, response) => {
  const product = await updateProduct(request.params.id, request.body, request.files, request.user);
  response.status(200).json({
    success: true,
    message: request.user.role === 'admin' ? 'Product updated.' : 'Product updated.',
    data: { product },
  });
});

export const deleteMyProduct = asyncHandler(async (request, response) => {
  await deleteProduct(request.params.id, request.user);
  response.status(200).json({ success: true, message: 'Product deleted.' });
});

export const hideMyProduct = asyncHandler(async (request, response) => {
  const product = await hideProduct(request.params.id, request.user);
  response.status(200).json({ success: true, message: 'Product hidden.', data: { product } });
});

export const unhideMyProduct = asyncHandler(async (request, response) => {
  const product = await unhideProduct(request.params.id, request.user);
  response.status(200).json({ success: true, message: 'Product unhidden.', data: { product } });
});

export const duplicateMyProduct = asyncHandler(async (request, response) => {
  const product = await duplicateProduct(request.params.id, request.user);
  response.status(201).json({ success: true, message: 'Product duplicated.', data: { product } });
});

export const getCategories = asyncHandler(async (_request, response) => {
  const categories = await listCategories();
  response.status(200).json({ success: true, data: { categories } });
});

export const searchAllProducts = asyncHandler(async (request, response) => {
  const result = await semanticSearch(request.query);
  response.status(200).json({ success: true, data: result });
});

export const getRelatedProductsById = asyncHandler(async (request, response) => {
  const products = await getRelatedProducts(request.params.id, request.query.limit);
  response.status(200).json({ success: true, data: { products } });
});