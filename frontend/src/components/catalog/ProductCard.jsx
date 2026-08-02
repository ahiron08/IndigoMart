import { Heart } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext.jsx';
import api from '@/services/api.js';
import { formatCurrency, getProductPrice } from '@/utils/format.js';

function ProductCard({ product }) {
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const image = product.images?.[0];
  const price = getProductPrice(product);

  const saveProduct = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (saved || isSaving) return;
    setIsSaving(true);
    try {
      await api.post(`/wishlist/${product._id}`);
      setSaved(true);
    } catch {
      setSaved(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="group flex h-full min-w-0 flex-col rounded-2xl border border-indigo/10 bg-canvas overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-sand">
        <Link to={`/shop/${product.slug || product._id}`} aria-label={`View ${product.title}`} className="block h-full w-full">
          {image?.url ? (
            <img
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
              src={image.url}
              alt={image.alt || product.title}
              loading="lazy"
            />
          ) : (
            <div className="grid h-full place-items-center bg-gradient-to-br from-sand to-[#d8cab0]">
              <div className="h-2/5 w-2/5 rounded-[48%_52%_44%_56%] bg-canvas/80 shadow-xl" />
            </div>
          )}
        </Link>
        <button className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-canvas/90 text-indigo backdrop-blur" type="button" onClick={saveProduct} disabled={isSaving} aria-pressed={saved} aria-label={`Save ${product.title}`}>
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
        {product.stock === 0 && <span className="absolute bottom-3 left-3 status-pill bg-canvas">Sold out</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="truncate font-mono text-[9px] uppercase tracking-[.18em] text-muted">{product.brand}</p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <Link className="min-w-0" to={`/shop/${product.slug || product._id}`}>
            <h2 className="truncate font-display text-xl text-indigo transition group-hover:text-clay">{product.title}</h2>
          </Link>
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between gap-2 text-xs">
          <span className="font-medium">{formatCurrency(price)}</span>
          {product.discountPrice != null && <span className="text-muted line-through">{formatCurrency(product.price)}</span>}
        </div>
        {product.ratings?.count > 0 && <p className="mt-2 text-[11px] text-muted">★ {product.ratings.average.toFixed(1)} · {product.ratings.count} reviews</p>}
      </div>
    </article>
  );
}

export default ProductCard;
