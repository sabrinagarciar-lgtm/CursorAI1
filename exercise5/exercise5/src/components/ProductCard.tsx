import React, { useEffect, useMemo, useState } from 'react';
import type { ProductCardProps } from '../types/product';
import RatingStars from './RatingStars';

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [imageSrc, setImageSrc] = useState(product.imageUrl);

  useEffect(() => {
    setImageSrc(product.imageUrl);
  }, [product.imageUrl]);

  const fallbackImage = useMemo(() => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#e2e8f0" />
            <stop offset="100%" stop-color="#cbd5e1" />
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#bg)" />
        <rect x="120" y="92" width="160" height="220" rx="26" fill="#334155" />
        <rect x="140" y="118" width="120" height="12" rx="6" fill="#94a3b8" />
        <rect x="145" y="220" width="110" height="48" rx="10" fill="#1e293b" />
        <circle cx="176" cy="244" r="7" fill="#22c55e" />
        <circle cx="200" cy="244" r="7" fill="#22c55e" />
        <circle cx="224" cy="244" r="7" fill="#22c55e" />
        <text x="200" y="350" text-anchor="middle" fill="#0f172a" font-family="Arial, sans-serif" font-size="22">Product</text>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, []);

  const handleAddToCart = () => {
    onAddToCart?.(product.id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <article
      className="
        group relative flex flex-col overflow-hidden rounded-xl
        bg-white shadow-md ring-1 ring-slate-200/80
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:shadow-xl hover:ring-slate-300/90
        focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2
      "
      aria-labelledby={`product-title-${product.id}`}
      itemScope
      itemType="https://schema.org/Product"
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={imageSrc}
          alt={product.title}
          className="
            h-full w-full object-cover object-center
            transition-transform duration-500 ease-out
            group-hover:scale-105
          "
          loading="lazy"
          onError={() => setImageSrc(fallbackImage)}
        />
        <div
          className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/80"
          aria-label={`Category: ${product.category}`}
        >
          {product.category}
        </div>
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h2
          id={`product-title-${product.id}`}
          className="text-lg font-semibold text-slate-800 line-clamp-2 tracking-tight sm:text-xl"
          itemProp="name"
        >
          {product.title}
        </h2>

        <p
          className="mt-2 line-clamp-2 text-sm text-slate-600 leading-relaxed"
          itemProp="description"
        >
          {product.description}
        </p>

        <div className="mt-3">
          <div className="sm:hidden">
            <RatingStars
              rating={product.rating}
              reviewCount={product.reviewCount}
              size="xs"
            />
          </div>
          <div className="hidden sm:block lg:hidden">
            <RatingStars
              rating={product.rating}
              reviewCount={product.reviewCount}
              size="sm"
            />
          </div>
          <div className="hidden lg:block">
            <RatingStars
              rating={product.rating}
              reviewCount={product.reviewCount}
              size="md"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-1 flex-col justify-end gap-3">
          <p className="text-xl font-bold text-indigo-600" itemProp="offers" itemScope itemType="https://schema.org/Offer">
            <span itemProp="price" content={product.price.toString()}>
              {formatPrice(product.price)}
            </span>
          </p>

          <button
            type="button"
            onClick={handleAddToCart}
            className="
              w-full rounded-lg bg-indigo-600 px-4 py-3
              font-semibold text-white
              transition-all duration-200 ease-out
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              active:scale-[0.98]
              disabled:cursor-not-allowed disabled:opacity-50
              hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25
            "
            aria-label={`Add ${product.title} to cart`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
