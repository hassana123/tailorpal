import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import { setUser, setLoading } from '../store/slices/authSlice';
import { setShop } from '../store/slices/shopSlice';

export const useAuthListener = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setLoading(true));
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          dispatch(setUser(null));
          dispatch(setShop(null));
          return;
        }

        if (session?.user) {
          await handleUserSession(session.user);
        } else {
          dispatch(setUser(null));
          dispatch(setShop(null));
        }
      } catch (error) {
        console.error('Error in initial session check:', error);
        dispatch(setUser(null));
        dispatch(setShop(null));
      } finally {
        dispatch(setLoading(false));
      }
    };

    // Handle user session data
    const handleUserSession = async (user) => {
      try {
        const userData = {
          uid: user.id,
          email: user.email,
          displayName: user.user_metadata?.display_name || user.email,
          photoURL: user.user_metadata?.avatar_url || null,
        };
        
        dispatch(setUser(userData));

        // Check if user has a shop
        try {
          const { data: shopData, error } = await supabase
            .from('shops')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
            console.error('Error fetching shop data:', error);
            dispatch(setShop(null));
          } else if (shopData) {
            dispatch(setShop({
              id: shopData.id,
              ...shopData
            }));
          } else {
            dispatch(setShop(null));
          }
        } catch (error) {
          console.error('Error fetching shop data:', error);
          dispatch(setShop(null));
        }
      } catch (error) {
        console.error('Error handling user session:', error);
        dispatch(setUser(null));
        dispatch(setShop(null));
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            await handleUserSession(session.user);
          } else {
            dispatch(setUser(null));
            dispatch(setShop(null));
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          dispatch(setUser(null));
          dispatch(setShop(null));
        }
      }
    );

    // Get initial session
    getInitialSession();

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [dispatch]);
};