import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAdARQe1BiksiVI7v7pczNiSTQgTmbIsMQ",
  authDomain: "gikigpacalc.firebaseapp.com",
  projectId: "gikigpacalc",
  storageBucket: "gikigpacalc.firebasestorage.app",
  messagingSenderId: "967269023657",
  appId: "1:967269023657:web:fac6aee10b1cfc55448eb8",
  measurementId: "G-MRHE49P4V8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable Offline Persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time.
    console.warn("Firestore persistence failed: Multiple tabs open");
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the features required to enable persistence
    console.warn("Firestore persistence failed: Browser not supported");
  }
});

// Helper function to handle silent login
export const loginAnonymously = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    console.log("Logged in anonymously with UID: ", userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error("Firebase Anonymous Login Failed: ", error.message);
    throw error;
  }
};
