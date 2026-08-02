import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 40, default: 'Home' },
    recipientName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200, default: '' },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    postalCode: { type: String, required: true, trim: true, maxlength: 20 },
    country: { type: String, required: true, trim: true, maxlength: 100, default: 'India' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const sessionSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, minlength: 8, select: false },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    profileImage: { type: String, trim: true, default: '' },
    role: { type: String, enum: ['user', 'creator', 'admin', 'customer', 'seller'], default: 'user', index: true },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false, index: true },
    // Seller-specific fields
    shopName: { type: String, trim: true, maxlength: 100 },
    businessType: { type: String, trim: true, maxlength: 100 },
    gstNumber: { type: String, trim: true, maxlength: 50 },
    panNumber: { type: String, trim: true, maxlength: 50 },
    shopAddress: { type: String, trim: true, maxlength: 500 },
    city: { type: String, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    pinCode: { type: String, trim: true, maxlength: 20 },
    shopLogo: { type: String, trim: true, default: '' },
    shopBanner: { type: String, trim: true, default: '' },
    shopDescription: { type: String, trim: true, maxlength: 2000 },
    categoriesSold: [{ type: String, trim: true }],
    accountHolderName: { type: String, trim: true, maxlength: 100 },
    bankName: { type: String, trim: true, maxlength: 100 },
    accountNumber: { type: String, trim: true, maxlength: 50 },
    ifscCode: { type: String, trim: true, maxlength: 20 },
    sellerRating: { type: Number, min: 0, max: 5, default: 0 },
    followers: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    isSellerVerified: { type: Boolean, default: false },
    isSellerActive: { type: Boolean, default: true },
    // Seller government ID verification (adult identity proof)
    govtIdType: { type: String, trim: true, maxlength: 50, default: '' },
    govtIdNumber: { type: String, trim: true, maxlength: 100, default: '' },
    govtIdImage: {
      url: { type: String, trim: true, default: '' },
      publicId: { type: String, trim: true, default: '' },
    },
    // Seller pickup address (used as shipment origin)
    pickupName: { type: String, trim: true, maxlength: 100, default: '' },
    pickupPhone: { type: String, trim: true, maxlength: 20, default: '' },
    pickupAddress: { type: String, trim: true, maxlength: 500, default: '' },
    pickupLandmark: { type: String, trim: true, maxlength: 200, default: '' },
    pickupCity: { type: String, trim: true, maxlength: 100, default: '' },
    pickupState: { type: String, trim: true, maxlength: 100, default: '' },
    pickupPincode: { type: String, trim: true, maxlength: 20, default: '' },
    socialLinks: {
      website: { type: String, trim: true, default: '' },
      instagram: { type: String, trim: true, default: '' },
      facebook: { type: String, trim: true, default: '' },
      twitter: { type: String, trim: true, default: '' },
    },
    returnPolicy: { type: String, trim: true, maxlength: 2000 },
    shippingPolicy: { type: String, trim: true, maxlength: 2000 },
    notificationSettings: {
      emailOrders: { type: Boolean, default: true },
      emailMarketing: { type: Boolean, default: false },
      smsOrders: { type: Boolean, default: false },
    },
    addresses: { type: [addressSchema], default: [] },
    wishlist: { type: mongoose.Schema.Types.ObjectId, ref: 'Wishlist', default: null },
    cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart', default: null },
    sessions: { type: [sessionSchema], select: false, default: [] },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    tokenVersion: { type: Number, default: 0, select: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

userSchema.pre('save', async function hashChangedPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function sanitizeUser() {
  const user = this.toObject({ virtuals: true });
  delete user.password;
  delete user.sessions;
  delete user.passwordResetToken;
  delete user.passwordResetExpiresAt;
  delete user.tokenVersion;
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
