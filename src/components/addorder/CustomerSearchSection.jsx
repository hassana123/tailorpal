const CustomerSearchSection = ({
  preselectedCustomerId,
  customerSearch,
  onCustomerSearch,
  filteredCustomers,
  selectedCustomer,
  onSelectCustomer,
  onClearCustomerSelection
}) => {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Customer Information
      </h2>

      {/* Customer Search */}
      {!preselectedCustomerId && (
        <div className="mb-6">
          <label htmlFor="customerSearch" className="block text-sm font-semibold text-gray-700 mb-2">
            Search Existing Customer (Optional)
          </label>
          <div className="relative">
            <input
              type="text"
              id="customerSearch"
              value={customerSearch}
              onChange={(e) => onCustomerSearch(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
              placeholder="Search by name or phone number..."
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Customer Search Results */}
          {customerSearch && !selectedCustomer && filteredCustomers.length > 0 && (
            <div className="mt-2 bg-white border border-purple-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => onSelectCustomer(customer)}
                  className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{customer.fullName}</div>
                  <div className="text-sm text-gray-600">{customer.phone} • {customer.gender}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Customer Display */}
      {selectedCustomer && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl md:p-4 p-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-emerald-800">Selected Customer</h3>
              <p className="text-emerald-700">{selectedCustomer.fullName}</p>
              <p className="text-sm text-emerald-600">{selectedCustomer.phone} • {selectedCustomer.gender}</p>
            </div>
            {!preselectedCustomerId && (
              <button
                type="button"
                onClick={onClearCustomerSelection}
                className="text-emerald-600 hover:text-emerald-800 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSearchSection;