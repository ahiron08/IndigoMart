import { env } from '../config/env.js';
import Shipment from '../models/shipment.model.js';

const DEFAULT_WEIGHT = 0.5;
const DEFAULT_LENGTH = 20;
const DEFAULT_WIDTH = 15;
const DEFAULT_HEIGHT = 10;

const DELHIVERY_BASE_URL = 'https://track.delhivery.com';
const DELHIVERY_API_KEY = env.DELHIVERY_API_KEY || '';

const shippingCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const getCacheKey = (pickupPincode, deliveryPincode, weight) =>
  `${pickupPincode}-${deliveryPincode}-${weight}`;

const getFromCache = (key) => {
  const entry = shippingCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    shippingCache.delete(key);
    return null;
  }
  return entry.data;
};

const setInCache = (key, data) => {
  shippingCache.set(key, { data, timestamp: Date.now() });
};

export const checkServiceability = async (deliveryPincode, pickupPincode) => {
  const cacheKey = `svc-${pickupPincode}-${deliveryPincode}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  if (!DELHIVERY_API_KEY) {
    const result = { isServiceable: true, message: 'All India delivery available.', estimatedDays: '3-5' };
    setInCache(cacheKey, result);
    return result;
  }

  try {
    const response = await fetch(
      `${DELHIVERY_BASE_URL}/api/pin-codes/json/?filter_codes=${deliveryPincode}`,
      {
        headers: { Authorization: `Token ${DELHIVERY_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) {
      return { isServiceable: true, message: 'Serviceability check unavailable, proceeding with default.', estimatedDays: '3-5' };
    }

    const data = await response.json();
    const isServiceable = data?.delivery_codes?.some(
      (c) => c?.postal_code?.pin === deliveryPincode && c?.postal_code?.pre_paid === 'Y',
    );

    const result = {
      isServiceable: !!isServiceable,
      message: isServiceable ? 'Delivery available.' : 'Delivery not available to this pincode.',
      estimatedDays: '3-5',
    };
    setInCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Delhivery serviceability check failed:', error.message);
    return { isServiceable: true, message: 'Serviceability check unavailable, proceeding with default.', estimatedDays: '3-5' };
  }
};

export const calculateShippingCharge = async ({
  pickupPincode,
  deliveryPincode,
  weight = DEFAULT_WEIGHT,
  length = DEFAULT_LENGTH,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}) => {
  const cacheKey = getCacheKey(pickupPincode, deliveryPincode, weight);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  if (!DELHIVERY_API_KEY) {
    const baseRate = 50;
    const weightCharge = Math.max(0, (weight - 0.5)) * 30;
    const regionCharge = pickupPincode?.startsWith(deliveryPincode?.charAt(0)) ? 0 : 20;
    const totalCharge = Math.round(baseRate + weightCharge + regionCharge);

    const result = {
      charge: totalCharge,
      currency: 'INR',
      estimatedDays: '3-5',
      courierName: 'Standard Courier',
      isCalculated: true,
    };
    setInCache(cacheKey, result);
    return result;
  }

  try {
    const volumetricWeight = (length * width * height) / 5000;
    const chargeableWeight = Math.max(weight, volumetricWeight);

    const params = new URLSearchParams({
      md: 'S',
      ss: 'Delivered',
      d_pin: deliveryPincode,
      o_pin: pickupPincode,
      dg: 'N',
      pt: 'NDR',
      weight: String(Math.ceil(chargeableWeight * 1000)),
      shipment_length: String(Math.ceil(length)),
      shipment_width: String(Math.ceil(width)),
      shipment_height: String(Math.ceil(height)),
    });

    const response = await fetch(
      `${DELHIVERY_BASE_URL}/api/kinko/v1/invoice/charges/.json?${params}`,
      {
        headers: { Authorization: `Token ${DELHIVERY_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) {
      throw new Error(`Delhivery API returned ${response.status}`);
    }

    const data = await response.json();

    const result = {
      charge: Math.round(data?.total_amount?.value || 75),
      currency: 'INR',
      estimatedDays: data?.estimated_days || '3-5',
      courierName: data?.courier_name || 'Delhivery',
      isCalculated: true,
    };
    setInCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Delhivery shipping calculation failed:', error.message);
    const fallbackCharge = 75;
    const result = {
      charge: fallbackCharge,
      currency: 'INR',
      estimatedDays: '3-5',
      courierName: 'Standard Courier',
      isCalculated: false,
    };
    setInCache(cacheKey, result);
    return result;
  }
};

export const getDefaultDimensions = (product) => ({
  weight: product?.shippingDetails?.weight || DEFAULT_WEIGHT,
  length: product?.shippingDetails?.dimensions?.length || DEFAULT_LENGTH,
  width: product?.shippingDetails?.dimensions?.width || DEFAULT_WIDTH,
  height: product?.shippingDetails?.dimensions?.height || DEFAULT_HEIGHT,
});

export const createShipmentRecord = async ({
  order,
  seller,
  pickupPincode,
  deliveryPincode,
  weight,
  length,
  width,
  height,
  shippingCharge,
  estimatedDelivery,
  courierName,
  isServiceable,
}) => {
  return Shipment.create({
    order,
    seller,
    pickupPincode,
    deliveryPincode,
    weight,
    length,
    width,
    height,
    shippingCharge,
    estimatedDelivery,
    courierName,
    isServiceable,
    serviceabilityMessage: isServiceable ? 'Serviceable' : 'Not serviceable',
    status: 'Pending',
  });
};

export const getShipmentByOrder = (orderId) =>
  Shipment.findOne({ order: orderId }).lean();

export default {
  checkServiceability,
  calculateShippingCharge,
  getDefaultDimensions,
  createShipmentRecord,
  getShipmentByOrder,
};