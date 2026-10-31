// src/utils/mediaPermissions.js
//
// The ONE place this app is allowed to ask for a media permission.
//
// Why this exists: Google Play's "Photo and Video Permissions" policy rejects apps
// that request READ_MEDIA_IMAGES / READ_MEDIA_VIDEO when a system picker (or no
// access at all) would do. Faith Frames only ever *writes* one wallpaper at a time
// into the gallery, which never needs read access to the user's library.
//
//  - Android 13+ (API 33+): saving through expo-media-library inserts the file into
//    MediaStore as an item owned by this app, which needs NO permission. So we ask
//    for nothing. (READ_MEDIA_* are removed from the manifest on purpose, so a
//    request here could never succeed anyway.)
//  - Android 12 and below: saving still needs the legacy storage permission, so the
//    OS prompt is kept exactly as it was. READ/WRITE_EXTERNAL_STORAGE are declared
//    with maxSdkVersion 32, so they do not exist on Android 13+.
//  - iOS: unchanged (the Photos prompt described by NSPhotoLibrary*UsageDescription).
//
// scripts/check-android-permissions.js fails the build if MediaLibrary permission
// calls (or any library-read API) appear anywhere else in src/.
import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

const ANDROID_13_API_LEVEL = 33;

/** False on Android 13+, where saving to the gallery needs no permission. */
export function isGallerySavePermissionRequired() {
  return !(Platform.OS === 'android' && Number(Platform.Version) >= ANDROID_13_API_LEVEL);
}

/**
 * Detailed permission state for saving to the gallery.
 *   required     - the OS asks for a permission at all on this device
 *   granted      - saving is allowed right now
 *   canAskAgain  - the system dialog can still be shown (false = permanently denied,
 *                  the only way forward is the app's Settings page)
 *   supported    - false where expo-media-library does not exist (web)
 */
export async function getGallerySavePermissionState() {
  if (Platform.OS === 'web') {
    return { supported: false, required: false, granted: false, canAskAgain: false };
  }
  if (!isGallerySavePermissionRequired()) {
    return { supported: true, required: false, granted: true, canAskAgain: true };
  }
  const current = await MediaLibrary.getPermissionsAsync(true);
  return {
    supported: true,
    required: true,
    granted: current.granted === true,
    canAskAgain: current.canAskAgain !== false,
  };
}

/**
 * Shows the system permission dialog if (and only if) it is needed and can still
 * be shown. Never re-prompts when the permission is already granted, and never
 * tries to prompt when it was permanently denied.
 */
export async function requestGallerySavePermission() {
  const state = await getGallerySavePermissionState();
  if (!state.supported || !state.required || state.granted || !state.canAskAgain) {
    return state;
  }
  const result = await MediaLibrary.requestPermissionsAsync(true);
  return {
    supported: true,
    required: true,
    granted: result.granted === true,
    canAskAgain: result.canAskAgain !== false,
  };
}

/**
 * Resolves true when the app may save an image to the user's gallery.
 * Only prompts where the OS actually requires it (see the note at the top).
 * Kept for existing callers; new code should use requestGallerySavePermission()
 * so it can tell "denied" apart from "permanently denied".
 */
export async function ensureGallerySavePermission() {
  const state = await requestGallerySavePermission();
  return state.granted;
}
