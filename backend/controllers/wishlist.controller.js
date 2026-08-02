import {
  addWishlistProduct,
  getWishlist,
  removeWishlistProduct,
} from '../services/wishlist.service.js';
import asyncHandler from '../utils/async-handler.js';

export const readWishlist = asyncHandler(async (request, response) => {
  const wishlist = await getWishlist(request.user.id);
  response.status(200).json({ success: true, data: { wishlist } });
});

export const addProduct = asyncHandler(async (request, response) => {
  const wishlist = await addWishlistProduct(request.user.id, request.params.productId);
  response.status(200).json({ success: true, message: 'Product added to wishlist.', data: { wishlist } });
});

export const removeProduct = asyncHandler(async (request, response) => {
  const wishlist = await removeWishlistProduct(request.user.id, request.params.productId);
  response.status(200).json({ success: true, message: 'Product removed from wishlist.', data: { wishlist } });
});
