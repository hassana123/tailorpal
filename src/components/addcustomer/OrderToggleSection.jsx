const OrderToggleSection = ({ showOrderSection, onToggle }) => {
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-lightBlue-50 rounded-2xl p-6 border border-emerald-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Add Order</h3>
          <p className="text-gray-600">Would you like to create an order for this customer now?</p>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
              showOrderSection ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                showOrderSection ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="ml-3 text-sm font-medium text-gray-700">
            {showOrderSection ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderToggleSection;