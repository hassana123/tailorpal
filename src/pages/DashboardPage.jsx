import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { setCustomers } from '../store/slices/customersSlice';
import { setOrders } from '../store/slices/ordersSlice';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import DashboardWelcome from '../components/dashboard/DashboardWelcome';
import DashboardQuickStats from '../components/dashboard/DashboardQuickStats';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import DashboardFinancialSummary from '../components/dashboard/DashboardFinancialSummary';
import DashboardQuickActions from '../components/dashboard/DashboardQuickActions';
import DashboardRecentOrders from '../components/dashboard/DashboardRecentOrders';
import DashboardShopInfo from '../components/dashboard/DashboardShopInfo';

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
    let unsubscribeExpenses = null;
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

        // Real-time shop expenses
        const expensesRef = collection(db, 'shops', user.uid, 'expenses');
        unsubscribeExpenses = onSnapshot(expensesRef, (expensesSnapshot) => {
          const expensesData = expensesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setExpenses(expensesData);

          // Calculate financial statistics
          const totalRevenue = allOrders.reduce((sum, order) => sum + (order.price || 0), 0);
          const totalPaid = allOrders.reduce((sum, order) => sum + (order.amountPaid || 0), 0);
          const totalBalance = allOrders.reduce((sum, order) => sum + (order.balance || 0), 0);
          const totalMaterialCost = allMaterials.reduce((sum, material) => sum + (material.totalCost || 0), 0);
          const totalExpenses = expensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0);
          const totalProfit = totalRevenue - totalMaterialCost - totalExpenses;

          // Calculate monthly stats
          const thisMonth = new Date();
          thisMonth.setDate(1);
          thisMonth.setHours(0, 0, 0, 0);

          const monthlyOrders = allOrders.filter(order => new Date(order.createdAt) >= thisMonth);
          const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + (order.price || 0), 0);
          
          const monthlyExpenses = expensesData.filter(expense => new Date(expense.date) >= thisMonth)
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
        });

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      if (unsubscribeExpenses) unsubscribeExpenses();
    };
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
      <DashboardWelcome shop={shop} />

      {/* Quick Stats */}
      <DashboardQuickStats customers={customers} stats={stats} financialStats={financialStats} formatCurrency={formatCurrency} />

      {/* Charts Section */}
      <DashboardCharts orderStatusData={orderStatusData} financialData={financialData} Pie={Pie} Bar={Bar} />

      {/* Financial Summary */}
      <DashboardFinancialSummary financialStats={financialStats} formatCurrency={formatCurrency} />

      {/* Quick Actions */}
      <DashboardQuickActions navigate={navigate} />

      {/* Recent Orders */}
      <DashboardRecentOrders recentOrders={recentOrders} formatCurrency={formatCurrency} formatDate={formatDate} getStatusColor={getStatusColor} navigate={navigate} />

      {/* Shop Information */}
      <DashboardShopInfo shop={shop} navigate={navigate} />
    </div>
  );
};

export default DashboardPage;