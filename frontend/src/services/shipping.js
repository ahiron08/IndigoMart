import api from './api.js';

/**
 * Frontend shipping API helpers.
 *
 * The frontend only sends user-selectable options (destination PIN, items,
 * payment method, shipping mode). The backend fetches all product weight / price /
 * dimensions and computes the charge itself — nothing shipping-related is ever
 * trusted from the client.
 */

/**
 * Check whether a destination PIN is serviceable.
 * @param {string} deliveryPincode
 * @param {string} [pickupPincode]
 */
export const checkShippingServiceability = async (deliveryPincode, pickupPincode) => {
  const params = { deliveryPincode };
  if (pickupPincode) params.pickupPincode = pickupPincode;
  const response = await api.get('/shipping/serviceability', { params });
  return response.data.data;
};

/**
 * Estimate shipping for one or more order lines.
 *
 * @param {object} payload
 * @param {string} payload.destinationPincode
 * @param {Array<{productId:string, quantity:number}>} payload.items
 * @param {'PREPAID'|'COD'} [payload.paymentMethod]
 * @param {'SURFACE'|'EXPRESS'} [payload.shippingMode]
 * @param {number} [payload.orderValue]
 * @returns {Promise<{
 *   shipping: {charge:number, currency:string, estimatedDeliveryDays:{min,max}, provider:string, isEstimate:boolean},
 *   breakdown: object,
 *   zone: string
 * }>}
 */
export const calculateShipping = async (payload) => {
  const response = await api.post('/shipping/calculate', payload);
  return response.data;
};

export default {
  checkShippingServiceability,
  calculateShipping,
};