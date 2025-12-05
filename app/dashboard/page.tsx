'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(authService.getUser());

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local storage anyway
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  {process.env.NEXT_PUBLIC_APP_NAME || 'RT Order Management'}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user?.name || user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/billing"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  New Order
                </h3>
                <p className="text-gray-600">
                  Create a new order and billing
                </p>
              </Link>

              <Link
                href="/orders"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Orders List
                </h3>
                <p className="text-gray-600">
                  View and manage all orders
                </p>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

