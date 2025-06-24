import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { setCustomers, setLoading } from '../store/slices/customersSlice';

const CustomersPage = () => {
  const { user } = useSelector((state) => state.auth);
  const { shop } = useSelector((state) => state.shop);
  const { customers, isLoading } = useSelector((state) => state.customers);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [customersWithStats, setCustomersWithStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

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

  // Load customers and their order statistics
  useEffect(() => {
    const loadCustomersWithStats = async () => {
      if (!user?.uid || !shop) return;

      try {
        dispatch(setLoading(true));
        setLoadingStats(true);
        
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

        // Load order statistics for each customer
        const customersWithOrderStats = await Promise.all(
          customersData.map(async (customer) => {
            try {
              const ordersRef = collection(db, 'shops', user.uid, 'customers', customer.id, 'orders');
              const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
              const ordersSnapshot = await getDocs(ordersQuery);
              
              const orders = ordersSnapshot.docs.map(doc => {
                const orderData = doc.data();
                return {
                  id: doc.id,
                  ...orderData,
                  createdAt: convertTimestampToString(orderData.createdAt)
                };
              });

              // Calculate statistics
              const totalOrders = orders.length;
              const unpaidBalance = orders.reduce((sum, order) => sum + (order.balance || 0), 0);
              const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null;
              const totalValue = orders.reduce((sum, order) => sum + (order.price || 0), 0);
              const totalPaid = orders.reduce((sum, order) => sum + (order.amountPaid || 0), 0);

              return {
                ...customer,
                orderStats: {
                  totalOrders,
                  unpaidBalance,
                  lastOrderDate,
                  totalValue,
                  totalPaid,
                  orders: orders.slice(0, 3) // Keep last 3 orders for quick preview
                }
              };
            } catch (error) {
              console.error(`Error loading orders for customer ${customer.id}:`, error);
              return {
                ...customer,
                orderStats: {
                  totalOrders: 0,
                  unpaidBalance: 0,
                  lastOrderDate: null,
                  totalValue: 0,
                  totalPaid: 0,
                  orders: []
                }
              };
            }
          })
        );

        setCustomersWithStats(customersWithOrderStats);
      } catch (error) {
        console.error('Error loading customers:', error);
      } finally {
        dispatch(setLoading(false));
        setLoadingStats(false);
      }
    };

    loadCustomersWithStats();
  }, [user?.uid, shop, dispatch]);

  // Filter customers based on search term and gender
  const filteredCustomers = customersWithStats.filter(customer => {
    const matchesSearch = customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    const matchesGender = genderFilter === 'all' || customer.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  // Sort customers by most active (most recent order first)
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const dateA = a.orderStats.lastOrderDate ? new Date(a.orderStats.lastOrderDate) : new Date(0);
    const dateB = b.orderStats.lastOrderDate ? new Date(b.orderStats.lastOrderDate) : new Date(0);
    return dateB - dateA;
  });

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

  // Calculate overall statistics
  const overallStats = {
    totalCustomers: customersWithStats.length,
    femaleCustomers: customersWithStats.filter(c => c.gender === 'female').length,
    maleCustomers: customersWithStats.filter(c => c.gender === 'male').length,
    totalUnpaidBalance: customersWithStats.reduce((sum, c) => sum + c.orderStats.unpaidBalance, 0),
    activeCustomers: customersWithStats.filter(c => c.orderStats.totalOrders > 0).length,
    newCustomers: customersWithStats.filter(c => {
      const createdDate = new Date(c.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdDate > thirtyDaysAgo;
    }).length
  };

  if (isLoading || loadingStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-lightBlue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-spin mx-auto mb-4 flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600 text-lg">Loading customers and order history...</p>
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
              Customer Management
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">Manage your customer database and order history</p>
        </div>

        <button
          onClick={() => navigate('/add-customer')}
          className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6 rounded-2xl border border-purple-200">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white mx-auto mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{overallStats.totalCustomers}</p>
            <p className="text-xs sm:text-sm text-gray-600">Total</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-lightBlue-50 p-4 sm:p-6 rounded-2xl border border-emerald-200">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-lightBlue-500 rounded-xl flex items-center justify-center text-white mx-auto mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{overallStats.activeCustomers}</p>
            <p className="text-xs sm:text-sm text-gray-600">Active</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-4 sm:p-6 rounded-2xl border border-pink-200">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center text-white mx-auto mb-3">
              <span className="text-sm font-bold">♀</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{overallStats.femaleCustomers}</p>
            <p className="text-xs sm:text-sm text-gray-600">Female</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-emerald-50 p-4 sm:p-6 rounded-2xl border border-blue-200">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center text-white mx-auto mb-3">
              <span className="text-sm font-bold">♂</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{overallStats.maleCustomers}</p>
            <p className="text-xs sm:text-sm text-gray-600">Male</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 sm:p-6 rounded-2xl border border-red-200">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center text-white mx-auto mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900">{formatCurrency(overallStats.totalUnpaidBalance)}</p>
            <p className="text-xs sm:text-sm text-gray-600">Unpaid</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-6 rounded-2xl border border-green-200">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white mx-auto mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{overallStats.newCustomers}</p>
            <p className="text-xs sm:text-sm text-gray-600">New (30d)</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-4 sm:p-6 border border-purple-100">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-white border-2 border-purple-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
                placeholder="Search customers by name or phone number..."
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Gender Filter */}
          <div className="sm:w-48">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
            >
              <option value="all">All Genders</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
        {sortedCustomers.length === 0 ? (
          <div className="text-center py-12 px-4">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {customersWithStats.length === 0 ? 'No Customers Yet' : 'No Customers Found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {customersWithStats.length === 0 
                ? "Start building your customer database by adding your first customer."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {customersWithStats.length === 0 && (
              <button
                onClick={() => navigate('/add-customer')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                Add Your First Customer
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table Header */}
            <div className="hidden lg:block bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-purple-100">
              <div className="grid grid-cols-7 gap-4 font-semibold text-gray-700">
                <div className="col-span-2">Customer</div>
                <div>Orders</div>
                <div>Balance</div>
                <div>Last Order</div>
                <div>Gender</div>
                <div>Actions</div>
              </div>
            </div>

            {/* Customer Rows */}
            <div className="divide-y divide-gray-100">
              {sortedCustomers.map((customer) => (
                <div key={customer.id} className="p-4 sm:p-6 hover:bg-purple-50 transition-colors duration-200">
                  {/* Desktop Layout */}
                  <div className="hidden lg:grid grid-cols-7 gap-4 items-center">
                    {/* Customer Info */}
                    <div className="col-span-2 flex items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mr-4 flex-shrink-0 ${
                        customer.gender === 'female' 
                          ? 'bg-gradient-to-br from-pink-500 to-purple-500'
                          : 'bg-gradient-to-br from-blue-500 to-emerald-500'
                      }`}>
                        {customer.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{customer.fullName}</h3>
                        <p className="text-sm text-gray-600">{customer.phone}</p>
                        {customer.address && (
                          <p className="text-sm text-gray-500 truncate">{customer.address}</p>
                        )}
                      </div>
                    </div>

                    {/* Orders Count */}
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{customer.orderStats.totalOrders}</p>
                      <p className="text-sm text-gray-600">orders</p>
                    </div>

                    {/* Unpaid Balance */}
                    <div>
                      <p className={`text-lg font-semibold ${customer.orderStats.unpaidBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(customer.orderStats.unpaidBalance)}
                      </p>
                      <p className="text-sm text-gray-600">balance</p>
                    </div>

                    {/* Last Order Date */}
                    <div>
                      <p className="text-sm text-gray-900">
                        {customer.orderStats.lastOrderDate ? formatDate(customer.orderStats.lastOrderDate) : '—'}
                      </p>
                      {customer.orderStats.totalOrders === 0 && (
                        <p className="text-xs text-gray-500">No orders yet</p>
                      )}
                    </div>

                    {/* Gender */}
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        customer.gender === 'female'
                          ? 'bg-pink-100 text-pink-800 border border-pink-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {customer.gender === 'female' ? '👩' : '👨'} {customer.gender?.charAt(0).toUpperCase() + customer.gender?.slice(1)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        className="bg-gradient-to-r from-emerald-500 to-lightBlue-500 hover:from-emerald-600 hover:to-lightBlue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/add-order?customerId=${customer.id}`)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Order
                      </button>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="lg:hidden">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold mr-4 flex-shrink-0 ${
                          customer.gender === 'female' 
                            ? 'bg-gradient-to-br from-pink-500 to-purple-500'
                            : 'bg-gradient-to-br from-blue-500 to-emerald-500'
                        }`}>
                          {customer.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">{customer.fullName}</h3>
                          <p className="text-sm text-gray-600">{customer.phone}</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                            customer.gender === 'female'
                              ? 'bg-pink-100 text-pink-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {customer.gender === 'female' ? '👩' : '👨'} {customer.gender?.charAt(0).toUpperCase() + customer.gender?.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900">{customer.orderStats.totalOrders}</p>
                        <p className="text-xs text-gray-600">Orders</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-lg font-semibold ${customer.orderStats.unpaidBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(customer.orderStats.unpaidBalance)}
                        </p>
                        <p className="text-xs text-gray-600">Balance</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-900">
                          {customer.orderStats.lastOrderDate ? formatDate(customer.orderStats.lastOrderDate) : '—'}
                        </p>
                        <p className="text-xs text-gray-600">Last Order</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-lightBlue-500 hover:from-emerald-600 hover:to-lightBlue-600 text-white px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Orders
                      </button>
                      <button
                        onClick={() => navigate(`/add-order?customerId=${customer.id}`)}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Order
                      </button>
                    </div>

                    {/* Show "No orders yet" message for customers with 0 orders */}
                    {customer.orderStats.totalOrders === 0 && (
                      <div className="mt-3 text-center">
                        <p className="text-sm text-gray-500 italic">No orders yet</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;