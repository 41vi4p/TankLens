import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize Firebase if it hasn't been initialized already and if we have config values
let app: FirebaseApp;

if (!getApps().length) {
  if (!firebaseConfig.apiKey) {
    console.error('Firebase configuration error: Missing API key in environment variables');
    throw new Error('Firebase configuration is missing. Check your environment variables.');
  } else {
    app = initializeApp(firebaseConfig);
  }
} else {
  app = getApps()[0];
}

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Configure Google provider with additional scopes if needed
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Helper functions for device sharing
export const addDeviceAccess = async (deviceId: string, userId: string, accessType: 'owner' | 'viewer' = 'viewer') => {
  try {
    await setDoc(doc(db, 'device_access', `${deviceId}_${userId}`), {
      deviceId,
      userId,
      accessType,
      addedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error adding device access:', error);
    return false;
  }
};

export const getUserDevices = async (userId: string) => {
  try {
    const accessRef = collection(db, 'device_access');
    const accessQuery = query(accessRef, where('userId', '==', userId));
    const accessSnapshot = await getDocs(accessQuery);
    
    const deviceIds: string[] = [];
    accessSnapshot.forEach(doc => {
      const data = doc.data();
      deviceIds.push(data.deviceId);
    });
    
    return deviceIds;
  } catch (error) {
    console.error('Error getting user devices:', error);
    return [];
  }
};

export { auth, db, googleProvider };