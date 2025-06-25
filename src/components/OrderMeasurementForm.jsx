import { useState, useEffect } from 'react';
import { 
  getRequiredMeasurementsForGarment, 
  getDefaultMeasurementsForGender,
  extractOrderMeasurements 
} from '../utils/measurementConfigs';

const OrderMeasurementForm = ({ 
  gender, 
  garmentType, 
  customerMeasurements = {}, 
  orderMeasurements = {}, 
  onChange,
  title = "Order-Specific Measurements"
}) => {
  const [measurements, setMeasurements] = useState({});
  const [badges, setBadges] = useState({});

  useEffect(() => {
    if (!gender || !garmentType) return;

    // Get required fields for this garment
    const requiredFields = getRequiredMeasurementsForGarment(gender, garmentType);
    const defaultFields = getDefaultMeasurementsForGender(gender);
    
    // Initialize measurements and badges
    const newMeasurements = {};
    const newBadges = {};
    
    requiredFields.forEach(field => {
      const customerValue = customerMeasurements[field] || 0;
      const orderValue = orderMeasurements[field];
      
      if (orderValue !== undefined) {
        // Use order-specific value
        newMeasurements[field] = orderValue;
        newBadges[field] = orderValue === customerValue ? 'default' : 'edited';
      } else {
        // Use customer default value
        newMeasurements[field] = customerValue;
        newBadges[field] = 'default';
      }
    });
    
    setMeasurements(newMeasurements);
    setBadges(newBadges);
  }, [gender, garmentType, customerMeasurements, orderMeasurements]);

  const handleMeasurementChange = (field, value) => {
    const numericValue = parseFloat(value) || 0;
    const customerValue = customerMeasurements[field] || 0;
    
    const updatedMeasurements = {
      ...measurements,
      [field]: numericValue
    };
    
    const updatedBadges = {
      ...badges,
      [field]: numericValue === customerValue ? 'default' : 'edited'
    };
    
    setMeasurements(updatedMeasurements);
    setBadges(updatedBadges);
    onChange(updatedMeasurements);
  };

  const resetToDefault = (field) => {
    const customerValue = customerMeasurements[field] || 0;
    handleMeasurementChange(field, customerValue);
  };

  const resetAllToDefaults = () => {
    const requiredFields = getRequiredMeasurementsForGarment(gender, garmentType);
    const resetMeasurements = {};
    
    requiredFields.forEach(field => {
      resetMeasurements[field] = customerMeasurements[field] || 0;
    });
    
    setMeasurements(resetMeasurements);
    setBadges(Object.fromEntries(requiredFields.map(field => [field, 'default'])));
    onChange(resetMeasurements);
  };

  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'default':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'edited':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return '';
    }
  };

  if (!gender || !garmentType) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <p className="text-gray-500">Please select gender and garment type to view measurements</p>
      </div>
    );
  }

  const requiredFields = getRequiredMeasurementsForGarment(gender, garmentType);
  const defaultFields = getDefaultMeasurementsForGender(gender);

  if (requiredFields.length === 0) {
    return (
      <div className="bg-yellow-50 rounded-xl p-6 text-center border border-yellow-200">
        <p className="text-yellow-800">No specific measurements required for {garmentType}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-cream-50 rounded-2xl border border-orange-200">
      {/* Header */}
      <div className="p-6 border-b border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-xl font-bold text-gray-900 mr-3">{title}</h3>
            <span className="text-sm text-gray-600">
              ({requiredFields.length} fields for {garmentType})
            </span>
          </div>
          
          <button
            type="button"
            onClick={resetAllToDefaults}
            className="bg-gradient-to-r from-orange-600 to-cream-600 hover:from-orange-700 hover:to-cream-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset All to Defaults
          </button>
        </div>
      </div>

      {/* Measurements Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {requiredFields.map((field) => {
            const config = defaultFields[field];
            if (!config) return null;

            return (
              <div key={field} className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {config.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(badges[field])}`}>
                    {badges[field]}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={measurements[field] || 0}
                    onChange={(e) => handleMeasurementChange(field, e.target.value)}
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 bg-white border-2 border-orange-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 hover:border-orange-300"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                    {config.unit}
                  </span>
                </div>
                
                {badges[field] === 'edited' && (
                  <button
                    type="button"
                    onClick={() => resetToDefault(field)}
                    className="mt-1 text-xs text-orange-600 hover:text-orange-800 transition-colors duration-200"
                  >
                    Reset to default ({customerMeasurements[field] || 0}")
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Missing Measurements Warning */}
        {requiredFields.some(field => !customerMeasurements[field] || customerMeasurements[field] === 0) && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-yellow-800 font-semibold">Missing Customer Measurements</h4>
                <p className="text-yellow-700 text-sm">
                  Some required measurements are missing from the customer's profile. 
                  Consider updating their default measurements for future orders.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderMeasurementForm;