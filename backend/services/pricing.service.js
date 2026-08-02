import PricingSlab from '../models/pricingSlab.model.js';

const DEFAULT_SLABS = [
  { minPrice: 0, maxPrice: 500, marginAmount: 50, marginType: 'fixed', description: '₹0 - ₹500' },
  { minPrice: 501, maxPrice: 1000, marginAmount: 80, marginType: 'fixed', description: '₹501 - ₹1,000' },
  { minPrice: 1001, maxPrice: 2500, marginAmount: 120, marginType: 'fixed', description: '₹1,001 - ₹2,500' },
  { minPrice: 2501, maxPrice: 5000, marginAmount: 200, marginType: 'fixed', description: '₹2,501 - ₹5,000' },
  { minPrice: 5001, maxPrice: 10000, marginAmount: 350, marginType: 'fixed', description: '₹5,001 - ₹10,000' },
  { minPrice: 10001, maxPrice: Infinity, marginAmount: 500, marginType: 'fixed', description: '₹10,001+' },
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

export const calculateMargin = async (sellerPrice) => {
  const slabs = await getActiveSlabs();
  const slab = slabs.find((s) => sellerPrice >= s.minPrice && sellerPrice <= s.maxPrice);

  if (!slab) {
    // Fallback: use the highest slab
    const highestSlab = slabs[slabs.length - 1];
    return highestSlab ? highestSlab.marginAmount : 50;
  }

  if (slab.marginType === 'percentage') {
    return Math.round((sellerPrice * slab.marginAmount) / 100);
  }

  return slab.marginAmount;
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
  calculateMargin,
  calculateTotalPrice,
};