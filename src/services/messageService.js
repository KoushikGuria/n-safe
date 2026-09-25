import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';

const LOCAL_STORAGE_MESSAGES = 'qr_contact_mock_messages';
const COOLDOWN_KEY_PREFIX = 'qr_contact_last_send_';
const COOLDOWN_SECONDS = 15;

/**
 * Checks if the visitor is currently under rate limit cooldown for sending messages.
 */
export function checkRateLimit(qrId) {
  try {
    const key = `${COOLDOWN_KEY_PREFIX}${qrId}`;
    const lastSend = localStorage.getItem(key);
    if (!lastSend) return { allowed: true, remainingSec: 0 };
    
    const diff = Math.floor((Date.now() - parseInt(lastSend, 10)) / 1000);
    if (diff < COOLDOWN_SECONDS) {
      return { allowed: false, remainingSec: COOLDOWN_SECONDS - diff };
    }
    return { allowed: true, remainingSec: 0 };
  } catch {
    return { allowed: true, remainingSec: 0 };
  }
}

/**
 * Updates the rate limit timestamp after successful submission.
 */
function recordSendTimestamp(qrId) {
  try {
    const key = `${COOLDOWN_KEY_PREFIX}${qrId}`;
    localStorage.setItem(key, Date.now().toString());
  } catch (err) {
    console.warn('Could not record cooldown timestamp', err);
  }
}

/**
 * Submits an anonymous message from the public QR page.
 */
export async function sendPublicMessage(qrId, userId, rawMessage) {
  if (!rawMessage || typeof rawMessage !== 'string') {
    throw new Error('Message content is required.');
  }

  const trimmed = rawMessage.trim();
  if (trimmed.length === 0) {
    throw new Error('Message cannot be empty.');
  }

  if (trimmed.length > 1000) {
    throw new Error('Message exceeds the maximum limit of 1,000 characters.');
  }

  // Rate limit check
  const rate = checkRateLimit(qrId);
  if (!rate.allowed) {
    throw new Error(`Please wait ${rate.remainingSec} seconds before sending another message.`);
  }

  if (isFirebaseConfigured && db) {
    const messagesCol = collection(db, 'messages');
    const docRef = await addDoc(messagesCol, {
      qrId,
      userId,
      message: trimmed,
      status: 'new',
      createdAt: serverTimestamp(),
    });

    recordSendTimestamp(qrId);
    return { id: docRef.id, message: trimmed, status: 'new' };
  }

  // --- Local Demo / Dev Fallback ---
  const messagesJson = localStorage.getItem(LOCAL_STORAGE_MESSAGES);
  const messages = messagesJson ? JSON.parse(messagesJson) : [];

  const mockMessage = {
    id: 'msg_' + Math.random().toString(36).substring(2, 11),
    qrId,
    userId,
    message: trimmed,
    status: 'new',
    createdAt: new Date().toISOString(),
  };

  messages.unshift(mockMessage);
  localStorage.setItem(LOCAL_STORAGE_MESSAGES, JSON.stringify(messages));
  recordSendTimestamp(qrId);

  // Notify active listeners
  window.dispatchEvent(new Event('mock_message_received'));
  return mockMessage;
}

/**
 * Subscribes to real-time message updates for a given user.
 */
export function subscribeToUserMessages(userId, onUpdate, onError) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  if (isFirebaseConfigured && db) {
    try {
      const messagesCol = collection(db, 'messages');
      // Query without composite index requirement: query by userId only
      const q = query(
        messagesCol,
        where('userId', '==', userId)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            let createdAtDate = null;
            if (data.createdAt?.toDate) {
              createdAtDate = data.createdAt.toDate();
            } else if (data.createdAt) {
              createdAtDate = new Date(data.createdAt);
            }
            return {
              id: docSnap.id,
              ...data,
              createdAt: createdAtDate,
            };
          });

          // Sort descending (newest first) in JavaScript - requires zero Firebase composite indexes!
          items.sort((a, b) => {
            const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return timeB - timeA;
          });

          onUpdate(items);
        },
        (error) => {
          console.error('Error listening to messages:', error);
          if (onError) onError(error);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.error('Failed to set up message listener:', err);
      if (onError) onError(err);
      return () => {};
    }
  }

  // --- Local Demo / Dev Fallback ---
  const syncMockMessages = () => {
    const messagesJson = localStorage.getItem(LOCAL_STORAGE_MESSAGES);
    const messages = messagesJson ? JSON.parse(messagesJson) : [];
    const userMessages = messages
      .filter((m) => m.userId === userId)
      .map((m) => ({
        ...m,
        createdAt: new Date(m.createdAt),
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
    onUpdate(userMessages);
  };

  syncMockMessages();

  const handleUpdate = () => syncMockMessages();
  window.addEventListener('mock_message_received', handleUpdate);
  window.addEventListener('storage', handleUpdate);

  return () => {
    window.removeEventListener('mock_message_received', handleUpdate);
    window.removeEventListener('storage', handleUpdate);
  };
}

/**
 * Marks a message as read or updates status.
 */
export async function updateMessageStatus(messageId, status) {
  if (isFirebaseConfigured && db) {
    const msgRef = doc(db, 'messages', messageId);
    await updateDoc(msgRef, { status });
    return true;
  }

  // --- Local Demo / Dev Fallback ---
  const messagesJson = localStorage.getItem(LOCAL_STORAGE_MESSAGES);
  const messages = messagesJson ? JSON.parse(messagesJson) : [];
  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx !== -1) {
    messages[idx].status = status;
    localStorage.setItem(LOCAL_STORAGE_MESSAGES, JSON.stringify(messages));
    window.dispatchEvent(new Event('mock_message_received'));
    return true;
  }
  return false;
}

/**
 * Marks multiple messages as read in a single atomic batch operation.
 */
export async function markAllMessagesAsRead(messageIds) {
  if (!messageIds || messageIds.length === 0) return true;

  if (isFirebaseConfigured && db) {
    const batch = writeBatch(db);
    messageIds.forEach((id) => {
      const msgRef = doc(db, 'messages', id);
      batch.update(msgRef, { status: 'read' });
    });
    await batch.commit();
    return true;
  }

  // --- Local Demo / Dev Fallback ---
  const messagesJson = localStorage.getItem(LOCAL_STORAGE_MESSAGES);
  const messages = messagesJson ? JSON.parse(messagesJson) : [];
  const idSet = new Set(messageIds);
  messages.forEach((m) => {
    if (idSet.has(m.id)) {
      m.status = 'read';
    }
  });
  localStorage.setItem(LOCAL_STORAGE_MESSAGES, JSON.stringify(messages));
  window.dispatchEvent(new Event('mock_message_received'));
  return true;
}
