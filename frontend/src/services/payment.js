import api from './api.js';

export const generateQR = async (amount, orderNumber) => {
  const response = await api.post('payment/generate-qr', { amount, orderNumber });
  return response.data.data;
};

export const getQRInfo = async () => {
  const response = await api.get('payment/qr-info');
  return response.data.data;
};