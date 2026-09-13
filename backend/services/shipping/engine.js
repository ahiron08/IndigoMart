import { determineZone } from './zone.service.js';
import { getBaseRate, computeAdditionalCharges, applyDeliveryProportionalCap } from './rate.service.js';
import { getShippingConfig } from './config.service.js';
import { calculateVolumetricWeight, totalDeadWeight, calculateChargeableWeight } from './weight.service.js';
import { calculatePackageDimensions } from './package.service.js';
import { checkPincodeServiceability } from './pincode.service.js';
import { DEFAULT_CURRENCY } from './constants.js';
import AppError from '../../utils/app-error.js';

/**
 * Internal estimate engine.
 *
 * Runs the deterministic chain: serviceability → weights → package → zone →
 * base rate → surcharges → tax → final amount. It is DB/config-driven and does
 * not hardcode courier commercial rates.
 *
 * The chain is kept modular (each stage calls into its own service) so the
 * orchestration can be replaced later by an external provider.
 *
 * @param {object} params
 * @param {string} params.originPincode
 * @param {string} params.destinationPincode
 * @param {Array<{weight:number,packagedWeight?:number,quantity:number,packagedDimensions?:object,dimensions?:object}>} params.items
 * @param {string} [params.paymentMethod] - PREPAID | COD
 * @param {number} [params.orderValue]
 * @param {string} [params.shippingMode] - SURFACE | EXPRESS
 * @param {string} [params.carrier] - default INTERNAL
 * @param {string} [params.provider] - provider id used for response labelling
 * @param {boolean} [params.isExternal] - true when the amount comes from a courier API
 * @returns {Promise<{
 *   success:true, provider, originPincode, destinationPincode, zone,
 *   deadWeight, volumetricWeight, chargeableWeight, packaging:object,
 *   shippingMode, baseShippingCharge, remoteSurcharge, expressSurcharge,
 *   codCharge, insuranceCharge, tax, subtotalExclTax, totalShippingCharge,
 *   estimatedDeliveryDays, currency, isEstimate, breakdown
 * }>}
 */
export const runEstimate = async ({
  originPincode,
  destinationPincode,
  items = [],
  paymentMethod = 'PREPAID',
  orderValue = 0,
  shippingMode = 'SURFACE',
  carrier = 'INTERNAL',
  provider = 'INTERNAL',
  isExternal = false,
  configOverride,
}) => {
  const config = configOverride || (await getShippingConfig());

  // 1. Serviceability (throws AppError with stable codes on failure).
  const serviceability = await checkPincodeServiceability(originPincode, destinationPincode, {
    paymentMethod,
    shippingMode,
  });
  if (!serviceability.success) {
    throw new AppError(serviceability.error, 422, [
      { field: 'destinationPincode', message: serviceability.error },
    ]);
  }

        // 2. Weights.
  const deadWeight = totalDeadWeight(items);
  const packaging = await calculatePackageDimensions(items);
  const volumetricWeight = calculateVolumetricWeight(packaging, config.volumetricDivisor);
  const chargeable = await calculateChargeableWeight(deadWeight, volumetricWeight, config);

    // 3. Zone.
  const zoneResult = await determineZone(originPincode, destinationPincode);

  // 5. Base rate.
  const rateCard = await getBaseRate({
    carrier,
    mode: shippingMode,
    zone: zoneResult.zone,
    chargeableWeight: chargeable.rounded,
  });

  // 6. Surcharges + tax.
  const charges = await computeAdditionalCharges({
    paymentMethod,
    orderValue,
    zone: zoneResult.zone,
    shippingMode,
    baseShippingCharge: rateCard.base,
    declaredValue: orderValue,
    config,
  });

  let totalShippingCharge =
    charges.subtotalExclTax + charges.tax;

  // Keep delivery proportional to the item value: a low-priced product must not
  // pay a delivery fee that exceeds (or nearly exceeds) its own price. We cap
  // the final charge at a share of the order value. For higher-value/heavier
  // orders the weight/zone-derived charge is below the cap and is kept as-is.
  totalShippingCharge = applyDeliveryProportionalCap(
    totalShippingCharge,
    orderValue,
  );

  const estimatedDays = estimateDeliveryDays(shippingMode, config);

  return {
    success: true,
    provider,
    originPincode,
    destinationPincode,
    zone: zoneResult.zone,
    deadWeight,
    volumetricWeight,
    chargeableWeight: chargeable.rounded,
    packageDimensions: packaging,
    shippingMode,
    baseShippingCharge: rateCard.base,
    remoteSurcharge: charges.remoteSurcharge,
    expressSurcharge: charges.expressSurcharge,
    codCharge: charges.codCharge,
    insuranceCharge: charges.insuranceCharge,
    tax: charges.tax,
    totalShippingCharge,
    currency: config.currency || DEFAULT_CURRENCY,
    estimatedDeliveryDays: estimatedDays,
    isEstimate: !isExternal,
    breakdown: {
      zone: zoneResult.zone,
      deadWeight,
      volumetricWeight,
      chargeableWeight: chargeable.rounded,
      roundingRule: chargeable.roundingRule,
      weightSlabSize: chargeable.weightSlabSize,
      baseRate: rateCard.base,
      cod: charges.codCharge,
      remoteSurcharge: charges.remoteSurcharge,
      expressSurcharge: charges.expressSurcharge,
      insurance: charges.insuranceCharge,
      tax: charges.tax,
      subtotalExclTax: charges.subtotalExclTax,
      total: totalShippingCharge,
    },
  };
};

const estimateDeliveryDays = (mode, config) => {
  const days = config.defaultEstimatedDays?.[(mode || 'SURFACE').toUpperCase()];
  if (Array.isArray(days) && days.length === 2) {
    return { min: days[0], max: days[1] };
  }
  return { min: 3, max: 5 };
};

export default runEstimate;