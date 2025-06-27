import React from 'react';

const DashboardRecentOrders = ({ recentOrders, formatCurrency, formatDate, getStatusColor, navigate }) => (
  recentOrders.length > 0 && (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Recent Orders</h2>
        <button
          onClick={() => navigate('/orders')}
          className="text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-200"
        >
          View All →
        </button>
      </div>
      <div className="space-y-4">
        {recentOrders.map((order) => (
          <div
            key={order.id}
            onClick={() => navigate(`/customers/${order.customerId}/orders/${order.id}`)}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 space-y-3 sm:space-y-0"
          >
            <div className="flex items-center">
              {order.styleImageURL && (
                <img
                  src={order.styleImageURL}
                  alt="Style"
                  className="w-12 h-12 object-cover rounded-lg mr-4 border border-gray-200 flex-shrink-0"
                />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">{order.garmentType}</h3>
                <p className="text-sm text-gray-600">{order.customerName}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-left sm:text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(order.price)}</p>
                <p className="text-sm text-gray-600">Due: {formatDate(order.dueDate)}</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)} w-fit`}>
                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
);

export default DashboardRecentOrders; 