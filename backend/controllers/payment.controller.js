import { getQRCodeDetails, verifyQRPayment, getPaymentsByStatus } from '../services/payment.service.js';
import { generateUpiQrCode } from '../services/qr.service.js';
import { env } from '../config/env.js';
import Payment from '../models/payment.model.js';
import asyncHandler from '../utils/async-handler.js';
import AppError from '../utils/app-error.js';

export const getQRInfo = asyncHandler(async (_request, response) => {
  const qrDetails = getQRCodeDetails();
  response.status(200).json({ success: true, data: qrDetails });
});

export const generatePaymentQR = asyncHandler(async (request, response) => {
  const { amount, orderNumber } = request.body;
  if (!amount || amount <= 0) throw new AppError('Valid amount is required.', 400);

  const upiId = env.QR_UPI_ID || 'indigomart@upi';
  const payeeName = env.QR_PAYEE_NAME || 'IndigoMart';

  const qr = await generateUpiQrCode({
    upiId,
    payeeName,
    amount,
    orderNumber: orderNumber || '',
    note: `IndigoMart Order ${orderNumber || ''}`,
    width: 350,
  });

  response.status(200).json({ success: true, data: qr });
});

export const adminVerifyPayment = asyncHandler(async (request, response) => {
  const { paymentId, utrNumber, paymentScreenshot } = request.body;
  if (!paymentId) throw new AppError('Payment ID is required.', 400);
  const payment = await verifyQRPayment({
    paymentId,
    adminId: request.user.id,
    utrNumber: utrNumber || '',
    paymentScreenshot: paymentScreenshot || '',
  });
  response.status(200).json({ success: true, message: 'Payment verified.', data: { payment } });
});

export const adminGetPendingPayments = asyncHandler(async (request, response) => {
  const payments = await getPaymentsByStatus('Verification Pending');
  response.status(200).json({ success: true, data: { payments } });
});

export const adminGetAllPayments = asyncHandler(async (request, response) => {
  const status = request.query.status;
  const filter = status ? { status } : {};
  const payments = await Payment.find(filter)
    .populate('buyer', 'name email')
    .populate('order', 'orderNumber pricing totalAmount')
    .sort({ createdAt: -1 })
    .lean();
  response.status(200).json({ success: true, data: { payments } });
});