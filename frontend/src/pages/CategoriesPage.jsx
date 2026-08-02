import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useCategories } from '@/hooks/useCatalog.js';
import { getProducts } from '@/services/products.js';

function CategoriesPage() {
  const { categories, isLoading, error } = useCategories();
  const [categoryImages, setCategoryImages] = useState({});

  useEffect(() => {
    if (categories.length === 0) return;

    let cancelled = false;

    const fetchCategoryImages = async () => {
      const images = {};
      await Promise.all(
        categories.map(async (category) => {
          if (category.image?.url) {
            images[category.slug] = category.image.url;
            return;
          }
          try {
            const result = await getProducts({ category: category.slug, limit: 1 });
            if (result.products?.[0]?.images?.[0]?.url) {
              images[category.slug] = result.products[0].images[0].url;
            }
          } catch {
            // Skip on error — gradient fallback will be used
          }
        }),
      );
      if (!cancelled) setCategoryImages(images);
    };

    fetchCategoryImages();

    return () => {
      cancelled = true;
    };
  }, [categories]);

  return (
    <main className="page-wrap py-16 lg:py-24">
      <p className="eyebrow text-clay">Find your way in</p>
      <h1 className="mt-5 max-w-4xl font-display text-6xl leading-[.95] tracking-tight text-indigo md:text-8xl">Browse by ritual, room, and mood.</h1>
      {isLoading && <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="aspect-[4/3] animate-pulse rounded-3xl bg-sand" />)}</div>}
      {!isLoading && error && <div className="empty-state mt-14">{error}</div>}
      {!isLoading && !error && categories.length === 0 && <div className="empty-state mt-14">Categories will appear here once the collection is curated.</div>}
      {!isLoading && categories.length > 0 && (
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Link key={category._id} className="group relative aspect-[4/3] overflow-hidden rounded-3xl bg-sand" to={`/shop?category=${category.slug}`}>
              {(category.image?.url || categoryImages[category.slug]) ? <img className="h-full w-full object-cover transition duration-700 group-hover:scale-105" src={category.image?.url || categoryImages[category.slug]} alt={category.name} /> : <div className={`h-full bg-gradient-to-br ${index % 3 === 0 ? 'from-[#d0b486] to-[#8b6b49]' : index % 3 === 1 ? 'from-[#a9b09a] to-[#59634f]' : 'from-[#bd8a73] to-[#754938]'}`} />}
              <div className="absolute inset-0 bg-gradient-to-t from-indigo/75 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-canvas"><p className="eyebrow text-canvas/55">Collection {String(index + 1).padStart(2, '0')}</p><div className="mt-2 flex items-end justify-between"><h2 className="font-display text-4xl">{category.name}</h2><ArrowRight className="transition group-hover:translate-x-1" size={19} /></div></div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export default CategoriesPage;
