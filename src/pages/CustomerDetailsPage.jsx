import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { doc, getDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';

const CustomerDetailsPage = () => {
  const { customerId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    const loadCustomerData = async () => {
      if (!user?.uid || !customerId) return;

      try {
        setIsLoading(true);
        
        // Load customer details
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

        // Load customer orders
        const ordersRef = collection(db, 'shops', user.uid, 'customers', customerId, 'orders');
        const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
        const ordersSnapshot = await getDocs(ordersQuery);
        
        const ordersData = ordersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: convertTimestampToString(data.createdAt)
          };
        });
        setOrders(ordersData);

      } catch (error) {
        console.error('Error loading customer data:', error);
        setError('Failed to load customer data');
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomerData();
  }, [user?.uid, customerId]);

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
          <p className="text-gray-600 text-lg">Loading customer details...</p>
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
            onClick={() => navigate('/customers')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/customers')}
            className="flex items-center text-purple-600 hover:text-purple-700 mb-4 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Customers
          </button>
          
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 bg-clip-text text-transparent">
              {customer.fullName}
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">Customer Details & Order History</p>
        </div>

        <button
          onClick={() => navigate(`/add-order?customerId=${customerId}`)}
          className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Order
        </button>
      </div>

      {/* Customer Information */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Customer Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Full Name</h3>
            <p className="text-lg font-medium text-gray-900">{customer.fullName}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Phone Number</h3>
            <p className="text-lg font-medium text-gray-900">{customer.phone}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Address</h3>
            <p className="text-lg font-medium text-gray-900">{customer.address || 'Not provided'}</p>
          </div>
        </div>

        {/* Customer Stats */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{orders.length}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-50 to-lightBlue-50 rounded-xl p-4 border border-emerald-200">
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(orders.reduce((sum, order) => sum + (order.price || 0), 0))}
            </div>
            <div className="text-sm text-gray-600">Total Value</div>
          </div>
          
          <div className="bg-gradient-to-r from-cream-50 to-orange-50 rounded-xl p-4 border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(orders.reduce((sum, order) => sum + (order.amountPaid || 0), 0))}
            </div>
            <div className="text-sm text-gray-600">Total Paid</div>
          </div>
          
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(orders.reduce((sum, order) => sum + (order.balance || 0), 0))}
            </div>
            <div className="text-sm text-gray-600">Outstanding</div>
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <svg className="w-6 h-6 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Order History ({orders.length})
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8h6m-6 4h6" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-600 mb-6">This customer hasn't placed any orders yet.</p>
            <button
              onClick={() => navigate(`/add-order?customerId=${customerId}`)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
            >
              Create First Order
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div 
                key={order.id} 
                onClick={() => navigate(`/customers/${customerId}/orders/${order.id}`)}
                className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{order.garmentType}</h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                          </span>
                          <span className="text-sm text-gray-600">Due: {formatDate(order.dueDate)}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(order.price)}</div>
                        <div className="text-sm text-gray-600">
                          Paid: {formatCurrency(order.amountPaid)} | 
                          Balance: {formatCurrency(order.balance)}
                        </div>
                      </div>
                    </div>

                    {/* Style Reference */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      {order.styleImageURL && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Style Image</h4>
                          <img
                            src={order.styleImageURL}
                            alt="Style reference"
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                      
                      {order.styleDescription && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Style Description</h4>
                          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{order.styleDescription}</p>
                        </div>
                      )}
                    </div>

                    {/* Measurements */}
                    {order.measurements && Object.values(order.measurements).some(val => val > 0) && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Measurements (inches)</h4>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                          {Object.entries(order.measurements).map(([key, value]) => (
                            value > 0 && (
                              <div key={key} className="text-center bg-gray-50 rounded-lg p-2">
                                <div className="text-sm font-medium text-gray-900">{value}"</div>
                                <div className="text-xs text-gray-600 capitalize">{key}</div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
                        <p className="text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">{order.notes}</p>
                      </div>
                    )}

                    {/* Order Date */}
                    <div className="text-sm text-gray-500">
                      Order created: {formatDate(order.createdAt)}
                    </div>
                  </div>

                  {/* View Order Button */}
                  <div className="lg:ml-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/customers/${customerId}/orders/${order.id}`);
                      }}
                      className="w-full lg:w-auto bg-gradient-to-r from-emerald-600 to-lightBlue-600 hover:from-emerald-700 hover:to-lightBlue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Order
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetailsPage;