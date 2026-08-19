import ShippingConfig from '../../models/ShippingConfig.model.js';

import { DEFAULT_SHIPPING_CONFIG } from './constants.js';

/**
 * Database-backed shipping configuration.
 *
 * Falls back to sensible defaults defined in constants.js when no document
 * exists yet. The config is deliberately a single active row so operators can
 * change rates/fees without touching code.
 */

const DEFAULT_KEY = 'default';

/**
 * Return the active config row (creating it on first access if needed).
 * @returns {Promise<object>} A plain config object merged over defaults.
 */
export const getShippingConfig = async () => {
  const stored = await ShippingConfig.findOne({ key: DEFAULT_KEY }).lean();
  return { ...DEFAULT_SHIPPING_CONFIG, ...(stored || {}) };
};

/**
 * Persist a partial update onto the active config row.
 * @param {object} patch - Partial config fields.
 * @returns {Promise<object>} The saved config object.
 */
export const updateShippingConfig = async (patch) => {
  const existing = await ShippingConfig.findOne({ key: DEFAULT_KEY });
  const merged = { ...DEFAULT_SHIPPING_CONFIG, ...(patch || {}) };

  if (existing) {
    existing.set(merged);
    await existing.save();
    return updatedConfigDocument(existing);
  }

  const created = await ShippingConfig.create({ key: DEFAULT_KEY, ...merged });
  return updatedConfigDocument(created);
};

const updatedConfigDocument = (doc) => ({ ...DEFAULT_SHIPPING_CONFIG, ...doc.toObject() });

/**
 * Idempotently write the default config row (used at startup / seeding).
 */
export const seedDefaultShippingConfig = async () => {
  const existing = await ShippingConfig.findOne({ key: DEFAULT_KEY });
  if (existing) return updatedConfigDocument(existing);
  const created = await ShippingConfig.create({ key: DEFAULT_KEY, ...DEFAULT_SHIPPING_CONFIG });
  return updatedConfigDocument(created);
};

export default {
  getShippingConfig,
  updateShippingConfig,
  seedDefaultShippingConfig,
};