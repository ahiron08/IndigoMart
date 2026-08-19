import ShippingZone from '../models/ShippingZone.model.js';
import ShippingZoneRule from '../models/ShippingZoneRule.model.js';
import ShippingRate from '../models/ShippingRate.model.js';
import Pincode from '../models/Pincode.model.js';
import { seedShippingDefaults } from '../services/shipping/seed.js';
import {
  getShippingConfig as fetchConfig,
  updateShippingConfig as applyConfig,
} from '../services/shipping/config.service.js';
import asyncHandler from '../utils/async-handler.js';

const paginate = (req) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

// ─── Config ──────────────────────────────────────────────────────────────────

export const getShippingConfig = asyncHandler(async (_request, response) => {
  const config = await fetchConfig();
  response.status(200).json({ success: true, data: { config } });
});

export const updateConfig = asyncHandler(async (request, response) => {
  const config = await applyConfig(request.body);
  response.status(200).json({ success: true, message: 'Shipping config updated.', data: { config } });
});

// ─── Zones ───────────────────────────────────────────────────────────────────

export const getZones = asyncHandler(async (request, response) => {
  const { skip, limit, page } = paginate(request);
  const [zones, total] = await Promise.all([
    ShippingZone.find({}).sort({ priority: 1 }).skip(skip).limit(limit),
    ShippingZone.countDocuments({}),
  ]);
  response.status(200).json({
    success: true,
    data: {
      zones,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

export const createZone = asyncHandler(async (request, response) => {
  const { zoneCode, name, description, priority, isActive } = request.body;
  const existing = await ShippingZone.findOne({ zoneCode });
  if (existing) {
    return response.status(409).json({ success: false, message: `Zone ${zoneCode} already exists.` });
  }
  const zone = await ShippingZone.create({ zoneCode, name, description, priority, isActive });
  response.status(201).json({ success: true, message: 'Zone created.', data: { zone } });
});

export const updateZone = asyncHandler(async (request, response) => {
  const zone = await ShippingZone.findByIdAndUpdate(request.params.id, request.body, {
    new: true,
    runValidators: true,
  });
  if (!zone) return response.status(404).json({ success: false, message: 'Zone not found.' });
  response.status(200).json({ success: true, data: { zone } });
});

export const deleteZone = asyncHandler(async (request, response) => {
  const zone = await ShippingZone.findByIdAndDelete(request.params.id);
  if (!zone) return response.status(404).json({ success: false, message: 'Zone not found.' });
  response.status(200).json({ success: true, message: 'Zone deleted.' });
});

// ─── Zone rules ──────────────────────────────────────────────────────────────

export const getZoneRules = asyncHandler(async (request, response) => {
  const rules = await ShippingZoneRule.find({}).sort({ priority: 1 });
  response.status(200).json({ success: true, data: { rules } });
});

export const createZoneRule = asyncHandler(async (request, response) => {
  const rule = await ShippingZoneRule.create(request.body);
  response.status(201).json({ success: true, message: 'Zone rule created.', data: { rule } });
});

export const updateZoneRule = asyncHandler(async (request, response) => {
  const rule = await ShippingZoneRule.findByIdAndUpdate(request.params.id, request.body, { new: true });
  if (!rule) return response.status(404).json({ success: false, message: 'Zone rule not found.' });
  response.status(200).json({ success: true, data: { rule } });
});

export const deleteZoneRule = asyncHandler(async (request, response) => {
  const rule = await ShippingZoneRule.findByIdAndDelete(request.params.id);
  if (!rule) return response.status(404).json({ success: false, message: 'Zone rule not found.' });
  response.status(200).json({ success: true, message: 'Zone rule deleted.' });
});

// ─── Rates ───────────────────────────────────────────────────────────────────

export const getRates = asyncHandler(async (request, response) => {
  const { skip, limit, page } = paginate(request);
  const filter = {};
  if (request.query.mode) filter.mode = request.query.mode.toUpperCase();
  if (request.query.zone) filter.zone = request.query.zone.toUpperCase();
  if (request.query.carrier) filter.carrier = request.query.carrier.toUpperCase();
  const [rates, total] = await Promise.all([
    ShippingRate.find(filter).sort({ zone: 1, mode: 1, weightFrom: 1 }).skip(skip).limit(limit),
    ShippingRate.countDocuments(filter),
  ]);
  response.status(200).json({
    success: true,
    data: {
      rates,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

export const createRate = asyncHandler(async (request, response) => {
  const rate = await ShippingRate.create(request.body);
  response.status(201).json({ success: true, message: 'Rate created.', data: { rate } });
});

export const updateRate = asyncHandler(async (request, response) => {
  const rate = await ShippingRate.findByIdAndUpdate(request.params.id, request.body, { new: true });
  if (!rate) return response.status(404).json({ success: false, message: 'Rate not found.' });
  response.status(200).json({ success: true, data: { rate } });
});

export const deleteRate = asyncHandler(async (request, response) => {
  const rate = await ShippingRate.findByIdAndDelete(request.params.id);
  if (!rate) return response.status(404).json({ success: false, message: 'Rate not found.' });
  response.status(200).json({ success: true, message: 'Rate deleted.' });
});

// ─── Pincodes ────────────────────────────────────────────────────────────────

export const getPincodes = asyncHandler(async (request, response) => {
  const { skip, limit, page } = paginate(request);
  const filter = {};
  if (request.query.search) {
    const regex = { $regex: request.query.search, $options: 'i' };
    filter.$or = [{ pincode: regex }, { city: regex }, { district: regex }];
  }
  if (request.query.serviceable !== undefined) filter.serviceable = request.query.serviceable === 'true';
  const [pincodes, total] = await Promise.all([
    Pincode.find(filter).sort({ pincode: 1 }).skip(skip).limit(limit),
    Pincode.countDocuments(filter),
  ]);
  response.status(200).json({
    success: true,
    data: {
      pincodes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

export const createOrUpdatePincode = asyncHandler(async (request, response) => {
  const { pincode, city, district, state, serviceable, codAvailable, zone } = request.body;
  const doc = await Pincode.findOneAndUpdate(
    { pincode },
    { city, district, state, serviceable, codAvailable, zone },
    { new: true, upsert: true, runValidators: true },
  );
  response.status(201).json({
    success: true,
    message: 'Pincode saved.',
    data: { pincode: doc },
  });
});

// ─── Seeding / stats ─────────────────────────────────────────────────────────

export const seedShipping = asyncHandler(async (_request, response) => {
  const result = await seedShippingDefaults();
  response.status(200).json({ success: true, message: 'Shipping defaults seeded.', data: result });
});

export const getShippingStats = asyncHandler(async (_request, response) => {
  const [zones, rules, rates, pincodes] = await Promise.all([
    ShippingZone.countDocuments({}),
    ShippingZoneRule.countDocuments({}),
    ShippingRate.countDocuments({}),
    Pincode.countDocuments({}),
  ]);
  response.status(200).json({
    success: true,
    data: { zones, zoneRules: rules, rates, pincodes },
  });
});

export default {
  getShippingConfig,
  updateConfig,
  getZones,
  createZone,
  updateZone,
  deleteZone,
  getZoneRules,
  createZoneRule,
  updateZoneRule,
  deleteZoneRule,
  getRates,
  createRate,
  updateRate,
  deleteRate,
  getPincodes,
  createOrUpdatePincode,
  seedShipping,
  getShippingStats,
};