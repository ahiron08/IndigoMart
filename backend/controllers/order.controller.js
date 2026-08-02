import {
  getOrderById,
  getBuyerOrders,
  getSellerOrders,
  getAllOrders,
  updateOrderStatus,
  updateShipmentTracking,
} from '../services/order.service.js';
import asyncHandler from '../utils/async-handler.js';
import AppError from '../utils/app-error.js';

export const getMyOrders = asyncHandler(async (request, response) => {
  const page = parseInt(request.query.page) || 1;
  const limit = parseInt(request.query.limit) || 20;
  const result = await getBuyerOrders(request.user.id, page, limit);
  response.status(200).json({ success: true, data: result });
});

export const getSellerOrderList = asyncHandler(async (request, response) => {
  const page = parseInt(request.query.page) || 1;
  const limit = parseInt(request.query.limit) || 20;
  const result = await getSellerOrders(request.user.id, page, limit);
  response.status(200).json({ success: true, data: result });
});

export const getOrder = asyncHandler(async (request, response) => {
  const result = await getOrderById(request.params.id, request.user.id, request.user.role);
  response.status(200).json({ success: true, data: result });
});

export const adminGetAllOrders = asyncHandler(async (request, response) => {
  const page = parseInt(request.query.page) || 1;
  const limit = parseInt(request.query.limit) || 50;
  const status = request.query.status;
  const result = await getAllOrders(page, limit, status);
  response.status(200).json({ success: true, data: result });
});

export const updateStatus = asyncHandler(async (request, response) => {
  const { status } = request.body;
  if (!status) throw new AppError('Status is required.', 400);
  const order = await updateOrderStatus(request.params.id, status, request.user.id, request.user.role);
  response.status(200).json({ success: true, message: 'Order status updated.', data: { order } });
});

export const updateTracking = asyncHandler(async (request, response) => {
  const { trackingNumber, courierName, awbNumber } = request.body;
  const order = await updateShipmentTracking(request.params.id, { trackingNumber, courierName, awbNumber });
  response.status(200).json({ success: true, message: 'Tracking updated.', data: { order } });
});

export const updateOrderPayment = asyncHandler(async (request, response) => {
  const { utrNumber } = request.body;
  const paymentScreenshotFile = request.file;

  const Order = (await import('../models/order.model.js')).default;
  const order = await Order.findOne({ _id: request.params.id, buyer: request.user.id });
  if (!order) throw new AppError('Order not found.', 404);
  if (order.payment.method !== 'QR') throw new AppError('This order does not use QR payment.', 400);

  if (!utrNumber && !paymentScreenshotFile) {
    throw new AppError('UTR number or payment screenshot is required.', 400);
  }

  const updateData = { status: 'Verification Pending' };
  if (utrNumber) updateData.utrNumber = utrNumber;

  // Upload payment screenshot if provided
  if (paymentScreenshotFile) {
    const { uploadImage } = await import('../services/image.service.js');
    const uploaded = await uploadImage(paymentScreenshotFile, 'indigomart/payment-screenshots');
    updateData.paymentScreenshot = uploaded.url;
  }

  order.payment = { ...order.payment, ...updateData };
  await order.save();

  // Also update the Payment record
  const Payment = (await import('../models/payment.model.js')).default;
  await Payment.findOneAndUpdate(
    { order: order._id },
    { $set: updateData },
  );

  response.status(200).json({
    success: true,
    message: 'Payment details submitted for verification.',
    data: { order },
  });
});
