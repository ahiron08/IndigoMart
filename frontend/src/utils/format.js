export const formatCurrency = (value, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);

export const getProductPrice = (product) =>
  product.customerPrice ?? product.displayPrice ?? product.discountPrice ?? product.price;

export const getProductOriginalPrice = (product) =>
  product.customerOriginalPrice ?? product.displayPrice ?? product.price;
