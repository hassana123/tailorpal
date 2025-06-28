import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDocs, 
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
  AddCustomerHeader,
  CustomerInformationForm,
  OrderToggleSection,
  OrderDetailsForm,
  StyleReferenceForm,
  SubmitButtons,
  ErrorMessage
} from '../components/addcustomer';
import { 
  initializeDefaultMeasurements, 
  getGarmentTypesForGender,
  extractOrderMeasurements 
} from '../utils/measurementConfigs';

const AddCustomerPage = () => {
  const { user } = useSelector((state) => state.auth);
  const { shop } = useSelector((state) => state.shop);
  const { customers } = useSelector((state) => state.customers);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrderSection, setShowOrderSection] = useState(false);

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
      } catch (error) {
        console.error('Error loading customers:', error);
      } finally {
        dispatch(setCustomersLoading(false));
      }
    };

    loadCustomers();
  }, [user?.uid, shop, dispatch]);

  // Initialize default measurements when gender changes
  useEffect(() => {
    if (customerData.gender) {
      const defaultMeasurements = initializeDefaultMeasurements(customerData.gender);
      setCustomerMeasurements(defaultMeasurements);
      
      // Reset order data when gender changes
      setOrderData(prev => ({
        ...prev,
        garmentType: ''
      }));
      setOrderMeasurements({});
    } else {
      setCustomerMeasurements({});
    }
  }, [customerData.gender]);

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

    // Customer validation
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

    // Order validation (only if order section is shown)
    if (showOrderSection) {
      if(!styleDescription){
        newErrors.styleDescription ="Description is Required"
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
    if (showOrderSection) {
      dispatch(setOrdersLoading(true));
    }

    try {
      // Check if customer with same phone already exists
      const existingCustomer = await findExistingCustomer(customerData.phone);
      
      if (existingCustomer) {
        setErrors({ general: 'A customer with this phone number already exists. Please use a different phone number or update the existing customer.' });
        return;
      }

      // Create new customer
      const customerRef = doc(collection(db, 'shops', user.uid, 'customers'));
      const customerId = customerRef.id;
      
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
      const customerInfo = {
        id: customerId,
        fullName: customerData.fullName.trim(),
        phone: customerData.phone.trim(),
        address: customerData.address.trim(),
        gender: customerData.gender,
        createdAt: new Date().toISOString(),
      };

      await setDoc(customerRef, customerFirestoreData);

      // Save customer measurements
      if (Object.keys(customerMeasurements).length > 0) {
        const measurementsRef = doc(db, 'shops', user.uid, 'customers', customerId, 'measurements', 'default');
        await setDoc(measurementsRef, customerMeasurements);
      }

      dispatch(addCustomer(customerInfo));

      // Create order if order section is shown
      if (showOrderSection) {
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
      }

      // Redirect to customer details page or customers list
      if (showOrderSection) {
        navigate(`/customers/${customerId}`);
      } else {
        navigate('/customers');
      }

    } catch (error) {
      console.error('Error creating customer:', error);
      setErrors({ general: error.message || 'Failed to create customer. Please try again.' });
    } finally {
      setIsSubmitting(false);
      dispatch(setCustomersLoading(false));
      if (showOrderSection) {
        dispatch(setOrdersLoading(false));
      }
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <AddCustomerHeader showOrderSection={showOrderSection} />

      {/* Main Form */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl md:p-8 border border-purple-100">
        {/* Error Message */}
        <ErrorMessage error={errors.general} />

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Information Section */}
          <CustomerInformationForm
            customerData={customerData}
            onChange={handleCustomerChange}
            errors={errors}
          />

          {/* Customer Measurements Section */}
          {customerData.gender && (
            <MeasurementForm
              gender={customerData.gender}
              measurements={customerMeasurements}
              onChange={setCustomerMeasurements}
              isCollapsible={true}
              title="Default Customer Measurements (Optional)"
            />
          )}

          {/* Add Order Toggle */}
          <OrderToggleSection
            showOrderSection={showOrderSection}
            onToggle={() => setShowOrderSection(!showOrderSection)}
          />

          {/* Order Details Section */}
          {showOrderSection && (
            <>
              <OrderDetailsForm
                orderData={orderData}
                customerGender={customerData.gender}
                onChange={handleOrderChange}
                errors={errors}
                formatCurrency={formatCurrency}
                calculateBalance={calculateBalance}
                calculateTotalMaterialCost={calculateTotalMaterialCost}
                calculateNetProfit={calculateNetProfit}
              />

              {/* Order Measurements */}
              {customerData.gender && orderData.garmentType && (
                <OrderMeasurementForm
                  gender={customerData.gender}
                  garmentType={orderData.garmentType}
                  customerMeasurements={customerMeasurements}
                  orderMeasurements={orderMeasurements}
                  onChange={setOrderMeasurements}
                />
              )}

              {/* Custom Measurements */}
              {customerData.gender && orderData.garmentType && (
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
              {customerData.gender && orderData.garmentType && (
                <MaterialsForm
                  customerId="temp"
                  orderId="temp"
                  materials={materials}
                  onChange={setMaterials}
                />
              )}
            </>
          )}

          {/* Submit Buttons */}
          <SubmitButtons
            isSubmitting={isSubmitting}
            showOrderSection={showOrderSection}
          />
        </form>
      </div>
    </div>
  );
};

export default AddCustomerPage;