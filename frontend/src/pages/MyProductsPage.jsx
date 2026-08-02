import { Plus, Search, SlidersHorizontal, Trash2, Eye, EyeOff, Copy, Pencil, MoreVertical } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '@/services/api.js';
import { formatCurrency, getProductPrice } from '@/utils/format.js';

function MyProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [actionMenu, setActionMenu] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError('');

    api.get('products/mine', { signal: controller.signal })
      .then((response) => {
        setProducts(response.data.data.products || []);
        setIsLoading(false);
      })
      .catch((err) => {
        if (err.code !== 'ERR_CANCELED') {
          setError('Could not load your products.');
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((product) =>
        product.title?.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
        product.category?.name?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((product) => {
        if (statusFilter === 'published') return product.status === 'published' && product.isApproved;
        if (statusFilter === 'draft') return product.status === 'draft';
        if (statusFilter === 'hidden') return product.status === 'hidden';
        if (statusFilter === 'deleted') return product.isDeleted;
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'price-asc':
          return (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price);
        case 'price-desc':
          return (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price);
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'popularity':
          return (b.orderCount || 0) - (a.orderCount || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [products, searchQuery, statusFilter, sortBy]);

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product? This action can be undone from the admin panel.')) return;

    try {
      await api.delete('products/' + productId);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      setActionMenu(null);
    } catch (err) {
      alert('Could not delete product. Please try again.');
    }
  };

  const handleToggleVisibility = async (product) => {
    try {
      const isHidden = product.status === 'hidden';
      const endpoint = isHidden
        ? 'products/' + product._id + '/unhide'
        : 'products/' + product._id + '/hide';
      const response = await api.patch(endpoint);
      const updatedProduct = response.data.data.product;
      setProducts((prev) => prev.map((p) => (p._id === product._id ? updatedProduct : p)));
      setActionMenu(null);
    } catch (err) {
      alert('Could not update product visibility. Please try again.');
    }
  };

  const handleDuplicate = async (productId) => {
    try {
      const response = await api.post('products/' + productId + '/duplicate');
      setProducts((prev) => [response.data.data.product, ...prev]);
      setActionMenu(null);
    } catch (err) {
      alert('Could not duplicate product. Please try again.');
    }
  };

  const getStatusBadge = (product) => {
    if (product.isDeleted) return <span className="status-pill bg-clay/15 text-clay">Deleted</span>;
    if (product.status === 'published' && product.isApproved) return <span className="status-pill bg-emerald-100 text-emerald-700">Published</span>;
    if (product.status === 'hidden') return <span className="status-pill bg-amber-100 text-amber-700">Hidden</span>;
    return <span className="status-pill bg-indigo/10 text-indigo">Draft</span>;
  };

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-indigo/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow text-clay">Inventory</p>
          <h1 className="mt-3 font-display text-5xl text-indigo">My Products</h1>
          <p className="mt-2 text-sm text-muted">Manage your product catalog, pricing, and availability.</p>
        </div>
        <Link className="button-primary shrink-0" to="/seller/my-products/new">
          <Plus size={17} /> Add Product
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={17} />
          <input
            className="form-input pl-11"
            type="search"
            placeholder="Search products by name, brand, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <select className="rounded-full border border-indigo/15 bg-transparent px-4 py-2.5 text-xs outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="hidden">Hidden</option>
            <option value="deleted">Deleted</option>
          </select>
          <select className="rounded-full border border-indigo/15 bg-transparent px-4 py-2.5 text-xs outline-none" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="views">Most Viewed</option>
            <option value="popularity">Most Popular</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-indigo/10 bg-canvas p-5 animate-pulse">
              <div className="aspect-[4/5] rounded-xl bg-sand" />
              <div className="mt-4 h-4 w-3/4 rounded bg-sand" />
              <div className="mt-2 h-3 w-1/2 rounded bg-sand" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="empty-state my-20">
          <p className="font-display text-3xl">Could not load products.</p>
          <p className="mt-3 text-sm text-muted">{error}</p>
        </div>
      )}

      {!isLoading && !error && filteredProducts.length === 0 && (
        <div className="empty-state my-20">
          <p className="font-display text-3xl">No products found.</p>
          <p className="mt-3 text-sm text-muted">
            {products.length === 0 ? 'Get started by adding your first product.' : 'Try adjusting your search or filters.'}
          </p>
          {products.length === 0 && (
            <Link className="button-primary mt-7" to="/seller/my-products/new">
              <Plus size={17} /> Add Your First Product
            </Link>
          )}
        </div>
      )}

      {!isLoading && !error && filteredProducts.length > 0 && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => {
            const image = product.images?.[0];
            const price = getProductPrice(product);

            return (
              <article key={product._id} className="group rounded-2xl border border-indigo/10 bg-canvas overflow-hidden">
                <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                  <Link to={`/shop/${product.slug || product._id}`} target="_blank" aria-label={`View ${product.title}`}>
                    {image?.url ? (
                      <img className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" src={image.url} alt={image.alt || product.title} loading="lazy" />
                    ) : (
                      <div className="grid h-full place-items-center bg-gradient-to-br from-sand to-[#d8cab0]">
                        <div className="h-2/5 w-2/5 rounded-[48%_52%_44%_56%] bg-canvas/80 shadow-xl" />
                      </div>
                    )}
                  </Link>
                  <div className="absolute top-3 right-3">
                    <button
                      className="grid h-9 w-9 place-items-center rounded-full bg-canvas/90 text-indigo backdrop-blur"
                      type="button"
                      onClick={() => setActionMenu(actionMenu === product._id ? null : product._id)}
                      aria-label="Product actions"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {actionMenu === product._id && (
                      <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-indigo/10 bg-canvas shadow-xl">
                        <Link to={`/seller/my-products/${product._id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-sand/60" onClick={() => setActionMenu(null)}>
                          <Pencil size={15} /> Edit
                        </Link>
                        <button className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-sand/60" type="button" onClick={() => handleDuplicate(product._id)}>
                          <Copy size={15} /> Duplicate
                        </button>
                        <button className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-sand/60" type="button" onClick={() => handleToggleVisibility(product)}>
                          {product.status === 'hidden' ? <Eye size={15} /> : <EyeOff size={15} />}
                          {product.status === 'hidden' ? 'Unhide' : 'Hide'}
                        </button>
                        <button className="flex w-full items-center gap-3 px-4 py-3 text-sm text-clay hover:bg-clay/10" type="button" onClick={() => handleDelete(product._id)}>
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3">{getStatusBadge(product)}</div>
                </div>
                <div className="p-5">
                  <p className="truncate font-mono text-[9px] uppercase tracking-[.18em] text-muted">{product.brand}</p>
                  <Link to={`/seller/my-products/${product._id}`}>
                    <h3 className="mt-1 truncate font-display text-xl text-indigo transition group-hover:text-clay">{product.title}</h3>
                  </Link>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{formatCurrency(price)}</span>
                      {product.discountPrice != null && <span className="text-xs text-muted line-through">{formatCurrency(product.price)}</span>}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-indigo/10 pt-3 text-xs text-muted">
                    <span>Stock: {product.stock}</span>
                    <span>Views: {product.views || 0}</span>
                    <span>Orders: {product.orderCount || 0}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link to={`/seller/my-products/${product._id}`} className="button-secondary flex-1 min-h-9">
                      <Pencil size={15} /> Edit
                    </Link>
                    <button className="button-secondary min-h-9 px-3" type="button" onClick={() => handleToggleVisibility(product)} aria-label={product.status === 'hidden' ? 'Unhide product' : 'Hide product'}>
                      {product.status === 'hidden' ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button className="button-secondary min-h-9 px-3 text-clay hover:bg-clay/10" type="button" onClick={() => handleDelete(product._id)} aria-label="Delete product">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {actionMenu && <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />}
    </div>
  );
}

export default MyProductsPage;