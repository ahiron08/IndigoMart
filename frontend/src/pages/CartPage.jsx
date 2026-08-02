import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '@/services/api.js';
import { getApiError } from '@/utils/api-error.js';
import { formatCurrency } from '@/utils/format.js';

function CartPage() {
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingProduct, setPendingProduct] = useState('');
  const [error, setError] = useState('');

  const loadCart = useCallback(async () => {
    try {
      const response = await api.get('/cart');
      setCart(response.data.data.cart);
      setError('');
    } catch (requestError) {
      setError(getApiError(requestError, 'Your cart could not be loaded.').message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadCart(); }, [loadCart]);

  const mutateCart = async (productId, request) => {
    setPendingProduct(productId || 'all');
    setError('');
    try {
      const response = await request();
      setCart(response.data.data.cart);
    } catch (requestError) {
      setError(getApiError(requestError, 'Your cart could not be updated.').message);
    } finally {
      setPendingProduct('');
    }
  };

  const updateQuantity = (productId, quantity) =>
    mutateCart(productId, () => api.patch(`/cart/items/${productId}`, { quantity }));
  const removeItem = (productId) =>
    mutateCart(productId, () => api.delete(`/cart/items/${productId}`));

  if (isLoading) {
    return <main className="page-wrap py-16"><div className="grid gap-8 lg:grid-cols-[1fr_360px]"><div className="h-96 animate-pulse rounded-3xl bg-sand" /><div className="h-72 animate-pulse rounded-3xl bg-sand" /></div></main>;
  }

  if (!cart?.items?.length) {
    return (
      <main className="page-wrap grid min-h-[70dvh] place-items-center py-16 text-center">
        <div><ShoppingBag className="mx-auto text-clay" size={40} /><p className="eyebrow mt-6 text-clay">Your bag</p><h1 className="mt-4 font-display text-6xl text-indigo">Room for something good.</h1><p className="mx-auto mt-5 max-w-md text-sm leading-6 text-muted">Your cart is empty. Explore considered products from independent makers.</p><Link className="button-primary mt-8" to="/shop">Browse the collection <ArrowRight size={16} /></Link>{error && <p className="mt-4 text-xs text-clay">{error}</p>}</div>
      </main>
    );
  }

  return (
    <main className="page-wrap py-14 lg:py-20">
      <div className="flex items-end justify-between border-b border-indigo/10 pb-8">
        <div><p className="eyebrow text-clay">Your bag</p><h1 className="mt-3 font-display text-6xl text-indigo">Cart.</h1></div>
        <button className="text-xs text-muted hover:text-clay" type="button" disabled={pendingProduct === 'all'} onClick={() => mutateCart('', () => api.delete('/cart'))}>Clear cart</button>
      </div>
      {error && <div className="form-alert" role="alert">{error}</div>}

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px] xl:gap-16">
        <section className="divide-y divide-indigo/10" aria-label="Cart items">
          {cart.items.map((item) => {
            const product = item.product;
            const isPending = pendingProduct === product._id;
            return (
              <article key={item._id} className={`grid grid-cols-[100px_1fr] gap-5 py-6 first:pt-0 sm:grid-cols-[140px_1fr] ${isPending ? 'opacity-55' : ''}`}>
                <Link className="aspect-[4/5] overflow-hidden rounded-2xl bg-sand" to={`/shop/${product.slug}`}>
                  {product.images?.[0]?.url ? <img className="h-full w-full object-cover" src={product.images[0].url} alt={product.images[0].alt || product.title} /> : null}
                </Link>
                <div className="flex min-w-0 flex-col">
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0"><p className="eyebrow truncate text-muted">{product.brand}</p><Link to={`/shop/${product.slug}`}><h2 className="mt-2 font-display text-2xl text-indigo">{product.title}</h2></Link></div>
                    <button className="grid h-9 w-9 shrink-0 place-items-center text-muted hover:text-clay" type="button" disabled={isPending} onClick={() => removeItem(product._id)} aria-label={`Remove ${product.title}`}><Trash2 size={16} /></button>
                  </div>
                  <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-5">
                    <div className="flex items-center rounded-full border border-indigo/15">
                      <button className="grid h-9 w-9 place-items-center" type="button" disabled={isPending || item.quantity <= 1} onClick={() => updateQuantity(product._id, item.quantity - 1)} aria-label={`Decrease ${product.title} quantity`}><Minus size={13} /></button>
                      <span className="w-7 text-center text-xs">{item.quantity}</span>
                      <button className="grid h-9 w-9 place-items-center" type="button" disabled={isPending || item.quantity >= product.stock || item.quantity >= 99} onClick={() => updateQuantity(product._id, item.quantity + 1)} aria-label={`Increase ${product.title} quantity`}><Plus size={13} /></button>
                    </div>
                    <div className="text-right"><p className="text-sm font-medium">{formatCurrency(item.lineTotal)}</p><p className="mt-1 text-[10px] text-muted">{formatCurrency(item.unitPrice)} each</p></div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="rounded-3xl bg-sand/70 p-7 lg:sticky lg:top-28">
          <h2 className="font-display text-3xl">Order summary</h2>
          <div className="mt-7 space-y-4 border-b border-indigo/10 pb-6 text-sm">
            <div className="flex justify-between"><span className="text-muted">Items ({cart.summary.itemCount})</span><span>{formatCurrency(cart.summary.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Shipping</span><span>Calculated next</span></div>
          </div>
          <div className="flex justify-between pt-6 font-medium"><span>Total</span><span className="font-display text-2xl">{formatCurrency(cart.summary.subtotal)}</span></div>
          <Link className="button-primary mt-7 w-full" to="/checkout">Continue to checkout <ArrowRight size={16} /></Link>
          <p className="mt-4 text-center text-[10px] leading-4 text-muted">Taxes and delivery are calculated securely at checkout.</p>
        </aside>
      </div>
    </main>
  );
}

export default CartPage;
