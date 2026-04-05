// Mock Firebase for local development without connection
export const db: any = {};
export const auth: any = {
  currentUser: null,
  onAuthStateChanged: () => () => {},
  signInWithEmailAndPassword: () => Promise.resolve({}),
  createUserWithEmailAndPassword: () => Promise.resolve({}),
  signOut: () => Promise.resolve({}),
  sendPasswordResetEmail: () => Promise.resolve({}),
};

// Initialize Firebase SDK - Commented out as requested
/*
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

if (!firebaseConfig || !firebaseConfig.apiKey) {
  console.error('Firebase configuration is missing or invalid. Please check src/firebase-applet-config.json');
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// For debugging
(window as any).firebaseApp = app;
(window as any).firebaseConfig = firebaseConfig;
*/
