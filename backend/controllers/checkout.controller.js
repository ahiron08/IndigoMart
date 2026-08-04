import { calculateCheckout, placeOrder } from '../services/checkout.service.js';
import asyncHandler from '../utils/async-handler.js';

export const previewCheckout = asyncHandler(async (request, response) => {
  const { productId, quantity, deliveryPincode, couponCode } = request.body;
  const result = await calculateCheckout({
    productId,
    quantity: quantity || 1,
    deliveryPincode,
    userId: request.user.id,
    couponCode: couponCode || null,
  });
  response.status(200).json({ success: true, data: result });
});

export const createOrder = asyncHandler(async (request, response) => {
  const { productId, quantity, addressId, paymentMethod, couponCode, paymentReference, utrNumber } = request.body;
  const result = await placeOrder({
    productId,
    quantity: quantity || 1,
    addressId,
    paymentMethod,
    userId: request.user.id,
    couponCode: couponCode || null,
    paymentReference: paymentReference || utrNumber || null,
  });
  response.status(201).json({
    success: true,
    message: 'Order placed successfully.',
    data: result,
  });
});
