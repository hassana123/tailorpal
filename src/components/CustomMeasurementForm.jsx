import { useState } from 'react';

const CustomMeasurementForm = ({ 
  customMeasurements = {}, 
  onChange,
  title = "Custom Measurements"
}) => {
  const [newField, setNewField] = useState({ label: '', value: '' });
  const [isAddingField, setIsAddingField] = useState(false);

  const handleAddField = () => {
    if (!newField.label.trim()) return;
    
    const fieldKey = newField.label.toLowerCase().replace(/\s+/g, '_');
    const updatedMeasurements = {
      ...customMeasurements,
      [fieldKey]: {
        label: newField.label.trim(),
        value: parseFloat(newField.value) || 0
      }
    };
    
    onChange(updatedMeasurements);
    setNewField({ label: '', value: '' });
    setIsAddingField(false);
  };

  const handleUpdateField = (fieldKey, value) => {
    const updatedMeasurements = {
      ...customMeasurements,
      [fieldKey]: {
        ...customMeasurements[fieldKey],
        value: parseFloat(value) || 0
      }
    };
    onChange(updatedMeasurements);
  };

  const handleRemoveField = (fieldKey) => {
    const updatedMeasurements = { ...customMeasurements };
    delete updatedMeasurements[fieldKey];
    onChange(updatedMeasurements);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-lightBlue-50 rounded-2xl border border-emerald-200">
      {/* Header */}
      <div className="p-6 border-b border-emerald-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-xl font-bold text-gray-900 mr-3">{title}</h3>
            <span className="text-sm text-gray-600">
              ({Object.keys(customMeasurements).length} custom fields)
            </span>
          </div>
          
          <button
            type="button"
            onClick={() => setIsAddingField(!isAddingField)}
            className="bg-gradient-to-r from-emerald-600 to-lightBlue-600 hover:from-emerald-700 hover:to-lightBlue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Custom Field
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Add New Field Form */}
        {isAddingField && (
          <div className="bg-white rounded-xl p-4 border border-emerald-200 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Add Custom Measurement</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Field Name
                </label>
                <input
                  type="text"
                  value={newField.label}
                  onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                  className="w-full px-3 py-2 bg-white border-2 border-emerald-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                  placeholder="e.g., Sleeve Slant, Collar Width"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Value (inches)
                </label>
                <input
                  type="number"
                  value={newField.value}
                  onChange={(e) => setNewField({ ...newField, value: e.target.value })}
                  min="0"
                  step="0.5"
                  className="w-full px-3 py-2 bg-white border-2 border-emerald-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddingField(false);
                  setNewField({ label: '', value: '' });
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddField}
                disabled={!newField.label.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Field
              </button>
            </div>
          </div>
        )}

        {/* Existing Custom Fields */}
        {Object.keys(customMeasurements).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(customMeasurements).map(([fieldKey, field]) => (
              <div key={fieldKey} className="bg-white rounded-xl p-4 border border-emerald-200 relative">
                <button
                  type="button"
                  onClick={() => handleRemoveField(fieldKey)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors duration-200"
                >
                  ×
                </button>
                
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {field.label}
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    custom
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={field.value || 0}
                    onChange={(e) => handleUpdateField(fieldKey, e.target.value)}
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 bg-white border-2 border-emerald-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                    inches
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Custom Measurements</h4>
            <p className="text-gray-600 mb-4">Add custom measurement fields specific to this order</p>
            <button
              type="button"
              onClick={() => setIsAddingField(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Add First Custom Field
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomMeasurementForm;