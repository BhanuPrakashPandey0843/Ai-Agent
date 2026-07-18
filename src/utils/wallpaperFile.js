// src/utils/wallpaperFile.js
// Shared helpers for downloading + caching a wallpaper image locally so that
// Download and Set Wallpaper never fetch the same remote file twice.
import * as FileSystem from 'expo-file-system';

const CACHE_DIR = `${FileSystem.cacheDirectory}wallpapers/`;

async function ensureCacheDir() {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

export function getCachedFilePath(id) {
  return `${CACHE_DIR}wallpaper_${id}.jpg`;
}

/**
 * Returns a local file:// path for the wallpaper, downloading it only if it
 * isn't already cached on disk. Reports 0-1 progress via onProgress while a
 * real download is in flight.
 */
export async function getOrDownloadWallpaper(remoteUri, id, onProgress) {
  await ensureCacheDir();
  const localPath = getCachedFilePath(id);

  const existing = await FileSystem.getInfoAsync(localPath);
  if (existing.exists && existing.size > 0) {
    onProgress?.(1);
    return localPath;
  }

  const downloadResumable = FileSystem.createDownloadResumable(
    remoteUri,
    localPath,
    {},
    (progressEvent) => {
      if (!progressEvent.totalBytesExpectedToWrite) return;
      onProgress?.(progressEvent.totalBytesWritten / progressEvent.totalBytesExpectedToWrite);
    }
  );

  let result;
  try {
    result = await downloadResumable.downloadAsync();
  } catch (e) {
    throw new Error('DOWNLOAD_FAILED');
  }

  if (!result?.uri) {
    throw new Error('DOWNLOAD_FAILED');
  }
  return result.uri;
}

/** Maps low-level errors into short, user-friendly copy for the toast/snackbar. */
export function mapErrorToMessage(err) {
  const code = err?.message || '';

  if (code === 'IOS_UNSUPPORTED') {
    return "Apple doesn't allow apps to set the wallpaper automatically.";
  }
  if (code === 'NATIVE_MODULE_MISSING') {
    return 'This build is missing the wallpaper module. Rebuild the app to enable this.';
  }
  if (code === 'DOWNLOAD_FAILED') {
    return "Couldn't download the image. Check your connection and try again.";
  }
  if (/network|internet|offline/i.test(code)) {
    return "You're offline. Connect to the internet and try again.";
  }
  if (/permission/i.test(code)) {
    return 'Permission was denied, so this action was cancelled.';
  }
  return 'Something went wrong. Please try again.';
}
