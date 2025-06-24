import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-purple-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center group cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-lightBlue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                TailorPal
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              <a href="#home" className="relative text-purple-600 hover:text-purple-700 px-4 py-2 rounded-xl text-lg font-medium transition-all duration-300 group">
                <span className="relative z-10">Home</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
              <a href="#features" className="relative text-gray-600 hover:text-purple-600 px-4 py-2 rounded-xl text-lg font-medium transition-all duration-300 group">
                <span className="relative z-10">Features</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
              <button 
                onClick={handleLogin}
                className="relative text-gray-600 hover:text-purple-600 px-4 py-2 rounded-xl text-lg font-medium transition-all duration-300 group"
              >
                <span className="relative z-10">Login</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              <button 
                onClick={handleGetStarted}
                className="relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl blur opacity-0 hover:opacity-50 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-purple-600 inline-flex items-center justify-center p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 transition-colors duration-200"
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-6 space-y-2 bg-gradient-to-br from-purple-50 to-pink-50 border-t border-purple-100 rounded-b-2xl">
              <a href="#home" className="text-purple-600 hover:text-purple-700 block px-4 py-3 rounded-xl text-lg font-medium transition-colors duration-200 hover:bg-white/50">
                Home
              </a>
              <a href="#features" className="text-gray-600 hover:text-purple-600 block px-4 py-3 rounded-xl text-lg font-medium transition-colors duration-200 hover:bg-white/50">
                Features
              </a>
              <button 
                onClick={handleLogin}
                className="text-gray-600 hover:text-purple-600 block w-full text-left px-4 py-3 rounded-xl text-lg font-medium transition-colors duration-200 hover:bg-white/50"
              >
                Login
              </button>
              <button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white block w-full px-4 py-3 rounded-xl text-lg font-medium mt-4 text-center shadow-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;