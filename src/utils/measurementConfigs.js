// Enhanced measurement configurations for Nigerian tailoring

// Default measurements for each gender
export const DEFAULT_MEASUREMENTS = {
  male: {
    'agbadaLength': { label: 'Agbada Length', unit: 'inches' },
    'topLength': { label: 'Top Length', unit: 'inches' },
    'chest': { label: 'Chest / Body', unit: 'inches' },
    'shoulder': { label: 'Shoulder', unit: 'inches' },
    'sleeveLength': { label: 'Sleeve Length', unit: 'inches' },
    'neck': { label: 'Neck', unit: 'inches' },
    'trouserLength': { label: 'Trouser Length', unit: 'inches' },
    'waist': { label: 'Waist', unit: 'inches' },
    'hips': { label: 'Hips', unit: 'inches' },
    'thigh': { label: 'Thigh / Lap', unit: 'inches' },
    'knee': { label: 'Knee', unit: 'inches' },
    'trouserMouth': { label: 'Trouser Mouth', unit: 'inches' }
  },
  female: {
    'bust': { label: 'Bust', unit: 'inches' },
    'waist': { label: 'Waist', unit: 'inches' },
    'hip': { label: 'Hip', unit: 'inches' },
    'shoulder': { label: 'Shoulder', unit: 'inches' },
    'neck': { label: 'Neck', unit: 'inches' },
    'backLength': { label: 'Back Length', unit: 'inches' },
    'sleeveLength': { label: 'Sleeve Length', unit: 'inches' },
    'armhole': { label: 'Armhole', unit: 'inches' },
    'gownLength': { label: 'Gown Length', unit: 'inches' },
    'blouseLength': { label: 'Blouse Length', unit: 'inches' },
    'skirtLength': { label: 'Skirt Length', unit: 'inches' },
    'trouserLength': { label: 'Trouser Length', unit: 'inches' },
    'inseam': { label: 'Inseam', unit: 'inches' },
    'thigh': { label: 'Thigh', unit: 'inches' },
    'knee': { label: 'Knee', unit: 'inches' },
    'ankle': { label: 'Ankle', unit: 'inches' }
  }
};

// Garment-specific measurement mappings
export const GARMENT_MEASUREMENTS = {
  female: {
    'boubou': ['bust', 'shoulder', 'sleeveLength', 'gownLength'],
    'gown': ['bust', 'waist', 'hip', 'shoulder', 'gownLength', 'sleeveLength', 'backLength'],
    'wrapper-blouse': ['bust', 'waist', 'hip', 'blouseLength', 'skirtLength', 'sleeveLength'],
    'skirt-blouse': ['bust', 'waist', 'hip', 'blouseLength', 'skirtLength', 'sleeveLength'],
    'trousers': ['waist', 'hip', 'thigh', 'trouserLength', 'inseam'],
    'jumpsuit': ['bust', 'waist', 'hip', 'shoulder', 'gownLength', 'sleeveLength', 'trouserLength']
  },
  male: {
    'kaftan': ['shoulder', 'chest', 'sleeveLength', 'topLength'],
    'senator': ['shoulder', 'chest', 'waist', 'sleeveLength', 'topLength', 'trouserLength'],
    'agbada': ['shoulder', 'chest', 'sleeveLength', 'agbadaLength'],
    'shirt-trousers': ['shoulder', 'chest', 'waist', 'sleeveLength', 'topLength', 'trouserLength', 'thigh'],
    'trousers': ['waist', 'hips', 'thigh', 'trouserLength', 'trouserMouth'],
    'dashiki': ['shoulder', 'chest', 'sleeveLength', 'topLength']
  }
};

// Garment type options
export const GARMENT_TYPES = {
  female: [
    { value: 'boubou', label: 'Boubou' },
    { value: 'gown', label: 'Gown' },
    { value: 'wrapper-blouse', label: 'Wrapper & Blouse' },
    { value: 'skirt-blouse', label: 'Skirt & Blouse' },
    { value: 'trousers', label: 'Trousers' },
    { value: 'jumpsuit', label: 'Jumpsuit' }
  ],
  male: [
    { value: 'kaftan', label: 'Kaftan' },
    { value: 'senator', label: 'Senator' },
    { value: 'agbada', label: 'Agbada' },
    { value: 'shirt-trousers', label: 'Shirt & Trousers' },
    { value: 'trousers', label: 'Trousers' },
    { value: 'dashiki', label: 'Dashiki' }
  ]
};

// Helper functions
export const getDefaultMeasurementsForGender = (gender) => {
  return DEFAULT_MEASUREMENTS[gender] || {};
};

export const getRequiredMeasurementsForGarment = (gender, garmentType) => {
  return GARMENT_MEASUREMENTS[gender]?.[garmentType] || [];
};

export const getGarmentTypesForGender = (gender) => {
  return GARMENT_TYPES[gender] || [];
};

export const initializeDefaultMeasurements = (gender) => {
  const measurements = {};
  const defaultFields = getDefaultMeasurementsForGender(gender);
  
  Object.keys(defaultFields).forEach(key => {
    measurements[key] = 0;
  });
  
  return measurements;
};

export const extractOrderMeasurements = (customerMeasurements, gender, garmentType) => {
  const requiredFields = getRequiredMeasurementsForGarment(gender, garmentType);
  const orderMeasurements = {};
  
  requiredFields.forEach(field => {
    orderMeasurements[field] = customerMeasurements?.[field] || 0;
  });
  
  return orderMeasurements;
};