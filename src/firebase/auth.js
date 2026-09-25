import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';

// Local storage keys for development simulator mode
const LOCAL_STORAGE_USERS = 'qr_contact_mock_users';
const LOCAL_STORAGE_SESSION = 'qr_contact_mock_session';

/**
 * Maps Firebase Auth error codes to user-friendly error messages.
 */
export function formatAuthError(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const code = error.code || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please log in.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes before trying again.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}

/**
 * Registers a new user with Firebase Authentication.
 */
export async function registerAuthUser(email, password, displayName) {
  if (isFirebaseConfigured && auth) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    return userCredential.user;
  }

  // --- Local Demo / Dev Mode Fallback ---
  const usersJson = localStorage.getItem(LOCAL_STORAGE_USERS);
  const users = usersJson ? JSON.parse(usersJson) : [];
  
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    const err = new Error('An account with this email address already exists.');
    err.code = 'auth/email-already-in-use';
    throw err;
  }

  const mockUid = 'usr_' + Math.random().toString(36).substring(2, 11);
  const mockUser = {
    uid: mockUid,
    email,
    displayName: displayName || '',
  };

  users.push({ ...mockUser, password }); // password kept in mock storage for test login
  localStorage.setItem(LOCAL_STORAGE_USERS, JSON.stringify(users));
  localStorage.setItem(LOCAL_STORAGE_SESSION, JSON.stringify(mockUser));

  // Notify listeners
  window.dispatchEvent(new Event('mock_auth_change'));
  return mockUser;
}

/**
 * Logs in an existing user with email and password.
 */
export async function loginAuthUser(email, password) {
  if (isFirebaseConfigured && auth) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }

  // --- Local Demo / Dev Mode Fallback ---
  const usersJson = localStorage.getItem(LOCAL_STORAGE_USERS);
  const users = usersJson ? JSON.parse(usersJson) : [];

  const found = users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!found) {
    const err = new Error('Invalid email or password.');
    err.code = 'auth/invalid-credential';
    throw err;
  }

  const mockUser = {
    uid: found.uid,
    email: found.email,
    displayName: found.displayName || '',
  };

  localStorage.setItem(LOCAL_STORAGE_SESSION, JSON.stringify(mockUser));
  window.dispatchEvent(new Event('mock_auth_change'));
  return mockUser;
}

/**
 * Logs out the current user.
 */
export async function logoutAuthUser() {
  if (isFirebaseConfigured && auth) {
    return await signOut(auth);
  }

  // --- Local Demo / Dev Mode Fallback ---
  localStorage.removeItem(LOCAL_STORAGE_SESSION);
  window.dispatchEvent(new Event('mock_auth_change'));
}

/**
 * Subscribes to auth state changes (handles page refreshes & login state).
 */
export function onAuthStateListener(callback) {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, callback);
  }

  // --- Local Demo / Dev Mode Fallback ---
  const checkSession = () => {
    const sessionJson = localStorage.getItem(LOCAL_STORAGE_SESSION);
    const session = sessionJson ? JSON.parse(sessionJson) : null;
    callback(session);
  };

  checkSession();

  const handleStorage = () => checkSession();
  window.addEventListener('mock_auth_change', handleStorage);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('mock_auth_change', handleStorage);
    window.removeEventListener('storage', handleStorage);
  };
}
