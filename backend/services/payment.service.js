import crypto from 'node:crypto';
import { env } from '../config/env.js';
import Payment from '../models/payment.model.js';
import Order from '../models/order.model.js';
import AppError from '../utils/app-error.js';

const QR_UPI_ID = env.QR_UPI_ID || 'indigomart@upi';
const QR_PAYEE_NAME = env.QR_PAYEE_NAME || 'IndigoMart';

export const generateQRReference = () => `QR-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

export const getQRCodeDetails = () => ({
  upiId: QR_UPI_ID,
  payeeName: QR_PAYEE_NAME,
  description: 'Payment for IndigoMart order',
});

export const initiateCODPayment = async ({ order, buyer, amount }) => {
  const payment = await Payment.create({
    order: order._id,
    buyer,
    method: 'COD',
    amount,
    status: 'Pending',
  });

  order.payment.method = 'COD';
  order.payment.status = 'Pending';
  await order.save();

  return payment;
};

export const initiateQRPayment = async ({ order, buyer, amount }) => {
  const qrReference = generateQRReference();

  const payment = await Payment.create({
    order: order._id,
    buyer,
    method: 'QR',
    amount,
    status: 'Verification Pending',
    qrReference,
  });

  order.payment.method = 'QR';
  order.payment.status = 'Verification Pending';
  order.payment.qrReference = qrReference;
  await order.save();

  return { payment, qrReference, qrDetails: getQRCodeDetails() };
};

export const verifyQRPayment = async ({ paymentId, adminId, utrNumber, paymentScreenshot }) => {
  const payment = await Payment.findById(paymentId).populate('order');
  if (!payment) throw new AppError('Payment record not found.', 404);
  if (payment.method !== 'QR') throw new AppError('This payment is not a QR payment.', 400);

  if (utrNumber) payment.utrNumber = utrNumber;
  if (paymentScreenshot) payment.paymentScreenshot = paymentScreenshot;

  payment.status = 'Paid';
  payment.verifiedBy = adminId;
  payment.verifiedAt = new Date();
  payment.paidAt = new Date();
  await payment.save();

  const order = await Order.findById(payment.order);
  if (order) {
    order.payment.status = 'Paid';
    order.payment.utrNumber = utrNumber || order.payment.utrNumber;
    order.payment.paymentScreenshot = paymentScreenshot || order.payment.paymentScreenshot;
    order.payment.paidAt = new Date();
    order.status = 'Confirmed';
    await order.save();
  }

  return payment;
};

export const getPaymentByOrder = (orderId) =>
  Payment.findOne({ order: orderId }).lean();

export const getPaymentsByStatus = (status) =>
  Payment.find({ status }).populate('order').sort({ createdAt: -1 }).lean();

export default {
  generateQRReference,
  getQRCodeDetails,
  initiateCODPayment,
  initiateQRPayment,
  verifyQRPayment,
  getPaymentByOrder,
  getPaymentsByStatus,
};