export interface Product {
  id: number;
  name: string;
  barcode: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
}

export interface Stock {
  id: number;
  product_id: number;
  sku: string;
  sale_price: string;
  purchase_price: string;
  quantity: number;
  last_update_at: string;
}

export interface ProductWithStock extends Product {
  stock?: Stock;
  total_available_quantity?: number;
}

export interface OrderProduct {
  id: number;
  order_id: number;
  product_id: number;
  stock_id: number;
  sale_price: string;
  sub_total: string;
  profit: string;
  product?: Product;
  stock?: Stock;
}

export interface Order {
  id: number;
  invoice_number: string;
  date_time: string;
  total_amount: string;
  customer_name: string;
  status: 'Pending' | 'Processing' | 'Delivered' | 'Cancelled';
  created_at?: string;
  updated_at?: string;
  order_products?: OrderProduct[];
}

export interface OrderCreateRequest {
  customer_name: string;
  products: {
    product_id: number;
    stock_id: number;
    quantity: number;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
}

