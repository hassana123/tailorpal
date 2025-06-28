import { getGarmentTypesForGender } from '../../utils/measurementConfigs';

const OrderDetailsForm = ({ 
  orderData, 
  customerGender,
  onChange, 
  errors,
  formatCurrency,
  calculateBalance,
  calculateTotalMaterialCost,
  calculateNetProfit
}) => {
  const getAvailableGarmentTypes = () => {
    if (!customerGender) return [];
    return getGarmentTypesForGender(customerGender);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-lightBlue-50 rounded-2xl p-6 border border-emerald-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <svg className="w-6 h-6 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        Order Details
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Garment Type */}
        <div>
          <label htmlFor="garmentType" className="block text-sm font-semibold text-gray-700 mb-2">
            Garment Type *
          </label>
          <select
            id="garmentType"
            name="garmentType"
            value={orderData.garmentType}
            onChange={onChange}
            disabled={!customerGender}
            className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 ${
              errors.garmentType ? 'border-red-300 bg-red-50' : 'border-emerald-200 hover:border-emerald-300'
            } ${!customerGender ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <option value="">
              {customerGender ? 'Select Garment Type' : 'Select Gender First'}
            </option>
            {getAvailableGarmentTypes().map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.garmentType && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.garmentType}
            </p>
          )}
        </div>

        {/* Due Date */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700 mb-2">
            Due Date *
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={orderData.dueDate}
            onChange={onChange}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 ${
              errors.dueDate ? 'border-red-300 bg-red-50' : 'border-emerald-200 hover:border-emerald-300'
            }`}
          />
          {errors.dueDate && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.dueDate}
            </p>
          )}
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">
            Price (₦) *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={orderData.price}
            onChange={onChange}
            min="0"
            step="0.01"
            className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 ${
              errors.price ? 'border-red-300 bg-red-50' : 'border-emerald-200 hover:border-emerald-300'
            }`}
            placeholder="Enter total price"
          />
          {errors.price && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.price}
            </p>
          )}
        </div>

        {/* Amount Paid */}
        <div>
          <label htmlFor="amountPaid" className="block text-sm font-semibold text-gray-700 mb-2">
            Amount Paid (₦)
          </label>
          <input
            type="number"
            id="amountPaid"
            name="amountPaid"
            value={orderData.amountPaid}
            onChange={onChange}
            min="0"
            step="0.01"
            className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 ${
              errors.amountPaid ? 'border-red-300 bg-red-50' : 'border-emerald-200 hover:border-emerald-300'
            }`}
            placeholder="Enter amount paid upfront"
          />
          {errors.amountPaid && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.amountPaid}
            </p>
          )}
        </div>

        {/* Financial Summary */}
        {orderData.price && (
          <div className="md:col-span-2">
            <div className="bg-gradient-to-r from-cream-50 to-orange-50 border border-cream-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Financial Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-600">Total Price</p>
                  <p className="font-bold text-gray-900">{formatCurrency(parseFloat(orderData.price))}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Amount Paid</p>
                  <p className="font-bold text-emerald-600">{formatCurrency(parseFloat(orderData.amountPaid) || 0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Balance</p>
                  <p className={`font-bold ${calculateBalance() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(calculateBalance())}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Material Cost</p>
                  <p className="font-bold text-orange-600">{formatCurrency(calculateTotalMaterialCost())}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-cream-200 text-center">
                <p className="text-gray-600">Net Profit</p>
                <p className={`text-lg font-bold ${calculateNetProfit() > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(calculateNetProfit())}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsForm;