import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Handshake, Leaf, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getProducts } from '@/services/products.js';
import { formatCurrency, getProductPrice } from '@/utils/format.js';

function LandingPage() {
  const [newProducts, setNewProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getProducts({ sort: 'newest', limit: 4 })
      .then((result) => setNewProducts(result.products))
      .catch(() => setNewProducts([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main>
      <section className="page-wrap grid min-h-[calc(100dvh-4.5rem)] items-center gap-10 py-16 lg:grid-cols-[1.04fr_.96fr] lg:py-20">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
          <p className="eyebrow text-clay">CRAFTED WITH PURPOSE</p>
          <h1 className="mt-6 max-w-3xl font-display text-[clamp(4rem,9vw,8.5rem)] leading-[.84] tracking-[-.055em] text-indigo">
            Discover India's Finest<br /><em className="font-normal text-clay">Handmade</em> Creations.
          </h1>
          <p className="mt-8 max-w-lg text-base leading-7 text-muted md:text-lg">
            IndigoMart brings authentic handmade crafts, décor, textiles, paintings, and unique creations from independent artisans across India to your home.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link className="button-primary" to="/shop">Explore the collection <ArrowRight size={17} /></Link>
            <Link className="button-secondary" to="/signup/seller">Sell with us</Link>
          </div>
        </motion.div>

        <motion.div
          className="hero-object relative mx-auto aspect-[4/5] w-full max-w-[570px] overflow-hidden rounded-[2rem] bg-indigo"
          initial={false} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.12 }}
        >
          <div className="absolute left-[14%] top-[14%] h-[52%] w-[50%] rotate-[-9deg] rounded-[48%_52%_46%_54%] bg-accent" />
          <div className="absolute bottom-[13%] right-[10%] h-[47%] w-[47%] rotate-[12deg] rounded-[45%_55%_58%_42%] bg-clay" />
          <div className="absolute left-[38%] top-[34%] h-[45%] w-[36%] rounded-t-full rounded-b-[42%] border border-white/30 bg-canvas/85 shadow-2xl backdrop-blur" />
          <p className="absolute bottom-7 left-8 font-mono text-[10px] uppercase tracking-[.25em] text-canvas/60">Edition 01 · made nearby</p>
        </motion.div>
      </section>

      <section className="border-y border-indigo/10 bg-sand/70">
        <div className="page-wrap grid gap-6 py-7 text-sm text-indigo/70 sm:grid-cols-3">
          {[[BadgeCheck, 'Independent makers'], [PackageCheck, 'Considered delivery'], [Leaf, 'Small-batch thinking']].map(([Icon, label]) => (
            <div key={label} className="flex items-center gap-3 sm:justify-center"><Icon size={17} className="text-clay" /><span>{label}</span></div>
          ))}
        </div>
      </section>

      <section className="page-wrap py-24 lg:py-32">
        <div className="section-heading">
          <div><p className="eyebrow text-clay">Why IndigoMart</p><h2 className="section-title">Why Shop with IndigoMart?</h2></div>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Leaf, 'Authentic Products', 'Every product comes directly from independent creators and trusted sellers.'],
            [Handshake, 'Support Local Artisans', 'Every purchase contributes to the livelihood of skilled craftsmen and artists.'],
            [Truck, 'Pan India Delivery', 'Reliable delivery across India with secure packaging.'],
            [ShieldCheck, 'Safe Payments', 'Protected transactions and customer-first support.'],
          ].map(([Icon, title, description]) => (
            <div key={title} className="rounded-3xl border border-indigo/10 bg-sand/40 p-7 transition-transform duration-300 hover:-translate-y-1">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo text-canvas"><Icon size={22} /></div>
              <h3 className="mt-5 font-display text-xl text-indigo">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-indigo py-24 text-canvas lg:py-32">
        <div className="page-wrap">
          <div className="section-heading border-canvas/15">
            <div><p className="eyebrow text-accent">Freshly considered</p><h2 className="section-title text-canvas">New to IndigoMart.</h2></div>
            <Link className="text-link text-canvas" to="/shop">Shop all <ArrowRight size={15} /></Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-6">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index}>
                    <div className="aspect-[4/5] rounded-2xl bg-canvas/10" />
                    <div className="mt-4 h-3 w-1/3 rounded bg-canvas/10" />
                    <div className="mt-2 h-4 w-2/3 rounded bg-canvas/10" />
                  </div>
                ))
              : newProducts.map((product) => {
                  const image = product.images?.[0];
                  return (
                    <Link key={product._id} to={`/shop/${product.slug || product._id}`} className="group">
                      <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-canvas/10 transition-transform duration-500 group-hover:-translate-y-1">
                        {image?.url ? (
                          <img className="h-full w-full object-cover" src={image.url} alt={image.alt || product.title} loading="lazy" />
                        ) : (
                          <div className="grid h-full place-items-center"><div className="h-2/5 w-2/5 rounded-[50%_45%_52%_48%] bg-canvas/70 shadow-xl" /></div>
                        )}
                      </div>
                      <p className="mt-4 font-mono text-[9px] uppercase tracking-[.18em] text-canvas/45">{product.brand}</p>
                      <div className="mt-1 flex items-start justify-between gap-3"><h3 className="font-display text-lg">{product.title}</h3><span className="text-xs text-canvas/60">{formatCurrency(getProductPrice(product))}</span></div>
                    </Link>
                  );
                })}
          </div>
        </div>
      </section>

      <section className="page-wrap py-24 text-center lg:py-32">
        <p className="eyebrow text-clay">Notes from the source</p>
        <blockquote className="mx-auto mt-7 max-w-4xl font-display text-4xl leading-tight text-indigo md:text-6xl">
          “Every handmade creation carries a story. We simply help it find its next home.”
        </blockquote>
        <p className="mt-7 text-sm text-muted">Every purchase supports an artist, preserves traditional craftsmanship, and celebrates creativity</p>
      </section>
    </main>
  );
}

export default LandingPage;
