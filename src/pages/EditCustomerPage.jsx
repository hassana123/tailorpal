import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { updateCustomer, setLoading } from '../store/slices/customersSlice';
import MeasurementForm from '../components/MeasurementForm';
import { initializeDefaultMeasurements } from '../utils/measurementConfigs';

const EditCustomerPage = () => {
  const { customerId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Form data
  const [customerData, setCustomerData] = useState({
    fullName: '',
    phone: '',
    address: '',
    gender: '',
  });

  const [customerMeasurements, setCustomerMeasurements] = useState({});
  const [errors, setErrors] = useState({});

  // Load customer data
  useEffect(() => {
    const loadCustomer = async () => {
      if (!user?.uid || !customerId) return;

      try {
        setIsLoading(true);
        
        // Load customer basic info
        const customerDoc = await getDoc(doc(db, 'shops', user.uid, 'customers', customerId));
        if (!customerDoc.exists()) {
          setError('Customer not found');
          return;
        }

        const customerInfo = { id: customerDoc.id, ...customerDoc.data() };
        setCustomer(customerInfo);
        setCustomerData({
          fullName: customerInfo.fullName || '',
          phone: customerInfo.phone || '',
          address: customerInfo.address || '',
          gender: customerInfo.gender || '',
        });

        // Load customer measurements
        try {
          const measurementsDoc = await getDoc(doc(db, 'shops', user.uid, 'customers', customerId, 'measurements', 'default'));
          if (measurementsDoc.exists()) {
            setCustomerMeasurements(measurementsDoc.data());
          } else if (customerInfo.gender) {
            // Initialize with default structure if no measurements exist
            const defaultMeasurements = initializeDefaultMeasurements(customerInfo.gender);
            setCustomerMeasurements(defaultMeasurements);
          }
        } catch (error) {
          console.error('Error loading measurements:', error);
          if (customerInfo.gender) {
            const defaultMeasurements = initializeDefaultMeasurements(customerInfo.gender);
            setCustomerMeasurements(defaultMeasurements);
          }
        }

      } catch (error) {
        console.error('Error loading customer:', error);
        setError('Failed to load customer data');
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomer();
  }, [user?.uid, customerId]);

  // Initialize measurements when gender changes
  useEffect(() => {
    if (customerData.gender && Object.keys(customerMeasurements).length === 0) {
      const defaultMeasurements = initializeDefaultMeasurements(customerData.gender);
      setCustomerMeasurements(defaultMeasurements);
    }
  }, [customerData.gender, customerMeasurements]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({
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

  const validateForm = () => {
    const newErrors = {};

    if (!customerData.fullName.trim()) {
      newErrors.fullName = 'Customer name is required';
    }
    if (!customerData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(customerData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!customerData.gender) {
      newErrors.gender = 'Gender is required';
    }

    return newErrors;
  };

  const handleSave = async () => {
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSaving(true);
    dispatch(setLoading(true));

    try {
      // Update customer basic info
      const customerRef = doc(db, 'shops', user.uid, 'customers', customerId);
      const updatedCustomerData = {
        fullName: customerData.fullName.trim(),
        phone: customerData.phone.trim(),
        address: customerData.address.trim(),
        gender: customerData.gender,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(customerRef, updatedCustomerData);

      // Update measurements
      const measurementsRef = doc(db, 'shops', user.uid, 'customers', customerId, 'measurements', 'default');
      await updateDoc(measurementsRef, customerMeasurements);

      // Update Redux store
      const updatedCustomer = {
        ...customer,
        ...updatedCustomerData
      };
      dispatch(updateCustomer(updatedCustomer));

      setSuccessMessage('Customer updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Error updating customer:', error);
      setError('Failed to update customer. Please try again.');
    } finally {
      setIsSaving(false);
      dispatch(setLoading(false));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-lightBlue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-spin mx-auto mb-4 flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600 text-lg">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/customers')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(`/customers/${customerId}`)}
            className="flex items-center text-purple-600 hover:text-purple-700 mb-4 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Customer Details
          </button>
          
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 bg-clip-text text-transparent">
              Edit Customer
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">Update customer information and measurements</p>
        </div>

        <button
          onClick={handleSave}
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

      {/* Customer Information Form */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Customer Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={customerData.fullName}
              onChange={handleInputChange}
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

          {/* Phone Number */}
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={customerData.phone}
              onChange={handleInputChange}
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

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 mb-2">
              Gender *
            </label>
            <select
              id="gender"
              name="gender"
              value={customerData.gender}
              onChange={handleInputChange}
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

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
              Address (Optional)
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={customerData.address}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
              placeholder="Enter customer's address"
            />
          </div>
        </div>
      </div>

      {/* Customer Measurements */}
      {customerData.gender && (
        <MeasurementForm
          gender={customerData.gender}
          measurements={customerMeasurements}
          onChange={setCustomerMeasurements}
          isCollapsible={false}
          title="Customer Default Measurements"
        />
      )}
    </div>
  );
};

export default EditCustomerPage;