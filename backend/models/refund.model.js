import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema(
  {
    // Unique human-readable refund request number
    refundNumber: { type: String, required: true, unique: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    orderNumber: { type: String, required: true, index: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    // Payment context at the time of cancellation
    paymentMethod: { type: String, enum: ['COD', 'QR'], required: true },
    // Cancellation context (snapshot for admin display)
    cancellationReason: { type: String, trim: true, default: '' },
    cancellationComments: { type: String, trim: true, default: '' },
    cancelledBy: { type: String, enum: ['customer', 'admin', 'seller'], default: 'customer' },
    cancelledAt: { type: Date },
    // Refund lifecycle
    status: {
      type: String,
      enum: ['pending', 'processing', 'refunded', 'rejected'],
      default: 'pending',
      index: true,
    },
    // Processing metadata
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date },
    rejectionReason: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

refundSchema.index({ status: 1, createdAt: -1 });
refundSchema.index({ order: 1 });

const Refund = mongoose.model('Refund', refundSchema);

export default Refund;