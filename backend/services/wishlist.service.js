import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import Wishlist from '../models/wishlist.model.js';
import AppError from '../utils/app-error.js';
import { enrichWithCustomerPrice } from './pricing.service.js';

const getOrCreateWishlist = async (userId) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, products: [] } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  await User.updateOne({ _id: userId, wishlist: { $ne: wishlist.id } }, { wishlist: wishlist.id });
  return wishlist;
};

const populatedWishlist = async (id) => {
  const wishlist = await Wishlist.findById(id).populate({
    path: 'products',
    match: { isApproved: true },
    select: 'title slug price discountPrice images stock brand ratings',
  });
  if (!wishlist) return wishlist;
  const enrichedProducts = await enrichWithCustomerPrice(wishlist.products);
  wishlist.products = enrichedProducts;
  return wishlist;
};

export const getWishlist = async (userId) => {
  const wishlist = await getOrCreateWishlist(userId);
  return populatedWishlist(wishlist.id);
};

export const addWishlistProduct = async (userId, productId) => {
  if (!(await Product.exists({ _id: productId, isApproved: true }))) {
    throw new AppError('Product is unavailable.', 404);
  }
  const wishlist = await getOrCreateWishlist(userId);
  if (!wishlist.products.some((id) => id.equals(productId))) {
    wishlist.products.push(productId);
    await wishlist.save();
  }
  return populatedWishlist(wishlist.id);
};

export const removeWishlistProduct = async (userId, productId) => {
  const wishlist = await getOrCreateWishlist(userId);
  wishlist.products = wishlist.products.filter((id) => !id.equals(productId));
  await wishlist.save();
  return populatedWishlist(wishlist.id);
};
