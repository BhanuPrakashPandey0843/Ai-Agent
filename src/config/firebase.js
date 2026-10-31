import 'react-native-url-polyfill/auto';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Env, assertFirebaseConfig } from './env';

assertFirebaseConfig();

const firebaseConfig = { ...Env.firebase };

console.log('🔍 [Firebase Config] Initializing with project ID:', firebaseConfig.projectId);
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
console.log('✅ [Firebase Config] App initialized, name:', app.name, 'options:', app.options);

// Browser WebChannel requests can fail with HTTP 400 on some local web
// development setups, so use long-polling on web. Native clients retain
// automatic detection and can opt into forced long-polling through the env flag.
// initializeFirestore() throws if Firestore was already initialized for this
// app (e.g. Fast Refresh re-running this module), so fall back to the
// already-initialized instance in that case, same pattern as `auth` below.
let db;
try {
  db = initializeFirestore(
    app,
    Platform.OS === 'web' || Env.firestoreForceLongPolling
      ? { experimentalForceLongPolling: true }
      : { experimentalAutoDetectLongPolling: true }
  );
} catch {
  db = getFirestore(app);
}

const storage = getStorage(app);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export const CLOUDINARY_CLOUD_NAME = Env.cloudinary.cloudName || 'dhliwva4d';
export const CLOUDINARY_UPLOAD_PRESET = Env.cloudinary.uploadPreset || 'faithframes_uploads';
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export { app, db, storage, auth };
