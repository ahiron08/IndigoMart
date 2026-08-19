import mongoose from 'mongoose';

/**
 * Configurable PIN → zone mapping rule.
 *
 * A rule matches when a PIN's leading digits (`prefix`) fall within a given
 * numeric range (`from`..`to`). Rules are evaluated in priority order and the
 * first match wins, letting operators define zone boundaries without code.
 */
const shippingZoneRuleSchema = new mongoose.Schema(
  {
    zoneCode: { type: String, required: true, uppercase: true, index: true },
    // Inclusive numeric range of the pincode's first digit (1-9).
    fromPrefix: { type: Number, required: true, min: 1, max: 9 },
    toPrefix: { type: Number, required: true, min: 1, max: 9 },
    priority: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true },
    description: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true },
);

shippingZoneRuleSchema.index({ priority: 1, fromPrefix: 1, toPrefix: 1, isActive: 1 });

const ShippingZoneRule = mongoose.model('ShippingZoneRule', shippingZoneRuleSchema);

export default ShippingZoneRule;