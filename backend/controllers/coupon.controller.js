import Coupon from '../models/coupon.model.js';
import asyncHandler from '../utils/async-handler.js';

export const createCoupon = asyncHandler(async (request, response) => {
  const { code, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, usageLimit, isActive, expiresAt } = request.body;

  const existing = await Coupon.findOne({ code: code.toUpperCase() });
  if (existing) {
    response.status(409).json({ success: false, message: 'A coupon with this code already exists.' });
    return;
  }

  const coupon = await Coupon.create({
    code,
    description,
    discountType,
    discountValue,
    minOrderAmount: minOrderAmount || 0,
    maxDiscountAmount: maxDiscountAmount || 0,
    usageLimit: usageLimit || 0,
    isActive: isActive !== undefined ? isActive : true,
    expiresAt: expiresAt || null,
    createdBy: request.user._id,
  });

  response.status(201).json({
    success: true,
    message: 'Coupon created successfully.',
    data: { coupon },
  });
});

export const getCoupons = asyncHandler(async (request, response) => {
  const page = parseInt(request.query.page, 10) || 1;
  const limit = parseInt(request.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const filter = {};

  if (request.query.isActive !== undefined) {
    filter.isActive = request.query.isActive === 'true';
  }
  if (request.query.search) {
    filter.code = { $regex: request.query.search, $options: 'i' };
  }

  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('createdBy', 'name email'),
    Coupon.countDocuments(filter),
  ]);

  response.status(200).json({
    success: true,
    data: {
      coupons,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

export const getCoupon = asyncHandler(async (request, response) => {
  const coupon = await Coupon.findById(request.params.id).populate('createdBy', 'name email');
  if (!coupon) {
    response.status(404).json({ success: false, message: 'Coupon not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    data: { coupon },
  });
});

export const updateCoupon = asyncHandler(async (request, response) => {
  const { code, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, usageLimit, isActive, expiresAt } = request.body;

  const updateData = {};
  if (code !== undefined) {
    const existing = await Coupon.findOne({ code: code.toUpperCase(), _id: { $ne: request.params.id } });
    if (existing) {
      response.status(409).json({ success: false, message: 'A coupon with this code already exists.' });
      return;
    }
    updateData.code = code;
  }
  if (description !== undefined) updateData.description = description;
  if (discountType !== undefined) updateData.discountType = discountType;
  if (discountValue !== undefined) updateData.discountValue = discountValue;
  if (minOrderAmount !== undefined) updateData.minOrderAmount = minOrderAmount;
  if (maxDiscountAmount !== undefined) updateData.maxDiscountAmount = maxDiscountAmount;
  if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (expiresAt !== undefined) updateData.expiresAt = expiresAt;

  const coupon = await Coupon.findByIdAndUpdate(request.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!coupon) {
    response.status(404).json({ success: false, message: 'Coupon not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Coupon updated successfully.',
    data: { coupon },
  });
});

export const deleteCoupon = asyncHandler(async (request, response) => {
  const coupon = await Coupon.findByIdAndDelete(request.params.id);
  if (!coupon) {
    response.status(404).json({ success: false, message: 'Coupon not found.' });
    return;
  }

  response.status(200).json({
    success: true,
    message: 'Coupon deleted successfully.',
  });
});

export const validateCoupon = asyncHandler(async (request, response) => {
  const { code, orderAmount } = request.body;

  if (!code) {
    response.status(400).json({ success: false, message: 'Coupon code is required.' });
    return;
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) {
    response.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    return;
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    response.status(400).json({ success: false, message: 'This coupon has expired.' });
    return;
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    response.status(400).json({ success: false, message: 'This coupon has reached its usage limit.' });
    return;
  }

  if (orderAmount && coupon.minOrderAmount > 0 && orderAmount < coupon.minOrderAmount) {
    response.status(400).json({
      success: false,
      message: `Minimum order amount of ₹${coupon.minOrderAmount} is required for this coupon.`,
    });
    return;
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

  response.status(200).json({
    success: true,
    data: {
      coupon,
      discountAmount,
      finalAmount: orderAmount ? orderAmount - discountAmount : undefined,
    },
  });
});