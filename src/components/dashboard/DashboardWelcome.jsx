import React from 'react';

const DashboardWelcome = ({ shop }) => (
  <div className="text-center">
    <h1 className="text-3xl sm:text-4xl font-bold mb-4">
      <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 bg-clip-text text-transparent">
        TailorPal Dashboard
      </span>
    </h1>
    {shop && (
      <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-emerald-100 to-lightBlue-100 border border-emerald-200">
        <span className="text-sm font-semibold text-emerald-700">
          🏪 {shop.shopName}
        </span>
      </div>
    )}
  </div>
);

export default DashboardWelcome; 