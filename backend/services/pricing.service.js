import PricingSlab from '../models/pricingSlab.model.js';

// Exact pricing table from the platform fee sheet
const DEFAULT_SLABS = [
  { minPrice: 1, maxPrice: 99, marginAmount: 20, marginType: 'fixed', description: '₹1 - ₹99' },
  { minPrice: 100, maxPrice: 199, marginAmount: 30, marginType: 'fixed', description: '₹100 - ₹199' },
  { minPrice: 200, maxPrice: 299, marginAmount: 40, marginType: 'fixed', description: '₹200 - ₹299' },
  { minPrice: 300, maxPrice: 499, marginAmount: 50, marginType: 'fixed', description: '₹300 - ₹499' },
  { minPrice: 500, maxPrice: 749, marginAmount: 70, marginType: 'fixed', description: '₹500 - ₹749' },
  { minPrice: 750, maxPrice: 999, marginAmount: 90, marginType: 'fixed', description: '₹750 - ₹999' },
  { minPrice: 1000, maxPrice: 1499, marginAmount: 120, marginType: 'fixed', description: '₹1,000 - ₹1,499' },
  { minPrice: 1500, maxPrice: 1999, marginAmount: 150, marginType: 'fixed', description: '₹1,500 - ₹1,999' },
  { minPrice: 2000, maxPrice: 2999, marginAmount: 200, marginType: 'fixed', description: '₹2,000 - ₹2,999' },
  { minPrice: 3000, maxPrice: 4999, marginAmount: 300, marginType: 'fixed', description: '₹3,000 - ₹4,999' },
  { minPrice: 5000, maxPrice: 6999, marginAmount: 600, marginType: 'fixed', description: '₹5,000 - ₹6,999' },
  { minPrice: 7000, maxPrice: Infinity, marginAmount: 600, marginType: 'fixed', description: '₹7,000+' },
];

export const seedDefaultSlabs = async () => {
  const count = await PricingSlab.countDocuments({ isActive: true });
  if (count === 0) {
    await PricingSlab.insertMany(DEFAULT_SLABS.map((s) => ({ ...s, isActive: true })));
    console.log('Default pricing slabs seeded.');
  }
};

export const getActiveSlabs = async () => {
  const slabs = await PricingSlab.find({ isActive: true }).sort({ minPrice: 1 }).lean();
  return slabs.length > 0 ? slabs : DEFAULT_SLABS;
};

/**
 * Calculate the platform fee for a given seller price.
 * @param {number} sellerPrice - The price the seller wants to receive.
 * @param {Array} slabs - Optional pricing slabs to use.
 * @returns {number} The platform fee amount.
 */
export const getMarginForPrice = (sellerPrice, slabs = DEFAULT_SLABS) => {
  const price = Number(sellerPrice) || 0;
  const slab = slabs.find((s) => price >= s.minPrice && price <= s.maxPrice);

  if (!slab) {
    // Fallback: use the highest slab
    const highestSlab = slabs[slabs.length - 1];
    return highestSlab ? highestSlab.marginAmount : 20;
  }

  if (slab.marginType === 'percentage') {
    return Math.round((price * slab.marginAmount) / 100);
  }

  return slab.marginAmount;
};

export const calculateMargin = async (sellerPrice) => {
  const slabs = await getActiveSlabs();
  return getMarginForPrice(sellerPrice, slabs);
};

/**
 * Calculate the platform fee for a given seller price.
 * Alias for getMarginForPrice for clarity.
 */
export const calculatePlatformFee = async (sellerPrice) => {
  return calculateMargin(sellerPrice);
};

/**
 * Calculate the display price (seller price + platform fee).
 * @param {number} sellerPrice - The price the seller wants to receive.
 * @returns {Promise<{sellerPrice: number, platformFee: number, displayPrice: number}>}
 */
export const calculateDisplayPrice = async (sellerPrice) => {
  const price = Number(sellerPrice) || 0;
  const platformFee = await calculateMargin(price);
  return {
    sellerPrice: price,
    platformFee,
    displayPrice: price + platformFee,
  };
};

/**
 * Adds customer-facing price fields to an array of product documents.
 * Each product receives:
 *   - platformMargin: the margin applied to the effective (discounted) price
 *   - customerPrice: effective price + margin (what buyers see)
 *   - customerOriginalPrice: original price + margin (for strikethrough display)
 */
export const enrichWithCustomerPrice = async (products) => {
  if (!Array.isArray(products) || products.length === 0) return products || [];

  const slabs = await getActiveSlabs();

  return products.map((product) => {
    const price = product?.price ?? 0;
    const discountPrice = product?.discountPrice ?? null;
    const effectivePrice = discountPrice ?? price;

    // Use stored displayPrice if available (new products), otherwise calculate
    const storedDisplayPrice = product?.displayPrice ?? null;
    const storedPlatformFee = product?.platformFee ?? null;

    const margin = storedPlatformFee ?? getMarginForPrice(effectivePrice, slabs);
    const originalMargin = getMarginForPrice(price, slabs);

    return {
      ...product,
      platformMargin: margin,
      customerPrice: storedDisplayPrice ?? effectivePrice + margin,
      customerOriginalPrice: storedDisplayPrice ?? price + originalMargin,
    };
  });
};

export const enrichProductWithCustomerPrice = async (product) => {
  if (!product) return product;
  const enriched = await enrichWithCustomerPrice([product]);
  return enriched[0];
};

export const calculateTotalPrice = async (sellerPrice, shippingCost) => {
  const platformMargin = await calculateMargin(sellerPrice);
  return {
    sellerPrice,
    platformMargin,
    shippingCost,
    totalAmount: sellerPrice + platformMargin + shippingCost,
  };
};

export default {
  seedDefaultSlabs,
  getActiveSlabs,
  getMarginForPrice,
  calculateMargin,
  calculatePlatformFee,
  calculateDisplayPrice,
  enrichWithCustomerPrice,
  enrichProductWithCustomerPrice,
  calculateTotalPrice,
};