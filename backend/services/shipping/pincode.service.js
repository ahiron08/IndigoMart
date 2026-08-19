import PincodeModel from '../../models/Pincode.model.js';
import AppError from '../../utils/app-error.js';

/**
 * PIN-code validation, serviceability and COD-availability checks.
 *
 * Uses a database-backed Pincode collection, cached in memory so repeated
 * lookups do not hit Mongo (and far less an external courier API) for every
 * PIN digit a shopper types.
 */

export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

const PIN_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/** In-memory cache: pincode → metadata document (null when unknown). */
const pincodeCache = new Map();

const now = () => Date.now();

/**
 * Strict 6-digit Indian PIN validation.
 * @param {string} pincode
 * @returns {boolean}
 */
export const isValidPincode = (pincode) =>
  typeof pincode === 'string' && /^[1-9][0-9]{5}$/.test(pincode);

const PIN_PATTERN = /^[1-9][0-9]{5}$/;

/**
 * Validate and normalize a PIN, throwing a 400 AppError payload if invalid.
 * Returns the normalized PIN string.
 */
export const assertValidPincode = (pincode) => {
  const value = typeof pincode === 'string' ? pincode.trim() : '';
  if (!PIN_PATTERN.test(value)) {
    throw new AppError('INVALID_PINCODE', 400, [
      { field: 'pincode', message: 'Pincode must be a valid 6-digit Indian pincode.' },
    ]);
  }
  return value;
};

const cacheKeyOf = (pincode) => `pin:${pincode}`;

const getCached = (key) => {
  const entry = pincodeCache.get(key);
  if (!entry) return null;
  if (now() - entry.cachedAt > PIN_CACHE_TTL_MS) {
    pincodeCache.delete(key);
    return null;
  }
  return entry.value;
};

const setCached = (key, value) => {
  pincodeCache.set(key, { value, cachedAt: now() });
  if (pincodeCache.size > 5000) {
    const firstKey = pincodeCache.keys().next().value;
    pincodeCache.delete(firstKey);
  }
};

/**
 * Resolve a PIN's metadata from the Pincode collection (cached).
 * @returns {Promise<object|null>} Lean pincode doc or null.
 */
export const getPincodeMetadata = async (pincode) => {
  const key = cacheKeyOf(pincode);
  const cached = getCached(key);
  if (cached !== undefined) return cached;

  const doc = await PincodeModel.findOne({ pincode }).lean();
  // Cache negative results too so missing PINs don't re-query.
  setCached(key, doc || null);
  return doc || null;
};

/**
 * Determine whether the destination PIN is serviceable.
 * @param {string} destinationPincode - 6-digit PIN.
 * @returns {Promise<boolean>}
 */
export const isDestinationServiceable = async (destinationPincode) => {
  const meta = await getPincodeMetadata(destinationPincode);
  if (!meta) return true; // Unknown PINs default to serviceable unless configured otherwise.
  return meta.serviceable !== false;
};

/**
 * Determine whether COD is available for the destination PIN.
 * @param {string} destinationPincode
 * @returns {Promise<boolean>}
 */
export const isCodAvailable = async (destinationPincode) => {
  const meta = await getPincodeMetadata(destinationPincode);
  if (!meta) return true;
  return meta.codAvailable === true;
};

/**
 * Run the full serviceability + COD + zone resolution for a destination PIN
 * relative to an origin PIN. Returns clear, stable error codes.
 *
 * @param {string} originPincode
 * @param {string} destinationPincode
 * @param {{paymentMethod?: string, shippingMode?: string}} [options]
 * @returns {Promise<{
 *   success: boolean,
 *   isServiceable: boolean,
 *   codAvailable: boolean,
 *   zone: string|null,
 *   error?: string,
 *   metadata?: object|null
 * }>}
 */
export const checkPincodeServiceability = async (
  originPincode,
  destinationPincode,
  options = {},
  deps = {},
) => {
  assertValidPincode(destinationPincode);
  assertValidPincode(originPincode);

  const getMeta = deps.getMetadata || getPincodeMetadata;
  const meta = await getMeta(destinationPincode);

  if (meta && meta.serviceable === false) {
    return {
      success: false,
      isServiceable: false,
      codAvailable: !!meta.codAvailable,
      zone: meta.zone || null,
      error: 'DESTINATION_NOT_SERVICEABLE',
      metadata: meta,
    };
  }

  // For PINs not present in the local directory we default to available
  // (all-India) behaviour unless explicitly configured otherwise.
  const codAvailable = meta ? meta.codAvailable === true : true;

  const method = (options.paymentMethod || 'PREPAID').toUpperCase();
  if (method === 'COD' && !codAvailable) {
    return {
      success: false,
      isServiceable: true,
      codAvailable: false,
      zone: meta?.zone || null,
      error: 'COD_NOT_AVAILABLE',
      metadata: meta,
    };
  }

  return {
    success: true,
    isServiceable: true,
    codAvailable,
    zone: meta?.zone || null,
    metadata: meta,
  };
};

export default {
  isValidPincode,
  assertValidPincode,
  getPincodeMetadata,
  isDestinationServiceable,
  isCodAvailable,
  checkPincodeServiceability,
};