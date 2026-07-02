import type { Product } from '../data/products';

export type CartItem = {
  productId: number;
  size: string;
  quantity: number;
};

export type CheckoutForm = {
  fullName: string;
  email: string;
  phone: string;
  apartment: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  paymentMethod: 'COD' | 'EasyPaisa' | 'Bank Transfer';
  paymentScreenshot: string;
};

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export type OrderRecord = CheckoutForm & {
  orderNumber: string;
  placedAt: string;
  items: Array<CartItem & { product: Product }>;
  total: number;
  status?: OrderStatus;
};

export type AdminSession = {
  email: string;
};

export type ManagedProduct = Product;

export type ProductDraft = {
  id?: number;
  slug: string;
  name: string;
  price: number;
  description: string;
  details: string[];
  fabric: string;
  sizes: string[];
  color: string;
  collection: string;
  images: string[];
  featured?: boolean;
  bestSeller?: boolean;
};