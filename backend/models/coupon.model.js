import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 50,
      index: true,
    },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, min: 0, default: 0 },
    maxDiscountAmount: { type: Number, min: 0, default: 0 },
    usageLimit: { type: Number, min: 0, default: 0 },
    usedCount: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

couponSchema.index({ code: 1, isActive: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;