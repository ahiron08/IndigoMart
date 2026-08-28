export const formatCurrency = (value, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);

/**
 * Returns the price the customer pays.
 *
 * Priority:
 *  1. customerPrice  — computed by the backend's enrichWithCustomerPrice
 *                      (always includes the platform fee)
 *  2. discountPrice  — discounted price + platformFee (fallback, checked
 *                     before displayPrice so discounted items never show the
 *                     pre-discount total)
 *  3. displayPrice   — stored displayPrice (sellerPrice + platformFee)
 *  4. price          — base price + platformFee (fallback)
 *
 * The platform fee is added to the fallback values so that the platform fee
 * is never silently omitted, even when enrichment data is unavailable.
 */
export const getProductPrice = (product) => {
  if (product?.customerPrice != null) return product.customerPrice;

  // Resolve the platform fee to add to the raw price fallbacks.
  const platformFee =
    product?.platformFee != null && product.platformFee > 0
      ? product.platformFee
      : product?.platformMargin ?? 0;

  // Check discount BEFORE displayPrice: for non-enriched products that have
  // both a discountPrice and a displayPrice, we want the discounted customer
  // price — not the pre-discount displayPrice.
  if (product?.discountPrice != null) return product.discountPrice + platformFee;
  if (product?.displayPrice != null) return product.displayPrice;
  return product?.price + platformFee;
};

/**
 * Returns the original (pre-discount) price the customer would pay.
 *
 * Priority:
 *  1. customerOriginalPrice — computed by the backend
 *  2. displayPrice          — stored displayPrice
 *  3. price                 — base price + platformFee (fallback)
 */
export const getProductOriginalPrice = (product) => {
  if (product?.customerOriginalPrice != null) return product.customerOriginalPrice;
  if (product?.displayPrice != null) return product.displayPrice;

  const platformFee =
    product?.platformFee != null && product.platformFee > 0
      ? product.platformFee
      : product?.platformMargin ?? 0;

  return product?.price + platformFee;
};
