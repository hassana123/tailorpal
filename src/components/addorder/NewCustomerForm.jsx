const NewCustomerForm = ({
  customerData,
  onChange,
  errors
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
          Full Name *
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={customerData.fullName}
          onChange={onChange}
          className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 ${
            errors.fullName ? 'border-red-300 bg-red-50' : 'border-purple-200 hover:border-purple-300'
          }`}
          placeholder="Enter customer's full name"
        />
        {errors.fullName && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.fullName}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
          Phone Number *
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={customerData.phone}
          onChange={onChange}
          className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 ${
            errors.phone ? 'border-red-300 bg-red-50' : 'border-purple-200 hover:border-purple-300'
          }`}
          placeholder="Enter phone number"
        />
        {errors.phone && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.phone}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 mb-2">
          Gender *
        </label>
        <select
          id="gender"
          name="gender"
          value={customerData.gender}
          onChange={onChange}
          className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 ${
            errors.gender ? 'border-red-300 bg-red-50' : 'border-purple-200 hover:border-purple-300'
          }`}
        >
          <option value="">Select Gender</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
        </select>
        {errors.gender && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.gender}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
          Address (Optional)
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={customerData.address}
          onChange={onChange}
          className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
          placeholder="Enter customer's address"
        />
      </div>
    </div>
  );
};

export default NewCustomerForm;