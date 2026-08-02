function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid" aria-label="Loading products" role="status">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[4/5] rounded-2xl bg-sand" />
          <div className="mt-4 h-2 w-20 rounded bg-sand" />
          <div className="mt-3 h-5 w-3/4 rounded bg-sand" />
        </div>
      ))}
    </div>
  );
}

export default ProductGridSkeleton;
