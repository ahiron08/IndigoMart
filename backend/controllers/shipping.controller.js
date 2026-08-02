import { checkServiceability, calculateShippingCharge, getDefaultDimensions } from '../services/shipping.service.js';
import Product from '../models/product.model.js';
import asyncHandler from '../utils/async-handler.js';

export const checkServiceabilityRoute = asyncHandler(async (request, response) => {
  const { deliveryPincode, pickupPincode } = request.query;
  const result = await checkServiceability(deliveryPincode, pickupPincode || '785001');
  response.status(200).json({ success: true, data: result });
});

export const calculateShipping = asyncHandler(async (request, response) => {
  const { productId, deliveryPincode, pickupPincode, quantity } = request.body;

  let product = null;
  if (productId) {
    product = await Product.findById(productId).populate('creator', 'pickupPincode pinCode').lean();
  }

  const pickup = pickupPincode || product?.creator?.pickupPincode || product?.creator?.pinCode || '785001';
  const dims = product ? getDefaultDimensions(product) : { weight: 0.5, length: 20, width: 15, height: 10 };

  const result = await calculateShippingCharge({
    pickupPincode: pickup,
    deliveryPincode,
    weight: dims.weight,
    length: dims.length,
    width: dims.width,
    height: dims.height,
  });

  response.status(200).json({ success: true, data: result });
});

export const getProductDimensions = asyncHandler(async (request, response) => {
  const product = await Product.findById(request.params.productId).lean();
  if (!product) {
    return response.status(404).json({ success: false, message: 'Product not found.' });
  }
  const dims = getDefaultDimensions(product);
  response.status(200).json({ success: true, data: dims });
});