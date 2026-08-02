import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    method: { type: String, enum: ['COD', 'QR'], required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Verification Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    // QR Payment fields
    qrReference: { type: String, default: '' },
    utrNumber: { type: String, default: '' },
    paymentScreenshot: { type: String, default: '' },
    // Admin verification
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: { type: Date },
    paidAt: { type: Date },
    // Gateway fields (for future integrations)
    gateway: { type: String, default: '' },
    gatewayTransactionId: { type: String, default: '' },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Metadata
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

paymentSchema.index({ buyer: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;