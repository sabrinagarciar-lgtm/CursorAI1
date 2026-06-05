export type ProductCategory =
  | 'Electronics'
  | 'Apparel'
  | 'Home'
  | 'Sports'
  | 'Accessories';

/** Merchandising priority used for catalog filters (Exercise 5 E2E). */
export type ProductPriority = 'High' | 'Medium' | 'Low';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  rating: number;
  reviewCount?: number;
  category: ProductCategory;
  priority: ProductPriority;
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
