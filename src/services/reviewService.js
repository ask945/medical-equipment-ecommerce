import { collection, getDocs, addDoc, query, where, serverTimestamp, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'reviews';

export async function getReviews() {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch reviews for a specific product
 */
export async function getReviewsByProduct(productId) {
  const q = query(
    collection(db, COLLECTION),
    where('productId', '==', productId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date()
  })).sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Check if the user is eligible to review (has purchased + hasn't reviewed yet)
 */
export async function canUserReview(userId, productId) {
  if (!userId || !productId) return false;

  // 1. Check if user already reviewed
  const qReview = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    where('productId', '==', productId)
  );
  const reviewSnap = await getDocs(qReview);
  if (!reviewSnap.empty) return { canReview: false, reason: 'ALREADY_REVIEWED' };

  // 2. Check if user has a DELIVERED order containing this product
  const qOrders = query(
    collection(db, 'orders'),
    where('userId', '==', userId)
  );
  const ordersSnap = await getDocs(qOrders);

  const hasDelivered = ordersSnap.docs.some(doc => {
    const order = doc.data();
    return order.status === 'Delivered' &&
           order.items?.some(item => (item.productId === productId || item.id === productId));
  });

  if (!hasDelivered) return { canReview: false, reason: 'NOT_DELIVERED' };

  return { canReview: true };
}

/**
 * Add a new review and update product stats
 */
export async function addReview(reviewData) {
  const { productId, rating } = reviewData;
  
  // 1. Add the review document
  await addDoc(collection(db, COLLECTION), {
    ...reviewData,
    createdAt: serverTimestamp()
  });

  // 2. Update product aggregation (Simple approach for now)
  const productRef = doc(db, 'products', productId);
  const productSnap = await getDoc(productRef);
  
  if (productSnap.exists()) {
    const currentData = productSnap.data();
    const currentCount = Number(currentData.reviews) || 0;
    const currentRating = Number(currentData.rating) || 0;
    
    // New average = ((old_avg * old_count) + new_rating) / (old_count + 1)
    const newCount = currentCount + 1;
    const newRating = ((currentRating * currentCount) + rating) / newCount;

    await updateDoc(productRef, {
      rating: Number(newRating.toFixed(1)),
      reviews: newCount
    });
  }
}
