export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: "admin" | "customer";
}

export type ProductCategory =
  | "Electronics"
  | "Apparel"
  | "Home"
  | "Sports"
  | "Accessories"
  | "general"
  | "electronics"
  | "clothing"
  | "accessories"
  | "home";

export type ProductPriority = "High" | "Medium" | "Low";

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  rating: number;
  reviewCount?: number;
  category?: ProductCategory | string;
  priority?: ProductPriority;
}

export interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
}

export interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  reviewCount?: number;
  size?: "xs" | "sm" | "md" | "lg";
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface DiscountValidation {
  valid: boolean;
  code?: string;
  discount_amount?: number;
  message: string;
}

export interface CheckoutPayload {
  customer_name: string;
  customer_email: string;
  discount_code?: string;
  items: Array<{ product_id: string; quantity: number }>;
  payment: {
    card_number: string;
    expiry: string;
    cvv: string;
    cardholder_name: string;
  };
}

export interface OrderItem {
  product_id: string;
  title: string;
  quantity: number;
  unit_price: number;
  line_total?: number;
}

export interface Order {
  order_id: string;
  user_id?: number | null;
  status: string;
  customer_name: string;
  customer_email: string;
  subtotal: number;
  discount_code?: string | null;
  discount_amount: number;
  total: number;
  payment_last4: string;
  created_at?: string;
  items: OrderItem[];
  email_sent?: boolean;
  email_preview?: {
    subject: string;
    to: string;
  };
}
