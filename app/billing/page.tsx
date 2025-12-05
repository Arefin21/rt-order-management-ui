'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProductAutocomplete from '@/components/ProductAutocomplete';
import { ProductWithStock } from '@/lib/types';
import { orderService } from '@/lib/orders';

interface CartItem {
  product: ProductWithStock;
  quantity: number;
}

export default function BillingPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProductSelect = (product: ProductWithStock) => {
    if (!product.stock || (product.total_available_quantity || product.stock.quantity) <= 0) {
      setError('Product is out of stock');
      return;
    }

    const existingItem = cart.find(
      (item) => item.product.id === product.id && item.product.stock?.id === product.stock?.id
    );

    if (existingItem) {
      const availableQty = product.total_available_quantity || product.stock.quantity;
      if (existingItem.quantity < availableQty) {
        setCart(
          cart.map((item) =>
            item.product.id === product.id && item.product.stock?.id === product.stock?.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        setError('Insufficient stock available');
      }
    } else {
      setCart([...cart, { product, quantity: 1 }]);
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

  const handlePlaceOrder = async () => {
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
        products: cart.map((item) => ({
          product_id: item.product.id,
          stock_id: item.product.stock!.id,
          quantity: item.quantity,
        })),
      };

      await orderService.placeOrder(orderData);
      router.push('/orders');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-indigo-600 hover:text-indigo-800 mr-4"
                >
                  ← Back
                </button>
                <h1 className="text-xl font-semibold text-gray-900">New Order</h1>
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
                          key={`${item.product.id}-${item.product.stock?.id}`}
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
                    onClick={handlePlaceOrder}
                    disabled={loading || cart.length === 0 || !customerName.trim()}
                    className="w-full mt-6 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Placing Order...' : 'Place Order'}
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

