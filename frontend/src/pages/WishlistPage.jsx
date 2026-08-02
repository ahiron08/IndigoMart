import { ArrowRight, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '@/services/api.js';
import { getApiError } from '@/utils/api-error.js';
import { formatCurrency, getProductPrice } from '@/utils/format.js';

function WishlistPage() {
  const [wishlist, setWishlist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingProduct, setPendingProduct] = useState('');
  const [error, setError] = useState('');

  const loadWishlist = useCallback(async () => {
    try {
      const response = await api.get('/wishlist');
      setWishlist(response.data.data.wishlist);
      setError('');
    } catch (requestError) {
      setError(getApiError(requestError, 'Your wishlist could not be loaded.').message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadWishlist(); }, [loadWishlist]);

  const removeProduct = async (productId) => {
    setPendingProduct(productId);
    setError('');
    try {
      const response = await api.delete(`/wishlist/${productId}`);
      setWishlist(response.data.data.wishlist);
    } catch (requestError) {
      setError(getApiError(requestError, 'This product could not be removed.').message);
    } finally {
      setPendingProduct('');
    }
  };

  const moveToCart = async (productId) => {
    setPendingProduct(productId);
    setError('');
    try {
      await api.post('/cart/items', { productId, quantity: 1 });
      const response = await api.delete(`/wishlist/${productId}`);
      setWishlist(response.data.data.wishlist);
    } catch (requestError) {
      setError(getApiError(requestError, 'This product could not be moved to your cart.').message);
    } finally {
      setPendingProduct('');
    }
  };

  if (isLoading) return <main className="page-wrap py-16"><div className="product-grid">{[1, 2, 3, 4].map((item) => <div key={item} className="aspect-[4/5] animate-pulse rounded-2xl bg-sand" />)}</div></main>;

  if (!wishlist?.products?.length) {
    return (
      <main className="page-wrap grid min-h-[70dvh] place-items-center py-16 text-center">
        <div><Heart className="mx-auto text-clay" size={40} /><p className="eyebrow mt-6 text-clay">Wishlist</p><h1 className="mt-4 font-display text-6xl text-indigo">Keep an eye on things.</h1><p className="mx-auto mt-5 max-w-md text-sm leading-6 text-muted">Save pieces that speak to you and return whenever the moment is right.</p><Link className="button-primary mt-8" to="/shop">Find something worth saving <ArrowRight size={16} /></Link>{error && <p className="mt-4 text-xs text-clay">{error}</p>}</div>
      </main>
    );
  }

  return (
    <main className="page-wrap py-14 lg:py-20">
      <div className="border-b border-indigo/10 pb-8"><p className="eyebrow text-clay">Saved for later</p><h1 className="mt-3 font-display text-6xl text-indigo">Wishlist.</h1><p className="mt-4 text-sm text-muted">{wishlist.products.length} {wishlist.products.length === 1 ? 'piece' : 'pieces'} kept close.</p></div>
      {error && <div className="form-alert" role="alert">{error}</div>}
      <div className="product-grid mt-10">
        {wishlist.products.map((product) => {
          const isPending = pendingProduct === product._id;
          return (
            <article key={product._id} className={`group ${isPending ? 'opacity-55' : ''}`}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
                <Link to={`/shop/${product.slug}`}>{product.images?.[0]?.url ? <img className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" src={product.images[0].url} alt={product.images[0].alt || product.title} /> : null}</Link>
                <button className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-canvas/90 text-clay" type="button" disabled={isPending} onClick={() => removeProduct(product._id)} aria-label={`Remove ${product.title} from wishlist`}><Trash2 size={15} /></button>
              </div>
              <p className="mt-4 eyebrow text-muted">{product.brand}</p>
              <div className="mt-2 flex items-start justify-between gap-3"><Link to={`/shop/${product.slug}`}><h2 className="font-display text-xl">{product.title}</h2></Link><span className="shrink-0 text-xs">{formatCurrency(getProductPrice(product))}</span></div>
              <button className="button-secondary mt-4 min-h-10 w-full" type="button" disabled={isPending || product.stock === 0} onClick={() => moveToCart(product._id)}><ShoppingBag size={15} /> {product.stock === 0 ? 'Sold out' : 'Move to cart'}</button>
            </article>
          );
        })}
      </div>
    </main>
  );
}

export default WishlistPage;
