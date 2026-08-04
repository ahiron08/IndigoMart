import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/app-error.js';
import { enrichWithCustomerPrice } from './pricing.service.js';

const productSelection = 'title slug price discountPrice images stock brand isApproved';

const getOrCreateCart = async (userId) => {
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  await User.updateOne({ _id: userId, cart: { $ne: cart.id } }, { cart: cart.id });
  return cart;
};

const serializeCart = async (cartId) => {
  const cart = await Cart.findById(cartId).populate('items.product', productSelection).lean();
  const items = (cart?.items || [])
    .filter((item) => item.product?.isApproved)
    .map((item) => {
      const unitPrice = item.product.discountPrice ?? item.product.price;
      return { ...item, unitPrice, lineTotal: unitPrice * item.quantity };
    });

  // Enrich products with customer-facing prices (seller price + platform margin)
  const products = items.map((item) => item.product);
  const enrichedProducts = await enrichWithCustomerPrice(products);
  const enrichedMap = new Map(enrichedProducts.map((product) => [String(product._id), product]));

  const enrichedItems = items.map((item) => {
    const enriched = enrichedMap.get(String(item.product._id));
    if (!enriched) return item;
    const customerPrice = enriched.customerPrice;
    const sellerPrice = enriched.customerPrice - enriched.platformMargin;
    return {
      ...item,
      product: enriched,
      unitPrice: customerPrice,
      lineTotal: customerPrice * item.quantity,
      sellerUnitPrice: sellerPrice,
      sellerLineTotal: sellerPrice * item.quantity,
      platformMargin: enriched.platformMargin,
    };
  });

  const subtotal = enrichedItems.reduce((total, item) => total + item.lineTotal, 0);

  return {
    id: cart?._id,
    items: enrichedItems,
    summary: {
      itemCount: enrichedItems.reduce((total, item) => total + item.quantity, 0),
      subtotal,
      currency: 'INR',
    },
    updatedAt: cart?.updatedAt,
  };
};

const requirePurchasableProduct = async (productId) => {
  const product = await Product.findOne({ _id: productId, isApproved: true });
  if (!product) throw new AppError('Product is unavailable.', 404);
  if (product.stock < 1) throw new AppError('Product is out of stock.', 409);
  return product;
};

export const getCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  return serializeCart(cart.id);
};

export const addCartItem = async (userId, productId, quantity) => {
  const [cart, product] = await Promise.all([getOrCreateCart(userId), requirePurchasableProduct(productId)]);
  const existingItem = cart.items.find((item) => item.product.equals(productId));
  const requestedQuantity = (existingItem?.quantity || 0) + quantity;

  if (requestedQuantity > product.stock) {
    throw new AppError(`Only ${product.stock} unit(s) are currently available.`, 409);
  }
  if (requestedQuantity > 99) throw new AppError('Cart quantity cannot exceed 99.', 422);

  if (existingItem) existingItem.quantity = requestedQuantity;
  else cart.items.push({ product: productId, quantity });
  await cart.save();
  return serializeCart(cart.id);
};

export const updateCartItem = async (userId, productId, quantity) => {
  const [cart, product] = await Promise.all([getOrCreateCart(userId), requirePurchasableProduct(productId)]);
  const item = cart.items.find((candidate) => candidate.product.equals(productId));
  if (!item) throw new AppError('Product is not in the cart.', 404);
  if (quantity > product.stock) throw new AppError(`Only ${product.stock} unit(s) are currently available.`, 409);

  item.quantity = quantity;
  await cart.save();
  return serializeCart(cart.id);
};

export const removeCartItem = async (userId, productId) => {
  const cart = await getOrCreateCart(userId);
  const initialCount = cart.items.length;
  cart.items = cart.items.filter((item) => !item.product.equals(productId));
  if (cart.items.length === initialCount) throw new AppError('Product is not in the cart.', 404);
  await cart.save();
  return serializeCart(cart.id);
};

export const clearCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  await cart.save();
  return serializeCart(cart.id);
};
