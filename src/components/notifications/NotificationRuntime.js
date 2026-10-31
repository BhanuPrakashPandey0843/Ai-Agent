import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
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
import { deactivatePushToken, syncPushToken } from "../../services/notificationService";
import { openNotificationAction, openNotificationDestination } from "../../utils/notificationLinks";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function NotificationRuntime() {
  const navigation = useNavigation();
  const { user, loading } = useAuth();
  const uidRef = useRef(null);
  const tokenLifecycleRef = useRef(Promise.resolve());
  const pendingResponseRef = useRef(null);
  const responseInProgressRef = useRef(false);

  const handleResponse = useCallback(async (response) => {
    const data = response?.notification?.request?.content?.data;
    if (
      !data ||
      data.v !== 1 ||
      typeof data.nid !== "string" ||
      typeof data.uid !== "string"
    ) return;

    pendingResponseRef.current = data;
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return undefined;
    let active = true;
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (active && response) handleResponse(response);
      })
      .catch((error) => console.warn("[Notifications] Could not read launch response:", error?.message));
    const tokenSubscription = Notifications.addPushTokenListener(() => {
      const uid = uidRef.current;
      if (uid) {
        syncPushToken(uid).catch((error) => {
          console.warn("[Notifications] Push token refresh failed:", error?.message);
        });
      }
    });
    return () => {
      active = false;
      responseSubscription.remove();
      tokenSubscription.remove();
    };
  }, [handleResponse]);

  useEffect(() => {
    if (loading) return undefined;
    const previousUid = uidRef.current;
    const nextUid = user?.uid || null;
    if (previousUid !== nextUid) uidRef.current = null;
    let active = true;
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
      const snapshot = await getDoc(doc(db, "notification_preferences", nextUid));
      if (active && snapshot.data()?.pushEnabled === true) {
        await syncPushToken(nextUid).catch((error) => {
          console.warn("[Notifications] Push token registration failed:", error?.message);
        });
      }
    }).catch((error) => {
      console.warn("[Notifications] Could not synchronize the push-token lifecycle:", error?.message);
    });
    tokenLifecycleRef.current = lifecycle;
    return () => {
      active = false;
    };
  }, [loading, user?.uid]);

  useEffect(() => {
    if (loading || !user || responseInProgressRef.current) return undefined;
    const data = pendingResponseRef.current;
    if (!data) return undefined;
    if (data.uid !== user.uid) {
      pendingResponseRef.current = null;
      return undefined;
    }

    responseInProgressRef.current = true;
    pendingResponseRef.current = null;
    const open = async () => {
      try {
        const notificationRef = doc(db, "users", user.uid, "notifications", data.nid);
        const snapshot = await getDoc(notificationRef);
        if (!snapshot.exists()) {
          navigation.navigate("Notifications");
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
          await openNotificationDestination(navigation, notification);
        }
      } catch (error) {
        console.warn("[Notifications] Could not open notification:", error?.message);
        navigation.navigate("Notifications");
      } finally {
        responseInProgressRef.current = false;
        Notifications.clearLastNotificationResponseAsync().catch(() => {});
      }
    };
    open();
    return undefined;
  }, [loading, navigation, user]);

  return null;
}
