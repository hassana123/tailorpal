import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

const RequireShop = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const { shop } = useSelector((state) => state.shop);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only proceed if auth is loaded and user is authenticated
    if (!isLoading && isAuthenticated && user) {
      // If user doesn't have a shop and is not already on create-shop page
      if (!shop && location.pathname !== '/create-shop') {
        console.log('No shop found, redirecting to create-shop');
        navigate('/create-shop', { replace: true });
      }
      // If user has a shop and is on create-shop page, redirect to dashboard
      else if (shop && location.pathname === '/create-shop') {
        console.log('Shop found, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user, shop, location.pathname, navigate]);

  // Show loading while auth is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-lightBlue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-spin mx-auto mb-4 flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600 text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated but no shop exists and not on create-shop page, show loading
  if (isAuthenticated && user && !shop && location.pathname !== '/create-shop') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-lightBlue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-spin mx-auto mb-4 flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600 text-lg">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default RequireShop;