// src/native/WallpaperManager.js
// Thin wrapper around the custom native module (android/.../RNWallpaperModule.kt)
// that actually applies an image as the device wallpaper.
import { NativeModules, Platform } from 'react-native';

const { RNWallpaperManager } = NativeModules;

/** True only on Android, when the native module has been compiled into the app. */
export const isNativeWallpaperAvailable = () =>
  Platform.OS === 'android' && !!RNWallpaperManager;

/**
 * Applies a local image file as the wallpaper.
 * @param {string} localFilePath file:// path to an already-downloaded image
 * @param {'home'|'lock'|'both'} target which screen(s) to apply it to
 */
export async function setNativeWallpaper(localFilePath, target = 'both') {
  if (Platform.OS !== 'android') {
    throw new Error('IOS_UNSUPPORTED');
  }
  if (!RNWallpaperManager) {
    throw new Error('NATIVE_MODULE_MISSING');
  }
  return RNWallpaperManager.setWallpaper(localFilePath, target);
}

export async function isLockScreenSupported() {
  if (!isNativeWallpaperAvailable()) return false;
  try {
    return await RNWallpaperManager.isLockScreenSupported();
  } catch {
    return false;
  }
}
