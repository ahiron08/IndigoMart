import { motion } from 'framer-motion';

function OurStoryPage() {
  return (
    <main className="page-wrap py-20 lg:py-28">
      <motion.div
        className="mx-auto max-w-3xl text-center"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65 }}
      >
        <p className="eyebrow text-clay">Our story</p>
        <h1 className="mt-6 font-display text-[clamp(3rem,7vw,6rem)] leading-[.9] tracking-[-.045em] text-indigo">
          Crafted by People.<br />
          <em className="font-normal text-clay">Connected by IndigoMart.</em>
        </h1>
      </motion.div>

      <motion.div
        className="mx-auto mt-16 max-w-2xl space-y-6 text-base leading-8 text-muted md:text-lg md:leading-9"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.12 }}
      >
        <p className="font-display text-2xl leading-snug text-indigo md:text-3xl">
          IndigoMart was founded with one simple belief:
        </p>
        <p className="font-display text-2xl leading-snug text-indigo md:text-3xl">
          Every artisan deserves a global audience.
        </p>
        <p>
          Across India, thousands of talented craftsmen, artists and independent creators produce extraordinary work, yet many struggle to reach customers beyond their local markets.
        </p>
        <p>
          We built IndigoMart to bridge that gap.
        </p>
        <p>
          Our platform empowers creators to sell directly to customers while preserving authenticity, fair pricing and traditional craftsmanship.
        </p>
        <p>
          Every order supports a real maker, a real family and a real story.
        </p>
        <p>
          Whether you're purchasing a painting, handcrafted décor, textiles, jewellery or everyday essentials, you're buying directly from people who create with passion.
        </p>
        <p className="pt-4 font-display text-2xl leading-snug text-indigo md:text-3xl">
          Closer to the maker. Closer to the story.
        </p>
      </motion.div>
    </main>
  );
}

export default OurStoryPage;