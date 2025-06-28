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
import MaterialsForm from '../components/MaterialsForm';
import {
  AddOrderHeader,
  CustomerSearchSection,
  NewCustomerForm,
  OrderDetailsForm,
  StyleReferenceForm,
  SubmitButton,
  ErrorMessage
} from '../components/addorder';
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
    dueDate: '',
    price: '',
    amountPaid: '',
    status: 'pending'
  });

  // Order measurements and materials
  const [orderMeasurements, setOrderMeasurements] = useState({});
  const [customMeasurements, setCustomMeasurements] = useState({});
  const [materials, setMaterials] = useState([]);

  // Style reference
  const [styleDescription, setStyleDescription] = useState('');
  const [notes, setNotes] = useState('');

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
    if(!styleDescription){
      newErrors.styleDescription = "Please Provide Description";
    }
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

  // Calculate balance
  const calculateBalance = () => {
    const price = parseFloat(orderData.price) || 0;
    const paid = parseFloat(orderData.amountPaid) || 0;
    return price - paid;
  };

  // Calculate total material cost
  const calculateTotalMaterialCost = () => {
    return materials.reduce((total, material) => total + (material.totalCost || 0), 0);
  };

  // Calculate net profit
  const calculateNetProfit = () => {
    const totalPrice = parseFloat(orderData.price) || 0;
    const totalMaterialCost = calculateTotalMaterialCost();
    return totalPrice - totalMaterialCost;
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
        styleDescription: styleDescription.trim(),
        styleImageURL,
        dueDate: orderData.dueDate,
        price: parseFloat(orderData.price),
        amountPaid: parseFloat(orderData.amountPaid) || 0,
        balance: calculateBalance(),
        notes: notes.trim(),
        status: orderData.status,
        createdAt: serverTimestamp(),
      };

      // Prepare order data for Redux (with ISO string)
      const orderInfo = {
        id: orderId,
        customerId,
        customerName: customerInfo.fullName,
        garmentType: orderData.garmentType.trim(),
        styleDescription: styleDescription.trim(),
        styleImageURL,
        dueDate: orderData.dueDate,
        price: parseFloat(orderData.price),
        amountPaid: parseFloat(orderData.amountPaid) || 0,
        balance: calculateBalance(),
        notes: notes.trim(),
        status: orderData.status,
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

      // Save materials
      for (const material of materials) {
        const materialsRef = collection(db, 'shops', user.uid, 'customers', customerId, 'orders', orderId, 'materials');
        await addDoc(materialsRef, material);
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

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <AddOrderHeader selectedCustomer={selectedCustomer} />

      {/* Main Form */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl md:p-8 border border-purple-100">
        {/* General Error Message */}
        <ErrorMessage error={errors.general} />

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Selection Section */}
          <CustomerSearchSection
            preselectedCustomerId={preselectedCustomerId}
            customerSearch={customerSearch}
            onCustomerSearch={handleCustomerSearch}
            filteredCustomers={filteredCustomers}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={selectCustomer}
            onClearCustomerSelection={clearCustomerSelection}
          />

          {/* Customer Form (show only if no customer selected) */}
          {showCustomerForm && (
            <>
              <NewCustomerForm
                customerData={customerData}
                onChange={handleCustomerChange}
                errors={errors}
              />

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

          {/* Order Details Section */}
          <OrderDetailsForm
            orderData={orderData}
            customerGender={selectedCustomer?.gender || customerData.gender}
            onChange={handleOrderChange}
            errors={errors}
            formatCurrency={formatCurrency}
            calculateBalance={calculateBalance}
            calculateTotalMaterialCost={calculateTotalMaterialCost}
            calculateNetProfit={calculateNetProfit}
          />

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

          {/* Style Reference Section */}
          <StyleReferenceForm
            styleDescription={styleDescription}
            setStyleDescription={setStyleDescription}
            notes={notes}
            setNotes={setNotes}
            styleImage={styleImage}
            styleImagePreview={styleImagePreview}
            imageLoading={imageLoading}
            onImageChange={handleStyleImageChange}
            onClearImage={clearStyleImage}
            errors={errors}
          />

          {/* Materials Section */}
          {(selectedCustomer?.gender || customerData.gender) && orderData.garmentType && (
            <MaterialsForm
              customerId="temp"
              orderId="temp"
              materials={materials}
              onChange={setMaterials}
            />
          )}

          {/* Submit Button */}
          <SubmitButton isSubmitting={isSubmitting} />
        </form>
      </div>
    </div>
  );
};

export default AddOrderPage;