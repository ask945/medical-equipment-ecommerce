import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  increment,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'blogs';

/**
 * Fetch all blogs (Admin or Public)
 */
export async function getBlogs(onlyActive = false) {
  try {
    let q;
    if (onlyActive) {
      q = query(
        collection(db, COLLECTION), 
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    }
    
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ 
      id: d.id, 
      ...d.data(),
      createdAt: d.data().createdAt?.toDate() || new Date()
    }));
  } catch (err) {
    console.warn('Ordered blog fetch failed, falling back:', err.message);
    const snap = await getDocs(collection(db, COLLECTION));
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return onlyActive ? all.filter(b => b.isActive === true) : all;
  }
}

/**
 * Get single blog by ID
 */
export async function getBlogById(id) {
  try {
    const ref = doc(db, COLLECTION, id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { 
        id: snap.id, 
        ...snap.data(),
        createdAt: snap.data().createdAt?.toDate() || new Date()
      };
    }
    return null;
  } catch (err) {
    console.error('Error fetching blog by ID:', err);
    return null;
  }
}

/**
 * Create a new blog
 */
export async function createBlog(blogData) {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...blogData,
    views: 0,
    viewedBy: [],
    comments: [],
    isActive: blogData.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

/**
 * Update existing blog
 */
export async function updateBlog(id, updateData) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...updateData,
    updatedAt: serverTimestamp()
  });
}

/**
 * Real-time subscription to all blogs (for admin panel)
 * Returns an unsubscribe function
 */
export function subscribeToBlogsAdmin(callback) {
  let q;
  try {
    q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  } catch {
    q = collection(db, COLLECTION);
  }
  return onSnapshot(q, (snapshot) => {
    const blogs = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate() || new Date()
    }));
    callback(blogs);
  }, (error) => {
    console.error('Blog subscription error:', error);
  });
}

/**
 * Delete blog
 */
export async function deleteBlog(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}

/**
 * Increment unique views
 */
export async function incrementBlogViews(id, identifier) {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  
  if (snap.exists()) {
    const data = snap.data();
    const viewedBy = data.viewedBy || [];
    
    if (!viewedBy.includes(identifier)) {
      await updateDoc(ref, {
        views: increment(1),
        viewedBy: arrayUnion(identifier)
      });
    }
  }
}

/**
 * Add comment to blog
 */
export async function addBlogComment(id, commentData) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    comments: arrayUnion({
      ...commentData,
      commentedAt: new Date().toISOString()
    })
  });
}
