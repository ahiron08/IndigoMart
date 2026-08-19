import mongoose from 'mongoose';

import { SHIPPING_ZONE_CODES } from '../services/shipping/constants.js';

const zipShippingZoneCodes = SHIPPING_ZONE_CODES;

const pincodeSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^[1-9][0-9]{5}$/,
      trim: true,
    },
    city: { type: String, trim: true, maxlength: 100, default: '' },
    district: { type: String, trim: true, maxlength: 100, default: '' },
    state: { type: String, trim: true, maxlength: 100, default: '' },
    serviceable: { type: Boolean, default: true },
    codAvailable: { type: Boolean, default: false },
    zone: {
      type: String,
      enum: [...zipShippingZoneCodes, ''],
      default: '',
    },
  },
  { timestamps: true },
);

const ShipmentPincode = mongoose.model('ShippingPincode', pincodeSchema);

export default ShipmentPincode;