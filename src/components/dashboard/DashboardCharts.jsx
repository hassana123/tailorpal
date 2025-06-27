import React from 'react';

const DashboardCharts = ({ orderStatusData, financialData, Pie, Bar }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Order Status Chart */}
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Order Status</h2>
      <div className="h-64">
        <Pie data={orderStatusData} options={{ maintainAspectRatio: false }} />
      </div>
    </div>
    {/* Financial Overview Chart */}
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Financial Overview</h2>
      <div className="h-64">
        <Bar 
          data={financialData} 
          options={{ 
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }} 
        />
      </div>
    </div>
  </div>
);

export default DashboardCharts; 