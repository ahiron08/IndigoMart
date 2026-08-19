import mongoose from 'mongoose';

import { SHIPPING_MODES } from '../services/shipping/constants.js';

const shippingRateSchema = new mongoose.Schema(
  {
    carrier: { type: String, trim: true, uppercase: true, default: 'INTERNAL', index: true },
    mode: { type: String, enum: SHIPPING_MODES, required: true, index: true },
    zone: { type: String, required: true, uppercase: true, index: true },
    // Weight slab expressed in kilograms; a single rate covers [weightFrom, weightTo).
    weightFrom: { type: Number, required: true, min: 0 },
    weightTo: { type: Number, required: true, min: 0 },
    baseRate: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    description: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true },
);

shippingRateSchema.index({ carrier: 1, mode: 1, zone: 1, weightFrom: 1, isActive: 1 });

const ShippingRate = mongoose.model('ShippingRate', shippingRateSchema);

export default ShippingRate;