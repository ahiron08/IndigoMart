import api from './api.js';

export const getMyOrders = async (page = 1, limit = 20) => {
  const response = await api.get(`orders/my?page=${page}&limit=${limit}`);
  return response.data.data;
};

export const getSellerOrders = async (page = 1, limit = 20) => {
  const response = await api.get(`orders/seller/list?page=${page}&limit=${limit}`);
  return response.data.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`orders/${id}`);
  return response.data.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await api.patch(`orders/${id}/status`, { status });
  return response.data;
};

export const updateOrderTracking = async (id, data) => {
  const response = await api.patch(`orders/${id}/tracking`, data);
  return response.data;
};

export const adminGetAllOrders = async (page = 1, limit = 50, status) => {
  const params = `page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`;
  const response = await api.get(`orders/admin/all?${params}`);
  return response.data.data;
};