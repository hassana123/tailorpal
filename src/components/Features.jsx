const Features = () => {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      title: "Track Customers",
      description: "Effortlessly manage customer profiles, measurements, and preferences with our intuitive dashboard. Build lasting relationships with detailed client histories.",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
      borderColor: "border-purple-200",
      iconBg: "from-purple-500 to-pink-500"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      title: "Manage Orders",
      description: "Streamline your workflow with smart order tracking from concept to completion. Monitor progress, payments, and delivery schedules in real-time.",
      gradient: "from-emerald-500 to-lightBlue-500",
      bgGradient: "from-emerald-50 to-lightBlue-50",
      borderColor: "border-emerald-200",
      iconBg: "from-emerald-500 to-lightBlue-500"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Smart Reminders",
      description: "Never miss a deadline again with intelligent notifications for due dates, payments, and follow-ups. Keep your business running smoothly.",
      gradient: "from-cream-500 to-orange-500",
      bgGradient: "from-cream-50 to-orange-50",
      borderColor: "border-cream-200",
      iconBg: "from-cream-500 to-orange-500"
    }
  ];

  return (
    <section id="features" className="relative py-20 lg:py-32 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-to-br from-purple-300/10 to-pink-300/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-gradient-to-br from-emerald-300/10 to-lightBlue-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 mb-6">
            <span className="text-sm font-semibold text-purple-700">🚀 Powerful Features</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Everything You Need to
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 bg-clip-text text-transparent">
              Scale Your Business
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover the comprehensive suite of tools designed to revolutionize how Nigerian tailors 
            manage their craft and grow their businesses.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 mb-20">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`group relative bg-gradient-to-br ${feature.bgGradient} p-8 rounded-3xl border-2 ${feature.borderColor} hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:scale-105`}
            >
              {/* Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
              
              {/* Feature Icon */}
              <div className={`relative w-16 h-16 bg-gradient-to-br ${feature.iconBg} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                {feature.icon}
              </div>
              
              {/* Feature Content */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-purple-700 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                {feature.description}
              </p>

              {/* Decorative Corner */}
              <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-white/50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>

        {/* Enhanced Benefits Section */}
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 rounded-3xl p-1 shadow-2xl">
          <div className="bg-white rounded-3xl p-8 lg:p-12">
            <div className="text-center mb-12">
              <h3 className="text-3xl lg:text-4xl font-bold mb-6">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Built for Nigerian Excellence
                </span>
              </h3>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Every feature is crafted with the unique needs of Nigerian tailors and fashion entrepreneurs in mind.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  ₦
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Naira Support</h4>
                <p className="text-sm text-gray-600">Full local currency integration</p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-lightBlue-500 rounded-2xl flex items-center justify-center text-white text-2xl mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  📱
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Mobile First</h4>
                <p className="text-sm text-gray-600">Perfect on any device</p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-cream-500 to-orange-500 rounded-2xl flex items-center justify-center text-white text-2xl mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  🌍
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Accessible Anywhere</h4>
                <p className="text-sm text-gray-600">Access your business from any device, anytime, anywhere.</p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-2xl mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  ⚡
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Lightning Fast</h4>
                <p className="text-sm text-gray-600">Optimized for speed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;