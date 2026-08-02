import api from './api.js';

export const getMyAddresses = async () => {
  const response = await api.get('address');
  return response.data.data.addresses;
};

export const getAddressById = async (id) => {
  const response = await api.get(`address/${id}`);
  return response.data.data.address;
};

export const createAddress = async (data) => {
  const response = await api.post('address', data);
  return response.data.data.address;
};

export const updateAddress = async (id, data) => {
  const response = await api.put(`address/${id}`, data);
  return response.data.data.address;
};

export const deleteAddress = async (id) => {
  const response = await api.delete(`address/${id}`);
  return response.data;
};

export const setDefaultAddress = async (id) => {
  const response = await api.patch(`address/${id}/default`);
  return response.data.data.address;
};