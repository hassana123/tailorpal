import React from 'react';

const DashboardQuickStats = ({ customers, stats, financialStats, formatCurrency }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-8 rounded-3xl border-2 border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white mb-4 sm:mb-6 shadow-lg">
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{customers.length}</h3>
      <p className="text-sm sm:text-base text-gray-600">Total Customers</p>
    </div>
    <div className="bg-gradient-to-br from-emerald-50 to-lightBlue-50 p-4 sm:p-8 rounded-3xl border-2 border-emerald-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-lightBlue-500 rounded-2xl flex items-center justify-center text-white mb-4 sm:mb-6 shadow-lg">
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{stats.total}</h3>
      <p className="text-sm sm:text-base text-gray-600">Total Orders</p>
    </div>
    <div className="bg-gradient-to-br from-cream-50 to-orange-50 p-4 sm:p-8 rounded-3xl border-2 border-cream-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-cream-500 to-orange-500 rounded-2xl flex items-center justify-center text-white mb-4 sm:mb-6 shadow-lg">
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      </div>
      <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">{formatCurrency(financialStats.totalRevenue)}</h3>
      <p className="text-sm sm:text-base text-gray-600">Total Revenue</p>
    </div>
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-8 rounded-3xl border-2 border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white mb-4 sm:mb-6 shadow-lg">
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">{formatCurrency(financialStats.totalProfit)}</h3>
      <p className="text-sm sm:text-base text-gray-600">Net Profit</p>
    </div>
  </div>
);

export default DashboardQuickStats; 