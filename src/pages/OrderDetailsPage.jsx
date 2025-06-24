import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { updateOrder, setLoading } from '../store/slices/ordersSlice';

// Nigerian tailoring measurement configurations
const MEASUREMENT_CONFIGS = {
  female: {
    'boubou': {
      name: 'Boubou',
      measurements: ['bust', 'shoulder', 'boubouLength', 'sleeveLength']
    },
    'gown': {
      name: 'Gown',
      measurements: ['bust', 'waist', 'hip', 'shoulder', 'gownLength', 'sleeveLength']
    },
    'wrapper-blouse': {
      name: 'Wrapper & Blouse',
      measurements: ['bust', 'waist', 'hip', 'blouseLength', 'wrapperLength', 'sleeveLength']
    },
    'skirt-blouse': {
      name: 'Skirt & Blouse',
      measurements: ['bust', 'waist', 'hip', 'blouseLength', 'skirtLength', 'sleeveLength']
    },
    'trousers': {
      name: 'Trousers',
      measurements: ['waist', 'hip', 'thigh', 'trouserLength', 'lap']
    },
    'jumpsuit': {
      name: 'Jumpsuit',
      measurements: ['bust', 'waist', 'hip', 'shoulder', 'jumpsuitLength', 'sleeveLength']
    }
  },
  male: {
    'kaftan': {
      name: 'Kaftan',
      measurements: ['shoulder', 'chest', 'sleeveLength', 'kaftanLength']
    },
    'senator': {
      name: 'Senator',
      measurements: ['shoulder', 'chest', 'waist', 'sleeveLength', 'topLength', 'trouserLength']
    },
    'agbada': {
      name: 'Agbada',
      measurements: ['shoulder', 'chest', 'sleeveLength', 'agbadaLength', 'armholeCircumference']
    },
    'shirt-trousers': {
      name: 'Shirt & Trousers',
      measurements: ['shoulder', 'chest', 'waist', 'sleeveLength', 'shirtLength', 'trouserLength', 'lap']
    },
    'trousers': {
      name: 'Trousers',
      measurements: ['waist', 'hip', 'thigh', 'trouserLength', 'lap']
    },
    'dashiki': {
      name: 'Dashiki',
      measurements: ['shoulder', 'chest', 'sleeveLength', 'dashikiLength']
    }
  }
};

// Measurement field labels
const MEASUREMENT_LABELS = {
  bust: 'Bust',
  waist: 'Waist',
  hip: 'Hip',
  shoulder: 'Shoulder',
  chest: 'Chest',
  thigh: 'Thigh',
  lap: 'Lap',
  sleeveLength: 'Sleeve Length',
  gownLength: 'Gown Length',
  boubouLength: 'Boubou Length',
  kaftanLength: 'Kaftan Length',
  agbadaLength: 'Agbada Length',
  dashikiLength: 'Dashiki Length',
  topLength: 'Top Length',
  shirtLength: 'Shirt Length',
  blouseLength: 'Blouse Length',
  trouserLength: 'Trouser Length',
  skirtLength: 'Skirt Length',
  wrapperLength: 'Wrapper Length',
  jumpsuitLength: 'Jumpsuit Length',
  armholeCircumference: 'Armhole Circumference'
};

const OrderDetailsPage = () => {
  const { customerId, orderId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Edit form state
  const [editData, setEditData] = useState({
    dueDate: '',
    amountPaid: '',
    status: '',
    notes: '',
    styleDescription: '',
    measurements: {}
  });

  // Image upload state
  const [newStyleImage, setNewStyleImage] = useState(null);
  const [newStyleImagePreview, setNewStyleImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

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

        // Load order data
        const orderDoc = await getDoc(doc(db, 'shops', user.uid, 'customers', customerId, 'orders', orderId));
        if (!orderDoc.exists()) {
          setError('Order not found');
          return;
        }

        const orderData = {
          id: orderDoc.id,
          ...orderDoc.data(),
          createdAt: convertTimestampToString(orderDoc.data().createdAt)
        };
        setOrder(orderData);

        // Initialize edit form with current data
        setEditData({
          dueDate: orderData.dueDate || '',
          amountPaid: orderData.amountPaid?.toString() || '',
          status: orderData.status || 'pending',
          notes: orderData.notes || '',
          styleDescription: orderData.styleDescription || '',
          measurements: orderData.measurements || {}
        });

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
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMeasurementChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [name]: value
      }
    }));
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
    const price = parseFloat(order?.price) || 0;
    const paid = parseFloat(editData.amountPaid) || 0;
    return price - paid;
  };

  // Check if due date is within 2 days
  const isDueSoon = () => {
    if (!editData.dueDate) return false;
    const dueDate = new Date(editData.dueDate);
    const today = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(today.getDate() + 2);
    return dueDate <= twoDaysFromNow && dueDate >= today;
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      setError('');

      // Validate form
      if (!editData.dueDate) {
        setError('Due date is required');
        return;
      }

      if (parseFloat(editData.amountPaid) < 0) {
        setError('Amount paid cannot be negative');
        return;
      }

      if (parseFloat(editData.amountPaid) > order.price) {
        setError('Amount paid cannot exceed the total price');
        return;
      }

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
        dueDate: editData.dueDate,
        amountPaid: parseFloat(editData.amountPaid) || 0,
        balance: calculateBalance(),
        status: editData.status,
        notes: editData.notes.trim(),
        styleDescription: editData.styleDescription.trim(),
        measurements: Object.fromEntries(
          Object.entries(editData.measurements).map(([key, value]) => [key, parseFloat(value) || 0])
        ),
        styleImageURL: newImageURL,
        updatedAt: new Date().toISOString()
      };

      // Update in Firestore
      const orderRef = doc(db, 'shops', user.uid, 'customers', customerId, 'orders', orderId);
      await updateDoc(orderRef, updatedData);

      // Update local state
      const updatedOrder = {
        ...order,
        ...updatedData
      };
      setOrder(updatedOrder);

      // Update Redux store
      dispatch(updateOrder(updatedOrder));

      // Clear edit state
      setIsEditing(false);
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

  // Handle delete order
  const handleDeleteOrder = async () => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      
      // Delete style image if it exists
      if (order.styleImageURL) {
        try {
          const imageRef = ref(storage, order.styleImageURL);
          await deleteObject(imageRef);
        } catch (error) {
          console.warn('Could not delete style image:', error);
        }
      }

      // Delete order from Firestore
      const orderRef = doc(db, 'shops', user.uid, 'customers', customerId, 'orders', orderId);
      await deleteDoc(orderRef);

      // Navigate back to customer details
      navigate(`/customers/${customerId}`);

    } catch (error) {
      console.error('Error deleting order:', error);
      setError('Failed to delete order. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get available measurements for the garment type
  const getAvailableMeasurements = () => {
    if (!customer?.gender || !order?.garmentType) return [];
    const config = MEASUREMENT_CONFIGS[customer.gender]?.[order.garmentType];
    return config ? config.measurements : [];
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
            onClick={() => navigate(`/customers/${customerId}`)}
            className="flex items-center text-purple-600 hover:text-purple-700 mb-4 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {customer.fullName}
          </button>
          
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 bg-clip-text text-transparent">
              {order.garmentType}
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">Order Details & Management</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-emerald-600 to-lightBlue-600 hover:from-emerald-700 hover:to-lightBlue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Order
              </button>
              <button
                onClick={handleDeleteOrder}
                disabled={isDeleting}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Order
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
              <button
                onClick={() => {
                  setIsEditing(false);
                  setNewStyleImage(null);
                  setNewStyleImagePreview(null);
                  setError('');
                  // Reset edit data
                  setEditData({
                    dueDate: order.dueDate || '',
                    amountPaid: order.amountPaid?.toString() || '',
                    status: order.status || 'pending',
                    notes: order.notes || '',
                    styleDescription: order.styleDescription || '',
                    measurements: order.measurements || {}
                  });
                }}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Due Date Warning */}
      {isDueSoon() && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 rounded-xl">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-yellow-800 font-semibold">⚠️ This order is almost due!</h3>
              <p className="text-yellow-700 text-sm">Due date: {formatDate(editData.dueDate)}</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Order Overview */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Order Overview
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Order Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Garment Type</h3>
              <p className="text-xl font-semibold text-gray-900">{order.garmentType}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer</h3>
              <p className="text-lg font-medium text-gray-900">{customer.fullName}</p>
              <p className="text-sm text-gray-600">{customer.phone}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Due Date</h3>
              {isEditing ? (
                <input
                  type="date"
                  name="dueDate"
                  value={editData.dueDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-white border-2 border-emerald-200 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                />
              ) : (
                <p className="text-lg font-medium text-gray-900">{formatDate(order.dueDate)}</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</h3>
              {isEditing ? (
                <select
                  name="status"
                  value={editData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border-2 border-emerald-200 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delivered">Delivered</option>
                </select>
              ) : (
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                  {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                </span>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-50 to-lightBlue-50 rounded-2xl p-6 border border-emerald-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Details</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Price:</span>
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(order.price)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount Paid:</span>
                  {isEditing ? (
                    <input
                      type="number"
                      name="amountPaid"
                      value={editData.amountPaid}
                      onChange={handleInputChange}
                      min="0"
                      max={order.price}
                      step="0.01"
                      className="w-32 px-3 py-2 bg-white border-2 border-emerald-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-emerald-600">{formatCurrency(order.amountPaid)}</span>
                  )}
                </div>

                <div className="border-t border-emerald-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Balance:</span>
                    <span className={`text-xl font-bold ${calculateBalance() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(isEditing ? calculateBalance() : order.balance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Created: {formatDate(order.createdAt)}</span>
                </div>
                {order.updatedAt && (
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    <span className="text-gray-600">Last updated: {formatDate(order.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Style Reference */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Style Reference
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Style Image */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Style Image</h3>
            
            {/* Current Image */}
            {(order.styleImageURL || newStyleImagePreview) && (
              <div className="mb-4">
                <img
                  src={newStyleImagePreview || order.styleImageURL}
                  alt="Style reference"
                  className="w-full h-64 object-cover rounded-xl border border-gray-200 shadow-lg"
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

            {/* Upload New Image (Edit Mode) */}
            {isEditing && (
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
            )}

            {!order.styleImageURL && !newStyleImagePreview && !isEditing && (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No style image uploaded</p>
              </div>
            )}
          </div>

          {/* Style Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Style Description</h3>
            {isEditing ? (
              <textarea
                name="styleDescription"
                value={editData.styleDescription}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-3 bg-white border-2 border-emerald-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 resize-none"
                placeholder="Describe the style details..."
              />
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 min-h-[150px]">
                {order.styleDescription ? (
                  <p className="text-gray-900 leading-relaxed">{order.styleDescription}</p>
                ) : (
                  <p className="text-gray-500 italic">No style description provided</p>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Additional Notes</h3>
              {isEditing ? (
                <textarea
                  name="notes"
                  value={editData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-white border-2 border-emerald-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 resize-none"
                  placeholder="Any special instructions or notes..."
                />
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 min-h-[100px]">
                  {order.notes ? (
                    <p className="text-gray-900 leading-relaxed">{order.notes}</p>
                  ) : (
                    <p className="text-gray-500 italic">No additional notes</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Measurements */}
      {getAvailableMeasurements().length > 0 && (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Measurements (inches)
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {getAvailableMeasurements().map((measurementKey) => (
              <div key={measurementKey} className="bg-gradient-to-r from-orange-50 to-cream-50 rounded-xl p-4 border border-orange-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {MEASUREMENT_LABELS[measurementKey] || measurementKey}
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name={measurementKey}
                    value={editData.measurements[measurementKey] || ''}
                    onChange={handleMeasurementChange}
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2 bg-white border-2 border-orange-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300"
                    placeholder="0"
                  />
                ) : (
                  <div className="text-xl font-bold text-orange-600">
                    {order.measurements?.[measurementKey] || 0}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;