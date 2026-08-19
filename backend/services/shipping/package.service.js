import { getShippingConfig } from './config.service.js';

/**
 * Package dimension calculation.
 *
 * This is intentionally isolated so that a real packing algorithm can replace
 * it later. The v1 strategy ("simple-additive") estimates the enclosing box
 * for one or more items:
 *  - Single item → uses its packaged dimensions (falling back to raw).
 *  - Multiple items → arranges the boxes in a row:
 *    newLength = sum of per-box lengths, width = max width, height = max height.
 *    A configurable packaging allowance is then added to each axis.
 *
 * Returns dimensions in centimeters.
 */

const DEFAULT_PACKAGE_ALLOWANCE = 2; // cm added to each axis beyond the product

const DEFAULT_DIM = { length: 20, width: 15, height: 10 };

const toPositive = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Extract preferred dimensions for a single item (packaged over raw).
 * @param {object} item - { packagedDimensions?, dimensions?, ... }
 * @returns {{length:number,width:number,height:number}}
 */
export const itemDimensions = (item) => {
  const packaged = item?.packagedDimensions;
  const hasPackaged = packaged && toPositive(packaged.length) !== null
    && toPositive(packaged.width) !== null && toPositive(packaged.height) !== null;
  const chosen = hasPackaged ? packaged : item?.dimensions;

  return {
    length: toPositive(chosen?.length) ?? DEFAULT_DIM.length,
    width: toPositive(chosen?.width) ?? DEFAULT_DIM.width,
    height: toPositive(chosen?.height) ?? DEFAULT_DIM.height,
  };
};

const hasDimensions = (d) =>
  toPositive(d.length) !== null || toPositive(d.width) !== null || toPositive(d.height) !== null;

/**
 * Compute the final package dimensions for a set of items.
 * @param {Array<{quantity?:number}>} items - items with dimensions resolved.
 * @param {{allowance?:number}} [options]
 * @returns {{length:number,width:number,height:number}}
 */
export const calculatePackageDimensions = async (items, options = {}) => {
  const explicitAllowance = Number(options.allowance);
  const hasExplicitAllowance = Number.isFinite(explicitAllowance) && explicitAllowance >= 0;

  let allowance = hasExplicitAllowance
    ? explicitAllowance
    : DEFAULT_PACKAGE_ALLOWANCE;

  if (!hasExplicitAllowance) {
    const config = options.config || (await tryGetConfig());
    const configured = Number(config?.packagingAllowance);
    if (Number.isFinite(configured) && configured >= 0) {
      allowance = configured;
    }
  }

  const boxes = [];
  for (const item of items || []) {
    const qty = Math.max(1, Number(item?.quantity) || 1);
    const dims = itemDimensions(item);
    if (!hasDimensions(dims)) continue;
    for (let i = 0; i < qty; i += 1) boxes.push(dims);
  }

  if (boxes.length === 0) {
    return { length: DEFAULT_DIM.length, width: DEFAULT_DIM.width, height: DEFAULT_DIM.height };
  }

  if (boxes.length === 1) {
    return addAllowance(boxes[0], allowance);
  }

  // Multiple boxes → arrange along one axis (sum of lengths, max width/height).
  const combined = {
    length: boxes.reduce((sum, b) => sum + b.length, 0),
    width: Math.max(...boxes.map((b) => b.width)),
    height: Math.max(...boxes.map((b) => b.height)),
  };

  return addAllowance(combined, allowance);
};

const tryGetConfig = async () => {
  try {
    return await getShippingConfig();
  } catch {
    return null;
  }
};

const addAllowance = (dim, allowance) => ({
  length: Math.round((Number(dim.length) || 0) + allowance),
  width: Math.round((Number(dim.width) || 0) + allowance),
  height: Math.round((Number(dim.height) || 0) + allowance),
});

export default {
  itemDimensions,
  calculatePackageDimensions,
};