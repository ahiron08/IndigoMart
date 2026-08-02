import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 80 },
    slug: { type: String, required: true, trim: true, unique: true, lowercase: true, index: true },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    image: {
      url: { type: String, trim: true, default: '' },
      publicId: { type: String, trim: true, default: '' },
    },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const Category = mongoose.model('Category', categorySchema);

export default Category;
