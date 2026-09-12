import Constants from 'expo-constants';

/** app.json `extra` — available in Expo Go and some dev builds; NOT guaranteed in standalone/production builds */
const extra = Constants.expoConfig?.extra ?? {};

// IMPORTANT: EXPO_PUBLIC_* variables only get baked into the production
// bundle when accessed as a literal, static `process.env.EXACT_NAME`
// expression — that's the only pattern Expo's build tooling can statically
// find and replace. A dynamic/bracket lookup like `process.env[someVar]`
// is invisible to that step and is ALWAYS undefined at runtime, in every
// build. This previously only worked in dev because it fell back to the
// `extra` object above, which is not reliably present in a standalone
// release build — causing Firebase config to silently end up empty in
// production while looking fine in dev/Expo Go.
export const Env = {
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || extra.firebaseApiKey || '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || extra.firebaseAuthDomain || '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || extra.firebaseProjectId || '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || extra.firebaseStorageBucket || '',
    messagingSenderId:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || extra.firebaseMessagingSenderId || '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || extra.firebaseAppId || '',
  },
  cloudinary: {
    cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || extra.cloudinaryCloudName || '',
    uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || extra.cloudinaryUploadPreset || '',
  },
};

export function assertFirebaseConfig() {
  const { apiKey, projectId, appId } = Env.firebase;
  if (!apiKey || !projectId || !appId) {
    throw new Error(
      'Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* keys to D:\\Final\\app\\.env'
    );
  }
}
