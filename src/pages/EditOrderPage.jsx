import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { updateOrder, setLoading } from '../store/slices/ordersSlice';
import OrderMeasurementForm from '../components/OrderMeasurementForm';
import CustomMeasurementForm from '../components/CustomMeasurementForm';
import MaterialsForm from '../components/MaterialsForm';
import { getGarmentTypesForGender } from '../utils/measurementConfigs';

const EditOrderPage = () => {
  const { customerId, orderId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Form data
  const [orderData, setOrderData] = useState({
    garmentType: '',
    dueDate: '',
    price: '',
    amountPaid: '',
    status: 'pending'
  });

  // Order measurements and materials
  const [orderMeasurements, setOrderMeasurements] = useState({});
  const [customMeasurements, setCustomMeasurements] = useState({});
  const [customerMeasurements, setCustomerMeasurements] = useState({});
  const [materials, setMaterials] = useState([]);

  // Style reference (moved to end)
  const [styleDescription, setStyleDescription] = useState('');
  const [notes, setNotes] = useState('');

  // Image upload state
  const [newStyleImage, setNewStyleImage] = useState(null);
  const [newStyleImagePreview, setNewStyleImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  const [errors, setErrors] = useState({});

  // Helper function to safely convert Firebase Timestamp
  const convertTimestampToString = (timestamp) => {
    if (!timestamp) return null;
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    if (typeof timestamp === 'string') {
      return timestamp;
    }
    return null;
  };

  // Load order and customer data
  useEffect(() => {
    const loadOrderData = async () => {
      if (!user?.uid || !customerId || !orderId) return;

      try {
        setIsLoading(true);
        
        // Load customer data
        const customerDoc = await getDoc(doc(db, 'shops', user.uid, 'customers', customerId));
        if (!customerDoc.exists()) {
          setError('Customer not found');
          return;
        }
        
        const customerData = { 
          id: customerDoc.id, 
          ...customerDoc.data(),
          createdAt: convertTimestampToString(customerDoc.data().createdAt)
        };
        setCustomer(customerData);

        // Load customer measurements
        try {
          const customerMeasurementsDoc = await getDoc(doc(db, 'shops', user.uid, 'customers', customerId, 'measurements', 'default'));
          if (customerMeasurementsDoc.exists()) {
            setCustomerMeasurements(customerMeasurementsDoc.data());
          }
        } catch (error) {
          console.error('Error loading customer measurements:', error);
        }

        // Load order data
        const orderDoc = await getDoc(doc(db, 'shops', user.uid, 'customers', customerId, 'orders', orderId));
        if (!orderDoc.exists()) {
          setError('Order not found');
          return;
        }

        const orderInfo = {
          id: orderDoc.id,
          ...orderDoc.data(),
          createdAt: convertTimestampToString(orderDoc.data().createdAt)
        };
        setOrder(orderInfo);

        // Initialize form data
        setOrderData({
          garmentType: orderInfo.garmentType || '',
          dueDate: orderInfo.dueDate || '',
          price: orderInfo.price?.toString() || '',
          amountPaid: orderInfo.amountPaid?.toString() || '',
          status: orderInfo.status || 'pending'
        });
        setStyleDescription(orderInfo.styleDescription || '');
        setNotes(orderInfo.notes || '');

        // Load order measurements
        try {
          const orderMeasurementsDoc = await getDoc(doc(db, 'shops', user.uid, 'customers', customerId, 'orders', orderId, 'measurements', 'default'));
          if (orderMeasurementsDoc.exists()) {
            setOrderMeasurements(orderMeasurementsDoc.data());
          }
        } catch (error) {
          console.error('Error loading order measurements:', error);
        }

        // Load custom measurements
        try {
          const customMeasurementsDoc = await getDoc(doc(db, 'shops', user.uid, 'customers', customerId, 'orders', orderId, 'customMeasurements', 'default'));
          if (customMeasurementsDoc.exists()) {
            setCustomMeasurements(customMeasurementsDoc.data());
          }
        } catch (error) {
          console.error('Error loading custom measurements:', error);
        }

        // Load materials
        try {
          const materialsRef = collection(db, 'shops', user.uid, 'customers', customerId, 'orders', orderId, 'materials');
          const materialsSnapshot = await getDocs(materialsRef);
          const materialsData = materialsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMaterials(materialsData);
        } catch (error) {
          console.error('Error loading materials:', error);
        }

      } catch (error) {
        console.error('Error loading order data:', error);
        setError('Failed to load order data');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderData();
  }, [user?.uid, customerId, orderId]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle style image upload
  const handleStyleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB');
        return;
      }

      setNewStyleImage(file);
      setImageLoading(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setNewStyleImagePreview(event.target.result);
          setImageLoading(false);
        }
      };
      reader.onerror = () => {
        console.error('Error reading file');
        setImageLoading(false);
        setError('Error reading image file');
      };
      reader.readAsDataURL(file);

      setError('');
    }
  };

  const clearNewStyleImage = () => {
    setNewStyleImage(null);
    setNewStyleImagePreview(null);
    setImageLoading(false);
    const fileInput = document.getElementById('newStyleImageInput');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Upload new style image
  const uploadNewStyleImage = async () => {
    if (!newStyleImage) return null;

    try {
      const imageRef = ref(storage, `style-images/${user.uid}/${customerId}/${orderId}/${Date.now()}_${newStyleImage.name}`);
      const snapshot = await uploadBytes(imageRef, newStyleImage);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading style image:', error);
      throw new Error('Failed to upload style image. Please try again.');
    }
  };

  // Calculate balance
  const calculateBalance = () => {
    const price = parseFloat(orderData.price) || 0;
    const paid = parseFloat(orderData.amountPaid) || 0;
    return price - paid;
  };

  // Calculate total material cost
  const calculateTotalMaterialCost = () => {
    return materials.reduce((total, material) => {
      return total + (material.totalCost || 0);
    }, 0);
  };

  // Calculate net profit
  const calculateNetProfit = () => {
    const totalPrice = parseFloat(orderData.price) || 0;
    const totalMaterialCost = calculateTotalMaterialCost();
    return totalPrice - totalMaterialCost;
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!orderData.garmentType.trim()) {
      newErrors.garmentType = 'Garment type is required';
    }
    if (!orderData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const dueDate = new Date(orderData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }
    if (!orderData.price || parseFloat(orderData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }
    if (orderData.amountPaid && parseFloat(orderData.amountPaid) < 0) {
      newErrors.amountPaid = 'Amount paid cannot be negative';
    }
    if (orderData.amountPaid && parseFloat(orderData.amountPaid) > parseFloat(orderData.price)) {
      newErrors.amountPaid = 'Amount paid cannot exceed the total price';
    }

    return newErrors;
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      // Upload new image if provided
      let newImageURL = order.styleImageURL;
      if (newStyleImage) {
        newImageURL = await uploadNewStyleImage();
        
        // Delete old image if it exists and is different
        if (order.styleImageURL && order.styleImageURL !== newImageURL) {
          try {
            const oldImageRef = ref(storage, order.styleImageURL);
            await deleteObject(oldImageRef);
          } catch (error) {
            console.warn('Could not delete old image:', error);
          }
        }
      }

      // Prepare updated data
      const updatedData = {
        garmentType: orderData.garmentType.trim(),
        styleDescription: styleDescription.trim(),
        dueDate: orderData.dueDate,
        price: parseFloat(orderData.price),
        amountPaid: parseFloat(orderData.amountPaid) || 0,
        balance: calculateBalance(),
        notes: notes.trim(),
        status: orderData.status,
        styleImageURL: newImageURL,
        updatedAt: new Date().toISOString()
      };

      // Update in Firestore
      const orderRef = doc(db, 'shops', user.uid, 'customers', customerId, 'orders', orderId);
      await updateDoc(orderRef, updatedData);

      // Update measurements if they exist
      if (Object.keys(orderMeasurements).length > 0) {
        const orderMeasurementsRef = doc(db, 'shops', user.uid, 'customers', customerId, 'orders', orderId, 'measurements', 'default');
        await updateDoc(orderMeasurementsRef, orderMeasurements);
      }

      // Update custom measurements if they exist
      if (Object.keys(customMeasurements).length > 0) {
        const customMeasurementsRef = doc(db, 'shops', user.uid, 'customers', customerId, 'orders', orderId, 'customMeasurements', 'default');
        await updateDoc(customMeasurementsRef, customMeasurements);
      }

      // Update local state
      const updatedOrder = {
        ...order,
        ...updatedData
      };
      setOrder(updatedOrder);

      // Update Redux store
      dispatch(updateOrder(updatedOrder));

      // Clear edit state
      setNewStyleImage(null);
      setNewStyleImagePreview(null);
      setSuccessMessage('Order updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Error updating order:', error);
      setError(error.message || 'Failed to update order. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Get available garment types based on customer gender
  const getAvailableGarmentTypes = () => {
    if (!customer?.gender) return [];
    return getGarmentTypesForGender(customer.gender);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-lightBlue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-spin mx-auto mb-4 flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600 text-lg">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(`/customers/${customerId}`)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
          >
            Back to Customer
          </button>
        </div>
      </div>
    );
  }

  if (!order || !customer) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(`/customers/${customerId}/orders/${orderId}`)}
            className="flex items-center text-purple-600 hover:text-purple-700 mb-4 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Order Details
          </button>
          
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 bg-clip-text text-transparent">
              Edit Order
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">Update order details, measurements, and materials</p>
        </div>

        <button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 p-4 rounded-xl">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-800 font-semibold">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 p-4 rounded-xl">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Order Details Form */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Order Information
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Garment Type */}
            <div>
              <label htmlFor="garmentType" className="block text-sm font-semibold text-gray-700 mb-2">
                Garment Type *
              </label>
              <select
                id="garmentType"
                name="garmentType"
                value={orderData.garmentType}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 ${
                  errors.garmentType ? 'border-red-300 bg-red-50' : 'border-purple-200 hover:border-purple-300'
                }`}
              >
                <option value="">Select Garment Type</option>
                {getAvailableGarmentTypes().map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.garmentType && (
                <p className="mt-2 text-sm text-red-600">{errors.garmentType}</p>
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
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 ${
                  errors.dueDate ? 'border-red-300 bg-red-50' : 'border-purple-200 hover:border-purple-300'
                }`}
              />
              {errors.dueDate && (
                <p className="mt-2 text-sm text-red-600">{errors.dueDate}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={orderData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
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
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 ${
                  errors.price ? 'border-red-300 bg-red-50' : 'border-purple-200 hover:border-purple-300'
                }`}
                placeholder="Enter total price"
              />
              {errors.price && (
                <p className="mt-2 text-sm text-red-600">{errors.price}</p>
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
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 ${
                  errors.amountPaid ? 'border-red-300 bg-red-50' : 'border-purple-200 hover:border-purple-300'
                }`}
                placeholder="Enter amount paid"
              />
              {errors.amountPaid && (
                <p className="mt-2 text-sm text-red-600">{errors.amountPaid}</p>
              )}
            </div>

            {/* Financial Summary */}
            <div className="bg-gradient-to-r from-emerald-50 to-lightBlue-50 rounded-xl p-4 border border-emerald-200">
              <h4 className="font-semibold text-gray-900 mb-3">Financial Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Price:</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(orderData.price) || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(parseFloat(orderData.amountPaid) || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Balance:</span>
                  <span className={`font-semibold ${calculateBalance() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(calculateBalance())}
                  </span>
                </div>
                <div className="border-t border-emerald-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Material Cost:</span>
                    <span className="font-semibold text-orange-600">{formatCurrency(calculateTotalMaterialCost())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net Profit:</span>
                    <span className={`font-semibold ${calculateNetProfit() > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(calculateNetProfit())}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Materials Management */}
      <MaterialsForm
        customerId={customerId}
        orderId={orderId}
        materials={materials}
        onChange={setMaterials}
      />

      {/* Order Measurements */}
      {customer?.gender && orderData.garmentType && (
        <OrderMeasurementForm
          gender={customer.gender}
          garmentType={orderData.garmentType}
          customerMeasurements={customerMeasurements}
          orderMeasurements={orderMeasurements}
          onChange={setOrderMeasurements}
        />
      )}

      {/* Custom Measurements */}
      {customer?.gender && orderData.garmentType && (
        <CustomMeasurementForm
          customMeasurements={customMeasurements}
          onChange={setCustomMeasurements}
        />
      )}

      {/* Style Reference Section (Moved to end) */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Style Reference
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Style Image */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Style Image</h3>
            
            {/* Current Image */}
            {(order.styleImageURL || newStyleImagePreview) && (
              <div className="mb-4">
                <img
                  src={newStyleImagePreview || order.styleImageURL}
                  alt="Style reference"
                  className="w-full h-48 object-cover rounded-xl border border-gray-200 shadow-lg"
                />
                {newStyleImagePreview && (
                  <div className="mt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={clearNewStyleImage}
                      className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors duration-200"
                    >
                      Remove new image
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Upload New Image */}
            <div className="border-2 border-dashed border-pink-300 rounded-xl p-6 text-center hover:border-pink-400 hover:bg-pink-50 transition-all duration-300">
              <input
                id="newStyleImageInput"
                type="file"
                accept="image/*"
                onChange={handleStyleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-2">
                <svg className="w-12 h-12 text-pink-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div>
                  <p className="text-pink-600 font-medium">
                    {order.styleImageURL ? 'Upload new style image' : 'Upload style image'}
                  </p>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Style Description */}
          <div>
            <label htmlFor="styleDescription" className="block text-sm font-semibold text-gray-700 mb-2">
              Style Description
            </label>
            <textarea
              id="styleDescription"
              value={styleDescription}
              onChange={(e) => setStyleDescription(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-white border-2 border-pink-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-300 resize-none"
              placeholder="Describe the style details..."
            />
          </div>
        </div>
      </div>

      {/* Additional Notes Section (Moved to end) */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Additional Notes
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 transition-all duration-300 resize-none"
          placeholder="Any special instructions or notes..."
        />
      </div>
    </div>
  );
};

export default EditOrderPage;