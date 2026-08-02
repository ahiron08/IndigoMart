import { ArrowLeft, Plus, X, GripVertical, Image as ImageIcon } from 'lucide-react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import api from '@/services/api.js';
import { useCategories } from '@/hooks/useCatalog.js';
import { formatCurrency } from '@/utils/format.js';

const initialFormData = {
  title: '',
  shortDescription: '',
  description: '',
  brand: '',
  category: '',
  subcategory: '',
  sku: '',
  productCondition: 'new',
  price: '',
  discountPercentage: '',
  discountPrice: '',
  taxIncluded: false,
  shippingCharge: '',
  codAvailable: true,
  stock: '',
  minOrderQuantity: 1,
  maxOrderQuantity: 99,
  stockStatus: 'in_stock',
  tags: [],
  specifications: [],
  pickupAddress: '',
  shippingDetails: {
    weight: '',
    dimensions: { length: '', width: '', height: '' },
    shippingTime: '',
    returnAvailable: false,
    returnWindow: '',
    shippingRegions: [],
  },
  metaTitle: '',
  metaDescription: '',
  searchKeywords: '',
  status: 'draft',
};

function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState(initialFormData);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const fileInputRef = useRef(null);
  const { categories, isLoading: categoriesLoading } = useCategories();

  const sections = [
    { id: 0, label: 'Basic Info', short: 'Info' },
    { id: 1, label: 'Pricing', short: 'Price' },
    { id: 2, label: 'Inventory', short: 'Stock' },
    { id: 3, label: 'Images', short: 'Images' },
    { id: 4, label: 'Tags', short: 'Tags' },
    { id: 5, label: 'Specifications', short: 'Specs' },
    { id: 6, label: 'Shipping', short: 'Ship' },
    { id: 7, label: 'SEO', short: 'SEO' },
    { id: 8, label: 'Visibility', short: 'Publish' },
  ];

  useEffect(() => {
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('products/mine/' + id);
      const product = response.data.data.product;
      setFormData({
        title: product.title || '',
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        brand: product.brand || '',
        category: typeof product.category === 'object' ? product.category._id : product.category || '',
        subcategory: product.subcategory || '',
        sku: product.sku || '',
        productCondition: product.productCondition || 'new',
        price: product.price?.toString() || '',
        discountPercentage: product.discountPercentage?.toString() || '',
        discountPrice: product.discountPrice?.toString() || '',
        taxIncluded: product.taxIncluded || false,
        shippingCharge: product.shippingCharge?.toString() || '',
        codAvailable: product.codAvailable ?? true,
        stock: product.stock?.toString() || '',
        minOrderQuantity: product.minOrderQuantity || 1,
        maxOrderQuantity: product.maxOrderQuantity || 99,
        stockStatus: product.stockStatus || 'in_stock',
        tags: product.tags || [],
        specifications: product.specifications || [],
        pickupAddress: product.pickupAddress || '',
        shippingDetails: product.shippingDetails || initialFormData.shippingDetails,
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        searchKeywords: product.searchKeywords || '',
        status: product.status || 'draft',
      });
      setExistingImages(product.images || []);
    } catch (err) {
      console.error('Failed to load product:', err);
      setError(err.response?.data?.message || 'Could not load product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  const handleImageUpload = (files) => {
    const validFiles = Array.from(files).filter((file) => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only JPG, PNG, and WebP are allowed.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Maximum size is 5MB.`);
        return false;
      }
      return true;
    });

    const newImages = validFiles.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
    }));

    setNewImageFiles((prev) => [...prev, ...newImages]);
  };

  const removeNewImage = (imageId) => {
    setNewImageFiles((prev) => {
      const image = prev.find((img) => img.id === imageId);
      if (image) URL.revokeObjectURL(image.preview);
      return prev.filter((img) => img.id !== imageId);
    });
  };

  const removeExistingImage = (publicId) => {
    setExistingImages((prev) => prev.filter((img) => img.publicId !== publicId));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleImageUpload(e.dataTransfer.files);
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.target.value.trim().toLowerCase();
      if (value && !formData.tags.includes(value)) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, value] }));
      }
      e.target.value = '';
    }
  };

  const removeTag = (tag) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const addSpecification = () => {
    setFormData((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }],
    }));
  };

  const updateSpecification = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.map((spec, i) => (i === index ? { ...spec, [field]: value } : spec)),
    }));
  };

  const removeSpecification = (index) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const handleShippingRegionInput = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.target.value.trim();
      if (value && !formData.shippingDetails.shippingRegions.includes(value)) {
        handleNestedChange('shippingDetails', 'shippingRegions', [...formData.shippingDetails.shippingRegions, value]);
      }
      e.target.value = '';
    }
  };

  const removeShippingRegion = (region) => {
    handleNestedChange(
      'shippingDetails',
      'shippingRegions',
      formData.shippingDetails.shippingRegions.filter((r) => r !== region)
    );
  };

  const calculateFinalPrice = () => {
    const price = parseFloat(formData.price) || 0;
    const discount = parseFloat(formData.discountPercentage) || 0;
    const finalPrice = price - (price * discount) / 100;
    return finalPrice.toFixed(2);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Product name is required.');
      return false;
    }
    if (!formData.description.trim() || formData.description.length < 20) {
      setError('Description must be at least 20 characters.');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Price must be greater than 0.');
      return false;
    }
    if (!formData.category) {
      setError('Category is required.');
      return false;
    }
    if (existingImages.length + newImageFiles.length === 0) {
      setError('At least one image is required.');
      return false;
    }
    if (formData.tags.length === 0) {
      setError('At least one tag is required.');
      return false;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      setError('Stock must be 0 or greater.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const submitData = new FormData();

      // Basic fields
      Object.keys(formData).forEach((key) => {
        if (key === 'shippingDetails' || key === 'specifications' || key === 'tags') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (key === 'dimensions') {
          // handled in shippingDetails
        } else if (typeof formData[key] === 'boolean') {
          submitData.append(key, formData[key] ? 'true' : 'false');
        } else if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });

      // Add new images
      newImageFiles.forEach((image) => {
        submitData.append('images', image.file);
      });

      if (isEdit) {
        await api.patch('products/' + id, submitData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccess('Product updated successfully!');
      } else {
        await api.post('products', submitData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccess('Product created successfully!');
      }

      setTimeout(() => navigate('/seller/my-products'), 1500);
    } catch (err) {
      const message = err.response?.data?.message || 'Could not save product. Please try again.';
      setError(message);
      setValidationErrors(err.response?.data?.errors || []);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 rounded bg-sand animate-pulse" />
        <div className="mt-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-sand animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 border-b border-indigo/10 pb-6">
        <button className="icon-button" type="button" onClick={() => navigate('/seller/my-products')} aria-label="Back to products">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="eyebrow text-clay">{isEdit ? 'Edit' : 'New'} product</p>
          <h1 className="mt-2 font-display text-4xl text-indigo">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-8">
          {/* Section 1: Basic Information */}
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <h2 className="font-display text-2xl text-indigo">Basic Information</h2>
            <p className="mt-1 text-sm text-muted">Essential details about your product.</p>
            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-medium">Product Name *</label>
                <input className="form-input mt-2" name="title" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder="Enter product name" required />
              </div>
              <div>
                <label className="block text-xs font-medium">Short Description</label>
                <input className="form-input mt-2" name="shortDescription" value={formData.shortDescription} onChange={(e) => handleInputChange('shortDescription', e.target.value)} placeholder="Brief summary (max 500 chars)" maxLength={500} />
              </div>
              <div>
                <label className="block text-xs font-medium">Detailed Description *</label>
                <textarea className="form-input mt-2" name="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Describe your product in detail (minimum 20 characters)" rows={5} required />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium">Brand *</label>
                  <input className="form-input mt-2" name="brand" value={formData.brand} onChange={(e) => handleInputChange('brand', e.target.value)} placeholder="Brand name" required />
                </div>
                <div>
                  <label className="block text-xs font-medium">Category *</label>
                  <select className="form-input mt-2" name="category" value={formData.category} onChange={(e) => handleInputChange('category', e.target.value)} required disabled={categoriesLoading}>
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium">Subcategory</label>
                  <input className="form-input mt-2" name="subcategory" value={formData.subcategory} onChange={(e) => handleInputChange('subcategory', e.target.value)} placeholder="e.g., Wireless" />
                </div>
                <div>
                  <label className="block text-xs font-medium">SKU</label>
                  <input className="form-input mt-2" name="sku" value={formData.sku} onChange={(e) => handleInputChange('sku', e.target.value)} placeholder="Optional SKU" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium">Product Condition</label>
                <div className="mt-2 flex gap-3">
                  {['new', 'used', 'refurbished'].map((condition) => (
                    <label key={condition} className="flex items-center gap-2 rounded-full border border-indigo/15 px-4 py-2.5 text-sm cursor-pointer">
                      <input type="radio" name="productCondition" value={condition} checked={formData.productCondition === condition} onChange={(e) => handleInputChange('productCondition', e.target.value)} className="accent-indigo" />
                      {condition.charAt(0).toUpperCase() + condition.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Pricing */}
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <h2 className="font-display text-2xl text-indigo">Pricing</h2>
            <p className="mt-1 text-sm text-muted">Set your product price and discounts.</p>
            <div className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium">Price (₹) *</label>
                  <input className="form-input mt-2" name="price" type="number" step="0.01" min="0" value={formData.price} onChange={(e) => handleInputChange('price', e.target.value)} placeholder="0.00" required />
                </div>
                <div>
                  <label className="block text-xs font-medium">Discount Percentage (%)</label>
                  <input className="form-input mt-2" name="discountPercentage" type="number" min="0" max="100" value={formData.discountPercentage} onChange={(e) => handleInputChange('discountPercentage', e.target.value)} placeholder="0" />
                </div>
              </div>
              {formData.discountPercentage && (
                <div className="rounded-xl bg-sand/60 p-4">
                  <p className="text-sm text-muted">Final Price: <span className="font-medium text-indigo">{formatCurrency(calculateFinalPrice())}</span></p>
                </div>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium">Shipping Charge (₹)</label>
                  <input className="form-input mt-2" name="shippingCharge" type="number" step="0.01" min="0" value={formData.shippingCharge} onChange={(e) => handleInputChange('shippingCharge', e.target.value)} placeholder="0.00" />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input type="checkbox" id="taxIncluded" checked={formData.taxIncluded} onChange={(e) => handleInputChange('taxIncluded', e.target.checked)} className="accent-indigo" />
                  <label htmlFor="taxIncluded" className="text-sm">Tax included in price</label>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="codAvailable" checked={formData.codAvailable} onChange={(e) => handleInputChange('codAvailable', e.target.checked)} className="accent-indigo" />
                <label htmlFor="codAvailable" className="text-sm">Cash on Delivery (COD) available</label>
              </div>
            </div>
          </section>

          {/* Section 3: Inventory */}
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <h2 className="font-display text-2xl text-indigo">Inventory</h2>
            <p className="mt-1 text-sm text-muted">Manage stock levels and order limits.</p>
            <div className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium">Stock Quantity *</label>
                  <input className="form-input mt-2" name="stock" type="number" min="0" value={formData.stock} onChange={(e) => handleInputChange('stock', e.target.value)} placeholder="0" required />
                </div>
                <div>
                  <label className="block text-xs font-medium">Stock Status</label>
                  <select className="form-input mt-2" name="stockStatus" value={formData.stockStatus} onChange={(e) => handleInputChange('stockStatus', e.target.value)}>
                    <option value="in_stock">In Stock</option>
                    <option value="limited_stock">Limited Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium">Minimum Order Quantity</label>
                  <input className="form-input mt-2" name="minOrderQuantity" type="number" min="1" value={formData.minOrderQuantity} onChange={(e) => handleInputChange('minOrderQuantity', parseInt(e.target.value) || 1)} />
                </div>
                <div>
                  <label className="block text-xs font-medium">Maximum Order Quantity</label>
                  <input className="form-input mt-2" name="maxOrderQuantity" type="number" min="1" value={formData.maxOrderQuantity} onChange={(e) => handleInputChange('maxOrderQuantity', parseInt(e.target.value) || 99)} />
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Images */}
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <h2 className="font-display text-2xl text-indigo">Images</h2>
            <p className="mt-1 text-sm text-muted">Upload up to 10 images. First image will be the thumbnail.</p>
            <div className="mt-6">
              <div
                className={`relative rounded-2xl border-2 border-dashed ${dragOver ? 'border-indigo bg-indigo/5' : 'border-indigo/20'} p-8 text-center transition`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple className="hidden" onChange={(e) => handleImageUpload(e.target.files)} />
                <ImageIcon className="mx-auto text-muted" size={48} />
                <p className="mt-4 text-sm font-medium">Drag and drop images here, or click to browse</p>
                <p className="mt-1 text-xs text-muted">JPG, PNG, WebP up to 5MB each (max 10 images)</p>
                <button className="button-secondary mt-4" type="button" onClick={() => fileInputRef.current?.click()}>
                  Choose Files
                </button>
              </div>

              {/* Image previews */}
              {(existingImages.length > 0 || newImageFiles.length > 0) && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {existingImages.map((image, index) => (
                    <div key={image.publicId} className="relative aspect-square rounded-xl overflow-hidden bg-sand group">
                      <img src={image.url} alt={image.alt || `Product ${index + 1}`} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-indigo/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <button type="button" onClick={() => removeExistingImage(image.publicId)} className="rounded-full bg-canvas p-2" aria-label="Remove image">
                          <X size={16} />
                        </button>
                      </div>
                      {index === 0 && <span className="absolute top-2 left-2 status-pill bg-indigo text-canvas text-[10px]">Thumbnail</span>}
                    </div>
                  ))}
                  {newImageFiles.map((image) => (
                    <div key={image.id} className="relative aspect-square rounded-xl overflow-hidden bg-sand group">
                      <img src={image.preview} alt="Preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-indigo/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <button type="button" onClick={() => removeNewImage(image.id)} className="rounded-full bg-canvas p-2" aria-label="Remove image">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Section 5: Tags */}
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <h2 className="font-display text-2xl text-indigo">Product Tags</h2>
            <p className="mt-1 text-sm text-muted">Add tags to help customers find your product. Press Enter to add.</p>
            <div className="mt-6">
              <input
                className="form-input"
                type="text"
                placeholder="Type a tag and press Enter"
                onKeyDown={handleTagInput}
              />
              {formData.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-indigo/10 px-4 py-2 text-sm">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-indigo hover:text-clay" aria-label={`Remove ${tag}`}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Section 6: Specifications */}
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl text-indigo">Specifications</h2>
                <p className="mt-1 text-sm text-muted">Add key-value pairs for product details.</p>
              </div>
              <button type="button" onClick={addSpecification} className="button-secondary">
                <Plus size={15} /> Add
              </button>
            </div>
            <div className="mt-6 space-y-3">
              {formData.specifications.map((spec, index) => (
                <div key={index} className="flex gap-3">
                  <input className="form-input flex-1" value={spec.key} onChange={(e) => updateSpecification(index, 'key', e.target.value)} placeholder="Key (e.g., RAM)" />
                  <input className="form-input flex-1" value={spec.value} onChange={(e) => updateSpecification(index, 'value', e.target.value)} placeholder="Value (e.g., 16GB)" />
                  <button type="button" onClick={() => removeSpecification(index)} className="icon-button text-clay" aria-label="Remove specification">
                    <X size={18} />
                  </button>
                </div>
              ))}
              {formData.specifications.length === 0 && <p className="text-sm text-muted">No specifications added yet.</p>}
            </div>
          </section>

          {/* Section 7: Shipping */}
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <h2 className="font-display text-2xl text-indigo">Shipping</h2>
            <p className="mt-1 text-sm text-muted">Shipping details and return policy.</p>
            <div className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium">Weight (kg)</label>
                  <input className="form-input mt-2" type="number" step="0.01" min="0" value={formData.shippingDetails.weight} onChange={(e) => handleNestedChange('shippingDetails', 'weight', e.target.value)} placeholder="0.5" />
                </div>
                <div>
                  <label className="block text-xs font-medium">Shipping Time</label>
                  <input className="form-input mt-2" value={formData.shippingDetails.shippingTime} onChange={(e) => handleNestedChange('shippingDetails', 'shippingTime', e.target.value)} placeholder="e.g., 3-5 business days" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium">Dimensions (cm)</label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  <input className="form-input" type="number" step="0.1" min="0" value={formData.shippingDetails.dimensions?.length || ''} onChange={(e) => handleNestedChange('shippingDetails', 'dimensions', { ...formData.shippingDetails.dimensions, length: e.target.value })} placeholder="Length" />
                  <input className="form-input" type="number" step="0.1" min="0" value={formData.shippingDetails.dimensions?.width || ''} onChange={(e) => handleNestedChange('shippingDetails', 'dimensions', { ...formData.shippingDetails.dimensions, width: e.target.value })} placeholder="Width" />
                  <input className="form-input" type="number" step="0.1" min="0" value={formData.shippingDetails.dimensions?.height || ''} onChange={(e) => handleNestedChange('shippingDetails', 'dimensions', { ...formData.shippingDetails.dimensions, height: e.target.value })} placeholder="Height" />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="returnAvailable" checked={formData.shippingDetails.returnAvailable} onChange={(e) => handleNestedChange('shippingDetails', 'returnAvailable', e.target.checked)} className="accent-indigo" />
                  <label htmlFor="returnAvailable" className="text-sm">Returns available</label>
                </div>
                <div>
                  <label className="block text-xs font-medium">Return Window (days)</label>
                  <input className="form-input mt-2" type="number" min="0" value={formData.shippingDetails.returnWindow} onChange={(e) => handleNestedChange('shippingDetails', 'returnWindow', e.target.value)} placeholder="7" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium">PickUp Address</label>
                <textarea className="form-input mt-2" value={formData.pickupAddress} onChange={(e) => handleInputChange('pickupAddress', e.target.value)} placeholder="Enter pickup address for this product" rows={2} maxLength={500} />
              </div>
              <div>
                <label className="block text-xs font-medium">Shipping Regions</label>
                <input className="form-input mt-2" type="text" placeholder="Type region and press Enter" onKeyDown={handleShippingRegionInput} />
                {formData.shippingDetails.shippingRegions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.shippingDetails.shippingRegions.map((region) => (
                      <span key={region} className="inline-flex items-center gap-2 rounded-full bg-indigo/10 px-3 py-1.5 text-sm">
                        {region}
                        <button type="button" onClick={() => removeShippingRegion(region)} className="text-indigo hover:text-clay" aria-label={`Remove ${region}`}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 8: SEO */}
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <h2 className="font-display text-2xl text-indigo">SEO</h2>
            <p className="mt-1 text-sm text-muted">Optimize your product for search engines.</p>
            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-medium">Meta Title</label>
                <input className="form-input mt-2" value={formData.metaTitle} onChange={(e) => handleInputChange('metaTitle', e.target.value)} placeholder="SEO title (max 160 chars)" maxLength={160} />
              </div>
              <div>
                <label className="block text-xs font-medium">Meta Description</label>
                <textarea className="form-input mt-2" value={formData.metaDescription} onChange={(e) => handleInputChange('metaDescription', e.target.value)} placeholder="Brief description for search results" rows={3} maxLength={320} />
              </div>
              <div>
                <label className="block text-xs font-medium">Search Keywords</label>
                <input className="form-input mt-2" value={formData.searchKeywords} onChange={(e) => handleInputChange('searchKeywords', e.target.value)} placeholder="Comma-separated keywords" />
              </div>
            </div>
          </section>

          {/* Section 9: Visibility */}
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <h2 className="font-display text-2xl text-indigo">Visibility</h2>
            <p className="mt-1 text-sm text-muted">Control who can see this product.</p>
            <div className="mt-6">
              <label className="block text-xs font-medium">Product Status</label>
              <div className="mt-2 flex gap-3">
                {['draft', 'published', 'hidden'].map((status) => (
                  <label key={status} className="flex items-center gap-2 rounded-full border border-indigo/15 px-4 py-2.5 text-sm cursor-pointer">
                    <input type="radio" name="status" value={status} checked={formData.status === status} onChange={(e) => handleInputChange('status', e.target.value)} className="accent-indigo" />
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">
                {formData.status === 'published' && 'Product will be visible in the marketplace.'}
                {formData.status === 'draft' && 'Product will be saved but not visible to customers.'}
                {formData.status === 'hidden' && 'Product will be hidden from the marketplace.'}
              </p>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-indigo/10 bg-canvas p-6">
            <h3 className="font-display text-xl text-indigo">Save Product</h3>
            <p className="mt-1 text-xs text-muted">Choose how you want to save this product.</p>
            <div className="mt-4 space-y-3">
              <button type="submit" className="button-primary w-full" disabled={isSaving}>
                {isSaving ? 'Saving...' : formData.status === 'published' ? 'Publish Product' : 'Save Product'}
              </button>
              <button type="button" className="button-secondary w-full" onClick={() => navigate('/seller/my-products')}>
                Cancel
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-clay/20 bg-clay/10 p-4">
              <p className="text-sm font-medium text-clay">{error}</p>
              {validationErrors.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {validationErrors.map((err, index) => (
                    <li key={index} className="text-xs text-clay/80">• {err.field}: {err.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">{success}</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export default ProductFormPage;