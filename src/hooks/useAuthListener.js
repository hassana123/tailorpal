import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { setUser, setLoading } from '../store/slices/authSlice';
import { setShop } from '../store/slices/shopSlice';

export const useAuthListener = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setLoading(true));
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // User is signed in
          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          };
          
          dispatch(setUser(userData));

          // Check if user has a shop
          try {
            const shopDoc = await getDoc(doc(db, 'shops', user.uid));
            if (shopDoc.exists()) {
              const shopData = {
                id: shopDoc.id,
                ...shopDoc.data()
              };
              dispatch(setShop(shopData));
            } else {
              // No shop found, clear shop state
              dispatch(setShop(null));
            }
          } catch (error) {
            console.error('Error fetching shop data:', error);
            dispatch(setShop(null));
          }
        } else {
          // User is signed out
          dispatch(setUser(null));
          dispatch(setShop(null));
        }
      } catch (error) {
        console.error('Error in auth listener:', error);
      } finally {
        dispatch(setLoading(false));
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [dispatch]);
};