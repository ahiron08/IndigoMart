import mongoose from 'mongoose';

const pricingSlabSchema = new mongoose.Schema(
  {
    minPrice: { type: Number, required: true, min: 0 },
    maxPrice: { type: Number, required: true, min: 0 },
    marginAmount: { type: Number, required: true, min: 0 },
    marginType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    isActive: { type: Boolean, default: true },
    description: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true },
);

pricingSlabSchema.index({ minPrice: 1, maxPrice: 1, isActive: 1 });

const PricingSlab = mongoose.model('PricingSlab', pricingSlabSchema);

export default PricingSlab;