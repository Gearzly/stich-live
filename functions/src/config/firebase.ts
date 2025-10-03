import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Firebase Admin SDK instances
export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();

// Firestore collections
export const COLLECTIONS = {
  USERS: 'users',
  APPS: 'apps',
  GENERATION_SESSIONS: 'generation_sessions',
  GENERATION_LOGS: 'generation_logs',
  TEMPLATES: 'templates',
  USAGE: 'usage',
  ADMIN: 'admin',
} as const;

// Firebase configuration helpers
export const getCollection = (collectionName: string) => {
  return db.collection(collectionName);
};

export const getDocument = (collectionName: string, documentId: string) => {
  return db.collection(collectionName).doc(documentId);
};