import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Pickup details
    pickupPincode: { type: String, required: true },
    pickupAddress: { type: String, default: '' },
    // Delivery details
    deliveryPincode: { type: String, required: true },
    deliveryAddress: { type: String, default: '' },
    // Package details
    weight: { type: Number, required: true, min: 0 },
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    // Delhivery details
    courierName: { type: String, default: '' },
    awbNumber: { type: String, default: '' },
    trackingNumber: { type: String, default: '' },
    shippingCharge: { type: Number, default: 0 },
    estimatedDelivery: { type: Date },
    // Status
    isServiceable: { type: Boolean, default: false },
    serviceabilityMessage: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Booked', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    // Tracking history (for future sync)
    trackingHistory: [
      {
        status: { type: String },
        location: { type: String },
        timestamp: { type: Date },
        message: { type: String },
      },
    ],
    // Metadata
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

shipmentSchema.index({ order: 1 });
shipmentSchema.index({ awbNumber: 1 });

const Shipment = mongoose.model('Shipment', shipmentSchema);

export default Shipment;