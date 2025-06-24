import { useState, useEffect } from 'react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = window.navigator.standalone === true;
      const isInstalled = isStandaloneMode || isIOSStandalone;
      
      setIsStandalone(isStandaloneMode || isIOSStandalone);
      setIsInstalled(isInstalled);
      
      return isInstalled;
    };

    // Check if device is iOS
    const checkIfIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      setIsIOS(isIOSDevice);
      return isIOSDevice;
    };

    // Initialize checks
    const installed = checkIfInstalled();
    const iOS = checkIfIOS();

    // Don't show prompt if already installed
    if (installed) {
      return;
    }

    // Handle beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA: beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      console.log('PWA: App was installed');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS devices, show install prompt after a delay
    if (iOS && !installed) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle install button click (Android/Chrome)
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`PWA: User response to install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
      } else {
        console.log('PWA: User dismissed the install prompt');
      }
      
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('PWA: Error during installation:', error);
    }
  };

  // Handle dismiss
  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Remember user dismissed (optional - could use localStorage)
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or user previously dismissed
  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  // Check if user previously dismissed
  if (localStorage.getItem('pwa-install-dismissed') === 'true') {
    return null;
  }

  return (
    <>
      {/* Floating Install Button */}
      <div className="fixed bottom-6 right-6 z-50 animate-bounce">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-lg opacity-75 animate-pulse"></div>
          
          {/* Main button */}
          <button
            onClick={isIOS ? () => setShowInstallPrompt(true) : handleInstallClick}
            className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 hover:from-purple-700 hover:via-pink-700 hover:to-lightBlue-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-1"
            aria-label="Install TailorPal App"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Install TailorPal
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>

      {/* iOS Install Instructions Modal */}
      {isIOS && showInstallPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div className="text-center">
              {/* App Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-lightBlue-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">Install TailorPal</h3>
              <p className="text-gray-600 mb-6">Add TailorPal to your home screen for quick access and a native app experience!</p>

              {/* Instructions */}
              <div className="text-left space-y-3 mb-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-700 mr-2">Tap the share button</span>
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-700 mr-2">Select "Add to Home Screen"</span>
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">3</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-700 mr-2">Tap "Add" to confirm</span>
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Why install?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Faster access from your home screen</li>
                  <li>• Works offline for basic features</li>
                  <li>• Native app-like experience</li>
                  <li>• Push notifications (coming soon)</li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  Got It!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Android Install Confirmation Modal */}
      {!isIOS && deferredPrompt && showInstallPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div className="text-center">
              {/* App Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-lightBlue-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">Install TailorPal</h3>
              <p className="text-gray-600 mb-6">Get the full app experience with offline access and faster performance!</p>

              {/* Benefits */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">App Benefits:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Install directly to your device</li>
                  <li>• Works offline for basic features</li>
                  <li>• Faster loading and performance</li>
                  <li>• Native app-like experience</li>
                  <li>• Push notifications (coming soon)</li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Not Now
                </button>
                <button
                  onClick={handleInstallClick}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Install App
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;