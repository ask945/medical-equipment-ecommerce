import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [blogsLoading, setBlogsLoading] = useState(true);

  // Real-time products listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      const all = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          category: data.category || data.type || data.categoryId || 'Uncategorized',
          brand: data.brand || 'Generic',
          rating: data.rating || 0,
          reviews: data.reviews || 0,
        };
      });
      // Only visible products for user side (not drafts, not disabled)
      setProducts(all.filter(p => p.showOnHome !== false && p.disabledByCategory !== true));
      setProductsLoading(false);
    }, (err) => {
      console.error('Products listener error:', err);
      setProductsLoading(false);
    });
    return unsub;
  }, []);

  // Real-time categories listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCategoriesLoading(false);
    }, (err) => {
      console.error('Categories listener error:', err);
      setCategoriesLoading(false);
    });
    return unsub;
  }, []);

  // Real-time blogs listener (only active)
  useEffect(() => {
    // Try ordered query first
    let q;
    try {
      q = query(
        collection(db, 'blogs'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
    } catch {
      q = collection(db, 'blogs');
    }

    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
      }));
      // Filter active in case the compound query wasn't available
      setBlogs(all.filter(b => b.isActive !== false));
      setBlogsLoading(false);
    }, (err) => {
      console.warn('Blog ordered query failed, falling back:', err.message);
      // Fallback: listen to all blogs and filter client-side
      const fallbackUnsub = onSnapshot(collection(db, 'blogs'), (snap) => {
        const all = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() || new Date(),
        }));
        setBlogs(all.filter(b => b.isActive === true).sort((a, b) => b.createdAt - a.createdAt));
        setBlogsLoading(false);
      });
      return fallbackUnsub;
    });

    return unsub;
  }, []);

  const value = {
    products,
    categories,
    blogs,
    productsLoading,
    categoriesLoading,
    blogsLoading,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
