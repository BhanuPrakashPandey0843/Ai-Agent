export const NOTIFICATION_CHANNELS = {
  default: "default",
  announcements: "announcements",
  content: "content",
  meetings: "meetings",
  reminders: "reminders",
  personal: "personal",
};

export const NOTIFICATION_CATEGORIES = [
  { id: "announcement", label: "Announcements", icon: "megaphone-outline", channel: "announcements", defaultPush: true, defaultInApp: true },
  { id: "content", label: "New content", icon: "sparkles-outline", channel: "content", defaultPush: true, defaultInApp: true },
  { id: "scripture", label: "Daily scripture", icon: "book-outline", channel: "reminders", defaultPush: true, defaultInApp: true },
  { id: "quiz", label: "Quizzes & events", icon: "bulb-outline", channel: "default", defaultPush: true, defaultInApp: true },
  { id: "meeting", label: "Meetings & reminders", icon: "videocam-outline", channel: "meetings", defaultPush: true, defaultInApp: true },
  { id: "engagement", label: "Encouragement", icon: "heart-outline", channel: "reminders", defaultPush: false, defaultInApp: true },
  { id: "premium", label: "Premium & offers", icon: "diamond-outline", channel: "default", defaultPush: true, defaultInApp: true },
  { id: "personal", label: "Personal messages", icon: "mail-outline", channel: "personal", defaultPush: true, defaultInApp: true, required: true },
  { id: "account", label: "Account & billing", icon: "shield-checkmark-outline", channel: "personal", defaultPush: true, defaultInApp: true, required: true },
];

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  version: 2,
  pushEnabled: false,
  push: Object.fromEntries(NOTIFICATION_CATEGORIES.map((category) => [category.id, category.defaultPush])),
  inApp: Object.fromEntries(NOTIFICATION_CATEGORIES.map((category) => [category.id, category.defaultInApp])),
};

export function getNotificationCategory(categoryId) {
  return NOTIFICATION_CATEGORIES.find((category) => category.id === categoryId) || null;
}
