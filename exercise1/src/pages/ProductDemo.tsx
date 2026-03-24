import React, { useCallback, useState } from 'react';
import ProductCard from '../components/ProductCard';
import type { Product } from '../types/product';

const DEMO_PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'Wireless Bluetooth Headphones',
    description: 'Premium over-ear headphones with active noise cancellation and 30-hour battery life. Perfect for commuting and travel.',
    price: 149.99,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    rating: 4.5,
    reviewCount: 2847,
  },
  {
    id: '2',
    title: 'Minimalist Watch',
    description: 'Sleek analog watch with genuine leather strap. Water-resistant and crafted with premium materials for everyday elegance.',
    price: 89.0,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    rating: 4.8,
    reviewCount: 562,
  },
  {
    id: '3',
    title: 'Organic Cotton T-Shirt',
    description: 'Soft, sustainable cotton tee in classic fit. Made from 100% certified organic cotton. Available in multiple colors.',
    price: 34.99,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    rating: 4.2,
    reviewCount: 1203,
  },
  {
    id: '4',
    title: 'Portable Power Bank',
    description: '20000mAh high-capacity power bank with fast charging. Compact design with multiple USB ports for all your devices.',
    price: 49.99,
    imageUrl: 'https://images.unsplash.com/photo-1609099516989-56e9a9b8a2e0?w=400&h=400&fit=crop',
    rating: 4.6,
    reviewCount: 1892,
  },
  {
    id: '5',
    title: 'Ceramic Coffee Mug',
    description: 'Handcrafted ceramic mug with ergonomic handle. Microwave and dishwasher safe. Holds 12oz of your favorite brew.',
    price: 24.99,
    imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop',
    rating: 4.9,
    reviewCount: 423,
  },
  {
    id: '6',
    title: 'Running Shoes',
    description: 'Lightweight performance running shoes with responsive cushioning. Engineered for speed and comfort on every mile.',
    price: 129.99,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    rating: 4.4,
    reviewCount: 3156,
  },
];

const ProductDemo: React.FC = () => {
  const [cartItems, setCartItems] = useState<string[]>([]);

  const handleAddToCart = useCallback((productId: string) => {
    setCartItems((prev) => [...prev, productId]);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
            Product Showcase
          </h1>
          <p className="mt-2 text-slate-600">
            Browse our selection and add your favorites to the cart
          </p>
          {cartItems.length > 0 && (
            <p
              className="mt-3 text-sm font-medium text-indigo-600"
              role="status"
              aria-live="polite"
            >
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart
            </p>
          )}
        </header>

        <main className="overflow-visible">
          <div
            className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3"
            role="list"
          >
            {DEMO_PRODUCTS.map((product) => (
              <div key={product.id} className="overflow-visible pt-1" role="listitem">
                <ProductCard
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProductDemo;
