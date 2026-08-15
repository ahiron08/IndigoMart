import crypto from 'node:crypto';
import Refund from '../models/refund.model.js';
import Payment from '../models/payment.model.js';
import AppError from '../utils/app-error.js';

const generateRefundNumber = () => `RF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

/**
 * Create a refund request for a QR-paid cancelled order.
 * Only called for paid QR orders. Returns the created refund document
 * or null when the order is not eligible for a QR refund.
 */
export const createRefundRequest = async ({ order, cancelledBy = 'customer', reason = '', comments = '' }) => {
  if (!order) return null;
  if (order.payment?.method !== 'QR') return null;
  // Only create a refund request if the payment was actually received.
  const paid = order.payment?.status === 'Paid' || order.payment?.status === 'Verification Pending';
  if (!paid) return null;

  // Avoid duplicate refund requests for the same order.
  const existing = await Refund.findOne({ order: order._id });
  if (existing) return existing;

  const refund = await Refund.create({
    refundNumber: generateRefundNumber(),
    order: order._id,
    orderNumber: order.orderNumber,
    buyer: order.buyer,
    seller: order.seller,
    amount: order.pricing?.totalAmount || 0,
    paymentMethod: order.payment.method,
    cancellationReason: reason,
    cancellationComments: comments,
    cancelledBy,
    cancelledAt: order.cancellation?.cancelledAt || new Date(),
    status: 'pending',
  });

  // Reflect refund state on the order's embedded payment.
  order.payment.refund = {
    status: 'pending',
    processedBy: null,
    processedAt: null,
  };
  await order.save();

  return refund;
};

/**
 * List refund requests for the admin dashboard (global access).
 */
export const getRefundRequests = async ({ page = 1, limit = 20, status } = {}) => {
  const skip = (page - 1) * limit;
  const filter = {};
  if (status) filter.status = status;

  const [refunds, total] = await Promise.all([
    Refund.find(filter)
      .populate('buyer', 'name email phone')
      .populate('seller', 'name shopName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Refund.countDocuments(filter),
  ]);

  return { refunds, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const getRefundRequestById = async (refundId) => {
  const refund = await Refund.findById(refundId)
    .populate('buyer', 'name email phone')
    .populate('seller', 'name shopName email')
    .populate('order')
    .lean();
  if (!refund) throw new AppError('Refund request not found.', 404);
  return refund;
};

/**
 * Admin processes a refund request: pending/processing -> refunded or rejected.
 */
export const processRefund = async ({ refundId, adminId, action, rejectionReason = '' }) => {
  const refund = await Refund.findById(refundId).populate('order');
  if (!refund) throw new AppError('Refund request not found.', 404);

  if (refund.status === 'refunded') {
    throw new AppError('This refund has already been completed.', 400);
  }
  if (refund.status === 'rejected') {
    throw new AppError('This refund has already been rejected.', 400);
  }

  if (action === 'reject') {
    refund.status = 'rejected';
    refund.rejectionReason = rejectionReason || '';
    refund.processedBy = adminId;
    refund.processedAt = new Date();
  } else if (action === 'refund' || action === 'process') {
    // Move through processing -> refunded. Directly to refunded from pending is allowed.
    refund.status = action === 'process' && refund.status === 'pending' ? 'processing' : 'refunded';
    refund.processedBy = adminId;
    refund.processedAt = new Date();
  } else {
    throw new AppError('Invalid refund action.', 400);
  }

  await refund.save();

  // Update the order's embedded payment + Payment record.
  const order = refund.order;
  if (order) {
    if (refund.status === 'refunded') {
      order.payment.status = 'Refunded';
    }
    order.payment.refund = {
      status: refund.status,
      processedBy: adminId,
      processedAt: refund.processedAt,
    };
    await order.save();

    // Keep the standalone Payment record in sync.
    await Payment.findOneAndUpdate(
      { order: order._id },
      { $set: { status: order.payment.status } },
    );
  }

  return refund;
};

export default {
  createRefundRequest,
  getRefundRequests,
  getRefundRequestById,
  processRefund,
};