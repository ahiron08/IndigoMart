import { getShippingConfig } from './config.service.js';

/**
 * Dead / volumetric / chargeable weight calculation.
 *
 * Chargeable weight = max(deadWeight, volumetricWeight), then clamped into the
 * configured weight slab (rounding rule is configurable; we do NOT hardcode a
 * single rounding rule).
 */

const roundToPrecision = (value, precision = 6) => {
  if (!Number.isFinite(Number(value))) return 0;
  const factor = 10 ** precision;
  return Number((Math.round((Number(value) + Number.EPSILON) * factor) / factor).toFixed(precision));
};

/**
 * Volumetric (dimensional) weight in kg.
 * @param {{length:number,width:number,height:number}} dimensions - cm
 * @param {number} [divisor] - cm^3 per kg (default from config).
 */
export const calculateVolumetricWeight = (dimensions, divisor) => {
  const { length = 0, width = 0, height = 0 } = dimensions || {};
  const d = Number(divisor) > 0 ? Number(divisor) : 5000;
  const volume = Math.max(0, Number(length)) * Math.max(0, Number(width)) * Math.max(0, Number(height));
  return roundToPrecision(volume / d, 6);
};

/**
 * Total dead weight of a shipment (sum of per-item weight × quantity).
 * Prefers the packaged weight when present (couriers bill on the packed box).
 */
export const totalDeadWeight = (entries) => {
  if (!Array.isArray(entries)) return 0;
  return roundToPrecision(
    entries.reduce((sum, entry) => {
      const w = Number(entry.packagedWeight ?? entry.weight) || 0;
      const qty = Number(entry.quantity) || 0;
      return sum + w * qty;
    }, 0),
    6,
  );
};

/**
 * Round a chargeable weight (kg) up to the configured slab size.
 * Slab boundary example: 0.5 kg slabs → 0.42 → 0.5, 0.73 → 1.0, 1.15 → 1.5.
 */
export const roundUpToSlab = (weight, slabSize) => {
  const slab = Number(slabSize) > 0 ? Number(slabSize) : 0.5;
  const w = Number(weight) || 0;
  if (w <= 0) return 0;
  return roundToPrecision(Math.ceil(w / slab) * slab, 6);
};

/**
 * Round chargeable weight into the configured slab using the configured rule.
 * @param {number} weight - chargeable weight (kg)
 * @param {object} [rateConfig] - config containing weightSlabSize & weightRoundingRule
 * @returns {number}
 */
export const roundChargeableWeight = (weight, rateConfig) => {
  const slabSize = Number(rateConfig?.weightSlabSize) > 0 ? Number(rateConfig.weightSlabSize) : 0.5;
  const rule = rateConfig?.weightRoundingRule || 'ceilToSlab';
  const w = Number(weight) || 0;
  if (w <= 0) return 0;
  if (rule === 'roundToSlab') {
    return roundToPrecision(Math.round(w / slabSize) * slabSize, 6);
  }
  return roundUpToSlab(w, slabSize);
};

/**
 * Convenience: compute chargeable weight `max(deadWeight, volumetricWeight)`
 * and return it rounded to the configured slab.
 */
export const calculateChargeableWeight = async (deadWeight, volumetricWeight, configOverride) => {
  const config = configOverride || (await getShippingConfig());
  const raw = Math.max(Number(deadWeight) || 0, Number(volumetricWeight) || 0);
  return {
    raw: roundToPrecision(raw, 6),
    rounded: roundChargeableWeight(raw, config),
    weightSlabSize: config.weightSlabSize,
    roundingRule: config.weightRoundingRule,
  };
};

export default {
  calculateVolumetricWeight,
  totalDeadWeight,
  roundUpToSlab,
  roundChargeableWeight,
  calculateChargeableWeight,
};