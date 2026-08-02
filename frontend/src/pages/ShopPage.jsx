import { SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import ProductCard from '@/components/catalog/ProductCard.jsx';
import ProductGridSkeleton from '@/components/catalog/ProductGridSkeleton.jsx';
import { useCategories, useProducts } from '@/hooks/useCatalog.js';

function ShopPage({ searchMode = false }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, pagination, isLoading, error } = useProducts(searchParams);
  const { categories } = useCategories();

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const applyFilters = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = new URLSearchParams(searchParams);
    ['category', 'subcategory', 'brand', 'minPrice', 'maxPrice', 'minRating', 'productCondition', 'seller', 'tags'].forEach((key) => {
      const value = form.get(key)?.toString().trim();
      if (value) next.set(key, value); else next.delete(key);
    });
    ['inStock', 'availability', 'discount'].forEach((key) => {
      if (form.get(key)) next.set(key, form.get(key)); else next.delete(key);
    });
    next.delete('page');
    setSearchParams(next);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    const search = searchParams.get('search');
    setSearchParams(search ? { search } : {});
  };

  return (
    <main className="page-wrap py-14 lg:py-20">
      <div className="flex flex-col gap-7 border-b border-indigo/10 pb-9 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow text-clay">{searchMode ? 'Discover' : 'The shop'}</p>
          <h1 className="mt-4 font-display text-6xl tracking-tight text-indigo md:text-8xl">
            {searchMode ? 'Search IndigoMart.' : 'Made with intention.'}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-muted">
            {searchMode ? 'Find a maker, material, ritual, or object.' : 'Independent goods selected for character, usefulness, and staying power.'}
          </p>
        </div>
        <form className="flex w-full max-w-lg gap-2" onSubmit={(event) => { event.preventDefault(); updateParam('search', new FormData(event.currentTarget).get('search').toString().trim()); }}>
          <input className="form-input" name="search" defaultValue={searchParams.get('search') || ''} placeholder="Search products and makers" aria-label="Search products" />
          <button className="button-primary shrink-0" type="submit">Search</button>
        </form>
      </div>

      <div className="mt-7 flex items-center justify-between gap-4">
        <button className="button-secondary min-h-10 px-4" type="button" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={15} /> Filters</button>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted sm:inline">{pagination?.total ?? 0} pieces</span>
          <select className="rounded-full border border-indigo/15 bg-transparent px-4 py-2.5 text-xs outline-none" value={searchParams.get('sort') || 'newest'} onChange={(event) => updateParam('sort', event.target.value)} aria-label="Sort products">
            <option value="newest">Newest</option><option value="oldest">Oldest</option>
            <option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option>
            <option value="best-selling">Best selling</option><option value="rating">Top rated</option>
          </select>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 bg-indigo/30 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFiltersOpen(false); }}>
          <aside className="ml-auto h-full w-full max-w-md overflow-y-auto bg-canvas p-7 shadow-2xl" aria-label="Product filters">
            <div className="flex items-center justify-between"><h2 className="font-display text-3xl">Refine the shop</h2><button className="icon-button" type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={19} /></button></div>
            <form className="mt-10 space-y-6" onSubmit={applyFilters}>
              <label className="block text-xs font-medium">Category<select className="form-input mt-2" name="category" defaultValue={searchParams.get('category') || ''}><option value="">All categories</option>{categories.map((category) => <option key={category._id} value={category.slug}>{category.name}</option>)}</select></label>
              <label className="block text-xs font-medium">Subcategory<input className="form-input mt-2" name="subcategory" defaultValue={searchParams.get('subcategory') || ''} placeholder="e.g., Wireless" /></label>
              <label className="block text-xs font-medium">Brand<input className="form-input mt-2" name="brand" defaultValue={searchParams.get('brand') || ''} placeholder="Brand name" /></label>
              <label className="block text-xs font-medium">Seller/Creator<input className="form-input mt-2" name="seller" defaultValue={searchParams.get('seller') || ''} placeholder="Seller name or ID" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-medium">Minimum price<input className="form-input mt-2" name="minPrice" type="number" min="0" defaultValue={searchParams.get('minPrice') || ''} placeholder="₹0" /></label>
                <label className="text-xs font-medium">Maximum price<input className="form-input mt-2" name="maxPrice" type="number" min="0" defaultValue={searchParams.get('maxPrice') || ''} placeholder="Any" /></label>
              </div>
              <label className="block text-xs font-medium">Minimum Rating<select className="form-input mt-2" name="minRating" defaultValue={searchParams.get('minRating') || ''}><option value="">Any rating</option><option value="4">4+ stars</option><option value="3">3+ stars</option><option value="2">2+ stars</option><option value="1">1+ star</option></select></label>
              <label className="block text-xs font-medium">Condition<select className="form-input mt-2" name="productCondition" defaultValue={searchParams.get('productCondition') || ''}><option value="">Any condition</option><option value="new">New</option><option value="used">Used</option><option value="refurbished">Refurbished</option></select></label>
              <label className="block text-xs font-medium">Tags (comma-separated)<input className="form-input mt-2" name="tags" defaultValue={searchParams.get('tags') || ''} placeholder="gaming, wireless, bluetooth" /></label>
              <label className="flex items-center gap-3 text-sm"><input className="accent-indigo" name="inStock" type="checkbox" defaultChecked={searchParams.get('inStock') === 'true'} /> In stock only</label>
              <label className="flex items-center gap-3 text-sm"><input className="accent-indigo" name="availability" type="radio" value="in_stock" defaultChecked={searchParams.get('availability') === 'in_stock'} /> In stock</label>
              <label className="flex items-center gap-3 text-sm"><input className="accent-indigo" name="availability" type="radio" value="out_of_stock" defaultChecked={searchParams.get('availability') === 'out_of_stock'} /> Out of stock</label>
              <label className="flex items-center gap-3 text-sm"><input className="accent-indigo" name="discount" type="checkbox" defaultChecked={searchParams.get('discount') === 'true'} /> On sale</label>
              <div className="flex gap-3 pt-4"><button className="button-primary flex-1" type="submit">Apply filters</button><button className="button-secondary" type="button" onClick={clearFilters}>Clear</button></div>
            </form>
          </aside>
        </div>
      )}

      <section className="mt-10">
        {isLoading && <ProductGridSkeleton />}
        {!isLoading && error && <div className="empty-state"><p className="font-display text-3xl">The shelves are out of reach.</p><p className="mt-3 text-sm text-muted">{error}</p></div>}
        {!isLoading && !error && products.length === 0 && <div className="empty-state"><p className="font-display text-3xl">Nothing matched—yet.</p><p className="mt-3 text-sm text-muted">Try a broader search or clear a filter.</p><button className="button-secondary mt-6" type="button" onClick={clearFilters}>Clear filters</button></div>}
        {!isLoading && products.length > 0 && <div className="product-grid">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>}
      </section>

      {pagination?.pages > 1 && (
        <nav className="mt-14 flex items-center justify-center gap-4" aria-label="Product pages">
          <button className="button-secondary min-h-10" type="button" disabled={pagination.page <= 1} onClick={() => updateParam('page', String(pagination.page - 1))}>Previous</button>
          <span className="text-xs text-muted">Page {pagination.page} of {pagination.pages}</span>
          <button className="button-secondary min-h-10" type="button" disabled={pagination.page >= pagination.pages} onClick={() => updateParam('page', String(pagination.page + 1))}>Next</button>
        </nav>
      )}
    </main>
  );
}

export default ShopPage;