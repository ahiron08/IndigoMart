import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, trim: true, maxlength: 40, default: 'Home' },
    recipientName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200, default: '' },
    landmark: { type: String, trim: true, maxlength: 200, default: '' },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    pincode: { type: String, required: true, trim: true, maxlength: 20 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

addressSchema.index({ user: 1, isDefault: 1 });

const Address = mongoose.model('Address', addressSchema);

export default Address;