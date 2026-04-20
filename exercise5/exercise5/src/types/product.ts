export type ProductCategory =
  | 'Electronics'
  | 'Apparel'
  | 'Home'
  | 'Sports'
  | 'Accessories';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  rating: number;
  reviewCount?: number;
  category: ProductCategory;
}

export interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
}

export interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  reviewCount?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}
