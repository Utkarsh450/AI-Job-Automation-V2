import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  dbUser: null,
  isLoading: true,
  
  fetchUser: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({ dbUser: data.user });
      }
    } catch (error) {
      console.error("Fetch User Error:", error);
    }
  },
  
  initializeAuth: () => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          
          // 1. Attempt to Login
          let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          // 2. If User not found (404), Register them!
          if (res.status === 404) {
             res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
             });
          }
          
          if (!res.ok) throw new Error('Backend Auth Failed');
          const data = await res.json();
          
          set({ user: firebaseUser, token, dbUser: data.user, isLoading: false });
        } catch (error) {
          console.error("Sync Error:", error);
          await signOut(auth); // Prevent zombie sessions if backend is completely down
          set({ user: null, token: null, dbUser: null, isLoading: false });
        }
      } else {
        set({ user: null, token: null, dbUser: null, isLoading: false });
      }
    });
  },

  loginWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Login Error:", error);
      throw error;
    }
  },

  loginWithEmail: async (email, password) => {
    try {
      // Attempt to sign in
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      // If user doesn't exist or invalid credentials, try to create an account
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (regError) {
        console.error("Email Auth Error:", regError);
        throw regError;
      }
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null, token: null, dbUser: null });
  }
}));

export default useAuthStore;
