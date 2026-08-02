import Address from '../models/address.model.js';
import AppError from '../utils/app-error.js';
import asyncHandler from '../utils/async-handler.js';

export const createAddress = asyncHandler(async (request, response) => {
  const { label, recipientName, phone, line1, line2, landmark, city, state, pincode, isDefault } = request.body;

  if (isDefault) {
    await Address.updateMany({ user: request.user.id }, { $set: { isDefault: false } });
  }

  const address = await Address.create({
    user: request.user.id,
    label: label || 'Home',
    recipientName,
    phone,
    line1,
    line2: line2 || '',
    landmark: landmark || '',
    city,
    state,
    pincode,
    isDefault: isDefault || false,
  });

  response.status(201).json({ success: true, data: { address } });
});

export const getMyAddresses = asyncHandler(async (request, response) => {
  const addresses = await Address.find({ user: request.user.id }).sort({ isDefault: -1, createdAt: -1 }).lean();
  response.status(200).json({ success: true, data: { addresses } });
});

export const getAddressById = asyncHandler(async (request, response) => {
  const address = await Address.findOne({ _id: request.params.id, user: request.user.id }).lean();
  if (!address) throw new AppError('Address not found.', 404);
  response.status(200).json({ success: true, data: { address } });
});

export const updateAddress = asyncHandler(async (request, response) => {
  const { label, recipientName, phone, line1, line2, landmark, city, state, pincode, isDefault } = request.body;

  const address = await Address.findOne({ _id: request.params.id, user: request.user.id });
  if (!address) throw new AppError('Address not found.', 404);

  if (isDefault) {
    await Address.updateMany({ user: request.user.id, _id: { $ne: address._id } }, { $set: { isDefault: false } });
  }

  if (label !== undefined) address.label = label;
  if (recipientName !== undefined) address.recipientName = recipientName;
  if (phone !== undefined) address.phone = phone;
  if (line1 !== undefined) address.line1 = line1;
  if (line2 !== undefined) address.line2 = line2;
  if (landmark !== undefined) address.landmark = landmark;
  if (city !== undefined) address.city = city;
  if (state !== undefined) address.state = state;
  if (pincode !== undefined) address.pincode = pincode;
  if (isDefault !== undefined) address.isDefault = isDefault;

  await address.save();
  response.status(200).json({ success: true, data: { address } });
});

export const deleteAddress = asyncHandler(async (request, response) => {
  const address = await Address.findOneAndDelete({ _id: request.params.id, user: request.user.id });
  if (!address) throw new AppError('Address not found.', 404);
  response.status(200).json({ success: true, message: 'Address deleted.' });
});

export const setDefaultAddress = asyncHandler(async (request, response) => {
  const address = await Address.findOne({ _id: request.params.id, user: request.user.id });
  if (!address) throw new AppError('Address not found.', 404);

  await Address.updateMany({ user: request.user.id }, { $set: { isDefault: false } });
  address.isDefault = true;
  await address.save();

  response.status(200).json({ success: true, data: { address } });
});