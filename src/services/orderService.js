import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'orders';

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
