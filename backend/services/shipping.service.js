import { resolveProvider } from './shipping/providers/index.js';
import { runEstimate } from './shipping/engine.js';
import { checkPincodeServiceability } from './shipping/pincode.service.js';
import Shipment from '../models/shipment.model.js';

/**
 * Public shipping facade — the single entry point used by the router and the
 * checkout service. It preserves the previous function signatures while
 * delegating the actual math to the modular engine.
 */

// ─── Product dimension extraction (backwards compatible) ─────────────────────

export const getDefaultDimensions = (product) => {
  const sd = product?.shippingDetails || {};
  const dims = sd.dimensions || {};
  return {
    weight: sd.packagedWeight ?? sd.weight ?? 0.5,
    length: dims.length || 20,
    width: dims.width || 15,
    height: dims.height || 10,
  };
};

/**
 * Build the resolved item list for the engine from a set of products.
 * Prefers packaged weight/dimensions over raw product shipping details.
 */
const resolveItems = (lineItems) =>
  (lineItems || []).map(({ product, quantity }) => {
    const sd = product?.shippingDetails || {};
    return {
      weight: sd.weight || sd.packagedWeight || 0,
      packagedWeight: sd.packagedWeight,
      dimensions: sd.dimensions || {},
      packagedDimensions: sd.packagedDimensions,
      quantity: Math.max(1, Number(quantity) || 1),
    };
  });

// ─── Serviceability (backwards compatible) ───────────────────────────────────

export const checkServiceability = async (deliveryPincode, pickupPincode) => {
  if (!deliveryPincode || !/^[1-9][0-9]{5}$/.test(String(deliveryPincode).trim())) {
    return {
      isServiceable: false,
      message: 'Invalid delivery pincode.',
      estimatedDays: '—',
    };
  }

  const origin = (pickupPincode || '785001').trim();
  const result = await checkPincodeServiceability(origin, deliveryPincode);

  return {
    isServiceable: result.success,
    message: result.success
      ? 'Delivery available.'
      : result.error === 'DESTINATION_NOT_SERVICEABLE'
        ? 'Delivery not available to this pincode.'
        : 'Delivery details unavailable for this pincode.',
    estimatedDays: '3-5',
    codAvailable: result.codAvailable,
  };
};

// ─── Legacy single-product charge (used by checkout) ─────────────────────────

export const calculateShippingCharge = async ({
  pickupPincode,
  deliveryPincode,
  weight,
  length,
  width,
  height,
}) => {
  const items = [
    {
      weight: Number(weight) || 0.5,
      packagedWeight: Number(weight) || undefined,
      dimensions: { length, width, height },
      packagedDimensions: { length, width, height },
      quantity: 1,
    },
  ];

  const estimate = await runEstimate({
    originPincode: pickupPincode,
    destinationPincode: deliveryPincode,
    items,
    paymentMethod: 'PREPAID',
    orderValue: 0,
    shippingMode: 'SURFACE',
    carrier: 'INTERNAL',
    provider: 'INTERNAL',
    isExternal: false,
  });

  const { min, max } = estimate.estimatedDeliveryDays;
  return {
    charge: estimate.totalShippingCharge,
    currency: estimate.currency,
    estimatedDays: `${min}-${max}`,
    courierName: 'Standard Courier',
    isCalculated: true,
    breakdown: estimate.breakdown,
  };
};

// ─── Full multi-item estimate (new primary API) ──────────────────────────────

/**
 * Estimate shipping charges for a multi-item shipment using the configured
 * provider (INTERNAL by default). Product shipping data must be resolved
 * server-side before calling this — nothing weight/price/zone related is ever
 * trusted from the client.
 *
 * @param {object} params
 * @param {string} params.originPincode
 * @param {string} params.destinationPincode
 * @param {Array<{product:object, quantity:number}>} params.items
 * @param {string} [params.paymentMethod] - PREPAID | COD
 * @param {number} [params.orderValue]
 * @param {string} [params.shippingMode] - SURFACE | EXPRESS
 * @param {string} [params.providerName] - optional provider override
 * @returns {Promise<object>} Estimate payload (see engine.runEstimate).
 */
export const estimateShipping = async (params = {}) => {
  const provider = resolveProvider(params.providerName);
  const resolvedItems = resolveItems(params.items || []);
  return provider.calculateRate({
    originPincode: params.originPincode,
    destinationPincode: params.destinationPincode,
    items: resolvedItems,
    paymentMethod: params.paymentMethod,
    orderValue: params.orderValue,
    shippingMode: params.shippingMode,
    isExternal: provider.name !== 'INTERNAL',
  });
};

// ─── Shipment records (backwards compatible) ─────────────────────────────────

export const createShipmentRecord = async (fields) => {
  return Shipment.create({
    order: fields.order,
    seller: fields.seller,
    pickupPincode: fields.pickupPincode,
    deliveryPincode: fields.deliveryPincode,
    weight: fields.weight,
    length: fields.length,
    width: fields.width,
    height: fields.height,
    shippingCharge: fields.shippingCharge,
    estimatedDelivery: fields.estimatedDelivery,
    courierName: fields.courierName,
    isServiceable: fields.isServiceable,
    serviceabilityMessage: fields.isServiceable ? 'Serviceable' : 'Not serviceable',
    status: 'Pending',
  });
};

export const getShipmentByOrder = (orderId) => Shipment.findOne({ order: orderId }).lean();

export default {
  getDefaultDimensions,
  checkServiceability,
  calculateShippingCharge,
  estimateShipping,
  createShipmentRecord,
  getShipmentByOrder,
};