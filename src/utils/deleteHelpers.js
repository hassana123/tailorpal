import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { db, storage } from '../firebase/config';

// Helper function to delete all documents in a collection
export const deleteCollection = async (collectionRef) => {
  const snapshot = await getDocs(collectionRef);
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};

// Helper function to delete all files in a storage folder
export const deleteStorageFolder = async (folderRef) => {
  try {
    const listResult = await listAll(folderRef);
    
    // Delete all files
    const fileDeletePromises = listResult.items.map(item => deleteObject(item));
    await Promise.all(fileDeletePromises);
    
    // Recursively delete subfolders
    const folderDeletePromises = listResult.prefixes.map(folder => deleteStorageFolder(folder));
    await Promise.all(folderDeletePromises);
  } catch (error) {
    console.warn('Error deleting storage folder:', error);
    // Don't throw error as storage cleanup is not critical
  }
};

// Delete customer and all related data
export const deleteCustomerCompletely = async (userId, customerId) => {
  try {
    // Delete all orders and their subcollections
    const ordersRef = collection(db, 'shops', userId, 'customers', customerId, 'orders');
    const ordersSnapshot = await getDocs(ordersRef);
    
    for (const orderDoc of ordersSnapshot.docs) {
      const orderId = orderDoc.id;
      
      // Delete order materials
      const materialsRef = collection(db, 'shops', userId, 'customers', customerId, 'orders', orderId, 'materials');
      await deleteCollection(materialsRef);
      
      // Delete order measurements
      const measurementsRef = collection(db, 'shops', userId, 'customers', customerId, 'orders', orderId, 'measurements');
      await deleteCollection(measurementsRef);
      
      // Delete custom measurements
      const customMeasurementsRef = collection(db, 'shops', userId, 'customers', customerId, 'orders', orderId, 'customMeasurements');
      await deleteCollection(customMeasurementsRef);
      
      // Delete the order document
      await deleteDoc(orderDoc.ref);
    }
    
    // Delete customer measurements
    const customerMeasurementsRef = collection(db, 'shops', userId, 'customers', customerId, 'measurements');
    await deleteCollection(customerMeasurementsRef);
    
    // Delete customer document
    const customerRef = doc(db, 'shops', userId, 'customers', customerId);
    await deleteDoc(customerRef);
    
    // Delete all storage files for this customer
    const customerStorageRef = ref(storage, `style-images/${userId}/${customerId}`);
    await deleteStorageFolder(customerStorageRef);
    
    console.log('Customer and all related data deleted successfully');
    
  } catch (error) {
    console.error('Error deleting customer completely:', error);
    throw new Error('Failed to delete customer completely. Please try again.');
  }
};

// Delete order and all related data
export const deleteOrderCompletely = async (userId, customerId, orderId) => {
  try {
    // Delete order materials
    const materialsRef = collection(db, 'shops', userId, 'customers', customerId, 'orders', orderId, 'materials');
    await deleteCollection(materialsRef);
    
    // Delete order measurements
    const measurementsRef = collection(db, 'shops', userId, 'customers', customerId, 'orders', orderId, 'measurements');
    await deleteCollection(measurementsRef);
    
    // Delete custom measurements
    const customMeasurementsRef = collection(db, 'shops', userId, 'customers', customerId, 'orders', orderId, 'customMeasurements');
    await deleteCollection(customMeasurementsRef);
    
    // Get order data to check for style image
    const orderRef = doc(db, 'shops', userId, 'customers', customerId, 'orders', orderId);
    const orderDoc = await getDocs(collection(db, 'shops', userId, 'customers', customerId, 'orders'));
    const orderData = orderDoc.docs.find(doc => doc.id === orderId)?.data();
    
    // Delete style image if it exists
    if (orderData?.styleImageURL) {
      try {
        const imageRef = ref(storage, orderData.styleImageURL);
        await deleteObject(imageRef);
      } catch (error) {
        console.warn('Could not delete style image:', error);
      }
    }
    
    // Delete the order document
    await deleteDoc(orderRef);
    
    console.log('Order and all related data deleted successfully');
    
  } catch (error) {
    console.error('Error deleting order completely:', error);
    throw new Error('Failed to delete order completely. Please try again.');
  }
};