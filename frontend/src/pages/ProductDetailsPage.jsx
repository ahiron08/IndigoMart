import { Minus, Plus, ShieldCheck, ShoppingBag, Truck, Tag, User, Package, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import ProductGridSkeleton from '@/components/catalog/ProductGridSkeleton.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import api from '@/services/api.js';
import { getApiError } from '@/utils/api-error.js';
import { formatCurrency, getProductOriginalPrice, getProductPrice } from '@/utils/format.js';

function ProductDetailsPage() {
  const { identifier } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState({ isLoading: true, error: '', cart: '' });

  useEffect(() => {
    const controller = new AbortController();
    setStatus({ isLoading: true, error: '', cart: '' });

    api.get(`/products/${identifier}`, { signal: controller.signal })
      .then((response) => {
        setProduct(response.data.data.product);
        setSelectedImage(0);
        setStatus({ isLoading: false, error: '', cart: '' });

        // Load related products
        return api.get(`/products/${response.data.data.product._id}/related`, { params: { limit: 6 }, signal: controller.signal });
      })
      .then((response) => {
        if (response?.data?.data?.products) {
          setRelatedProducts(response.data.data.products);
        }
      })
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED') setStatus({ isLoading: false, error: getApiError(error, 'Product could not be loaded.').message, cart: '' });
      });

    return () => controller.abort();
  }, [identifier]);

  const addToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setStatus((current) => ({ ...current, cart: 'loading' }));
    try {
      await api.post('/cart/items', { productId: product._id, quantity });
      setStatus((current) => ({ ...current, cart: 'added' }));
    } catch (error) {
      setStatus((current) => ({ ...current, cart: getApiError(error, 'Could not add this product.').message }));
    }
  };

  if (status.isLoading) return <main className="page-wrap py-16"><ProductGridSkeleton count={2} /></main>;
  if (status.error) return <main className="page-wrap"><div className="empty-state my-20"><h1 className="font-display text-4xl">This piece is unavailable.</h1><p className="mt-3 text-sm text-muted">{status.error}</p><Link className="button-primary mt-7" to="/shop">Return to collection</Link></div></main>;
  if (!product) return null;

  const currentImage = product.images?.[selectedImage];
  const price = getProductPrice(product);

  return (
    <main className="page-wrap py-10 lg:py-16">
      <nav className="mb-8 text-[11px] text-muted"><Link to="/shop">Collection</Link> <span className="mx-2">/</span> {product.category?.name ? <Link to={`/shop?category=${product.category.slug}`} className="hover:text-clay transition-colors">{product.category.name}</Link> : 'Product'}</nav>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
        {/* Product Images */}
        <section className="grid gap-3 sm:grid-cols-[80px_1fr]">
          {product.images?.length > 1 && (
            <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
              {product.images.map((image, index) => (
                <button key={image.publicId} className={`aspect-square w-16 shrink-0 overflow-hidden rounded-xl border-2 ${selectedImage === index ? 'border-indigo' : 'border-transparent'}`} type="button" onClick={() => setSelectedImage(index)} aria-label={`View image ${index + 1}`}>
                  <img className="h-full w-full object-cover" src={image.url} alt="" />
                </button>
              ))}
            </div>
          )}
          <div className="order-1 aspect-[4/5] overflow-hidden rounded-3xl bg-sand sm:order-2">
            {currentImage?.url ? <img className="h-full w-full object-cover" src={currentImage.url} alt={currentImage.alt || product.title} /> : <div className="grid h-full place-items-center"><div className="h-1/2 w-1/2 rounded-full bg-canvas shadow-xl" /></div>}
          </div>
        </section>

        {/* Product Info */}
        <section className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow text-clay">{product.brand}</p>
          <h1 className="mt-4 font-display text-5xl leading-none tracking-tight text-indigo md:text-7xl">{product.title}</h1>

          {/* Seller Info */}
          {product.creator && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-sand/70 p-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo/10">
                <User size={18} className="text-indigo" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Sold by</p>
                <Link to={`/shop/${product.creator._id}`} className="text-sm font-display text-indigo hover:text-clay">
                  {product.creator.shopName || product.creator.name}
                </Link>
              </div>
              {product.creator.isVerified && <span className="status-pill bg-emerald-100 text-emerald-700 text-[10px]">Verified</span>}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <span className="text-lg font-medium">{formatCurrency(price)}</span>
            {product.discountPrice != null && <span className="text-sm text-muted line-through">{formatCurrency(getProductOriginalPrice(product))}</span>}
            {product.discountPercentage > 0 && <span className="status-pill bg-clay/15 text-clay">{product.discountPercentage}% OFF</span>}
            <span className="ml-auto text-xs text-muted">★ {product.ratings?.average?.toFixed(1) || 'New'} {product.ratings?.count ? `(${product.ratings.count})` : ''}</span>
          </div>

          <p className="mt-7 whitespace-pre-line text-sm leading-7 text-muted">{product.description}</p>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 text-xs font-medium text-muted mb-2">
                <Tag size={14} /> Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Link key={tag} to={`/search?tags=${encodeURIComponent(tag)}`} className="rounded-full bg-indigo/10 px-3 py-1.5 text-xs text-indigo hover:bg-indigo/20 transition">
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Specifications */}
          {product.specifications?.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 text-xs font-medium text-muted mb-3">
                <Package size={14} /> Specifications
              </div>
              <div className="grid gap-2">
                {product.specifications.map((spec, index) => (
                  <div key={index} className="flex items-center justify-between rounded-xl border border-indigo/10 bg-sand/40 px-4 py-2.5 text-sm">
                    <span className="text-muted">{spec.key}</span>
                    <span className="font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock Status */}
          <div className="mt-6">
            {product.stock > 0 ? (
              <p className="text-sm text-emerald-700">
                {product.stockStatus === 'limited_stock' ? `Only ${product.stock} left in stock` : `In stock (${product.stock} available)`}
              </p>
            ) : (
              <p className="text-sm text-clay">Out of stock</p>
            )}
          </div>

          {/* Add to Cart */}
          <div className="mt-8 border-y border-indigo/10 py-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Quantity</span>
              <div className="flex items-center rounded-full border border-indigo/15">
                <button className="grid h-10 w-10 place-items-center" type="button" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus size={14} /></button>
                <span className="w-8 text-center text-xs">{quantity}</span>
                <button className="grid h-10 w-10 place-items-center" type="button" disabled={product.stock === 0 || quantity >= product.stock || quantity >= 99} onClick={() => setQuantity((value) => Math.min(product.stock, 99, value + 1))} aria-label="Increase quantity"><Plus size={14} /></button>
              </div>
            </div>
            <button className="button-primary mt-5 w-full" type="button" disabled={product.stock === 0 || status.cart === 'loading'} onClick={addToCart}>
              <ShoppingBag size={17} /> {product.stock === 0 ? 'Sold out' : status.cart === 'loading' ? 'Adding…' : status.cart === 'added' ? 'Added to cart' : 'Add to cart'}
            </button>
            <button
              className="button-secondary mt-3 w-full"
              type="button"
              disabled={product.stock === 0}
              onClick={() => {
                if (!user) { navigate('/login', { state: { from: location } }); return; }
                navigate(`/checkout?product=${product._id}&quantity=${quantity}`);
              }}
            >
              <Zap size={17} /> Buy Now
            </button>
            {status.cart && !['loading', 'added'].includes(status.cart) && <p className="mt-3 text-center text-xs text-clay" role="alert">{status.cart}</p>}
          </div>

          {/* Shipping Info */}
          <div className="mt-6 grid gap-4 text-xs text-muted sm:grid-cols-2">
            {product.shippingDetails?.shippingTime && (
              <div className="flex gap-3"><Truck className="shrink-0 text-clay" size={18} /><span>Ships within {product.shippingDetails.shippingTime}</span></div>
            )}
            {product.shippingDetails?.returnAvailable && (
              <div className="flex gap-3"><ShieldCheck className="shrink-0 text-clay" size={18} /><span>Returns available ({product.shippingDetails.returnWindow || 7} days)</span></div>
            )}
            {product.codAvailable && <div className="flex gap-3"><Package className="shrink-0 text-clay" size={18} /><span>Cash on Delivery available</span></div>}
          </div>

          {/* Views */}
          <div className="mt-6 text-xs text-muted">
            {product.views > 0 && <span>{product.views} views</span>}
          </div>
        </section>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-4xl text-indigo">You might also like</h2>
          <p className="mt-2 text-sm text-muted">Similar products from other sellers</p>
          <div className="mt-8 product-grid">
            {relatedProducts.map((relatedProduct) => (
              <Link key={relatedProduct._id} to={`/shop/${relatedProduct.slug || relatedProduct._id}`} className="group min-w-0">
                <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
                  {relatedProduct.images?.[0]?.url ? (
                    <img className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" src={relatedProduct.images[0].url} alt={relatedProduct.images[0].alt || relatedProduct.title} loading="lazy" />
                  ) : (
                    <div className="grid h-full place-items-center bg-gradient-to-br from-sand to-[#d8cab0]">
                      <div className="h-2/5 w-2/5 rounded-[48%_52%_44%_56%] bg-canvas/80 shadow-xl" />
                    </div>
                  )}
                </div>
                <p className="mt-4 truncate font-mono text-[9px] uppercase tracking-[.18em] text-muted">{relatedProduct.brand}</p>
                <h3 className="mt-1 truncate font-display text-xl text-indigo transition group-hover:text-clay">{relatedProduct.title}</h3>
                <p className="mt-2 text-sm font-medium">{formatCurrency(getProductPrice(relatedProduct))}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default ProductDetailsPage;