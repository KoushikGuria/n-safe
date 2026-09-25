import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  registerAuthUser,
  loginAuthUser,
  logoutAuthUser,
  onAuthStateListener,
  formatAuthError,
} from '../firebase/auth';
import { createUserProfile, getUserProfile } from '../services/userService';
import { generateQrId } from '../utils/qr';
import { normalizePhone } from '../utils/phone';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile when auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateListener(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (err) {
          console.error('Failed to load profile for user:', err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  /**
   * Refreshes the active user's profile from Firestore.
   */
  const refreshProfile = async () => {
    if (!currentUser) return null;
    try {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
      return profile;
    } catch (err) {
      console.error('Failed to refresh profile:', err);
      return null;
    }
  };

  /**
   * Full registration flow:
   * 1. Create Firebase Auth user
   * 2. Generate unique QR ID
   * 3. Normalize phone number
   * 4. Save to Firestore users/{uid} collection
   */
  const register = async ({ name, email, phone, alternateNumbers = [], address, password }) => {
    try {
      const user = await registerAuthUser(email, password, name);
      const uniqueQrId = generateQrId();
      const profile = await createUserProfile(user.uid, {
        name,
        email,
        phone: normalizePhone(phone),
        alternateNumbers: Array.isArray(alternateNumbers)
          ? alternateNumbers.filter(Boolean).map(normalizePhone)
          : [],
        address,
        qrId: uniqueQrId,
      });
      setUserProfile(profile);
      return { user, profile };
    } catch (error) {
      const friendlyMessage = formatAuthError(error);
      throw new Error(friendlyMessage);
    }
  };

  /**
   * Login flow
   */
  const login = async (email, password) => {
    try {
      const user = await loginAuthUser(email, password);
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
      return { user, profile };
    } catch (error) {
      const friendlyMessage = formatAuthError(error);
      throw new Error(friendlyMessage);
    }
  };

  /**
   * Logout flow
   */
  const logout = async () => {
    try {
      await logoutAuthUser();
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    register,
    login,
    logout,
    refreshProfile,
    isAuthenticated: Boolean(currentUser),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
