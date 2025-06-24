import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signup');
  };

  return (
    <section id="home" className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-lightBlue-50 py-8 lg:py-12 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-lightBlue-400/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cream-300/10 to-purple-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 mb-6">
              <span className="text-sm font-semibold text-purple-700">✨ Made for Nigerian Tailors</span>
            </div>

            {/* Hero Headline */}
            <h1 className="md:text-3xl  text-2xl font-bold text-gray-900 mb-6 leading-relaxed">
              <span className="text-4xl md:text-6xl bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 bg-clip-text text-transparent mb-3">
                TailorPal
              </span>
              <br />
              Your Digital Tailoring <span className="bg-gradient-to-r from-emerald-600 to-lightBlue-600 bg-clip-text text-transparent">
                Assistant
              </span>
            </h1>
            
            {/* Hero Description */}
            <p className="text-xl text-gray-600 mb-8 max-w-2xl leading-relaxed">
              Transform your tailoring business with smart customer management, seamless order tracking, 
              and intelligent reminders. Built specifically for Nigerian fashion entrepreneurs.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
              <button 
                onClick={handleGetStarted}
                className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105"
              >
                <span className="relative z-10">Get Started Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
              </button>
              <button className="group text-purple-600 hover:text-purple-700 px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transform hover:-translate-y-1">
                <span className="flex items-center">
                  Watch Demo
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-10V7a3 3 0 11-6 0V4" />
                  </svg>
                </span>
              </button>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 lg:gap-8">
              <div className="text-center lg:text-left">
                <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">500+</div>
                <div className="text-sm text-gray-600">Happy Tailors</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-lightBlue-600 bg-clip-text text-transparent">10k+</div>
                <div className="text-sm text-gray-600">Orders Managed</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cream-600 to-purple-600 bg-clip-text text-transparent">99%</div>
                <div className="text-sm text-gray-600">Satisfaction</div>
              </div>
            </div>
          </div>
          
          {/* Right Image */}
          <div className="relative">
            {/* Main Image Container */}
            <div className="relative">
              {/* Background Decorative Layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-pink-200 rounded-3xl transform rotate-6 scale-105 opacity-20"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-lightBlue-200 to-emerald-200 rounded-3xl transform -rotate-3 scale-110 opacity-15"></div>
              
              {/* Main Image */}
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 lg:p-12 border border-gray-100 transform hover:scale-105 transition-transform duration-500">
                {/* Tailoring Image */}
                <img 
                  src="https://img.freepik.com/free-photo/medium-shot-man-repairing-fashion-goods_23-2150627960.jpg?uid=R65901270&ga=GA1.1.817112314.1749635880&semt=ais_hybrid&w=740" 
                  alt="Professional tailor working with fabric and measuring tools" 
                  className="w-full h-80 lg:h-96 object-cover rounded-2xl shadow-lg"
                />
                
                {/* Floating UI Elements */}
                <div className="absolute -top-4 -left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-2xl shadow-lg animate-float">
                  <div className="flex items-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span className="font-semibold text-sm">25 Customers</span>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-emerald-500 to-lightBlue-500 text-white p-4 rounded-2xl shadow-lg animate-bounce-slow">
                  <div className="flex items-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-sm">Order Complete</span>
                  </div>
                </div>
                
                <div className="absolute top-1/2 -right-6 bg-gradient-to-r from-cream-500 to-orange-500 text-white p-3 rounded-xl shadow-lg animate-pulse">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;