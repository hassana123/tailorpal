import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { addCustomer, setCustomers, setLoading as setCustomersLoading } from '../store/slices/customersSlice';
import { addOrder, setLoading as setOrdersLoading } from '../store/slices/ordersSlice';
import MeasurementForm from '../components/MeasurementForm';
import OrderMeasurementForm from '../components/OrderMeasurementForm';
import CustomMeasurementForm from '../components/CustomMeasurementForm';
import { 
  initializeDefaultMeasurements, 
  getGarmentTypesForGender,
  extractOrderMeasurements 
} from '../utils/measurementConfigs';

const AddOrderPage = () => {
  const { user } = useSelector((state) => state.auth);
  const { shop } = useSelector((state) => state.shop);
  const { customers } = useSelector((state) => state.customers);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get customer ID from URL params if provided
  const preselectedCustomerId = searchParams.get('customerId');

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer form data
  const [customerData, setCustomerData] = useState({
    fullName: '',
    phone: '',
    address: '',
    gender: '',
  });

  // Customer measurements
  const [customerMeasurements, setCustomerMeasurements] = useState({});

  // Order form data
  const [orderData, setOrderData] = useState({
    garmentType: '',
    styleDescription: '',
    dueDate: '',
    price: '',
    amountPaid: '',
    notes: '',
  });

  // Order measurements
  const [orderMeasurements, setOrderMeasurements] = useState({});
  const [customMeasurements, setCustomMeasurements] = useState({});

  // Image upload state
  const [styleImage, setStyleImage] = useState(null);
  const [styleImagePreview, setStyleImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Form errors
  const [errors, setErrors] = useState({});

  // Helper function to safely convert Firebase Timestamp to ISO string
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

  // Load existing customers on component mount
  useEffect(() => {
    const loadCustomers = async () => {
      if (!user?.uid || !shop) return;

      try {
        dispatch(setCustomersLoading(true));
        const customersRef = collection(db, 'shops', user.uid, 'customers');
        const snapshot = await getDocs(customersRef);
        const customersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: convertTimestampToString(data.createdAt)
          };
        });
        dispatch(setCustomers(customersData));

        // If there's a preselected customer ID, load that customer
        if (preselectedCustomerId) {
          const preselectedCustomer = customersData.find(c => c.id === preselectedCustomerId);
          if (preselectedCustomer) {
            await selectCustomer(preselectedCustomer);
          }
        }
      } catch (error) {
        console.error('Error loading customers:', error);
      } finally {
        dispatch(setCustomersLoading(false));
      }
    };

    loadCustomers();
  }, [user?.uid, shop, dispatch, preselectedCustomerId]);

  // Initialize default measurements when gender changes
  useEffect(() => {
    const gender = selectedCustomer?.gender || customerData.gender;
    if (gender && showCustomerForm) {
      const defaultMeasurements = initializeDefaultMeasurements(gender);
      setCustomerMeasurements(defaultMeasurements);
    }
  }, [selectedCustomer?.gender, customerData.gender, showCustomerForm]);

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.fullName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch)
  );

  // Handle customer search and selection
  const handleCustomerSearch = (value) => {
    setCustomerSearch(value);
    if (value.trim() === '') {
      setSelectedCustomer(null);
      setShowCustomerForm(true);
    }
  };

  const selectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(`${customer.fullName} (${customer.phone})`);
    setShowCustomerForm(false);
    setCustomerData({
      fullName: customer.fullName,
      phone: customer.phone,
      address: customer.address || '',
      gender: customer.gender || '',
    });

    // Load customer's default measurements
    try {
      const measurementsRef = doc(db, 'shops', user.uid, 'customers', customer.id, 'measurements', 'default');
      const measurementsDoc = await getDoc(measurementsRef);
      
      if (measurementsDoc.exists()) {
        setCustomerMeasurements(measurementsDoc.data());
      } else {
        // Initialize with default structure if no measurements exist
        const defaultMeasurements = initializeDefaultMeasurements(customer.gender);
        setCustomerMeasurements(defaultMeasurements);
      }
    } catch (error) {
      console.error('Error loading customer measurements:', error);
      // Fallback to default measurements
      const defaultMeasurements = initializeDefaultMeasurements(customer.gender);
      setCustomerMeasurements(defaultMeasurements);
    }

    // Reset order data when customer changes
    setOrderData(prev => ({
      ...prev,
      garmentType: ''
    }));
    setOrderMeasurements({});
    setCustomMeasurements({});
  };

  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setShowCustomerForm(true);
    setCustomerData({
      fullName: '',
      phone: '',
      address: '',
      gender: '',
    });
    setCustomerMeasurements({});
    setOrderData(prev => ({
      ...prev,
      garmentType: ''
    }));
    setOrderMeasurements({});
    setCustomMeasurements({});
  };

  // Handle form input changes
  const handleCustomerChange = (e) => {
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

    // Reset garment type if gender changes
    if (name === 'gender') {
      setOrderData(prev => ({
        ...prev,
        garmentType: ''
      }));
      setOrderMeasurements({});
    }
  };

  const handleOrderChange = (e) => {
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
        setErrors(prev => ({
          ...prev,
          styleImage: 'Please select a valid image file'
        }));
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          styleImage: 'Image size should be less than 10MB'
        }));
        return;
      }

      setStyleImage(file);
      setImageLoading(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setStyleImagePreview(event.target.result);
          setImageLoading(false);
        }
      };
      reader.onerror = () => {
        console.error('Error reading file');
        setImageLoading(false);
        setErrors(prev => ({
          ...prev,
          styleImage: 'Error reading image file'
        }));
      };
      reader.readAsDataURL(file);

      // Clear image error
      if (errors.styleImage) {
        setErrors(prev => ({
          ...prev,
          styleImage: ''
        }));
      }
    }
  };

  const clearStyleImage = () => {
    setStyleImage(null);
    setStyleImagePreview(null);
    setImageLoading(false);
    // Clear the file input
    const fileInput = document.getElementById('styleImageInput');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Customer validation (only if showing customer form)
    if (showCustomerForm) {
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
    }

    // Order validation
    if (!orderData.garmentType.trim()) {
      newErrors.garmentType = 'Garment type is required';
    }
    if (!orderData.styleDescription.trim() && !styleImage) {
      newErrors.styleDescription = 'Please provide either a style description or upload an image';
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

  // Calculate balance
  const calculateBalance = () => {
    const price = parseFloat(orderData.price) || 0;
    const paid = parseFloat(orderData.amountPaid) || 0;
    return price - paid;
  };

  // Upload style image to Firebase Storage
  const uploadStyleImage = async (customerId, orderId) => {
    if (!styleImage) return null;

    try {
      const imageRef = ref(storage, `style-images/${user.uid}/${customerId}/${orderId}/${Date.now()}_${styleImage.name}`);
      const snapshot = await uploadBytes(imageRef, styleImage);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading style image:', error);
      throw new Error('Failed to upload style image. Please try again.');
    }
  };

  // Check if customer already exists
  const findExistingCustomer = async (phone) => {
    try {
      const customersRef = collection(db, 'shops', user.uid, 'customers');
      const q = query(customersRef, where('phone', '==', phone));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        return {
          id: snapshot.docs[0].id,
          ...data,
          createdAt: convertTimestampToString(data.createdAt)
        };
      }
      return null;
    } catch (error) {
      console.error('Error checking existing customer:', error);
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    dispatch(setCustomersLoading(true));
    dispatch(setOrdersLoading(true));

    try {
      let customerId;
      let customerInfo;

      // Handle customer creation or selection
      if (selectedCustomer) {
        // Use existing customer
        customerId = selectedCustomer.id;
        customerInfo = selectedCustomer;
      } else {
        // Check if customer with same phone already exists
        const existingCustomer = await findExistingCustomer(customerData.phone);
        
        if (existingCustomer) {
          // Use existing customer
          customerId = existingCustomer.id;
          customerInfo = existingCustomer;
          dispatch(addCustomer(existingCustomer));
        } else {
          // Create new customer
          const customerRef = doc(collection(db, 'shops', user.uid, 'customers'));
          customerId = customerRef.id;
          
          // Prepare customer data for Firestore (with serverTimestamp)
          const customerFirestoreData = {
            id: customerId,
            fullName: customerData.fullName.trim(),
            phone: customerData.phone.trim(),
            address: customerData.address.trim(),
            gender: customerData.gender,
            createdAt: serverTimestamp(),
          };

          // Prepare customer data for Redux (with ISO string)
          customerInfo = {
            id: customerId,
            fullName: customerData.fullName.trim(),
            phone: customerData.phone.trim(),
            address: customerData.address.trim(),
            gender: customerData.gender,
            createdAt: new Date().toISOString(),
          };

          await setDoc(customerRef, customerFirestoreData);

          // Save customer measurements if creating new customer
          if (Object.keys(customerMeasurements).length > 0) {
            const measurementsRef = doc(db, 'shops', user.uid, 'customers', customerId, 'measurements', 'default');
            await setDoc(measurementsRef, customerMeasurements);
          }

          dispatch(addCustomer(customerInfo));
        }
      }

      // Create order
      const ordersRef = collection(db, 'shops', user.uid, 'customers', customerId, 'orders');
      const orderRef = doc(ordersRef);
      const orderId = orderRef.id;

      // Upload style image if provided
      let styleImageURL = null;
      if (styleImage) {
        styleImageURL = await uploadStyleImage(customerId, orderId);
      }

      // Prepare order data for Firestore (with serverTimestamp)
      const orderFirestoreData = {
        id: orderId,
        customerId,
        customerName: customerInfo.fullName,
        garmentType: orderData.garmentType.trim(),
        styleDescription: orderData.styleDescription.trim(),
        styleImageURL,
        dueDate: orderData.dueDate,
        price: parseFloat(orderData.price),
        amountPaid: parseFloat(orderData.amountPaid) || 0,
        balance: calculateBalance(),
        notes: orderData.notes.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      // Prepare order data for Redux (with ISO string)
      const orderInfo = {
        id: orderId,
        customerId,
        customerName: customerInfo.fullName,
        garmentType: orderData.garmentType.trim(),
        styleDescription: orderData.styleDescription.trim(),
        styleImageURL,
        dueDate: orderData.dueDate,
        price: parseFloat(orderData.price),
        amountPaid: parseFloat(orderData.amountPaid) || 0,
        balance: calculateBalance(),
        notes: orderData.notes.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await setDoc(orderRef, orderFirestoreData);

      // Save order measurements
      if (Object.keys(orderMeasurements).length > 0) {
        const orderMeasurementsRef = doc(db, 'shops', user.uid, 'customers', customerId, 'orders', orderId, 'measurements', 'default');
        await setDoc(orderMeasurementsRef, orderMeasurements);
      }

      // Save custom measurements
      if (Object.keys(customMeasurements).length > 0) {
        const customMeasurementsRef = doc(db, 'shops', user.uid, 'customers', customerId, 'orders', orderId, 'customMeasurements', 'default');
        await setDoc(customMeasurementsRef, customMeasurements);
      }

      dispatch(addOrder(orderInfo));

      // Redirect to customer details page
      navigate(`/customers/${customerId}`);

    } catch (error) {
      console.error('Error creating order:', error);
      setErrors({ general: error.message || 'Failed to create order. Please try again.' });
    } finally {
      setIsSubmitting(false);
      dispatch(setCustomersLoading(false));
      dispatch(setOrdersLoading(false));
    }
  };

  // Get available garment types based on selected gender
  const getAvailableGarmentTypes = () => {
    const gender = selectedCustomer?.gender || customerData.gender;
    if (!gender) return [];
    return getGarmentTypesForGender(gender);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-lightBlue-500 rounded-3xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 bg-clip-text text-transparent">
            {selectedCustomer ? `Add Order for ${selectedCustomer.fullName}` : 'Add New Order'}
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {selectedCustomer 
            ? `Create a new order for ${selectedCustomer.fullName}.`
            : 'Create a new order for an existing customer or add a new customer with their first order.'
          }
        </p>
      </div>

      {/* Main Form */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-100">
        {/* General Error Message */}
        {errors.general && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm font-medium">{errors.general}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Selection Section */}
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
                    onChange={(e) => handleCustomerSearch(e.target.value)}
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
                        onClick={() => selectCustomer(customer)}
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
              <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-emerald-800">Selected Customer</h3>
                    <p className="text-emerald-700">{selectedCustomer.fullName}</p>
                    <p className="text-sm text-emerald-600">{selectedCustomer.phone} • {selectedCustomer.gender}</p>
                  </div>
                  {!preselectedCustomerId && (
                    <button
                      type="button"
                      onClick={clearCustomerSelection}
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

            {/* Customer Form (show only if no customer selected) */}
            {showCustomerForm && (
              <>
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
                      onChange={handleCustomerChange}
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
                      onChange={handleCustomerChange}
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
                      onChange={handleCustomerChange}
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
                      onChange={handleCustomerChange}
                      className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
                      placeholder="Enter customer's address"
                    />
                  </div>
                </div>

                {/* Customer Measurements for New Customer */}
                {customerData.gender && (
                  <div className="mt-6">
                    <MeasurementForm
                      gender={customerData.gender}
                      measurements={customerMeasurements}
                      onChange={setCustomerMeasurements}
                      isCollapsible={true}
                      title="Default Customer Measurements (Optional)"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Order Details Section */}
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
                  onChange={handleOrderChange}
                  disabled={!selectedCustomer?.gender && !customerData.gender}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 ${
                    errors.garmentType ? 'border-red-300 bg-red-50' : 'border-emerald-200 hover:border-emerald-300'
                  } ${!selectedCustomer?.gender && !customerData.gender ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">
                    {selectedCustomer?.gender || customerData.gender ? 'Select Garment Type' : 'Select Gender First'}
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
                  onChange={handleOrderChange}
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
                  onChange={handleOrderChange}
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
                  onChange={handleOrderChange}
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

              {/* Balance Display */}
              {orderData.price && (
                <div className="md:col-span-2">
                  <div className="bg-gradient-to-r from-cream-50 to-orange-50 border border-cream-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Balance Remaining:</span>
                      <span className="text-lg font-bold text-orange-600">
                        ₦{calculateBalance().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Style Reference */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Style Reference *
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Provide either a style description or upload an image (or both)
              </p>

              {/* Style Image Upload */}
              <div className="mb-4">
                <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
                  errors.styleImage ? 'border-red-300 bg-red-50' : 'border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50'
                }`}>
                  <input
                    id="styleImageInput"
                    type="file"
                    accept="image/*"
                    onChange={handleStyleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-2">
                    <svg className="w-12 h-12 text-emerald-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div>
                      <p className="text-emerald-600 font-medium">Click to upload style image</p>
                      <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>

                {/* Image Preview */}
                {(styleImagePreview || imageLoading) && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="relative">
                      {imageLoading ? (
                        <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                          <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      ) : styleImagePreview ? (
                        <div className="relative bg-white p-2 rounded-xl shadow-lg border border-gray-200">
                          <img
                            src={styleImagePreview}
                            alt="Style preview"
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={clearStyleImage}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors duration-200 shadow-lg"
                          >
                            ×
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {errors.styleImage && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.styleImage}
                  </p>
                )}
              </div>

              {/* Style Description */}
              <div>
                <textarea
                  id="styleDescription"
                  name="styleDescription"
                  value={orderData.styleDescription}
                  onChange={handleOrderChange}
                  rows={3}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 resize-none ${
                    errors.styleDescription ? 'border-red-300 bg-red-50' : 'border-emerald-200 hover:border-emerald-300'
                  }`}
                  placeholder="Describe the style details (e.g., High neck with bell sleeves, A-line cut, etc.)"
                />
                {errors.styleDescription && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.styleDescription}
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={orderData.notes}
                onChange={handleOrderChange}
                rows={2}
                className="w-full px-4 py-3 bg-white border-2 border-emerald-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 resize-none"
                placeholder="Any special instructions or notes for this order"
              />
            </div>
          </div>

          {/* Order Measurements */}
          {(selectedCustomer?.gender || customerData.gender) && orderData.garmentType && (
            <OrderMeasurementForm
              gender={selectedCustomer?.gender || customerData.gender}
              garmentType={orderData.garmentType}
              customerMeasurements={customerMeasurements}
              orderMeasurements={orderMeasurements}
              onChange={setOrderMeasurements}
            />
          )}

          {/* Custom Measurements */}
          {(selectedCustomer?.gender || customerData.gender) && orderData.garmentType && (
            <CustomMeasurementForm
              customMeasurements={customMeasurements}
              onChange={setCustomMeasurements}
            />
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 hover:from-purple-700 hover:via-pink-700 hover:to-lightBlue-700 text-white px-12 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="relative z-10 flex items-center justify-center">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Order...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Order
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-lightBlue-400 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrderPage;