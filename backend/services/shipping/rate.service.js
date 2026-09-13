import ShippingRate from '../../models/ShippingRate.model.js';
import AppError from '../../utils/app-error.js';
import { getShippingConfig } from './config.service.js';

/**
 * Rate-card lookup and surcharge/tax calculation.
 *
 * Rate cards are stored in the ShippingRate collection; operators change them
 * without touching code. Surcharges (COD, remote, express, insurance) and tax
 * come from the ShippingConfig row.
 */

const rateCache = new Map();
const RATE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const now = () => Date.now();

const rateCacheKey = (carrier, mode, zone) => `${carrier}|${mode}|${zone}`;

const getActiveRates = async (carrier = 'INTERNAL', mode = 'SURFACE', zone) => {
  const key = rateCacheKey(carrier, mode, zone);
  const cached = rateCache.get(key);
  if (cached && now() - cached.cachedAt < RATE_CACHE_TTL_MS) return cached.value;
  const rates = await ShippingRate.find({
    carrier: carrier.toUpperCase(),
    mode: mode.toUpperCase(),
    zone: zone.toUpperCase(),
    isActive: true,
  })
    .sort({ weightFrom: 1 })
    .lean();
  rateCache.set(key, { value: rates, cachedAt: now() });
  return rates;
};

/**
 * Look up the base shipping rate for a chargeable weight within a zone/mode.
 * Falls back to the highest (open-ended) slab when the weight exceeds the
 * largest configured slab.
 *
 * @param {{carrier?:string, mode:string, zone:string, chargeableWeight:number}} params
 * @returns {Promise<{rate:number, weightFrom:number, weightTo:number, matched:boolean}>}
 */
export const getBaseRate = async ({ carrier = 'INTERNAL', mode, zone, chargeableWeight }, deps = {}) => {
  const weight = Number(chargeableWeight) || 0;
  const normalizedMode = (mode || 'SURFACE').toUpperCase();
  const normalizedZone = (zone || '').toUpperCase();

  const getRates = deps.getRates || getActiveRates;
  const rates = await getRates(carrier, normalizedMode, normalizedZone);
  if (rates.length === 0) {
    throw new AppError('RATE_CARD_NOT_FOUND', 422, [
      { field: 'zone', message: `No active rate card for carrier ${carrier}, mode ${normalizedMode}, zone ${normalizedZone}.` },
    ]);
  }

  const matched = rates.find((rate) => weight >= rate.weightFrom && weight < rate.weightTo);
  if (matched) {
    return { base: matched.baseRate, weightFrom: matched.weightFrom, weightTo: matched.weightTo, matched: true };
  }

  // Fall back to the last (open-ended / highest) slab.
  const top = rates[rates.length - 1];
  return { base: top.baseRate, weightFrom: top.weightFrom, weightTo: top.weightTo, matched: false };
};

/**
 * Calculate the COD charge.
 * COD charge = max(fixedCODCharge, orderValue × codPercentage).
 */
export const calculateCodCharge = async (orderValue, configOverride) => {
  const config = configOverride || (await getShippingConfig());
  const fixed = Number(config.codFixedCharge) || 0;
  const pct = Number(config.codPercentage) || 0;
  const value = Number(orderValue) || 0;
  return Math.max(fixed, value * pct);
};

/**
 * Remote-area surcharge for REMOTE zone (config-driven flat amount).
 */
export const calculateRemoteSurcharge = async (zone, configOverride) => {
  const config = configOverride || (await getShippingConfig());
  if (String(zone).toUpperCase() === 'REMOTE') {
    return Number(config.remoteSurcharge) || 0;
  }
  return 0;
};

/**
 * Express surcharge (applied when mode is EXPRESS).
 */
export const calculateExpressSurcharge = async (mode, configOverride) => {
  const config = configOverride || (await getShippingConfig());
  if (String(mode).toUpperCase() === 'EXPRESS') {
    return Number(config.expressSurcharge) || 0;
  }
  return 0;
};

/**
 * Insurance charge (kept extensible; only applied when enabled).
 */
export const calculateInsuranceCharge = async ({ declaredValue = 0, configOverride } = {}) => {
  const config = configOverride || (await getShippingConfig());
  if (!config.insuranceEnabled) return 0;
  return Number(declaredValue) * (Number(config.insuranceRate) || 0);
};

/**
 * Tax on the pretax shipping total (GST-style, configurable rate).
 */
export const calculateTax = (subtotal, taxRate) => {
  const rate = Number(taxRate) || 0;
  const amount = subtotal * rate;
  return roundRupees(amount);
};

const roundRupees = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Share of the order value that a delivery charge may not exceed.
 * Keeps low-priced products from being charged more (or nearly more) in
 * delivery than the item's own value, while heavier/expensive orders keep
 * their weight/zone-derived charge (their cap is larger).
 */
const DELIVERY_CHARGE_RATIO = 0.55;

/**
 * Keep a computed delivery charge proportional to the order value.
 *
 * When an order value is supplied, the charge is capped at
 * `orderValue × DELIVERY_CHARGE_RATIO` so low-priced items are never charged a
 * delivery fee that exceeds ~half of the item price. For higher-value orders
 * the weight/zone-derived charge is below the cap and passes through unchanged.
 *
 * @param {number} rawCharge  The delivery amount derived from weight/zone/mode.
 * @param {number} [orderValue] The pre-tax order (item) value.
 * @returns {number} The effective delivery charge.
 */
export const applyDeliveryProportionalCap = (rawCharge, orderValue = 0) => {
  const value = Number(orderValue) || 0;
  if (value <= 0) return Number(rawCharge) || 0;
  return Math.min(Number(rawCharge) || 0, value * DELIVERY_CHARGE_RATIO);
};

/**
 * Compute all surcharges + tax for a given context.
 *
 * @param {object} params
 * @param {string} [params.paymentMethod]
 * @param {number} [params.orderValue]
 * @param {string} [params.zone]
 * @param {string} [params.shippingMode]
 * @param {number} [params.baseShippingCharge]
 * @param {number} [params.declaredValue]
 * @param {object} [params.config]
 * @returns {Promise<{
 *   codCharge:number, remoteSurcharge:number, expressSurcharge:number,
 *   insuranceCharge:number, tax:number, subtotalExclTax:number
 * }>}
 */
export const computeAdditionalCharges = async ({
  paymentMethod = 'PREPAID',
  orderValue = 0,
  zone = '',
  shippingMode = 'SURFACE',
  baseShippingCharge = 0,
  declaredValue = 0,
  config,
} = {}) => {
  const cfg = config || (await getShippingConfig());
  const isCod = String(paymentMethod).toUpperCase() === 'COD';

  const codCharge = isCod ? await calculateCodCharge(orderValue, cfg) : 0;
  const remoteSurcharge = await calculateRemoteSurcharge(zone, cfg);
  const expressSurcharge = await calculateExpressSurcharge(shippingMode, cfg);
  const insuranceCharge = await calculateInsuranceCharge({ declaredValue, configOverride: cfg });

  const subtotalExclTax =
    Number(baseShippingCharge) +
    remoteSurcharge +
    expressSurcharge +
    codCharge +
    insuranceCharge;

  const tax = calculateTax(subtotalExclTax, cfg.taxRate);

  return {
    codCharge,
    remoteSurcharge,
    expressSurcharge,
    insuranceCharge,
    tax,
    subtotalExclTax,
  };
};

export default {
  getBaseRate,
  calculateCodCharge,
  calculateRemoteSurcharge,
  calculateExpressSurcharge,
  calculateInsuranceCharge,
  calculateTax,
  computeAdditionalCharges,
  applyDeliveryProportionalCap,
};