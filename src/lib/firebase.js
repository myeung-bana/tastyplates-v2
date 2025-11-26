import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBXcIW1gwpFYsKUD616sNIgXfvij7kRx28",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "tastyplates-6d594.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "tastyplates-6d594",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "tastyplates-6d594.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "519613504996",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:519613504996:web:1e8ac590655f4e1f8a7bf1",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-W48FDEP12S"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Initialize analytics (only on client-side)
let analytics = null;
if (typeof window !== 'undefined') {
    try {
        analytics = getAnalytics(app);
    } catch (error) {
        console.warn('Firebase Analytics initialization failed:', error);
    }
}

export { auth, googleProvider, analytics };
