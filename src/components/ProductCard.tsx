import React from 'react';
import type { ProductCardProps } from '../types/product';
import RatingStars from './RatingStars';

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
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
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="
            h-full w-full object-cover object-center
            transition-transform duration-500 ease-out
            group-hover:scale-105
          "
          loading="lazy"
        />
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
            disabled={false}
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
