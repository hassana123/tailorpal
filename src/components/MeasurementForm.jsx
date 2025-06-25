import { useState } from 'react';
import { DEFAULT_MEASUREMENTS } from '../utils/measurementConfigs';

const MeasurementForm = ({ 
  gender, 
  measurements = {}, 
  onChange, 
  isCollapsible = true,
  title = "General Body Measurements",
  showEditToggle = false,
  isReadOnly = false,
  badges = {} // { fieldName: 'default' | 'edited' }
}) => {
  const [isExpanded, setIsExpanded] = useState(!isCollapsible);
  const [isEditing, setIsEditing] = useState(!isReadOnly);

  const defaultFields = DEFAULT_MEASUREMENTS[gender] || {};

  const handleMeasurementChange = (field, value) => {
    if (isReadOnly && !isEditing) return;
    
    const numericValue = parseFloat(value) || 0;
    onChange({
      ...measurements,
      [field]: numericValue
    });
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

  if (!gender) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <p className="text-gray-500">Please select gender to view measurements</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
      {/* Header */}
      <div className="p-6 border-b border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-xl font-bold text-gray-900 mr-3">{title}</h3>
            <span className="text-sm text-gray-600">({Object.keys(defaultFields).length} fields)</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {showEditToggle && (
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isEditing 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}
              >
                {isEditing ? 'Save' : 'Edit'}
              </button>
            )}
            
            {isCollapsible && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg hover:bg-purple-100 transition-colors duration-200"
              >
                <svg 
                  className={`w-5 h-5 text-purple-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Measurements Grid */}
      {isExpanded && (
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(defaultFields).map(([field, config]) => (
              <div key={field} className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {config.label}
                  {badges[field] && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(badges[field])}`}>
                      {badges[field]}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={measurements[field] || 0}
                    onChange={(e) => handleMeasurementChange(field, e.target.value)}
                    min="0"
                    step="0.5"
                    disabled={isReadOnly && !isEditing}
                    className={`w-full px-3 py-2 bg-white border-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 ${
                      isReadOnly && !isEditing 
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                        : 'border-purple-200 hover:border-purple-300'
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                    {config.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {Object.keys(defaultFields).length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No measurements configured for {gender} customers</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MeasurementForm;