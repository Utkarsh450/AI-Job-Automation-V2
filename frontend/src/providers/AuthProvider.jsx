'use client';

import { useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';

export default function AuthProvider({ children }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe(); // Cleanup the listener when the app unmounts
  }, [initializeAuth]);

  return <>{children}</>;
}
