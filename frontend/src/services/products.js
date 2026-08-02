import api from './api.js';

export const getProducts = (params = {}) => api.get('/products', { params }).then((response) => response.data.data);
export const getProduct = (identifier) => api.get(`/products/${identifier}`).then((response) => response.data.data.product);
export const getMyProducts = (params = {}) => api.get('/products/mine', { params }).then((response) => response.data.data.products);
export const createProduct = (formData) => api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((response) => response.data.data.product);
export const updateProduct = (id, formData) => api.patch(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((response) => response.data.data.product);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then((response) => response.data);
export const hideProduct = (id) => api.patch(`/products/${id}/hide`).then((response) => response.data);
export const duplicateProduct = (id) => api.post(`/products/${id}/duplicate`).then((response) => response.data.data.product);
export const searchProducts = (params = {}) => api.get('/products/search', { params }).then((response) => response.data.data);
export const getRelatedProducts = (id, limit = 6) => api.get(`/products/${id}/related`, { params: { limit } }).then((response) => response.data.data.products);
export const getCategories = () => api.get('/products/categories').then((response) => response.data.data.categories);