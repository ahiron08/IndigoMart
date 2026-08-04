import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    sellerPrice: { type: Number, required: true, min: 0 },
    platformMargin: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    // Delivery address snapshot
    deliveryAddress: {
      recipientName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String, default: '' },
      landmark: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    // Pickup address snapshot (from seller)
    pickupAddress: {
      fullName: { type: String, default: '' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      landmark: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    pricing: {
      subtotal: { type: Number, required: true, min: 0 },
      customerSubtotal: { type: Number, default: 0, min: 0 },
      platformMargin: { type: Number, default: 0 },
      shippingCost: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0, min: 0 },
      totalAmount: { type: Number, required: true, min: 0 },
    },
    coupon: {
      code: { type: String, default: null, trim: true },
      discountType: { type: String, enum: ['percentage', 'fixed'], default: null },
      discountValue: { type: Number, default: 0 },
    },
    payment: {
      method: { type: String, enum: ['COD', 'QR'], required: true },
      status: {
        type: String,
        enum: ['Pending', 'Verification Pending', 'Paid', 'Failed', 'Refunded'],
        default: 'Pending',
      },
      qrReference: { type: String, default: '' },
      utrNumber: { type: String, default: '' },
      paymentScreenshot: { type: String, default: '' },
      paidAt: { type: Date },
    },
    shipping: {
      courierName: { type: String, default: '' },
      trackingNumber: { type: String, default: '' },
      estimatedDelivery: { type: Date },
      shippedAt: { type: Date },
      deliveredAt: { type: Date },
      awbNumber: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: [
        'Order Placed',
        'Confirmed',
        'Packed',
        'Picked Up',
        'In Transit',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
      ],
      default: 'Order Placed',
    },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ 'shipping.trackingNumber': 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;