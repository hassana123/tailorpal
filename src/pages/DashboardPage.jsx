import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { setCustomers } from '../store/slices/customersSlice';
import { setOrders } from '../store/slices/ordersSlice';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);
  const { shop } = useSelector((state) => state.shop);
  const { customers } = useSelector((state) => state.customers);
  const { orders } = useSelector((state) => state.orders);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [financialStats, setFinancialStats] = useState({
    totalRevenue: 0,
    totalPaid: 0,
    totalBalance: 0,
    totalExpenses: 0,
    totalProfit: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    monthlyProfit: 0
  });

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

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.uid || !shop) return;

      try {
        setIsLoading(true);
        
        // Load customers
        const customersRef = collection(db, 'shops', user.uid, 'customers');
        const customersSnapshot = await getDocs(customersRef);
        const customersData = customersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: convertTimestampToString(data.createdAt)
          };
        });
        dispatch(setCustomers(customersData));

        // Load all orders from all customers
        const allOrders = [];
        const allMaterials = [];
        
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
                createdAt: convertTimestampToString(orderData.createdAt)
              };
            });
            
            allOrders.push(...customerOrders);

            // Load materials for each order
            for (const order of customerOrders) {
              try {
                const materialsRef = collection(db, 'shops', user.uid, 'customers', customer.id, 'orders', order.id, 'materials');
                const materialsSnapshot = await getDocs(materialsRef);
                const materialsData = materialsSnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data(),
                  orderId: order.id,
                  customerId: customer.id
                }));
                allMaterials.push(...materialsData);
              } catch (error) {
                console.error(`Error loading materials for order ${order.id}:`, error);
              }
            }
          } catch (error) {
            console.error(`Error loading orders for customer ${customer.id}:`, error);
          }
        }
        
        // Sort all orders by creation date (newest first)
        allOrders.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        
        dispatch(setOrders(allOrders));
        setRecentOrders(allOrders.slice(0, 5)); // Get 5 most recent orders

        // Load shop expenses
        try {
          const expensesRef = collection(db, 'shops', user.uid, 'expenses');
          const expensesSnapshot = await getDocs(expensesRef);
          const expensesData = expensesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setExpenses(expensesData);
        } catch (error) {
          console.error('Error loading expenses:', error);
        }

        // Calculate financial statistics
        const totalRevenue = allOrders.reduce((sum, order) => sum + (order.price || 0), 0);
        const totalPaid = allOrders.reduce((sum, order) => sum + (order.amountPaid || 0), 0);
        const totalBalance = allOrders.reduce((sum, order) => sum + (order.balance || 0), 0);
        const totalMaterialCost = allMaterials.reduce((sum, material) => sum + (material.totalCost || 0), 0);
        const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
        const totalProfit = totalRevenue - totalMaterialCost - totalExpenses;

        // Calculate monthly stats
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        const monthlyOrders = allOrders.filter(order => new Date(order.createdAt) >= thisMonth);
        const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + (order.price || 0), 0);
        
        const monthlyExpenses = expenses.filter(expense => new Date(expense.date) >= thisMonth)
          .reduce((sum, expense) => sum + (expense.amount || 0), 0);
        
        const monthlyMaterialCost = allMaterials
          .filter(material => {
            const order = allOrders.find(o => o.id === material.orderId);
            return order && new Date(order.createdAt) >= thisMonth;
          })
          .reduce((sum, material) => sum + (material.totalCost || 0), 0);
        
        const monthlyProfit = monthlyRevenue - monthlyMaterialCost - monthlyExpenses;

        setFinancialStats({
          totalRevenue,
          totalPaid,
          totalBalance,
          totalMaterialCost,
          totalExpenses,
          totalProfit,
          monthlyRevenue,
          monthlyExpenses,
          monthlyMaterialCost,
          monthlyProfit
        });

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.uid, shop, dispatch]);

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      inProgress: orders.filter(o => o.status === 'in-progress').length,
      completed: orders.filter(o => o.status === 'completed').length,
      delivered: orders.filter(o => o.status === 'delivered').length
    };
    return stats;
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const stats = getOrderStats();

  // Prepare chart data
  const orderStatusData = {
    labels: ['Pending', 'In Progress', 'Completed', 'Delivered'],
    datasets: [
      {
        data: [stats.pending, stats.inProgress, stats.completed, stats.delivered],
        backgroundColor: [
          'rgba(251, 191, 36, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(139, 92, 246, 0.7)'
        ],
        borderColor: [
          'rgba(251, 191, 36, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(139, 92, 246, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare financial chart data
  const financialData = {
    labels: ['Revenue', 'Material Cost', 'Expenses', 'Profit'],
    datasets: [
      {
        label: 'Amount (₦)',
        data: [
          financialStats.totalRevenue,
          financialStats.totalMaterialCost,
          financialStats.totalExpenses,
          financialStats.totalProfit
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)',
          'rgba(251, 191, 36, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(139, 92, 246, 0.7)'
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(139, 92, 246, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-lightBlue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-spin mx-auto mb-4 flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 bg-clip-text text-transparent">
            TailorPal Dashboard
          </span>
        </h1>
        {shop && (
          <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-emerald-100 to-lightBlue-100 border border-emerald-200">
            <span className="text-sm font-semibold text-emerald-700">
              🏪 {shop.shopName}
            </span>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-8 rounded-3xl border-2 border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white mb-4 sm:mb-6 shadow-lg">
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{customers.length}</h3>
          <p className="text-sm sm:text-base text-gray-600">Total Customers</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-lightBlue-50 p-4 sm:p-8 rounded-3xl border-2 border-emerald-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-lightBlue-500 rounded-2xl flex items-center justify-center text-white mb-4 sm:mb-6 shadow-lg">
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{stats.total}</h3>
          <p className="text-sm sm:text-base text-gray-600">Total Orders</p>
        </div>

        <div className="bg-gradient-to-br from-cream-50 to-orange-50 p-4 sm:p-8 rounded-3xl border-2 border-cream-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-cream-500 to-orange-500 rounded-2xl flex items-center justify-center text-white mb-4 sm:mb-6 shadow-lg">
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">{formatCurrency(financialStats.totalRevenue)}</h3>
          <p className="text-sm sm:text-base text-gray-600">Total Revenue</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-8 rounded-3xl border-2 border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white mb-4 sm:mb-6 shadow-lg">
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">{formatCurrency(financialStats.totalProfit)}</h3>
          <p className="text-sm sm:text-base text-gray-600">Net Profit</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Chart */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Order Status</h2>
          <div className="h-64">
            <Pie data={orderStatusData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Financial Overview Chart */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Financial Overview</h2>
          <div className="h-64">
            <Bar 
              data={financialData} 
              options={{ 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Financial Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Overall Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-600">Total Revenue:</span>
                <span className="text-lg font-semibold text-gray-900">{formatCurrency(financialStats.totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-600">Material Costs:</span>
                <span className="text-lg font-semibold text-orange-600">- {formatCurrency(financialStats.totalMaterialCost)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-600">Shop Expenses:</span>
                <span className="text-lg font-semibold text-red-600">- {formatCurrency(financialStats.totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-900 font-bold">Net Profit:</span>
                <span className={`text-xl font-bold ${financialStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(financialStats.totalProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* This Month Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-600">Monthly Revenue:</span>
                <span className="text-lg font-semibold text-gray-900">{formatCurrency(financialStats.monthlyRevenue)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-600">Material Costs:</span>
                <span className="text-lg font-semibold text-orange-600">- {formatCurrency(financialStats.monthlyMaterialCost)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-600">Shop Expenses:</span>
                <span className="text-lg font-semibold text-red-600">- {formatCurrency(financialStats.monthlyExpenses)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-900 font-bold">Monthly Profit:</span>
                <span className={`text-xl font-bold ${financialStats.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(financialStats.monthlyProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/add-customer')}
            className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white mr-4 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Add Customer</h3>
              <p className="text-sm text-gray-600">Create new customer profile</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/add-order')}
            className="flex items-center p-4 bg-gradient-to-r from-emerald-50 to-lightBlue-50 border border-emerald-200 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-lightBlue-500 rounded-xl flex items-center justify-center text-white mr-4 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Add Order</h3>
              <p className="text-sm text-gray-600">Create new order</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center p-4 bg-gradient-to-r from-cream-50 to-orange-50 border border-cream-200 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cream-500 to-orange-500 rounded-xl flex items-center justify-center text-white mr-4 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Inventory</h3>
              <p className="text-sm text-gray-600">Manage shop expenses</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/customers')}
            className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white mr-4 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">View Customers</h3>
              <p className="text-sm text-gray-600">Manage customer database</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Recent Orders</h2>
            <button
              onClick={() => navigate('/orders')}
              className="text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-200"
            >
              View All →
            </button>
          </div>
          
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/customers/${order.customerId}/orders/${order.id}`)}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 space-y-3 sm:space-y-0"
              >
                <div className="flex items-center">
                  {order.styleImageURL && (
                    <img
                      src={order.styleImageURL}
                      alt="Style"
                      className="w-12 h-12 object-cover rounded-lg mr-4 border border-gray-200 flex-shrink-0"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{order.garmentType}</h3>
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(order.price)}</p>
                    <p className="text-sm text-gray-600">Due: {formatDate(order.dueDate)}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)} w-fit`}>
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shop Information */}
      {shop && (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-purple-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Shop Information</h2>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-emerald-600 font-medium">Active</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Shop Name</h3>
                <p className="text-lg font-medium text-gray-900">{shop.shopName}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Owner</h3>
                <p className="text-lg font-medium text-gray-900">{shop.ownerName}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Phone</h3>
                <p className="text-lg font-medium text-gray-900">{shop.phoneNumber}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Address</h3>
                <p className="text-lg font-medium text-gray-900">{shop.address}</p>
              </div>
              {shop.logoURL && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Logo</h3>
                  <img
                    src={shop.logoURL}
                    alt="Shop logo"
                    className="w-16 h-16 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;