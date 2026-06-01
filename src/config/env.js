import Constants from 'expo-constants';

/** app.json `extra` — available in Expo Go; may be missing in some dev-client builds */
const extra = Constants.expoConfig?.extra ?? {};

function pick(envKey, extraKey) {
  return process.env[envKey] ?? extra[extraKey] ?? '';
}

export const Env = {
  firebase: {
    apiKey: pick('EXPO_PUBLIC_FIREBASE_API_KEY', 'firebaseApiKey'),
    authDomain: pick('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', 'firebaseAuthDomain'),
    projectId: pick('EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'firebaseProjectId'),
    storageBucket: pick('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', 'firebaseStorageBucket'),
    messagingSenderId: pick(
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'firebaseMessagingSenderId'
    ),
    appId: pick('EXPO_PUBLIC_FIREBASE_APP_ID', 'firebaseAppId'),
  },
  cloudinary: {
    cloudName: pick('EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME', 'cloudinaryCloudName'),
    uploadPreset: pick('EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET', 'cloudinaryUploadPreset'),
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
