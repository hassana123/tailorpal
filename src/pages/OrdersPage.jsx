import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { setOrders, setLoading } from '../store/slices/ordersSlice';
import { setCustomers } from '../store/slices/customersSlice';

const OrdersPage = () => {
  const { user } = useSelector((state) => state.auth);
  const { shop } = useSelector((state) => state.shop);
  const { orders, isLoading } = useSelector((state) => state.orders);
  const { customers } = useSelector((state) => state.customers);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');

  // Load orders and customers on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid || !shop) return;

      try {
        dispatch(setLoading(true));
        
        // Load customers first
        const customersRef = collection(db, 'shops', user.uid, 'customers');
        const customersSnapshot = await getDocs(customersRef);
        const customersData = customersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
          };
        });
        dispatch(setCustomers(customersData));

        // Load all orders from all customers
        const allOrders = [];
        
        for (const customer of customersData) {
          try {
            const ordersRef = collection(db, 'shops', user.uid, 'customers', customer.id, 'orders');
            const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
            const ordersSnapshot = await getDocs(ordersQuery);
            
            const customerOrders = ordersSnapshot.docs.map(doc => {
              const orderData = doc.data();
              return {
                id: doc.id,
                ...orderData,
                customerId: customer.id,
                customerName: customer.fullName,
                createdAt: orderData.createdAt?.toDate ? orderData.createdAt.toDate() : orderData.createdAt
              };
            });
            
            allOrders.push(...customerOrders);
          } catch (error) {
            console.error(`Error loading orders for customer ${customer.id}:`, error);
          }
        }
        
        // Sort all orders by creation date (newest first)
        allOrders.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA;
        });
        
        dispatch(setOrders(allOrders));
        console.log('Loaded orders:', allOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    loadData();
  }, [user?.uid, shop, dispatch]);

  // Filter orders based on search term, status, and customer
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.garmentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.styleDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesCustomer = customerFilter === 'all' || order.customerId === customerFilter;
    return matchesSearch && matchesStatus && matchesCustomer;
  });

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
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      inProgress: orders.filter(o => o.status === 'in-progress').length,
      completed: orders.filter(o => o.status === 'completed').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.price || 0), 0),
      totalPaid: orders.reduce((sum, o) => sum + (o.amountPaid || 0), 0),
      totalBalance: orders.reduce((sum, o) => sum + (o.balance || 0), 0)
    };
    return stats;
  };

  const stats = getOrderStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-lightBlue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-spin mx-auto mb-4 flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600 text-lg">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 bg-clip-text text-transparent">
              Orders
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">Track and manage all your orders</p>
        </div>

        <button
          onClick={() => navigate('/add-order')}
          className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Order
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6 rounded-2xl border border-purple-200">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white mb-3 sm:mb-0 sm:mr-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8h6m-6 4h6" />
              </svg>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs sm:text-sm text-gray-600">Total Orders</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 sm:p-6 rounded-2xl border border-yellow-200">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-white mb-3 sm:mb-0 sm:mr-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs sm:text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-lightBlue-50 p-4 sm:p-6 rounded-2xl border border-emerald-200">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-lightBlue-500 rounded-xl flex items-center justify-center text-white mb-3 sm:mb-0 sm:mr-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs sm:text-sm text-gray-600">Revenue</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 sm:p-6 rounded-2xl border border-red-200">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center text-white mb-3 sm:mb-0 sm:mr-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBalance)}</p>
              <p className="text-xs sm:text-sm text-gray-600">Balance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-4 sm:p-6 border border-purple-100">
        <div className="flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-white border-2 border-purple-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
              placeholder="Search orders by garment, customer, or notes..."
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delivered">Delivered</option>
            </select>

            {/* Customer Filter */}
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
            >
              <option value="all">All Customers</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 px-4">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8h6m-6 4h6" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {orders.length === 0 ? 'No Orders Yet' : 'No Orders Found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {orders.length === 0 
                ? "Start managing your orders by creating your first order."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {orders.length === 0 && (
              <button
                onClick={() => navigate('/add-order')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                Create Your First Order
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/customers/${order.customerId}/orders/${order.id}`)}
                className="p-4 sm:p-6 hover:bg-purple-50 transition-colors duration-200 cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  {/* Order Info */}
                  <div className="flex items-start space-x-4">
                    {order.styleImageURL && (
                      <img
                        src={order.styleImageURL}
                        alt="Style"
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">{order.garmentType}</h3>
                      <p className="text-sm text-gray-600 mb-2">Customer: {order.customerName}</p>
                      {order.styleDescription && (
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {order.styleDescription.length > 80 ? 
                            order.styleDescription.substring(0, 80) + '...' : 
                            order.styleDescription
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                    {/* Price & Payment */}
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-gray-900 text-lg">{formatCurrency(order.price)}</p>
                      <p className="text-sm text-gray-600">
                        Paid: {formatCurrency(order.amountPaid)}
                      </p>
                      {order.balance > 0 && (
                        <p className="text-sm text-red-600">
                          Balance: {formatCurrency(order.balance)}
                        </p>
                      )}
                    </div>

                    {/* Due Date & Status */}
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm text-gray-600">Due: {formatDate(order.dueDate)}</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)} w-fit`}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                      </span>
                    </div>
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

export default OrdersPage;