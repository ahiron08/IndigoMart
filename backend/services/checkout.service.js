import crypto from 'node:crypto';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import Order from '../models/order.model.js';
import Address from '../models/address.model.js';
import Coupon from '../models/coupon.model.js';
import AppError from '../utils/app-error.js';
import { calculateTotalPrice } from './pricing.service.js';
import {
  checkServiceability,
  calculateShippingCharge,
  getDefaultDimensions,
  createShipmentRecord,
} from './shipping.service.js';
import { initiateCODPayment, initiateQRPayment } from './payment.service.js';

const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `IND-${timestamp}-${random}`;
};

const getSellerPickupInfo = (seller) => ({
  fullName: seller.pickupName || seller.name || '',
  phone: seller.pickupPhone || seller.phone || '',
  address: seller.pickupAddress || seller.shopAddress || '',
  landmark: seller.pickupLandmark || '',
  city: seller.pickupCity || seller.city || '',
  state: seller.pickupState || seller.state || '',
  pincode: seller.pickupPincode || seller.pinCode || '',
});

// ─── Coupon Validation & Application ──────────────────────────────────────────

const validateAndApplyCoupon = async (couponCode, orderAmount) => {
  if (!couponCode) return { coupon: null, discountAmount: 0 };

  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
  if (!coupon) throw new AppError('Invalid or expired coupon code.', 400);

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    throw new AppError('This coupon has expired.', 400);
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('This coupon has reached its usage limit.', 400);
  }

  if (coupon.minOrderAmount > 0 && orderAmount < coupon.minOrderAmount) {
    throw new AppError(
      `Minimum order amount of ₹${coupon.minOrderAmount} is required for this coupon.`,
      400,
    );
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (orderAmount * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else {
    discountAmount = coupon.discountValue;
  }

  // Ensure discount doesn't exceed order amount
  if (discountAmount > orderAmount) discountAmount = orderAmount;

  return { coupon, discountAmount };
};

// ─── Calculate Checkout ───────────────────────────────────────────────────────

export const calculateCheckout = async ({ productId, quantity, deliveryPincode, userId, couponCode }) => {
  const product = await Product.findById(productId)
    .populate('creator', 'name phone shopName pickupName pickupPhone pickupAddress pickupLandmark pickupCity pickupState pickupPincode city state pinCode')
    .lean();

  if (!product) throw new AppError('Product not found.', 404);
  if (product.isDeleted || product.status !== 'published') {
    throw new AppError('Product is not available.', 404);
  }

  const seller = product.creator;
  const pickupPincode = seller.pickupPincode || seller.pinCode || '785001';
  const qty = quantity || 1;

  // Check serviceability
  const serviceability = await checkServiceability(deliveryPincode, pickupPincode);

  // Get dimensions
  const dims = getDefaultDimensions(product);

  // Calculate shipping
  const shipping = await calculateShippingCharge({
    pickupPincode,
    deliveryPincode,
    weight: dims.weight,
    length: dims.length,
    width: dims.width,
    height: dims.height,
  });

  // Calculate pricing
  const sellerPrice = (product.discountPrice || product.price) * qty;
  const pricing = await calculateTotalPrice(sellerPrice, shipping.charge);

  // Apply coupon if provided
  const { coupon, discountAmount } = await validateAndApplyCoupon(couponCode, pricing.totalAmount);
  const finalAmount = pricing.totalAmount - discountAmount;

  // Calculate estimated delivery
  const estimatedDays = shipping.estimatedDays || '3-5';
  const daysMatch = estimatedDays.match(/\d+/g);
  const minDays = daysMatch ? parseInt(daysMatch[0]) : 3;
  const maxDays = daysMatch && daysMatch.length > 1 ? parseInt(daysMatch[1]) : minDays + 2;
  const now = new Date();
  const estimatedMin = new Date(now.getTime() + minDays * 24 * 60 * 60 * 1000);
  const estimatedMax = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);

  const customerPrice = (product.discountPrice || product.price) + pricing.platformMargin;
  const customerOriginalPrice = product.price + pricing.platformMargin;

  return {
    product: {
      _id: product._id,
      title: product.title,
      image: product.images?.[0]?.url || '',
      price: customerPrice,
      originalPrice: customerOriginalPrice,
    },
    seller: {
      _id: seller._id,
      name: seller.name,
      shopName: seller.shopName || '',
      pickupAddress: getSellerPickupInfo(seller),
    },
    quantity: qty,
    serviceability,
    shipping: {
      courierName: shipping.courierName,
      charge: shipping.charge,
      estimatedDays: shipping.estimatedDays,
      estimatedMin,
      estimatedMax,
      isCalculated: shipping.isCalculated,
    },
    pricing: {
      sellerPrice,
      customerSubtotal: sellerPrice + pricing.platformMargin,
      platformMargin: pricing.platformMargin,
      shippingCost: pricing.shippingCost,
      discountAmount,
      totalAmount: finalAmount,
      originalTotalAmount: pricing.totalAmount,
    },
    coupon: coupon
      ? {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount,
        }
      : null,
  };
};

// ─── Place Order ──────────────────────────────────────────────────────────────

export const placeOrder = async ({ productId, quantity, addressId, paymentMethod, userId, couponCode }) => {
  const product = await Product.findById(productId)
    .populate('creator', 'name email phone shopName pickupName pickupPhone pickupAddress pickupLandmark pickupCity pickupState pickupPincode city state pinCode')
    .lean();

  if (!product) throw new AppError('Product not found.', 404);
  if (product.isDeleted || product.status !== 'published') {
    throw new AppError('Product is not available.', 404);
  }

  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) throw new AppError('Delivery address not found.', 404);

  const seller = product.creator;
  const qty = quantity || 1;
  const pickupPincode = seller.pickupPincode || seller.pinCode || '785001';
  const dims = getDefaultDimensions(product);

  // Calculate shipping
  const shipping = await calculateShippingCharge({
    pickupPincode,
    deliveryPincode: address.pincode,
    weight: dims.weight,
    length: dims.length,
    width: dims.width,
    height: dims.height,
  });

  // Calculate pricing
  const sellerPrice = (product.discountPrice || product.price) * qty;
  const pricing = await calculateTotalPrice(sellerPrice, shipping.charge);

  // Apply coupon if provided
  const { coupon, discountAmount } = await validateAndApplyCoupon(couponCode, pricing.totalAmount);
  const finalAmount = pricing.totalAmount - discountAmount;

  // Check serviceability
  const serviceability = await checkServiceability(address.pincode, pickupPincode);

  // Create order
  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    buyer: userId,
    seller: seller._id,
    items: [
      {
        product: product._id,
        title: product.title,
        image: product.images?.[0]?.url || '',
        quantity: qty,
        sellerPrice: product.discountPrice || product.price,
        platformMargin: pricing.platformMargin,
        shippingCost: shipping.charge,
        totalPrice: finalAmount,
      },
    ],
    deliveryAddress: {
      recipientName: address.recipientName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || '',
      landmark: address.landmark || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    },
    pickupAddress: getSellerPickupInfo(seller),
    pricing: {
      subtotal: sellerPrice,
      customerSubtotal: sellerPrice + pricing.platformMargin,
      platformMargin: pricing.platformMargin,
      shippingCost: shipping.charge,
      discountAmount,
      totalAmount: finalAmount,
    },
    coupon: coupon
      ? {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        }
      : { code: null, discountType: null, discountValue: 0 },
    payment: {
      method: paymentMethod,
      status: paymentMethod === 'COD' ? 'Pending' : 'Verification Pending',
    },
    status: paymentMethod === 'COD' ? 'Confirmed' : 'Order Placed',
  });

  // Increment coupon usage count
  if (coupon) {
    await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
  }

  // Create shipment record
  const estimatedDays = shipping.estimatedDays || '3-5';
  const daysMatch = estimatedDays.match(/\d+/g);
  const minDays = daysMatch ? parseInt(daysMatch[0]) : 3;
  const maxDays = daysMatch && daysMatch.length > 1 ? parseInt(daysMatch[1]) : minDays + 2;
  const now = new Date();
  const estimatedDelivery = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);

  await createShipmentRecord({
    order: order._id,
    seller: seller._id,
    pickupPincode,
    deliveryPincode: address.pincode,
    weight: dims.weight,
    length: dims.length,
    width: dims.width,
    height: dims.height,
    shippingCharge: shipping.charge,
    estimatedDelivery,
    courierName: shipping.courierName,
    isServiceable: serviceability.isServiceable,
  });

  // Process payment
  if (paymentMethod === 'COD') {
    await initiateCODPayment({ order, buyer: userId, amount: finalAmount });
  } else if (paymentMethod === 'QR') {
    const qrResult = await initiateQRPayment({ order, buyer: userId, amount: finalAmount });
    return { order, qrDetails: qrResult.qrDetails, qrReference: qrResult.qrReference };
  } else {
    throw new AppError('Invalid payment method.', 400);
  }

  return { order };
};

export default {
  calculateCheckout,
  placeOrder,
};