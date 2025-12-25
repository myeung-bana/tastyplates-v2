import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

/**
 * Initialize Firebase Admin SDK
 * Returns true if initialized successfully, false otherwise
 */
function initializeFirebaseAdmin(): boolean {
  // Check if already initialized
  if (getApps().length > 0) {
    return true;
  }

  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    // Check for required environment variables
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.error('Firebase Admin SDK: FIREBASE_PROJECT_ID is not set');
      return false;
    }
    
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      console.error('Firebase Admin SDK: FIREBASE_CLIENT_EMAIL is not set');
      return false;
    }
    
    if (!privateKey) {
      console.error('Firebase Admin SDK: FIREBASE_PRIVATE_KEY is not set or invalid');
      return false;
    }
    
    // Initialize Firebase Admin
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    
    return true;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    return false;
  }
}

/**
 * Get Firebase Admin instance
 * Initializes Firebase Admin if not already initialized
 * Returns an object with auth() method for accessing Firebase Auth
 */
export function getFirebaseAdmin(): { auth: () => Auth } {
  const isInitialized = initializeFirebaseAdmin();
  
  if (!isInitialized) {
    throw new Error('Firebase Admin SDK failed to initialize. Check environment variables.');
  }
  
  return {
    auth: () => getAuth()
  };
}

