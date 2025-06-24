import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useAuthListener } from './hooks/useAuthListener';
import PrivateRoute from './components/PrivateRoute';
import RequireShop from './components/RequireShop';
import DashboardLayout from './components/DashboardLayout';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import LandingPage from './pages/LandingPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CreateShopPage from './pages/CreateShopPage';
import AddOrderPage from './pages/AddOrderPage';
import AddCustomerPage from './pages/AddCustomerPage';
import CustomersPage from './pages/CustomersPage';
import OrdersPage from './pages/OrdersPage';
import CustomerDetailsPage from './pages/CustomerDetailsPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import './index.css';

// Auth Wrapper Component
const AuthWrapper = ({ children }) => {
  useAuthListener();
  return children;
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AuthWrapper>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <PrivateRoute>
                <RequireShop>
                  <DashboardLayout />
                </RequireShop>
              </PrivateRoute>
            }>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="add-order" element={<AddOrderPage />} />
              <Route path="add-customer" element={<AddCustomerPage />} />
              <Route path="customers/:customerId" element={<CustomerDetailsPage />} />
              <Route path="customers/:customerId/orders/:orderId" element={<OrderDetailsPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="orders" element={<OrdersPage />} />
            </Route>

            {/* Create Shop Route - Protected but doesn't require shop */}
            <Route path="/create-shop" element={
              <PrivateRoute>
                <CreateShopPage />
              </PrivateRoute>
            } />
          </Routes>
          
          {/* PWA Install Prompt - Show on all pages */}
          <PWAInstallPrompt />
        </AuthWrapper>
      </Router>
    </Provider>
  );
}

export default App;