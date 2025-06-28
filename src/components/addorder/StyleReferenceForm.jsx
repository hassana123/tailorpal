const StyleReferenceForm = ({
  styleDescription,
  setStyleDescription,
  notes,
  setNotes,
  styleImage,
  styleImagePreview,
  imageLoading,
  onImageChange,
  onClearImage,
  errors
}) => {
  return (
    <>
      {/* Style Reference Section */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Style Reference (Optional)
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Style Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Style Image (Optional)
            </label>
            <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
              errors.styleImage ? 'border-red-300 bg-red-50' : 'border-pink-300 hover:border-pink-400 hover:bg-pink-50'
            }`}>
              <input
                id="styleImageInput"
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-2">
                <svg className="w-12 h-12 text-pink-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div>
                  <p className="text-pink-600 font-medium">Click to upload style image</p>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>

            {/* Image Preview */}
            {(styleImagePreview || imageLoading) && (
              <div className="mt-4 flex items-center justify-center">
                <div className="relative">
                  {imageLoading ? (
                    <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                      <svg className="animate-spin h-8 w-8 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : styleImagePreview ? (
                    <div className="relative bg-white p-2 rounded-xl shadow-lg border border-gray-200">
                      <img
                        src={styleImagePreview}
                        alt="Style preview"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={onClearImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors duration-200 shadow-lg"
                      >
                        ×
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {errors.styleImage && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.styleImage}
              </p>
            )}
          </div>

          {/* Style Description */}
          <div>
            <label htmlFor="styleDescription" className="block text-sm font-semibold text-gray-700 mb-2">
              Style Description (Optional)
            </label>
            <textarea
              id="styleDescription"
              value={styleDescription}
              onChange={(e) => setStyleDescription(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-white border-2 border-pink-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-300 resize-none"
              placeholder="Describe the style details (e.g., High neck with bell sleeves, A-line cut, etc.)"
            />
          </div>
        </div>
      </div>

      {/* Additional Notes Section */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Additional Notes (Optional)
        </h2>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-500/20 focus:border-gray-500 transition-all duration-300 resize-none"
          placeholder="Any special instructions, preferences, or notes for this order..."
        />
      </div>
    </>
  );
};

export default StyleReferenceForm;