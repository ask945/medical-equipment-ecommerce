import { collection, getDocs, doc, getDoc, query, where, addDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'orders';

export async function createOrder(orderData) {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...orderData,
    createdAt: new Date().toISOString(),
  });

  // Decrement stock for each product (skip services)
  if (orderData.items && Array.isArray(orderData.items)) {
    for (const item of orderData.items) {
      if (item.category === 'Services' || String(item.id).startsWith('service-')) continue;
      try {
        const productRef = doc(db, 'products', item.id);
        await updateDoc(productRef, { stock: increment(-(item.quantity || 1)) });
      } catch (err) {
        console.warn(`Failed to decrement stock for ${item.id}:`, err.message);
      }
    }
  }

  return docRef.id;
}

export async function getOrders(userId) {
  if (!userId) return [];
  const q = query(collection(db, COLLECTION), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllOrders() {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getOrderById(orderId) {
  // Try fetching by document ID first
  const ref = doc(db, COLLECTION, orderId);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: snap.id, ...snap.data() };

  // Fallback: query by orderId field (in case doc ID differs from display ID)
  const q = query(collection(db, COLLECTION), where('id', '==', orderId));
  const qSnap = await getDocs(q);
  if (!qSnap.empty) {
    const d = qSnap.docs[0];
    return { id: d.id, ...d.data() };
  }
  return null;
}
