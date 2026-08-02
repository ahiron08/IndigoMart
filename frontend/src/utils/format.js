export const formatCurrency = (value, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);

export const getProductPrice = (product) => product.discountPrice ?? product.price;
