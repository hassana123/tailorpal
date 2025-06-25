import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { doc, getDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { deleteOrderCompletely } from '../utils/deleteHelpers';
import { deleteOrder } from '../store/slices/ordersSlice';

const OrderDetailsPage = () => {
  const { customerId, orderId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [orderMeasurements, setOrderMeasurements] = useState({});
  const [customMeasurements, setCustomMeasurements] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

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

      } catch (error) {
        console.error('Error loading order data:', error);
        setError('Failed to load order data');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderData();
  }, [user?.uid, customerId, orderId]);

  // Handle delete order
  const handleDeleteOrder = async () => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone and will remove all related data including materials and measurements.')) {
      return;
    }

    try {
      setIsDeleting(true);
      
      await deleteOrderCompletely(user.uid, customerId, orderId);
      
      // Update Redux store
      dispatch(deleteOrder(orderId));

      // Navigate back to customer details
      navigate(`/customers/${customerId}`);

    } catch (error) {
      console.error('Error deleting order:', error);
      setError('Failed to delete order. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  // Calculate total material cost
  const calculateTotalMaterialCost = () => {
    return materials.reduce((total, material) => total + (material.totalCost || 0), 0);
  };

  // Calculate net profit
  const calculateNetProfit = () => {
    const totalPrice = order?.price || 0;
    const totalMaterialCost = calculateTotalMaterialCost();
    return totalPrice - totalMaterialCost;
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

  if (error) {
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
          <button
            onClick={() => navigate(`/customers/${customerId}/orders/${orderId}/edit`)}
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
        </div>
      </div>

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
              <p className="text-lg font-medium text-gray-900">{formatDate(order.dueDate)}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</h3>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
              </span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-50 to-lightBlue-50 rounded-2xl p-6 border border-emerald-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Financial Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Price:</span>
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(order.price)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="text-lg font-semibold text-emerald-600">{formatCurrency(order.amountPaid)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Balance:</span>
                  <span className={`text-lg font-semibold ${order.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(order.balance)}
                  </span>
                </div>

                <div className="border-t border-emerald-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Material Cost:</span>
                    <span className="text-lg font-semibold text-orange-600">{formatCurrency(calculateTotalMaterialCost())}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Net Profit:</span>
                    <span className={`text-lg font-semibold ${calculateNetProfit() > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(calculateNetProfit())}
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
            
            {order.styleImageURL ? (
              <img
                src={order.styleImageURL}
                alt="Style reference"
                className="w-full h-64 object-cover rounded-xl border border-gray-200 shadow-lg"
              />
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
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
            <div className="bg-gray-50 rounded-xl p-4 min-h-[150px]">
              {order.styleDescription ? (
                <p className="text-gray-900 leading-relaxed">{order.styleDescription}</p>
              ) : (
                <p className="text-gray-500 italic">No style description provided</p>
              )}
            </div>

            {/* Notes */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Additional Notes</h3>
              <div className="bg-gray-50 rounded-xl p-4 min-h-[100px]">
                {order.notes ? (
                  <p className="text-gray-900 leading-relaxed">{order.notes}</p>
                ) : (
                  <p className="text-gray-500 italic">No additional notes</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Materials */}
      {materials.length > 0 && (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Materials ({materials.length})
          </h2>

          <div className="space-y-4">
            {materials.map((material) => (
              <div key={material.id} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Material</h4>
                    <p className="font-semibold text-gray-900">{material.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Quantity</h4>
                    <p className="text-gray-900">{material.quantity}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Unit Cost</h4>
                    <p className="text-gray-900">{formatCurrency(material.unitCost)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Cost</h4>
                    <p className="font-semibold text-emerald-600">{formatCurrency(material.totalCost)}</p>
                  </div>
                </div>
                {material.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</h4>
                    <p className="text-gray-600">{material.notes}</p>
                  </div>
                )}
              </div>
            ))}

            <div className="bg-gradient-to-r from-emerald-100 to-lightBlue-100 rounded-xl p-4 border-2 border-emerald-300">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Total Material Cost</h3>
                <span className="text-xl font-bold text-emerald-700">{formatCurrency(calculateTotalMaterialCost())}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Measurements */}
      {Object.keys(orderMeasurements).length > 0 && (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Measurements
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(orderMeasurements).map(([key, value]) => (
              <div key={key} className="bg-gradient-to-r from-orange-50 to-cream-50 rounded-xl p-4 border border-orange-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </h4>
                <p className="text-xl font-bold text-orange-600">{value}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Measurements */}
      {Object.keys(customMeasurements).length > 0 && (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
            Custom Measurements
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(customMeasurements).map(([key, field]) => (
              <div key={key} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  {field.label}
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                    custom
                  </span>
                </h4>
                <p className="text-xl font-bold text-purple-600">{field.value}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;