import mongoose from 'mongoose';

/**
 * Application-level shipping configuration.
 *
 * Stored in the database so that rates / fees / rules can be changed without
 * modifying application code. A single active document is used; update it in
 * place (see services/shipping/config.service.js).
 */
const shippingConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    // Volumetric weight divisor (cm^3 per kg).
    volumetricDivisor: { type: Number, min: 1, default: 5000 },
    // Weight rounding rule: 'ceilToSlab' | 'roundToSlab'.
    weightRoundingRule: {
      type: String,
      enum: ['ceilToSlab', 'roundToSlab'],
      default: 'ceilToSlab',
    },
    // Round to the nearest multiple of this (kg).
    weightSlabSize: { type: Number, min: 0.01, default: 0.5 },
    // COD fees.
    codFixedCharge: { type: Number, min: 0, default: 30 },
    codPercentage: { type: Number, min: 0, max: 1, default: 0.02 },
    remoteSurcharge: { type: Number, min: 0, default: 0 },
    expressSurcharge: { type: Number, min: 0, default: 0 },
    taxRate: { type: Number, min: 0, max: 1, default: 0.18 },
    // Insurance (kept extensible; disabled by default).
    insuranceEnabled: { type: Boolean, default: false },
    insuranceRate: { type: Number, min: 0, max: 1, default: 0 },
    // Packaging strategy hook: 'simple-additive' for v1.
    packagingStrategy: {
      type: String,
      enum: ['simple-additive'],
      default: 'simple-additive',
    },
    // Extra centimeters added to each package axis beyond raw product dims.
    packagingAllowance: { type: Number, min: 0, default: 2 },
    currency: { type: String, default: 'INR' },
  },
  { timestamps: true },
);

const ShippingConfig = mongoose.model('ShippingConfig', shippingConfigSchema);

export default ShippingConfig;