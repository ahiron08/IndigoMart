/**
 * Shared constants for the shipping engine.
 *
 * These are the *default* zone labels the engine understands. They are
 * intentionally kept in one place so they can be referenced by models,
 * validators and the zone engine. Zone *definitions* and the PIN → zone
 * mapping remain configuration-driven (see ShippingZone / custom rules).
 */

export const SHIPPING_ZONE_CODES = Object.freeze([
  'LOCAL',
  'REGIONAL',
  'METRO',
  'REST_OF_INDIA',
  'SPECIAL',
  'REMOTE',
]);

/** Shipping modes understood by the internal rate card. */
export const SHIPPING_MODES = Object.freeze(['SURFACE', 'EXPRESS']);

/** Payment methods supported by the shipping calculator. */
export const PAYMENT_METHODS = Object.freeze(['PREPAID', 'COD']);

export const DEFAULT_CURRENCY = 'INR';

/** Default fallback values used when no database config exists yet. */
export const DEFAULT_SHIPPING_CONFIG = Object.freeze({
  volumetricDivisor: 5000,
  weightRoundingRule: 'ceilToSlab',
  weightSlabSize: 0.5,
  codFixedCharge: 30,
  codPercentage: 0.02,
  remoteSurcharge: 0,
  expressSurcharge: 0,
  taxRate: 0.18,
  insuranceEnabled: false,
  insuranceRate: 0,
  packagingStrategy: 'simple-additive',
  packagingAllowance: 2,
  defaultEstimatedDays: { SURFACE: [3, 5], EXPRESS: [1, 3] },
  defaultZone: 'REST_OF_INDIA',
});

export default Object.freeze({
  SHIPPING_ZONE_CODES,
  SHIPPING_MODES,
  PAYMENT_METHODS,
  DEFAULT_CURRENCY,
  DEFAULT_SHIPPING_CONFIG,
});