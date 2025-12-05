'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProductAutocomplete from '@/components/ProductAutocomplete';
import { ProductWithStock, Order } from '@/lib/types';
import { orderService } from '@/lib/orders';

interface CartItem {
  product: ProductWithStock;
  quantity: number;
  stockId: number;
}

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = Number(params.id);

  const [customerName, setCustomerName] = useState('');
  const [status, setStatus] = useState<'Pending' | 'Processing' | 'Delivered' | 'Cancelled'>('Pending');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setFetching(true);
    try {
      const order = await orderService.getOrder(orderId);
      setCustomerName(order.customer_name);
      setStatus(order.status);

      // Convert order products to cart items
      const cartItems: CartItem[] = (order.order_products || []).map((op) => ({
        product: {
          id: op.product?.id || op.product_id,
          name: op.product?.name || '',
          barcode: op.product?.barcode || '',
          slug: '',
          stock: op.stock || undefined,
          total_available_quantity: op.stock?.quantity || 0,
        } as ProductWithStock,
        quantity: 1, // We'll need to calculate this from sub_total / sale_price
        stockId: op.stock_id,
      }));

      // Calculate quantities from order products
      const quantities: { [key: number]: number } = {};
      order.order_products?.forEach((op) => {
        const qty = Math.round(parseFloat(op.sub_total) / parseFloat(op.sale_price));
        quantities[op.stock_id] = (quantities[op.stock_id] || 0) + qty;
      });

      // Update cart items with correct quantities
      const updatedCart = cartItems.map((item) => ({
        ...item,
        quantity: quantities[item.stockId] || item.quantity,
      }));

      setCart(updatedCart);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch order');
    } finally {
      setFetching(false);
    }
  };

  const handleProductSelect = (product: ProductWithStock) => {
    if (!product.stock || (product.total_available_quantity || product.stock.quantity) <= 0) {
      setError('Product is out of stock');
      return;
    }

    const existingItem = cart.find(
      (item) => item.product.id === product.id && item.stockId === product.stock!.id
    );

    if (existingItem) {
      const availableQty = product.total_available_quantity || product.stock.quantity;
      if (existingItem.quantity < availableQty) {
        setCart(
          cart.map((item) =>
            item.product.id === product.id && item.stockId === product.stock!.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        setError('Insufficient stock available');
      }
    } else {
      setCart([...cart, { product, quantity: 1, stockId: product.stock!.id }]);
    }
    setError('');
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    const item = cart[index];
    const availableQty = item.product.total_available_quantity || item.product.stock?.quantity || 0;
    
    if (newQuantity > availableQty) {
      setError('Insufficient stock available');
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(index);
    } else {
      setCart(cart.map((item, i) => (i === index ? { ...item, quantity: newQuantity } : item)));
    }
    setError('');
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const calculateSubtotal = (item: CartItem): number => {
    const price = parseFloat(item.product.stock?.sale_price || '0');
    return price * item.quantity;
  };

  const calculateTotal = (): number => {
    return cart.reduce((sum, item) => sum + calculateSubtotal(item), 0);
  };

  const handleUpdateOrder = async () => {
    if (!customerName.trim()) {
      setError('Please enter customer name');
      return;
    }

    if (cart.length === 0) {
      setError('Please add at least one product to the cart');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        customer_name: customerName,
        status: status,
        products: cart.map((item) => ({
          product_id: item.product.id,
          stock_id: item.stockId,
          quantity: item.quantity,
        })),
      };

      await orderService.updateOrder(orderId, orderData);
      router.push('/orders');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading order...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/orders')}
                  className="text-indigo-600 hover:text-indigo-800 mr-4"
                >
                  ← Back
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Edit Order</h1>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Product Search and Cart */}
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Name */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter customer name"
                  />
                </div>

                {/* Status */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Product Search */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Product
                  </label>
                  <ProductAutocomplete onSelect={handleProductSelect} />
                  <p className="mt-2 text-xs text-gray-500">
                    Search by product name, barcode, or SKU
                  </p>
                </div>

                {/* Cart Items */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Cart Items</h2>
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No items in cart</p>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item, index) => (
                        <div
                          key={`${item.product.id}-${item.stockId}`}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                            <p className="text-sm text-gray-500">
                              SKU: {item.product.stock?.sku} | Barcode: {item.product.barcode}
                            </p>
                            <p className="text-sm text-gray-500">
                              Price: ${parseFloat(item.product.stock?.sale_price || '0').toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                              />
                              <button
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                            <div className="text-right min-w-[100px]">
                              <p className="font-semibold text-gray-900">
                                ${calculateSubtotal(item).toFixed(2)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFromCart(index)}
                              className="text-red-600 hover:text-red-800 ml-4"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg shadow sticky top-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Items:</span>
                      <span className="text-gray-900">{cart.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Quantity:</span>
                      <span className="text-gray-900">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-indigo-600">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleUpdateOrder}
                    disabled={loading || cart.length === 0 || !customerName.trim()}
                    className="w-full mt-6 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating Order...' : 'Update Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

