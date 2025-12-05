import api from './api';
import { ProductWithStock, ApiResponse } from './types';

export const productService = {
  async searchProducts(query: string): Promise<ProductWithStock[]> {
    const response = await api.get<ApiResponse<ProductWithStock[]>>(
      `/auth/products/search?query=${encodeURIComponent(query)}`
    );
    return response.data.data;
  },
};

