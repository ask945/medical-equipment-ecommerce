import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile, createUserProfile, updateUserProfile } from '../services/userService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isAdmin = sessionStorage.getItem("admin_verified") === "true";
        if (!firebaseUser.emailVerified && !isAdmin) {
          // If the email is not verified and not an admin, don't log them in
          setUser(null);
          setLoading(false);
          return;
        }
        // Try to fetch user profile from Firestore
        let profile = await getUserProfile(firebaseUser.uid);
        if (!profile) {
          // Create a basic profile if none exists
          await createUserProfile(firebaseUser.uid, {
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            email: firebaseUser.email,
            phone: '',
            avatar: firebaseUser.photoURL || `https://i.pravatar.cc/100?u=${firebaseUser.uid}`,
            addresses: [],
          });
          profile = await getUserProfile(firebaseUser.uid);
        }
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          avatar: firebaseUser.photoURL || `https://i.pravatar.cc/100?u=${firebaseUser.uid}`,
          ...profile
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email, password, { skipVerification = false } = {}) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      if (!skipVerification && !cred.user.emailVerified) {
        await sendEmailVerification(cred.user);
        await firebaseSignOut(auth);
        return { success: false, error: 'Please verify your email before logging in. A verification link has been sent to your inbox!' };
      }

      return { success: true };
    } catch (err) {
      let errorMessage = "An error occurred during sign in.";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        errorMessage = "Email ID or password entered is incorrect.";
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = "Email is not registered, Please sign up with this email.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (email, password, name) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      await sendEmailVerification(cred.user);

      await createUserProfile(cred.user.uid, {
        name: name || email.split('@')[0],
        email,
        phone: '',
        avatar: `https://i.pravatar.cc/100?u=${cred.user.uid}`,
        addresses: [],
      });

      // Sign out immediately so they have to verify and sign in
      await firebaseSignOut(auth);

      return { success: true, message: 'Signup successful! Please check your email to verify your account.' };
    } catch (err) {
      let errorMessage = "An error occurred during sign up.";
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = "Email already registered, please log in.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    sessionStorage.removeItem("admin_verified");
    setUser(null);
  };

  const updateProfile = async (data) => {
    try {
      if (!user) return { success: false, error: 'No user signed in' };
      await updateUserProfile(user.uid, data);
      setUser((prev) => ({ ...prev, ...data }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err) {
      let errorMessage = "An error occurred while sending reset email.";
      if (err.code === 'auth/user-not-found') {
        errorMessage = "Email is not registered.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      return { success: false, error: errorMessage };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateProfile, resetPassword, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
