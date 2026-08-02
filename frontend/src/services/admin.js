import api from './api.js';

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboardStats = () => api.get('/admin/dashboard');

// ─── Users ────────────────────────────────────────────────────────────────────

export const getUsers = (params = {}) => api.get('/admin/users', { params });

export const banUser = (id) => api.put(`/admin/user/${id}/ban`);

export const unbanUser = (id) => api.put(`/admin/user/${id}/unban`);

export const deleteUser = (id) => api.delete(`/admin/user/${id}`);

// ─── Sellers ──────────────────────────────────────────────────────────────────

export const getSellers = (params = {}) => api.get('/admin/sellers', { params });

export const getSeller = (id) => api.get(`/admin/seller/${id}`);

export const approveSeller = (id) => api.put(`/admin/seller/${id}/approve`);

export const rejectSeller = (id) => api.put(`/admin/seller/${id}/reject`);

export const suspendSeller = (id) => api.put(`/admin/seller/${id}/suspend`);

export const activateSeller = (id) => api.put(`/admin/seller/${id}/activate`);

export const deleteSeller = (id) => api.delete(`/admin/seller/${id}`);

// ─── Products ─────────────────────────────────────────────────────────────────

export const getAllProducts = (params = {}) => api.get('/admin/products', { params });

export const adminDeleteProduct = (id) => api.delete(`/admin/product/${id}`);

export const adminRestoreProduct = (id) => api.put(`/admin/product/${id}/restore`);

export const adminApproveProduct = (id) => api.put(`/admin/product/${id}/approve`);

export const adminRejectProduct = (id) => api.put(`/admin/product/${id}/reject`);

export const adminFeatureProduct = (id) => api.put(`/admin/product/${id}/feature`);

export const adminUnfeatureProduct = (id) => api.put(`/admin/product/${id}/unfeature`);

// ─── Orders ───────────────────────────────────────────────────────────────────

export const getAllOrders = (params = {}) => api.get('/admin/orders', { params });

export const adminUpdateOrderStatus = (id, data) => api.put(`/admin/order/${id}/status`, data);

// ─── Categories ───────────────────────────────────────────────────────────────

export const adminGetCategories = (params = {}) => api.get('/admin/categories', { params });

export const adminCreateCategory = (data) => api.post('/admin/categories', data);

export const adminUpdateCategory = (id, data) => api.put(`/admin/categories/${id}`, data);

export const adminDeleteCategory = (id) => api.delete(`/admin/categories/${id}`);

// ─── Coupons ──────────────────────────────────────────────────────────────────

export const getCoupons = (params = {}) => api.get('/admin/coupons', { params });

export const getCoupon = (id) => api.get(`/admin/coupons/${id}`);

export const createCoupon = (data) => api.post('/admin/coupons', data);

export const updateCoupon = (id, data) => api.put(`/admin/coupons/${id}`, data);

export const deleteCoupon = (id) => api.delete(`/admin/coupons/${id}`);

export const validateCoupon = (data) => api.post('/admin/coupons/validate', data);