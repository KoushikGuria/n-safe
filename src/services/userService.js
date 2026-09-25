import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { normalizePhone } from '../utils/phone';

const LOCAL_STORAGE_USERS = 'qr_contact_mock_profiles';
const LOCAL_STORAGE_PUBLIC_PROFILES = 'qr_contact_mock_public_profiles';

/**
 * Creates the initial user profile document in Firestore `users/{userId}`
 * AND creates the separate `publicProfiles/{qrId}` with ONLY public info.
 */
export async function createUserProfile(userId, { name, email, phone, alternateNumbers = [], address, qrId }) {
  const normalizedPhone = normalizePhone(phone);
  const normalizedAlternates = Array.isArray(alternateNumbers)
    ? alternateNumbers.filter(Boolean).map(normalizePhone)
    : [];
  const trimmedName = name.trim();
  const trimmedAddress = address.trim();
  const lowerEmail = email.trim().toLowerCase();
  
  if (isFirebaseConfigured && db) {
    // 1. Create the private user profile in `users/{userId}`
    const userRef = doc(db, 'users', userId);
    const profileData = {
      name: trimmedName,
      email: lowerEmail,
      phone: normalizedPhone,
      alternateNumbers: normalizedAlternates,
      address: trimmedAddress,
      qrId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(userRef, profileData);

    // 2. Create the separate public profile in `publicProfiles/{qrId}`
    // Only includes public info: qrId, userId, name, phone, alternateNumbers. NO email, address, or credentials!
    const publicRef = doc(db, 'publicProfiles', qrId);
    const publicData = {
      qrId,
      userId,
      name: trimmedName,
      phone: normalizedPhone,
      alternateNumbers: normalizedAlternates,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(publicRef, publicData);

    return { 
      ...profileData, 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    };
  }

  // --- Local Demo / Dev Fallback ---
  const profilesJson = localStorage.getItem(LOCAL_STORAGE_USERS);
  const profiles = profilesJson ? JSON.parse(profilesJson) : {};
  
  const mockProfile = {
    userId,
    name: trimmedName,
    email: lowerEmail,
    phone: normalizedPhone,
    alternateNumbers: normalizedAlternates,
    address: trimmedAddress,
    qrId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  profiles[userId] = mockProfile;
  localStorage.setItem(LOCAL_STORAGE_USERS, JSON.stringify(profiles));

  // Also sync mock publicProfiles
  const publicProfilesJson = localStorage.getItem(LOCAL_STORAGE_PUBLIC_PROFILES);
  const publicProfiles = publicProfilesJson ? JSON.parse(publicProfilesJson) : {};
  publicProfiles[qrId] = {
    qrId,
    userId,
    name: trimmedName,
    phone: normalizedPhone,
    alternateNumbers: normalizedAlternates,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_STORAGE_PUBLIC_PROFILES, JSON.stringify(publicProfiles));

  return mockProfile;
}

/**
 * Self-healing / Migration mechanism:
 * Checks if publicProfiles/{qrId} exists for an existing user.
 * If missing, automatically creates it from the user's private data.
 */
export async function ensurePublicProfile(userId, profile) {
  if (!userId || !profile || !profile.qrId) return;

  const { qrId, name, phone, alternateNumbers } = profile;

  if (isFirebaseConfigured && db) {
    try {
      const publicRef = doc(db, 'publicProfiles', qrId);
      const publicSnap = await getDoc(publicRef);

      if (!publicSnap.exists()) {
        console.info(`[Self-Healing] Creating missing publicProfiles/${qrId} for user ${userId}`);
        await setDoc(publicRef, {
          qrId,
          userId,
          name: name ? name.trim() : 'User',
          phone: phone ? normalizePhone(phone) : '',
          alternateNumbers: Array.isArray(alternateNumbers) ? alternateNumbers.map(normalizePhone) : [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn('[Self-Healing] Could not verify/create publicProfile:', err);
    }
    return;
  }

  // --- Local Demo / Dev Fallback ---
  const publicProfilesJson = localStorage.getItem(LOCAL_STORAGE_PUBLIC_PROFILES);
  const publicProfiles = publicProfilesJson ? JSON.parse(publicProfilesJson) : {};
  if (!publicProfiles[qrId]) {
    publicProfiles[qrId] = {
      qrId,
      userId,
      name: name ? name.trim() : 'User',
      phone: phone ? normalizePhone(phone) : '',
      alternateNumbers: Array.isArray(alternateNumbers) ? alternateNumbers.map(normalizePhone) : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_PUBLIC_PROFILES, JSON.stringify(publicProfiles));
  }
}

/**
 * Fetches the private user profile by Firebase User ID.
 * Automatically runs the self-healing check for publicProfiles.
 */
export async function getUserProfile(userId) {
  if (!userId) return null;

  if (isFirebaseConfigured && db) {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() };
      // Self-heal publicProfiles if missing
      if (data.qrId) {
        ensurePublicProfile(userId, data).catch((err) =>
          console.warn('Background publicProfile healing error:', err)
        );
      }
      return data;
    }
    return null;
  }

  // --- Local Demo / Dev Fallback ---
  const profilesJson = localStorage.getItem(LOCAL_STORAGE_USERS);
  const profiles = profilesJson ? JSON.parse(profilesJson) : {};
  const found = profiles[userId] || null;
  if (found && found.qrId) {
    ensurePublicProfile(userId, found);
  }
  return found;
}

/**
 * Public QR Lookup: Retrieves user info by their public qrId.
 * Directly reads `publicProfiles/{qrId}` using getDoc() without requiring collection querying.
 * Does NOT require authentication.
 */
export async function getUserByQrId(qrId) {
  if (!qrId) return null;

  if (isFirebaseConfigured && db) {
    const publicRef = doc(db, 'publicProfiles', qrId);
    const docSnap = await getDoc(publicRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();

    // Strictly return only required public contact data
    return {
      userId: data.userId,
      name: data.name,
      phone: data.phone,
      alternateNumbers: data.alternateNumbers || [],
      qrId: data.qrId || qrId,
    };
  }

  // --- Local Demo / Dev Fallback ---
  const publicProfilesJson = localStorage.getItem(LOCAL_STORAGE_PUBLIC_PROFILES);
  const publicProfiles = publicProfilesJson ? JSON.parse(publicProfilesJson) : {};
  
  if (publicProfiles[qrId]) {
    return publicProfiles[qrId];
  }

  // Fallback check in mock users
  const profilesJson = localStorage.getItem(LOCAL_STORAGE_USERS);
  const profiles = profilesJson ? JSON.parse(profilesJson) : {};
  const match = Object.values(profiles).find(p => p.qrId === qrId);
  if (!match) return null;

  return {
    userId: match.userId,
    name: match.name,
    phone: match.phone,
    alternateNumbers: match.alternateNumbers || [],
    qrId: match.qrId,
  };
}

/**
 * Updates editable fields of a user's profile in `users/{userId}`
 * AND synchronizes `name` and `phone` with `publicProfiles/{qrId}`.
 */
export async function updateUserProfile(userId, { name, phone, alternateNumbers, address }) {
  if (!userId) throw new Error('User ID is required');

  const updates = {
    ...(name && { name: name.trim() }),
    ...(phone && { phone: normalizePhone(phone) }),
    ...(Array.isArray(alternateNumbers) && {
      alternateNumbers: alternateNumbers.filter(Boolean).map(normalizePhone),
    }),
    ...(address && { address: address.trim() }),
  };

  if (isFirebaseConfigured && db) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    // Synchronize public profile if name, phone, or alternateNumbers changed
    if (name || phone || Array.isArray(alternateNumbers)) {
      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const qrId = userSnap.data()?.qrId;
          if (qrId) {
            const publicRef = doc(db, 'publicProfiles', qrId);
            await setDoc(
              publicRef,
              {
                qrId,
                userId,
                ...(name && { name: name.trim() }),
                ...(phone && { phone: normalizePhone(phone) }),
                ...(Array.isArray(alternateNumbers) && {
                  alternateNumbers: alternateNumbers.filter(Boolean).map(normalizePhone),
                }),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          }
        }
      } catch (err) {
        console.warn('Failed to sync publicProfile update:', err);
      }
    }
    return true;
  }

  // --- Local Demo / Dev Fallback ---
  const profilesJson = localStorage.getItem(LOCAL_STORAGE_USERS);
  const profiles = profilesJson ? JSON.parse(profilesJson) : {};

  if (profiles[userId]) {
    profiles[userId] = {
      ...profiles[userId],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_USERS, JSON.stringify(profiles));

    const qrId = profiles[userId].qrId;
    if (qrId) {
      const publicProfilesJson = localStorage.getItem(LOCAL_STORAGE_PUBLIC_PROFILES);
      const publicProfiles = publicProfilesJson ? JSON.parse(publicProfilesJson) : {};
      publicProfiles[qrId] = {
        ...(publicProfiles[qrId] || {}),
        qrId,
        userId,
        ...(name && { name: name.trim() }),
        ...(phone && { phone: normalizePhone(phone) }),
        ...(Array.isArray(alternateNumbers) && {
          alternateNumbers: alternateNumbers.filter(Boolean).map(normalizePhone),
        }),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_PUBLIC_PROFILES, JSON.stringify(publicProfiles));
    }
    return true;
  }
  return false;
}
