import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'products';

export async function getProducts({ includeDrafts = false } = {}) {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => {
      const data = d.data();
      const category = data.category || data.type || data.categoryId || 'Uncategorized';
      const brand = data.brand || 'Generic';
      return {
        id: d.id,
        ...data,
        category,
        brand,
        rating: data.rating || 0,
        reviews: data.reviews || 0
      };
    })
    .filter(p => includeDrafts || (p.showOnHome !== false && p.disabledByCategory !== true));
}

export async function getProductById(id, { checkVisibility = false } = {}) {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  if (checkVisibility && (data.showOnHome === false || data.disabledByCategory === true)) {
    return null;
  }
  return {
    id: snap.id,
    ...data,
    category: data.category || data.type || data.categoryId || 'Uncategorized',
    brand: data.brand || 'Generic',
    rating: data.rating || 0,
    reviews: data.reviews || 0
  };
}

export async function getProductsByCategory(category) {
  const q = query(collection(db, COLLECTION), where('category', '==', category));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter(p => p.showOnHome !== false && p.disabledByCategory !== true);
}
