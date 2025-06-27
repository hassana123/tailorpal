import React from 'react';

const DashboardFinancialSummary = ({ financialStats, formatCurrency }) => (
  <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Financial Summary</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Overall Summary */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-gray-600">Total Revenue:</span>
            <span className="text-lg font-semibold text-gray-900">{formatCurrency(financialStats.totalRevenue)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-gray-600">Material Costs:</span>
            <span className="text-lg font-semibold text-orange-600">- {formatCurrency(financialStats.totalMaterialCost)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-gray-600">Shop Expenses:</span>
            <span className="text-lg font-semibold text-red-600">- {formatCurrency(financialStats.totalExpenses)}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-900 font-bold">Net Profit:</span>
            <span className={`text-xl font-bold ${financialStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(financialStats.totalProfit)}
            </span>
          </div>
        </div>
      </div>
      {/* This Month Summary */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-gray-600">Monthly Revenue:</span>
            <span className="text-lg font-semibold text-gray-900">{formatCurrency(financialStats.monthlyRevenue)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-gray-600">Material Costs:</span>
            <span className="text-lg font-semibold text-orange-600">- {formatCurrency(financialStats.monthlyMaterialCost)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-gray-600">Shop Expenses:</span>
            <span className="text-lg font-semibold text-red-600">- {formatCurrency(financialStats.monthlyExpenses)}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-900 font-bold">Monthly Profit:</span>
            <span className={`text-xl font-bold ${financialStats.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(financialStats.monthlyProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardFinancialSummary; 