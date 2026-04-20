export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  rating: number;
  reviewCount?: number;
}

export interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
}

export interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  reviewCount?: number;
  /** Responsive size: scales with sm/lg breakpoints. Use "sm" for product cards. */
  size?: 'xs' | 'sm' | 'md' | 'lg';
}
