import React from 'react';

const DashboardShopInfo = ({ shop, navigate }) => (
  shop && (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Shop Information</h2>
          <button
            onClick={() => navigate('/edit-shop')}
            className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-xl shadow transition-all duration-200 ml-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6M3 17.25V21h3.75l11.086-11.086a2.121 2.121 0 00-3-3L3 17.25z" />
            </svg>
            Edit
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          <span className="text-sm text-emerald-600 font-medium">Active</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Shop Name</h3>
            <p className="text-lg font-medium text-gray-900">{shop.shopName}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Owner</h3>
            <p className="text-lg font-medium text-gray-900">{shop.ownerName}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Phone</h3>
            <p className="text-lg font-medium text-gray-900">{shop.phoneNumber}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Address</h3>
            <p className="text-lg font-medium text-gray-900">{shop.address}</p>
          </div>
          {shop.logoURL && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Logo</h3>
              <img
                src={shop.logoURL}
                alt="Shop logo"
                className="w-16 h-16 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
);

export default DashboardShopInfo; 