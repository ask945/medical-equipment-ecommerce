import { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load Wishlist Data
  useEffect(() => {
    async function loadWishlist() {
      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const ref = doc(db, 'wishlists', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setItems(snap.data().items || []);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error('Failed to load wishlist:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWishlist();
  }, [user]);

  // Synchronize explicitly
  const saveWishlistToDB = async (updatedItems) => {
    if (!user) return;
    try {
      const ref = doc(db, 'wishlists', user.uid);
      await setDoc(ref, { items: updatedItems, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to save wishlist:', err);
    }
  };

  const toggleItem = (product) => {
    setItems((prev) => {
      const isWishlisted = prev.some((item) => item.id === product.id);
      let updated;
      if (isWishlisted) {
        updated = prev.filter((item) => item.id !== product.id);
      } else {
        updated = [...prev, product];
      }
      saveWishlistToDB(updated);
      return updated;
    });
  };

  const removeItem = (productId) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== productId);
      saveWishlistToDB(updated);
      return updated;
    });
  };

  const isWishlisted = (productId) => items.some((item) => item.id === productId);

  return (
    <WishlistContext.Provider value={{ items, toggleItem, removeItem, isWishlisted, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
