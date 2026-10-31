import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

const PROMPTED_KEY = "notification-permission-prompted";
const REGISTERED_TOKEN_KEY = "notification-registered-token";

export async function createNotificationChannels() {
  if (Platform.OS !== "android") return;
  await Promise.all([
    Notifications.setNotificationChannelAsync("default", {
      name: "General",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    }),
    Notifications.setNotificationChannelAsync("announcements", {
      name: "Announcements",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    }),
    Notifications.setNotificationChannelAsync("content", {
      name: "New content",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    }),
    Notifications.setNotificationChannelAsync("meetings", {
      name: "Meetings & events",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    }),
    Notifications.setNotificationChannelAsync("reminders", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    }),
    Notifications.setNotificationChannelAsync("personal", {
      name: "Personal messages",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    }),
  ]);
}

export async function getNotificationPermission() {
  if (Platform.OS === "web") return { status: "unavailable", canAskAgain: false };
  return Notifications.getPermissionsAsync();
}

async function getExpoProjectId() {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  if (!projectId) throw new Error("Expo project ID is missing from the app configuration.");
  return projectId;
}

export async function syncPushToken(uid, { requestPermission = false } = {}) {
  if (!uid || Platform.OS === "web") {
    return { success: false, reason: "unavailable" };
  }
  await createNotificationChannels();

  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== "granted" && requestPermission) {
    const prompted = await AsyncStorage.getItem(PROMPTED_KEY);
    if (prompted === "denied" || permission.canAskAgain === false) {
      return { success: false, reason: "denied", canAskAgain: false };
    }
    permission = await Notifications.requestPermissionsAsync();
    if (permission.status !== "granted") {
      await AsyncStorage.setItem(PROMPTED_KEY, "denied");
      return { success: false, reason: "denied", canAskAgain: permission.canAskAgain };
    }
  }
  if (permission.status !== "granted") {
    return { success: false, reason: "permission-required", canAskAgain: permission.canAskAgain };
  }

  const projectId = await getExpoProjectId();
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  if (!token) throw new Error("Expo did not return a push token.");

  const tokenRef = doc(db, "pushTokens", token);
  const existing = await getDoc(tokenRef);
  if (existing.exists() && existing.data().ownerUid !== uid) {
    throw new Error("This device's push token is still linked to another account. Sign out and try again.");
  }
  if (existing.exists()) {
    await updateDoc(tokenRef, {
      active: true,
      platform: Platform.OS,
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(tokenRef, {
      ownerUid: uid,
      token,
      active: true,
      platform: Platform.OS,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await AsyncStorage.setItem(REGISTERED_TOKEN_KEY, token);
  return { success: true, token };
}

export async function deactivatePushToken(uid) {
  if (!uid || Platform.OS === "web") return;
  let token = await AsyncStorage.getItem(REGISTERED_TOKEN_KEY);
  if (!token) {
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== "granted") return;
    const projectId = await getExpoProjectId();
    ({ data: token } = await Notifications.getExpoPushTokenAsync({ projectId }));
  }
  if (!token) return;
  const tokenRef = doc(db, "pushTokens", token);
  const tokenDoc = await getDoc(tokenRef);
  if (tokenDoc.exists() && tokenDoc.data().ownerUid === uid) {
    await deleteDoc(tokenRef);
  }
  await AsyncStorage.removeItem(REGISTERED_TOKEN_KEY);
}

export async function setPushEnabled(uid, enabled) {
  if (!uid) throw new Error("Sign in before changing notification settings.");
  if (enabled) {
    const result = await syncPushToken(uid, { requestPermission: true });
    if (!result.success) return result;
  }

  const prefsRef = doc(db, "notification_preferences", uid);
  const prefs = await getDoc(prefsRef);
  if (prefs.exists()) {
    await updateDoc(prefsRef, {
      pushEnabled: enabled,
      version: 2,
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(prefsRef, {
      version: 2,
      pushEnabled: enabled,
      push: {},
      inApp: {},
      updatedAt: serverTimestamp(),
    });
  }
  if (!enabled) {
    try {
      await deactivatePushToken(uid);
    } catch (error) {
      console.warn("[Notifications] Push preference is off, but token cleanup failed:", error?.message);
      return { success: true, cleanupPending: true };
    }
  }
  return { success: true };
}

export async function updateNotificationCategoryPreference(uid, categoryId, enabled) {
  if (!uid || auth.currentUser?.uid !== uid) {
    throw new Error("Notification preferences are only available to the signed-in account.");
  }
  const ref = doc(db, "notification_preferences", uid);
  const snapshot = await getDoc(ref);
  const legacyPremium = categoryId === "premium" ? { premium: enabled } : {};
  if (snapshot.exists()) {
    await updateDoc(ref, {
      [`push.${categoryId}`]: enabled,
      [`inApp.${categoryId}`]: enabled,
      ...legacyPremium,
      version: 2,
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      version: 2,
      pushEnabled: false,
      push: { [categoryId]: enabled },
      inApp: { [categoryId]: enabled },
      ...legacyPremium,
      updatedAt: serverTimestamp(),
    });
  }
}
