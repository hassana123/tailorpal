import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const MaterialsForm = ({ customerId, orderId, materials = [], onChange }) => {
  const { user } = useSelector((state) => state.auth);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    quantity: '',
    unitCost: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAddMaterial = async () => {
    if (!newMaterial.name.trim() || !newMaterial.quantity || !newMaterial.unitCost) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const materialData = {
        name: newMaterial.name.trim(),
        quantity: parseFloat(newMaterial.quantity),
        unitCost: parseFloat(newMaterial.unitCost),
        totalCost: parseFloat(newMaterial.quantity) * parseFloat(newMaterial.unitCost),
        notes: newMaterial.notes.trim(),
        createdAt: new Date().toISOString()
      };

      const materialsRef = collection(db, 'shops', user.uid, 'customers', customerId, 'orders', orderId, 'materials');
      const docRef = await addDoc(materialsRef, materialData);

      const newMaterialWithId = {
        id: docRef.id,
        ...materialData
      };

      onChange([...materials, newMaterialWithId]);
      setNewMaterial({ name: '', quantity: '', unitCost: '', notes: '' });
      setIsAddingMaterial(false);

    } catch (error) {
      console.error('Error adding material:', error);
      setError('Failed to add material. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMaterial = async (materialId, field, value) => {
    try {
      const updatedMaterials = materials.map(material => {
        if (material.id === materialId) {
          const updatedMaterial = { ...material, [field]: value };
          if (field === 'quantity' || field === 'unitCost') {
            updatedMaterial.totalCost = updatedMaterial.quantity * updatedMaterial.unitCost;
          }
          return updatedMaterial;
        }
        return material;
      });

      onChange(updatedMaterials);

      // Update in Firestore
      const materialRef = doc(db, 'shops', user.uid, 'customers', customerId, 'orders', orderId, 'materials', materialId);
      const materialToUpdate = updatedMaterials.find(m => m.id === materialId);
      await updateDoc(materialRef, {
        [field]: value,
        totalCost: materialToUpdate.totalCost,
        updatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error updating material:', error);
      setError('Failed to update material. Please try again.');
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      const materialRef = doc(db, 'shops', user.uid, 'customers', customerId, 'orders', orderId, 'materials', materialId);
      await deleteDoc(materialRef);

      const updatedMaterials = materials.filter(material => material.id !== materialId);
      onChange(updatedMaterials);

    } catch (error) {
      console.error('Error deleting material:', error);
      setError('Failed to delete material. Please try again.');
    }
  };

  const calculateTotalCost = () => {
    return materials.reduce((total, material) => total + (material.totalCost || 0), 0);
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <svg className="w-6 h-6 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Materials & Inventory ({materials.length} items)
        </h2>

        <button
          onClick={() => setIsAddingMaterial(!isAddingMaterial)}
          className="bg-gradient-to-r from-emerald-600 to-lightBlue-600 hover:from-emerald-700 hover:to-lightBlue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Material
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Add Material Form */}
      {isAddingMaterial && (
        <div className="bg-gradient-to-r from-emerald-50 to-lightBlue-50 rounded-2xl p-6 border border-emerald-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Material</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Material Name *
              </label>
              <input
                type="text"
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border-2 border-emerald-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                placeholder="e.g., Cotton Fabric"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                value={newMaterial.quantity}
                onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 bg-white border-2 border-emerald-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Unit Cost (₦) *
              </label>
              <input
                type="number"
                value={newMaterial.unitCost}
                onChange={(e) => setNewMaterial({ ...newMaterial, unitCost: e.target.value })}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-white border-2 border-emerald-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Total Cost
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 font-semibold">
                {formatCurrency((parseFloat(newMaterial.quantity) || 0) * (parseFloat(newMaterial.unitCost) || 0))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={newMaterial.notes}
              onChange={(e) => setNewMaterial({ ...newMaterial, notes: e.target.value })}
              className="w-full px-3 py-2 bg-white border-2 border-emerald-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
              placeholder="Additional notes about this material"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => {
                setIsAddingMaterial(false);
                setNewMaterial({ name: '', quantity: '', unitCost: '', notes: '' });
                setError('');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddMaterial}
              disabled={isSaving || !newMaterial.name.trim() || !newMaterial.quantity || !newMaterial.unitCost}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Adding...' : 'Add Material'}
            </button>
          </div>
        </div>
      )}

      {/* Materials List */}
      {materials.length > 0 ? (
        <div className="space-y-4">
          {materials.map((material) => (
            <div key={material.id} className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Material Name
                  </label>
                  <input
                    type="text"
                    value={material.name}
                    onChange={(e) => handleUpdateMaterial(material.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={material.quantity}
                    onChange={(e) => handleUpdateMaterial(material.id, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Unit Cost (₦)
                  </label>
                  <input
                    type="number"
                    value={material.unitCost}
                    onChange={(e) => handleUpdateMaterial(material.id, 'unitCost', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Total Cost
                  </label>
                  <div className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-semibold">
                    {formatCurrency(material.totalCost || 0)}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleDeleteMaterial(material.id)}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              {material.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={material.notes}
                    onChange={(e) => handleUpdateMaterial(material.id, 'notes', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                    placeholder="Additional notes"
                  />
                </div>
              )}
            </div>
          ))}

          {/* Total Cost Summary */}
          <div className="bg-gradient-to-r from-emerald-100 to-lightBlue-100 rounded-2xl p-6 border-2 border-emerald-300">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Total Material Cost</h3>
              <span className="text-2xl font-bold text-emerald-700">{formatCurrency(calculateTotalCost())}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Materials Added</h3>
          <p className="text-gray-600 mb-6">Add materials needed for this order to track costs and calculate profit.</p>
          <button
            onClick={() => setIsAddingMaterial(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
          >
            Add First Material
          </button>
        </div>
      )}
    </div>
  );
};

export default MaterialsForm;