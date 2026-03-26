import { collection, getDocs, doc, getDoc, query, where, addDoc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'orders';

/**
 * Validate stock availability for all items before placing an order.
 * Returns { valid: true } or { valid: false, outOfStock: [...] }
 */
export async function validateStock(items) {
  if (!items || !Array.isArray(items)) return { valid: true };

  const outOfStock = [];
  for (const item of items) {
    if (item.category === 'Services' || String(item.id).startsWith('service-')) continue;
    try {
      const productSnap = await getDoc(doc(db, 'products', item.id));
      if (productSnap.exists()) {
        const product = productSnap.data();
        const currentStock = product.stock ?? 0;
        const requestedQty = item.quantity || 1;
        if (currentStock < requestedQty) {
          outOfStock.push({
            id: item.id,
            name: item.name || item.title || 'Product',
            requested: requestedQty,
            available: currentStock
          });
        }
      }
    } catch (err) {
      console.warn(`Stock check failed for ${item.id}:`, err.message);
    }
  }

  return outOfStock.length > 0 ? { valid: false, outOfStock } : { valid: true };
}

/**
 * Create order with transactional stock validation and decrement.
 * Validates stock inside transaction to prevent race conditions.
 */
export async function createOrder(orderData) {
  const productItems = (orderData.items || []).filter(
    item => item.category !== 'Services' && !String(item.id).startsWith('service-')
  );

  // Use transaction to atomically check stock and create order
  const orderId = await runTransaction(db, async (transaction) => {
    // Step 1: Read all product docs inside transaction
    const productSnaps = [];
    for (const item of productItems) {
      const productRef = doc(db, 'products', item.id);
      const snap = await transaction.get(productRef);
      productSnaps.push({ item, snap, ref: productRef });
    }

    // Step 2: Validate stock for each product
    const outOfStock = [];
    for (const { item, snap } of productSnaps) {
      if (!snap.exists()) continue;
      const currentStock = snap.data().stock ?? 0;
      const requestedQty = item.quantity || 1;
      if (currentStock < requestedQty) {
        outOfStock.push(`${item.name || 'Product'} (available: ${currentStock}, requested: ${requestedQty})`);
      }
    }

    if (outOfStock.length > 0) {
      throw new Error(`Insufficient stock: ${outOfStock.join(', ')}`);
    }

    // Step 3: Create order document
    const orderRef = doc(collection(db, COLLECTION));
    transaction.set(orderRef, {
      ...orderData,
      createdAt: new Date().toISOString(),
    });

    // Step 4: Decrement stock for each product
    for (const { item, snap, ref } of productSnaps) {
      if (!snap.exists()) continue;
      const currentStock = snap.data().stock ?? 0;
      const qty = item.quantity || 1;
      transaction.update(ref, { stock: currentStock - qty });
    }

    return orderRef.id;
  });

  return orderId;
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
