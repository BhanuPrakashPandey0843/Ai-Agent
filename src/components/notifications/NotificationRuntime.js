import { useCallback, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../config/firebase";
import {
  createNotificationChannels,
  deactivatePushToken,
  offerPushOptIn,
  refreshPushRegistration,
} from "../../services/notificationService";
import { openNotificationAction, openNotificationDestination } from "../../utils/notificationLinks";

// Show notifications that arrive while the app is open (banner + notification list + sound).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Give the home screen a moment before asking about notifications.
const INVITE_DELAY_MS = 3000;

export default function NotificationRuntime() {
  const navigation = useNavigation();
  const { user, loading } = useAuth();
  const uidRef = useRef(null);
  const tokenLifecycleRef = useRef(Promise.resolve());
  const pendingResponseRef = useRef(null);
  const responseInProgressRef = useRef(false);
  const readyUserRef = useRef(null);
  const navigationRef = useRef(navigation);
  navigationRef.current = navigation;

  // Opens the destination of a tapped notification. It runs as soon as BOTH the tap and a signed-in
  // user are known, whichever happens last: a tap while the app is running (foreground/background),
  // a tap that cold-started the app before sign-in finished, and a second tap during processing.
  const openPendingResponse = useCallback(async function openPending() {
    const currentUser = readyUserRef.current;
    const data = pendingResponseRef.current;
    if (!data || !currentUser || responseInProgressRef.current) return;
    if (data.uid !== currentUser.uid) {
      // Tapped a notification meant for another account: never show it to this one.
      pendingResponseRef.current = null;
      return;
    }

    responseInProgressRef.current = true;
    pendingResponseRef.current = null;
    const nav = navigationRef.current;
    try {
      const notificationRef = doc(db, "users", currentUser.uid, "notifications", data.nid);
      const snapshot = await getDoc(notificationRef);
      if (!snapshot.exists()) {
        nav.navigate("Notifications");
        return;
      }
      const notification = snapshot.data();
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp(),
        opened: true,
        openedAt: serverTimestamp(),
      });
      if (notification.deepLink?.type === "none" && notification.action?.url) {
        await openNotificationAction(notification);
      } else {
        await openNotificationDestination(nav, notification);
      }
    } catch (error) {
      console.warn("[Notifications] Could not open notification:", error?.message);
      try {
        nav.navigate("Notifications");
      } catch {
        // navigator not ready; the inbox is still reachable from the app
      }
    } finally {
      responseInProgressRef.current = false;
      Notifications.clearLastNotificationResponseAsync().catch(() => {});
      if (pendingResponseRef.current) openPending();
    }
  }, []);

  const handleResponse = useCallback((response) => {
    const data = response?.notification?.request?.content?.data;
    if (
      !data ||
      data.v !== 1 ||
      typeof data.nid !== "string" ||
      typeof data.uid !== "string"
    ) return;

    pendingResponseRef.current = data;
    openPendingResponse();
  }, [openPendingResponse]);

  // Listeners that live as long as the app does.
  useEffect(() => {
    if (Platform.OS === "web") return undefined;
    let active = true;
    // Channels must exist for notifications to display on Android 8+, even before registration.
    createNotificationChannels().catch((error) => {
      console.warn("[Notifications] Could not create Android channels:", error?.message);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    // The tap that launched the app from a closed state.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (active && response) handleResponse(response);
      })
      .catch((error) => console.warn("[Notifications] Could not read launch response:", error?.message));

    // The push token rotated: register the new one.
    const tokenSubscription = Notifications.addPushTokenListener(() => {
      const uid = uidRef.current;
      if (uid) {
        refreshPushRegistration(uid).catch((error) => {
          console.warn("[Notifications] Push token refresh failed:", error?.message);
        });
      }
    });

    // Coming back to the app is the moment to notice permission changes made in OS settings and to
    // open a notification that was tapped while the app was suspended.
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      const uid = uidRef.current;
      if (uid) {
        refreshPushRegistration(uid).catch((error) => {
          console.warn("[Notifications] Push registration refresh failed:", error?.message);
        });
      }
      openPendingResponse();
    });

    return () => {
      active = false;
      responseSubscription.remove();
      tokenSubscription.remove();
      appStateSubscription.remove();
    };
  }, [handleResponse, openPendingResponse]);

  // Sign-in / sign-out lifecycle for the push token.
  useEffect(() => {
    if (loading) return undefined;
    const previousUid = uidRef.current;
    const nextUid = user?.uid || null;
    if (previousUid !== nextUid) uidRef.current = null;
    let active = true;
    let inviteTimer = null;
    const lifecycle = tokenLifecycleRef.current.then(async () => {
      if (previousUid && previousUid !== nextUid) {
        try {
          await deactivatePushToken(previousUid);
        } catch (error) {
          console.warn("[Notifications] Could not deactivate the previous account token:", error?.message);
        }
      }
      if (!active || !nextUid) return;
      uidRef.current = nextUid;

      const result = await refreshPushRegistration(nextUid).catch((error) => {
        console.warn("[Notifications] Push token registration failed:", error?.message);
        return null;
      });
      if (!active || result?.reason !== "not-opted-in" || result.decided) return;

      // This account has never been asked about push alerts: invite them once, politely.
      inviteTimer = setTimeout(() => {
        if (uidRef.current !== nextUid || AppState.currentState !== "active") return;
        offerPushOptIn(nextUid).catch((error) => {
          console.warn("[Notifications] Could not offer push alerts:", error?.message);
        });
      }, INVITE_DELAY_MS);
    }).catch((error) => {
      console.warn("[Notifications] Could not synchronize the push-token lifecycle:", error?.message);
    });
    tokenLifecycleRef.current = lifecycle;
    return () => {
      active = false;
      if (inviteTimer) clearTimeout(inviteTimer);
    };
  }, [loading, user?.uid]);

  // Remember who is signed in, and open a notification that was tapped before sign-in finished.
  useEffect(() => {
    readyUserRef.current = loading ? null : user || null;
    if (!loading && user) openPendingResponse();
  }, [loading, user, openPendingResponse]);

  return null;
}
