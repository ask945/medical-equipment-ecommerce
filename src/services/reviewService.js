import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'reviews';

export async function getReviews() {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
