import React from 'react';

const DashboardQuickActions = ({ navigate }) => (
  <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <button
        onClick={() => navigate('/add-customer')}
        className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white mr-4 flex-shrink-0">
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-gray-900">Add Customer</h3>
          <p className="text-sm text-gray-600">Create new customer profile</p>
        </div>
      </button>
      <button
        onClick={() => navigate('/add-order')}
        className="flex items-center p-4 bg-gradient-to-r from-emerald-50 to-lightBlue-50 border border-emerald-200 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-lightBlue-500 rounded-xl flex items-center justify-center text-white mr-4 flex-shrink-0">
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-gray-900">Add Order</h3>
          <p className="text-sm text-gray-600">Create new order</p>
        </div>
      </button>
      <button
        onClick={() => navigate('/inventory')}
        className="flex items-center p-4 bg-gradient-to-r from-cream-50 to-orange-50 border border-cream-200 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cream-500 to-orange-500 rounded-xl flex items-center justify-center text-white mr-4 flex-shrink-0">
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-gray-900">Inventory</h3>
          <p className="text-sm text-gray-600">Manage shop expenses</p>
        </div>
      </button>
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white mr-4 flex-shrink-0">
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-gray-900">View Customers</h3>
          <p className="text-sm text-gray-600">Manage customer database</p>
        </div>
      </button>
    </div>
  </div>
);

export default DashboardQuickActions; 