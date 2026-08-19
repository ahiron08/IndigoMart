import Product from '../models/product.model.js';
import AppError from '../utils/app-error.js';
import asyncHandler from '../utils/async-handler.js';
import { env } from '../config/env.js';
import {
  checkServiceability,
  getDefaultDimensions,
  estimateShipping,
} from '../services/shipping.service.js';

const DEFAULT_ORIGIN_PIN = '785001';

/**
 * Resolve the origin PIN from the warehouse/store configuration. The frontend
 * must never be trusted with the origin — the server decides it.
 */
const resolveOriginPincode = (products) => {
  if (env.SHIPPING_ORIGIN_PINCODE) return env.SHIPPING_ORIGIN_PINCODE;
  const first = products?.[0];
  const seller = first?.creator || {};
  return (
    first?.pickupPincode ||
    seller.pickupPincode ||
    seller.pinCode ||
    DEFAULT_ORIGIN_PIN
  );
};

/**
 * POST /api/shipping/calculate
 * Body: { destinationPincode, items:[{productId,quantity}], paymentMethod, shippingMode, orderValue }
 */
export const calculateShipping = asyncHandler(async (request, response) => {
  const { destinationPincode, items, paymentMethod, shippingMode, orderValue } = request.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('At least one item is required.', 422, [
      { field: 'items', message: 'Provide at least one order line.' },
    ]);
  }

  // Load products server-side. Never trust weight/price/dimensions from the client.
  const productIds = items.map((item) => item.productId);
  const productsMap = await Product.find({ _id: { $in: productIds }, isDeleted: false })
    .select('shippingDetails pickupPincode creator')
    .populate('creator', 'pickupPincode pinCode')
    .lean();

  const lineItems = items.map((item) => {
    const product = productsMap.find((p) => p._id === item.productId);
    if (!product) {
      throw new AppError('PRODUCT_NOT_FOUND', 404, [
        { field: 'items', message: `Product ${item.productId} was not found.` },
      ]);
    }
    return { product, quantity: item.quantity };
  });

  const originPincode = resolveOriginPincode(productsMap);

  const estimate = await estimateShipping({
    originPincode,
    destinationPincode,
    items: lineItems,
    paymentMethod,
    shippingMode,
    orderValue,
  });

  const { min, max } = estimate.estimatedDeliveryDays;

  response.status(200).json({
    success: true,
    shipping: {
      charge: estimate.totalShippingCharge,
      currency: estimate.currency,
      estimatedDeliveryDays: { min, max },
      estimatedDaysLabel: min === max ? `${min} day` : `${min}-${max} days`,
      provider: estimate.provider,
      isEstimate: estimate.isEstimate,
    },
    breakdown: estimate.breakdown,
    zone: estimate.zone,
    package: estimate.packageDimensions,
  });
});

/**
 * GET /api/shipping/serviceability
 * Query: { deliveryPincode, pickupPincode? }
 */
export const checkServiceabilityRoute = asyncHandler(async (request, response) => {
  const { deliveryPincode, pickupPincode } = request.query;
  const result = await checkServiceability(deliveryPincode, pickupPincode || '785001');
  response.status(200).json({ success: true, data: result });
});

export const getProductDimensions = asyncHandler(async (request, response) => {
  const product = await Product.findById(request.params.productId).lean();
  if (!product) {
    return response.status(404).json({ success: false, message: 'Product not found.' });
  }
  const dims = getDefaultDimensions(product);
  response.status(200).json({ success: true, data: dims });
});

export default {
  calculateShipping,
  checkServiceabilityRoute,
  getProductDimensions,
};