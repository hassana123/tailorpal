const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 text-white overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-to-br from-lightBlue-500/10 to-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-lightBlue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                TailorPal
              </span>
            </div>
            <p className="text-gray-300 text-lg leading-relaxed max-w-md mb-6">
              Empowering Nigerian tailors and fashion designers with cutting-edge digital tools 
              to transform their businesses and reach new heights of success.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-white font-bold">f</span>
              </a>
              <a href="#" className="w-10 h-10 bg-gradient-to-br from-lightBlue-600 to-emerald-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-white font-bold">t</span>
              </a>
              <a href="#" className="w-10 h-10 bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-white font-bold">i</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Quick Links
            </h3>
            <ul className="space-y-4">
              <li>
                <a href="#home" className="text-gray-300 hover:text-white text-lg transition-colors duration-200 hover:translate-x-2 transform inline-block">
                  → Home
                </a>
              </li>
              <li>
                <a href="#features" className="text-gray-300 hover:text-white text-lg transition-colors duration-200 hover:translate-x-2 transform inline-block">
                  → Features
                </a>
              </li>
              <li>
                <a href="#login" className="text-gray-300 hover:text-white text-lg transition-colors duration-200 hover:translate-x-2 transform inline-block">
                  → Login
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-300 hover:text-white text-lg transition-colors duration-200 hover:translate-x-2 transform inline-block">
                  → Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6 bg-gradient-to-r from-emerald-300 to-lightBlue-300 bg-clip-text text-transparent">
              Get in Touch
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center text-gray-300 text-lg">
                <span className="text-2xl mr-3">📧</span>
                <span>hassanaabdll1@gmail.com</span>
              </li>
              <li className="flex items-center text-gray-300 text-lg">
                <span className="text-2xl mr-3">📱</span>
                <span>+234 8060618637</span>
              </li>
              <li className="flex items-center text-gray-300 text-lg">
                <span className="text-2xl mr-3">📍</span>
                <span> Nigeria</span>
              </li>
              <li className="flex items-center text-gray-300 text-lg">
                <span className="text-2xl mr-3">⏰</span>
                <span>24/7 Support</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-lg">
              © {new Date().getFullYear()} TailorPal. Crafted with ❤️ for Nigerian entrepreneurs.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-8">
              <a href="#" className="text-gray-400 hover:text-purple-300 transition-colors duration-200 text-lg">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-300 transition-colors duration-200 text-lg">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-300 transition-colors duration-200 text-lg">
                Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;