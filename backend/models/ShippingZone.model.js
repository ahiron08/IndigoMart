import mongoose from 'mongoose';

import { SHIPPING_ZONE_CODES } from '../services/shipping/constants.js';

const shippingZoneSchema = new mongoose.Schema(
  {
    zoneCode: {
      type: String,
      enum: SHIPPING_ZONE_CODES,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
    },
    name: { type: String, trim: true, maxlength: 100, default: '' },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    priority: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

shippingZoneSchema.index({ isActive: 1, priority: 1 });

const ShippingZone = mongoose.model('ShippingZone', shippingZoneSchema);

export default ShippingZone;