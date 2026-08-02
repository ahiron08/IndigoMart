import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    alt: { type: String, trim: true, maxlength: 160, default: '' },
  },
  { _id: false },
);

const specificationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const shippingDetailsSchema = new mongoose.Schema(
  {
    weight: { type: Number, min: 0 },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
    shippingTime: { type: String, trim: true, maxlength: 100 },
    returnAvailable: { type: Boolean, default: false },
    returnWindow: { type: Number, min: 0 },
    shippingRegions: [{ type: String, trim: true }],
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 10_000 },
    shortDescription: { type: String, trim: true, maxlength: 500, default: '' },
    price: { type: Number, required: true, min: 0 },
    discountPrice: {
      type: Number,
      min: 0,
      validate: {
        validator(value) {
          return value == null || value < this.price;
        },
        message: 'Discount price must be lower than the regular price.',
      },
    },
    discountPercentage: { type: Number, min: 0, max: 100, default: 0 },
    taxIncluded: { type: Boolean, default: false },
    pickupAddress: { type: String, trim: true, maxlength: 500, default: '' },
    shippingCharge: { type: Number, min: 0, default: 0 },
    codAvailable: { type: Boolean, default: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subcategory: { type: String, trim: true, maxlength: 100, default: '' },
    brand: { type: String, required: true, trim: true, maxlength: 100, index: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Seller-specific fields
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    sellerName: { type: String, trim: true, maxlength: 100, default: '' },
    shopName: { type: String, trim: true, maxlength: 100, default: '' },
    images: {
      type: [imageSchema],
      validate: [(images) => images.length <= 10, 'A product can contain at most 10 images.'],
      default: [],
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    specifications: { type: [specificationSchema], default: [] },
    shippingDetails: { type: shippingDetailsSchema, default: {} },
    productCondition: { type: String, enum: ['new', 'used', 'refurbished'], default: 'new' },
    sku: { type: String, trim: true, maxlength: 100, default: '' },
    stock: { type: Number, required: true, min: 0, default: 0 },
    minOrderQuantity: { type: Number, min: 1, default: 1 },
    maxOrderQuantity: { type: Number, min: 1, default: 99 },
    stockStatus: { type: String, enum: ['in_stock', 'limited_stock', 'out_of_stock'], default: 'in_stock' },
    ratings: {
      average: { type: Number, min: 0, max: 5, default: 0 },
      count: { type: Number, min: 0, default: 0 },
    },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    reviewCount: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: false, index: true },
    featured: { type: Boolean, default: false, index: true },
    // Visibility and status
    status: { type: String, enum: ['draft', 'published', 'hidden'], default: 'draft', index: true },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    isDeleted: { type: Boolean, default: false, index: true },
    // SEO fields
    metaTitle: { type: String, trim: true, maxlength: 160, default: '' },
    metaDescription: { type: String, trim: true, maxlength: 320, default: '' },
    searchKeywords: { type: String, trim: true, maxlength: 500, default: '' },
    // Analytics
    views: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Text index for search
productSchema.index(
  { title: 'text', description: 'text', brand: 'text', tags: 'text', sellerName: 'text', shopName: 'text' },
  { weights: { title: 10, tags: 8, brand: 5, description: 3, sellerName: 2, shopName: 2 } },
);

// Compound indexes for performance
productSchema.index({ isApproved: 1, status: 1, isDeleted: 1, category: 1, createdAt: -1 });
productSchema.index({ isApproved: 1, status: 1, isDeleted: 1, price: 1 });
productSchema.index({ isApproved: 1, status: 1, isDeleted: 1, 'ratings.average': -1 });
productSchema.index({ isApproved: 1, status: 1, isDeleted: 1, views: -1 });
productSchema.index({ isApproved: 1, status: 1, isDeleted: 1, orderCount: -1 });
productSchema.index({ tags: 1 });
productSchema.index({ sellerId: 1, isDeleted: 1 });
productSchema.index({ subcategory: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;