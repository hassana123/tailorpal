import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { setShop, setLoading, setError } from '../store/slices/shopSlice';

const CreateShopPage = () => {
  const { user } = useSelector((state) => state.auth);
  const { shop, isLoading, error } = useSelector((state) => state.shop);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: user?.displayName || '',
    phoneNumber: '',
    address: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update owner name when user data changes
  useEffect(() => {
    if (user?.displayName && !formData.ownerName) {
      setFormData(prev => ({
        ...prev,
        ownerName: user.displayName
      }));
    }
  }, [user?.displayName, formData.ownerName]);

  // Check if user already has a shop and redirect
  useEffect(() => {
    const checkExistingShop = async () => {
      if (user?.uid) {
        try {
          const shopDoc = await getDoc(doc(db, 'shops', user.uid));
          if (shopDoc.exists()) {
            const shopData = shopDoc.data();
            dispatch(setShop(shopData));
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('Error checking existing shop:', error);
        }
      }
    };

    checkExistingShop();
  }, [user?.uid, dispatch, navigate]);

  // Redirect if shop already exists in Redux
  useEffect(() => {
    if (shop) {
      navigate('/dashboard');
    }
  }, [shop, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFormErrors(prev => ({
          ...prev,
          logo: 'Please select a valid image file'
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors(prev => ({
          ...prev,
          logo: 'Image size should be less than 5MB'
        }));
        return;
      }

      setLogoFile(file);
      setImageLoading(true);
      
      // Create preview with proper error handling
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setLogoPreview(event.target.result);
          setImageLoading(false);
        }
      };
      reader.onerror = () => {
        console.error('Error reading file');
        setImageLoading(false);
        setFormErrors(prev => ({
          ...prev,
          logo: 'Error reading image file'
        }));
      };
      reader.readAsDataURL(file);

      // Clear logo error
      if (formErrors.logo) {
        setFormErrors(prev => ({
          ...prev,
          logo: ''
        }));
      }
    }
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setImageLoading(false);
    // Clear the file input
    const fileInput = document.getElementById('logoInput');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.shopName.trim()) {
      errors.shopName = 'Shop name is required';
    }

    if (!formData.ownerName.trim()) {
      errors.ownerName = 'Owner name is required';
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }

    return errors;
  };

  const uploadLogo = async () => {
    if (!logoFile) return null;

    try {
      const logoRef = ref(storage, `shop-logos/${user.uid}/${Date.now()}_${logoFile.name}`);
      const snapshot = await uploadBytes(logoRef, logoFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw new Error('Failed to upload logo. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      // Upload logo if provided
      let logoURL = null;
      if (logoFile) {
        logoURL = await uploadLogo();
      }

      // Prepare shop data
      const shopData = {
        shopName: formData.shopName.trim(),
        ownerName: formData.ownerName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        address: formData.address.trim(),
        logoURL,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to Firestore
      await setDoc(doc(db, 'shops', user.uid), shopData);

      // Update Redux state
      dispatch(setShop(shopData));

      // Redirect to dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error('Error creating shop:', error);
      dispatch(setError(error.message || 'Failed to create shop. Please try again.'));
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-lightBlue-500 rounded-3xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 bg-clip-text text-transparent">
            Create Your Shop
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Welcome {user?.displayName}! Let's set up your tailoring business profile to get started.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-100">
        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Name */}
          <div>
            <label htmlFor="shopName" className="block text-sm font-semibold text-gray-700 mb-2">
              Shop Name *
            </label>
            <input
              type="text"
              id="shopName"
              name="shopName"
              value={formData.shopName}
              onChange={handleInputChange}
              className={`w-full px-4 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 ${
                formErrors.shopName ? 'border-red-300 bg-red-50' : 'border-purple-200 hover:border-purple-300'
              }`}
              placeholder="Enter your shop name (e.g., Adunni's Fashion House)"
            />
            {formErrors.shopName && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formErrors.shopName}
              </p>
            )}
          </div>

          {/* Owner Name */}
          <div>
            <label htmlFor="ownerName" className="block text-sm font-semibold text-gray-700 mb-2">
              Owner's Name *
            </label>
            <input
              type="text"
              id="ownerName"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleInputChange}
              className={`w-full px-4 py-4 bg-gradient-to-r from-emerald-50 to-lightBlue-50 border-2 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 ${
                formErrors.ownerName ? 'border-red-300 bg-red-50' : 'border-emerald-200 hover:border-emerald-300'
              }`}
              placeholder="Enter your full name"
            />
            {formErrors.ownerName && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formErrors.ownerName}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className={`w-full px-4 py-4 bg-gradient-to-r from-cream-50 to-orange-50 border-2 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-cream-500/20 focus:border-cream-500 transition-all duration-300 ${
                formErrors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-cream-200 hover:border-cream-300'
              }`}
              placeholder="Enter your phone number (e.g., +234 801 234 5678)"
            />
            {formErrors.phoneNumber && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formErrors.phoneNumber}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
              Shop Address *
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-4 py-4 bg-gradient-to-r from-lightBlue-50 to-emerald-50 border-2 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-lightBlue-500/20 focus:border-lightBlue-500 transition-all duration-300 resize-none ${
                formErrors.address ? 'border-red-300 bg-red-50' : 'border-lightBlue-200 hover:border-lightBlue-300'
              }`}
              placeholder="Enter your shop address (e.g., 123 Balogun Street, Lagos Island, Lagos)"
            />
            {formErrors.address && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formErrors.address}
              </p>
            )}
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Shop Logo (Optional)
            </label>
            <div className="space-y-4">
              {/* Upload Area */}
              <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 ${
                formErrors.logo ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
              }`}>
                <input
                  id="logoInput"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <p className="text-gray-600 font-medium">Click to upload your shop logo</p>
                    <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>
              </div>

              {/* Logo Preview */}
              {(logoPreview || imageLoading) && (
                <div className="flex items-center justify-center">
                  <div className="relative">
                    {imageLoading ? (
                      <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                        <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : logoPreview ? (
                      <div className="relative bg-white p-2 rounded-2xl shadow-lg border border-gray-200">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-24 h-24 object-cover rounded-xl"
                          style={{ 
                            backgroundColor: '#ffffff',
                            display: 'block'
                          }}
                          onLoad={() => setImageLoading(false)}
                          onError={(e) => {
                            console.error('Error loading image preview');
                            setLogoPreview(null);
                            setImageLoading(false);
                            setFormErrors(prev => ({
                              ...prev,
                              logo: 'Error loading image preview'
                            }));
                          }}
                        />
                        <button
                          type="button"
                          onClick={clearLogo}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors duration-200 shadow-lg"
                        >
                          ×
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {formErrors.logo && (
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formErrors.logo}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="group relative w-full bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 hover:from-purple-700 hover:via-pink-700 hover:to-lightBlue-700 text-white py-4 px-6 rounded-2xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="relative z-10 flex items-center justify-center">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Shop...
                </>
              ) : (
                'Create Shop'
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-lightBlue-400 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
          </button>
        </form>
      </div>

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-purple-100">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Customer Management</h3>
          <p className="text-sm text-gray-600">Track customer details and measurements</p>
        </div>
        
        <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lightBlue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Order Tracking</h3>
          <p className="text-sm text-gray-600">Manage orders from start to completion</p>
        </div>
        
        <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-cream-100">
          <div className="w-12 h-12 bg-gradient-to-br from-cream-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Payment Tracking</h3>
          <p className="text-sm text-gray-600">Monitor payments and outstanding balances</p>
        </div>
      </div>
    </div>
  );
};

export default CreateShopPage;