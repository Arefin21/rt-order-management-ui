import api from './api';
import { Order, OrderCreateRequest, ApiResponse } from './types';

export const orderService = {
  async getAllOrders(params?: {
    search?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ data: Order[]; count: number }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());

    const response = await api.get<ApiResponse<Order[]>>(
      `/auth/orders?${queryParams.toString()}`
    );
    return {
      data: response.data.data,
      count: response.data.count || response.data.data.length,
    };
  },

  async getOrder(id: number): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`/auth/orders/${id}`);
    return response.data.data;
  },

  async createOrder(orderData: OrderCreateRequest): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>('/auth/orders', orderData);
    return response.data.data;
  },

  async updateOrder(id: number, orderData: Partial<OrderCreateRequest> & { status?: string }): Promise<Order> {
    const response = await api.put<ApiResponse<Order>>(`/auth/orders/${id}`, orderData);
    return response.data.data;
  },

  async deleteOrder(id: number): Promise<void> {
    await api.delete(`/auth/orders/${id}`);
  },

  async placeOrder(orderData: OrderCreateRequest): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>('/auth/orders/place', orderData);
    return response.data.data;
  },
};

