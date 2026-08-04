import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid identifier.');
const optionalNumber = (schema) =>
  z.preprocess((value) => (value === '' || value == null ? undefined : Number(value)), schema.optional());
const categoryId = z.string().trim().min(1).max(140);

const productFields = {
  title: z.string().trim().min(2).max(160),
  shortDescription: z.string().trim().max(500).optional().default(''),
  description: z.string().trim().min(20).max(10_000),
  price: z.preprocess((val) => { 
    if (val === '' || val == null || val === undefined) return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  }, z.number().positive('Price must be greater than 0')).optional(),
  sellerPrice: z.preprocess((val) => { 
    if (val === '' || val == null || val === undefined) return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  }, z.number().positive('Seller price must be greater than 0').optional()),
  platformFee: z.preprocess((val) => { 
    if (val === '' || val == null || val === undefined) return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  }, z.number().nonnegative('Platform fee cannot be negative').optional()),
  displayPrice: z.preprocess((val) => { 
    if (val === '' || val == null || val === undefined) return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  }, z.number().positive('Display price must be greater than 0').optional()),
  pickupPincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, 'Pickup pincode must be a valid 6-digit Indian pincode').optional(),
  discountPrice: z.preprocess((val) => { 
    if (val === '' || val == null || val === undefined) return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  }, z.number().nonnegative().optional()),
  discountPercentage: z.preprocess((val) => { 
    if (val === '' || val == null || val === undefined) return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  }, z.number().min(0).max(100).optional()),
  taxIncluded: z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
  pickupAddress: z.string().trim().max(500).optional().default(''),
  shippingCharge: z.preprocess((val) => { 
    if (val === '' || val == null || val === undefined) return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  }, z.number().nonnegative().optional()),
  codAvailable: z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
  category: categoryId,
  subcategory: z.string().trim().max(100).optional().default(''),
  brand: z.string().trim().min(1).max(100),
  stock: z.preprocess((val) => { 
    if (val === '' || val == null || val === undefined) return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  }, z.number().int().min(0, 'Stock must be 0 or greater')).optional(),
  minOrderQuantity: z.preprocess((val) => { 
    if (val === '' || val == null || val === undefined) return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  }, z.number().int().min(1).optional()),
  maxOrderQuantity: z.preprocess((val) => { 
    if (val === '' || val == null || val === undefined) return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  }, z.number().int().min(1).optional()),
  stockStatus: z.enum(['in_stock', 'limited_stock', 'out_of_stock']).optional().default('in_stock'),
  productCondition: z.enum(['new', 'used', 'refurbished']).optional().default('new'),
  sku: z.string().trim().max(100).optional().default(''),
  tags: z.preprocess((val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return val.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      }
    }
    return [];
  }, z.array(z.string().trim().toLowerCase()).optional().default([])),
  specifications: z.preprocess((val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return [];
  }, z.array(z.object({
    key: z.string().trim().min(1),
    value: z.string().trim().min(1),
  })).optional().default([])),
  shippingDetails: z.preprocess((val) => {
    if (!val) return {};
    if (typeof val === 'object' && !Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return {};
      }
    }
    return {};
  }, z.object({
    weight: z.preprocess((val) => { 
      if (val === '' || val == null || val === undefined) return undefined;
      const n = Number(val);
      return isNaN(n) ? undefined : n;
    }, z.number().nonnegative().optional()),
    dimensions: z.object({
      length: z.preprocess((val) => { 
        if (val === '' || val == null || val === undefined) return undefined;
        const n = Number(val);
        return isNaN(n) ? undefined : n;
      }, z.number().nonnegative().optional()),
      width: z.preprocess((val) => { 
        if (val === '' || val == null || val === undefined) return undefined;
        const n = Number(val);
        return isNaN(n) ? undefined : n;
      }, z.number().nonnegative().optional()),
      height: z.preprocess((val) => { 
        if (val === '' || val == null || val === undefined) return undefined;
        const n = Number(val);
        return isNaN(n) ? undefined : n;
      }, z.number().nonnegative().optional()),
    }).optional().default({}),
    shippingTime: z.string().trim().max(100).optional().default(''),
    returnAvailable: z.preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
    returnWindow: z.preprocess((val) => { 
      if (val === '' || val == null || val === undefined) return undefined;
      const n = Number(val);
      return isNaN(n) ? undefined : n;
    }, z.number().min(0).optional()),
    shippingRegions: z.preprocess((val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return val.split(',').map(r => r.trim()).filter(Boolean);
        }
      }
      return [];
    }, z.array(z.string().trim()).optional().default([])),
  }).optional().default({})),
  metaTitle: z.string().trim().max(160).optional().default(''),
  metaDescription: z.string().trim().max(320).optional().default(''),
  searchKeywords: z.string().trim().max(500).optional().default(''),
  status: z.enum(['draft', 'published', 'hidden']).optional().default('draft'),
};

export const createProductSchema = z.object({
  body: z.object(productFields)
    .refine(
      (data) => data.discountPrice == null || data.discountPrice < data.price,
      { message: 'Discount price must be lower than the regular price.', path: ['discountPrice'] },
    )
    .refine(
      (data) => data.price != null && data.price > 0,
      { message: 'Price is required and must be greater than 0.', path: ['price'] },
    )
    .refine(
      (data) => data.pickupPincode == null || /^[1-9][0-9]{5}$/.test(data.pickupPincode),
      { message: 'Pickup pincode must be a valid 6-digit Indian pincode.', path: ['pickupPincode'] },
    )
    .refine(
      (data) => data.stock != null && data.stock >= 0,
      { message: 'Stock is required and must be 0 or greater.', path: ['stock'] },
    ),
});

export const updateProductSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    title: productFields.title.optional(),
    shortDescription: productFields.shortDescription.optional(),
    description: productFields.description.optional(),
    price: optionalNumber(z.number().nonnegative()),
    sellerPrice: optionalNumber(z.number().positive()),
    platformFee: optionalNumber(z.number().nonnegative()),
    displayPrice: optionalNumber(z.number().positive()),
    pickupPincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, 'Pickup pincode must be a valid 6-digit Indian pincode').optional(),
    discountPrice: optionalNumber(z.number().nonnegative().nullable()),
    discountPercentage: optionalNumber(z.number().min(0).max(100)),
    taxIncluded: productFields.taxIncluded,
    pickupAddress: productFields.pickupAddress,
    shippingCharge: optionalNumber(z.number().nonnegative()),
    codAvailable: productFields.codAvailable,
    category: categoryId.optional(),
    subcategory: productFields.subcategory.optional(),
    brand: productFields.brand.optional(),
    stock: optionalNumber(z.number().int().nonnegative()),
    minOrderQuantity: z.coerce.number().int().min(1).optional(),
    maxOrderQuantity: z.coerce.number().int().min(1).optional(),
    stockStatus: productFields.stockStatus.optional(),
    productCondition: productFields.productCondition.optional(),
    sku: productFields.sku.optional(),
    tags: productFields.tags.optional(),
    specifications: productFields.specifications.optional(),
    shippingDetails: productFields.shippingDetails.optional(),
    metaTitle: productFields.metaTitle.optional(),
    metaDescription: productFields.metaDescription.optional(),
    searchKeywords: productFields.searchKeywords.optional(),
    status: productFields.status.optional(),
  }).refine(
    (data) => data.discountPrice == null || data.discountPrice < (data.price ?? 0),
    { message: 'Discount price must be lower than the regular price.', path: ['discountPrice'] },
  ),
});

export const productIdSchema = z.object({ params: z.object({ id: objectId }) });

export const productIdentifierSchema = z.object({
  params: z.object({ identifier: z.string().trim().min(1).max(160) }),
});

export const listProductsSchema = z.object({
  query: z.object({
    search: z.string().trim().max(100).optional(),
    category: z.string().trim().max(140).optional(),
    subcategory: z.string().trim().max(100).optional(),
    brand: z.string().trim().max(100).optional(),
    minPrice: optionalNumber(z.number().nonnegative()),
    maxPrice: optionalNumber(z.number().nonnegative()),
    minRating: optionalNumber(z.number().min(0).max(5)),
    featured: z.enum(['true', 'false']).optional(),
    inStock: z.enum(['true', 'false']).optional(),
    availability: z.enum(['in_stock', 'out_of_stock']).optional(),
    discount: z.enum(['true', 'false']).optional(),
    productCondition: z.enum(['new', 'used', 'refurbished']).optional(),
    seller: objectId.optional(),
    tags: z.string().trim().optional(),
    sort: z.enum(['newest', 'oldest', 'price-asc', 'price-desc', 'popularity', 'rating', 'views', 'best-selling']).default('newest'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }).refine(
    (data) => data.minPrice == null || data.maxPrice == null || data.minPrice <= data.maxPrice,
    { message: 'Minimum price cannot exceed maximum price.', path: ['minPrice'] },
  ),
});