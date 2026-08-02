import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../services/cart.service.js';
import asyncHandler from '../utils/async-handler.js';

const sendCart = (response, cart, message) =>
  response.status(200).json({ success: true, ...(message ? { message } : {}), data: { cart } });

export const readCart = asyncHandler(async (request, response) => {
  sendCart(response, await getCart(request.user.id));
});

export const addItem = asyncHandler(async (request, response) => {
  const cart = await addCartItem(request.user.id, request.body.productId, request.body.quantity);
  sendCart(response, cart, 'Product added to cart.');
});

export const updateItem = asyncHandler(async (request, response) => {
  const cart = await updateCartItem(request.user.id, request.params.productId, request.body.quantity);
  sendCart(response, cart, 'Cart updated.');
});

export const removeItem = asyncHandler(async (request, response) => {
  const cart = await removeCartItem(request.user.id, request.params.productId);
  sendCart(response, cart, 'Product removed from cart.');
});

export const removeAllItems = asyncHandler(async (request, response) => {
  sendCart(response, await clearCart(request.user.id), 'Cart cleared.');
});
