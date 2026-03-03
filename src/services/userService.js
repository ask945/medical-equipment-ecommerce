import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'users';

export async function getUserProfile(uid) {
  const ref = doc(db, COLLECTION, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createUserProfile(uid, data) {
  const ref = doc(db, COLLECTION, uid);
  await setDoc(ref, {
    ...data,
    createdAt: new Date().toISOString(),
  });
}
