import { Linking } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

async function openHttpsUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    await Linking.openURL(url.href);
    return true;
  } catch {
    return false;
  }
}

export async function openNotificationDestination(navigation, notification) {
  const destination = notification?.deepLink;
  const type = destination?.type || "none";

  if (type === "url" && await openHttpsUrl(destination.url)) return true;
  if (type === "wallpaper" && typeof destination.id === "string") {
    const snapshot = await getDoc(doc(db, "religiousWallpapers", destination.id));
    if (snapshot.exists()) {
      navigation.navigate("WallpaperDetail", {
        wallpaper: { id: snapshot.id, ...snapshot.data() },
      });
      return true;
    }
    navigation.navigate("Wallpapers");
    return false;
  }
  if (type === "content" && typeof destination.id === "string") {
    navigation.navigate("ContentDetail", {
      kind: destination.kind,
      contentId: destination.id,
    });
    return true;
  }

  const routes = {
    home: () => navigation.navigate("Tabs", { screen: "Home" }),
    notifications: () => navigation.navigate("Notifications"),
    dailyVerse: () => navigation.navigate("DailyVerse"),
    dailyPrayer: () => navigation.navigate("DailyPrayer"),
    bible: () => navigation.navigate("Tabs", { screen: "Bible" }),
    library: () => navigation.navigate("Tabs", { screen: "Library" }),
    quiz: () => navigation.navigate("Tabs", { screen: "Quiz" }),
    leaderboard: () => navigation.navigate("Tabs", { screen: "Quiz", params: { screen: "Leaderboard" } }),
    meetings: () => navigation.navigate("MeetShare"),
    premium: () => navigation.navigate("Paywall"),
    none: () => navigation.navigate("Notifications"),
  };
  const route = routes[type];
  if (!route) {
    navigation.navigate("Notifications");
    return false;
  }
  route();
  return true;
}

export function openNotificationAction(notification) {
  return openHttpsUrl(notification?.action?.url);
}
