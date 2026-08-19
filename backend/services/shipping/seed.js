import ShippingZone from '../../models/ShippingZone.model.js';
import ShippingZoneRule from '../../models/ShippingZoneRule.model.js';
import ShippingRate from '../../models/ShippingRate.model.js';
import Pincode from '../../models/Pincode.model.js';
import { seedDefaultShippingConfig } from './config.service.js';

/**
 * Idempotent shipping engine seeding. Safe to run at startup and on demand.
 *
 * Only inserts missing records — existing (operator-configured) data is left
 * untouched so admins can tune rates/zones without a seed wiping them.
 */

/** Upper bound used for the final "everything heavier" slab (kg). */
const MAX_WEIGHT_KG = 100_000;

const DEFAULT_ZONES = [
  { zoneCode: 'LOCAL', name: 'Local', description: 'Configured local shipping zone', priority: 1 },
  { zoneCode: 'REGIONAL', name: 'Regional', description: 'Configured regional shipping zone', priority: 2 },
  { zoneCode: 'METRO', name: 'Metro', description: 'Mapped metro shipping zones', priority: 3 },
  { zoneCode: 'REST_OF_INDIA', name: 'Rest of India', description: 'Default all-India shipping zone', priority: 4 },
  { zoneCode: 'SPECIAL', name: 'Special', description: 'Special-priority shipping zone', priority: 5 },
  { zoneCode: 'REMOTE', name: 'Remote', description: 'Remote-area shipping zone (surcharge eligible)', priority: 6 },
];

/**
 * Example rate cards. These are NOT Delhivery's rates — they are illustrative,
 * store-defined figures an operator is expected to replace from the database.
 * Slab shape: weightFrom inclusive, weightTo exclusive.
 */
const DEFAULT_RATES = [
  { zone: 'LOCAL', weightFrom: 0, weightTo: 0.5, baseRate: 40 },
  { zone: 'LOCAL', weightFrom: 0.5, weightTo: 1.0, baseRate: 50 },
  { zone: 'LOCAL', weightFrom: 1.0, weightTo: 1.5, baseRate: 60 },
  { zone: 'LOCAL', weightFrom: 1.5, weightTo: MAX_WEIGHT_KG, baseRate: 100 },
  { zone: 'REGIONAL', weightFrom: 0, weightTo: 0.5, baseRate: 55 },
  { zone: 'REGIONAL', weightFrom: 0.5, weightTo: 1.0, baseRate: 70 },
  { zone: 'REGIONAL', weightFrom: 1.0, weightTo: 1.5, baseRate: 85 },
  { zone: 'REGIONAL', weightFrom: 1.5, weightTo: MAX_WEIGHT_KG, baseRate: 130 },
  { zone: 'METRO', weightFrom: 0, weightTo: 0.5, baseRate: 60 },
  { zone: 'METRO', weightFrom: 0.5, weightTo: 1.0, baseRate: 75 },
  { zone: 'METRO', weightFrom: 1.0, weightTo: 1.5, baseRate: 100 },
  { zone: 'METRO', weightFrom: 1.5, weightTo: MAX_WEIGHT_KG, baseRate: 140 },
  { zone: 'REST_OF_INDIA', weightFrom: 0, weightTo: 0.5, baseRate: 80 },
  { zone: 'REST_OF_INDIA', weightFrom: 0.5, weightTo: 1.0, baseRate: 105 },
  { zone: 'REST_OF_INDIA', weightFrom: 1.0, weightTo: 1.5, baseRate: 130 },
  { zone: 'REST_OF_INDIA', weightFrom: 1.5, weightTo: MAX_WEIGHT_KG, baseRate: 180 },
  { zone: 'SPECIAL', weightFrom: 0, weightTo: 0.5, baseRate: 90 },
  { zone: 'SPECIAL', weightFrom: 0.5, weightTo: 1.0, baseRate: 115 },
  { zone: 'SPECIAL', weightFrom: 1.0, weightTo: 1.5, baseRate: 140 },
  { zone: 'SPECIAL', weightFrom: 1.5, weightTo: MAX_WEIGHT_KG, baseRate: 190 },
  { zone: 'REMOTE', weightFrom: 0, weightTo: 0.5, baseRate: 100 },
  { zone: 'REMOTE', weightFrom: 0.5, weightTo: 1.0, baseRate: 125 },
  { zone: 'REMOTE', weightFrom: 1.0, weightTo: 1.5, baseRate: 150 },
  { zone: 'REMOTE', weightFrom: 1.5, weightTo: MAX_WEIGHT_KG, baseRate: 200 },
];

const DEFAULT_ZONE_RULES = [
  { zoneCode: 'REST_OF_INDIA', fromPrefix: 1, toPrefix: 9, priority: 10, description: 'Default landing zone for all PINs (configurable).' },
];

const DEFAULT_PINCODES = [
  { pincode: '110001', city: 'New Delhi', district: 'New Delhi', state: 'Delhi', serviceable: true, codAvailable: true, zone: 'METRO' },
  { pincode: '400001', city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', serviceable: true, codAvailable: true, zone: 'METRO' },
  { pincode: '700001', city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', serviceable: true, codAvailable: true, zone: 'METRO' },
  { pincode: '788001', city: 'Silchar', district: 'Cachar', state: 'Assam', serviceable: true, codAvailable: true, zone: 'REST_OF_INDIA' },
];

export const seedZones = async () => {
  let count = 0;
  for (const zone of DEFAULT_ZONES) {
    const exists = await ShippingZone.findOne({ zoneCode: zone.zoneCode });
    if (!exists) {
      await ShippingZone.create(zone);
      count += 1;
    }
  }
  return count;
};

export const seedZoneRules = async () => {
  const existing = await ShippingZoneRule.countDocuments({});
  if (existing > 0) return 0;
  await ShippingZoneRule.insertMany(DEFAULT_ZONE_RULES);
  return DEFAULT_ZONE_RULES.length;
};

export const seedRates = async () => {
  const existing = await ShippingRate.countDocuments({ carrier: 'INTERNAL' });
  if (existing > 0) return 0;

  const rates = [];
  for (const mode of ['SURFACE', 'EXPRESS']) {
    for (const rate of DEFAULT_RATES) {
      rates.push({
        carrier: 'INTERNAL',
        mode,
        zone: rate.zone,
        weightFrom: rate.weightFrom,
        weightTo: rate.weightTo,
        baseRate: rate.baseRate,
        isActive: true,
        description: `${rate.zone} ${mode} ${rate.weightFrom}-${rate.weightTo} kg`,
      });
    }
  }
  await ShippingRate.insertMany(rates);
  return rates.length;
};

export const seedPincodes = async () => {
  let count = 0;
  for (const p of DEFAULT_PINCODES) {
    const exists = await Pincode.findOne({ pincode: p.pincode });
    if (!exists) {
      await Pincode.create(p);
      count += 1;
    }
  }
  return count;
};

/**
 * Seed all shipping defaults. Safe to call multiple times.
 */
export const seedShippingDefaults = async () => {
  await seedDefaultShippingConfig();
  const zones = await seedZones();
  const zoneRules = await seedZoneRules();
  const rates = await seedRates();
  const pincodes = await seedPincodes();

  return { seeded: { zones, zoneRules, rates, pincodes } };
};

export default seedShippingDefaults;