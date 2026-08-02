import api from './api.js';

export const previewCheckout = async (data) => {
  const response = await api.post('checkout/preview', data);
  return response.data.data;
};

export const placeOrder = async (data) => {
  const response = await api.post('checkout/place', data);
  return response.data;
};

export const getQRInfo = async () => {
  const response = await api.get('payment/qr-info');
  return response.data.data;
};

export const validateCoupon = async (code, orderAmount) => {
  const response = await api.post('coupons/validate', { code, orderAmount });
  return response.data.data;
};