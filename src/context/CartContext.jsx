import { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load Cart Data
  useEffect(() => {
    async function loadCart() {
      if (!user) {
        setCartItems([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const ref = doc(db, 'carts', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setCartItems(snap.data().items || []);
        } else {
          setCartItems([]);
        }
      } catch (err) {
        console.error('Failed to load cart:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCart();
  }, [user]);

  // Synchronize cart with Firestore explicitly
  const saveCartToDB = async (items) => {
    if (!user) return;
    try {
      const ref = doc(db, 'carts', user.uid);
      await setDoc(ref, { items, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to save cart:', err);
    }
  };

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(p => p.id === product.id);
      let updated;
      if (existing) {
        updated = prev.map(p => 
          p.id === product.id ? { ...p, quantity: p.quantity + quantity } : p
        );
      } else {
        updated = [...prev, { ...product, quantity }];
      }
      saveCartToDB(updated);
      return updated;
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => {
      const updated = prev.filter(p => p.id !== productId);
      saveCartToDB(updated);
      return updated;
    });
  };

  const updateQuantity = (productId, getNewQuantity) => {
    setCartItems(prev => {
      const updated = prev.map(p => {
        if (p.id === productId) {
          const newQty = getNewQuantity(p.quantity);
          return newQty > 0 ? { ...p, quantity: newQty } : p;
        }
        return p;
      });
      saveCartToDB(updated);
      return updated;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    saveCartToDB([]);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      loading,
      cartCount,
      subtotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
