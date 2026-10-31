// src/utils/wallpaperFile.js
// Shared helpers for downloading + caching a wallpaper image locally so that
// Download and Set Wallpaper never fetch the same remote file twice.
import * as FileSystem from 'expo-file-system/legacy';

const CACHE_DIR = FileSystem.cacheDirectory
  ? `${FileSystem.cacheDirectory}wallpapers/`
  : null;
const SUPPORTED_IMAGE_EXTENSIONS = new Set(['jpg', 'png', 'webp']);

export function resolveWallpaperUri(source = '') {
  if (!source || typeof source === 'string') {
    const value = typeof source === 'string' ? source.trim() : '';
    if (value) return value;
  }

  if (source && typeof source === 'object') {
    const candidates = [
      source.uri,
      source.image,
      source.imageUrl,
      source.imageURL,
      source.bgurl,
      source.url,
      source.downloadURL,
      source.downloadUrl,
      source.coverImage,
      source.coverimage,
      source.thumbnail,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const value = candidate.trim();
        if (value) return value;
      }
    }
  }

  return '';
}

function validateRemoteUri(remoteUri) {
  if (typeof remoteUri !== 'string' || !remoteUri.trim()) {
    throw new Error('MISSING_IMAGE_URL');
  }

  let parsed;
  try {
    parsed = new URL(remoteUri.trim());
  } catch {
    throw new Error('INVALID_IMAGE_URL');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('INVALID_IMAGE_URL');
  }
  return parsed;
}

function safeCacheKey(id, remoteUri) {
  const safeId = String(id || 'wallpaper').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  let hash = 2166136261;
  for (let i = 0; i < remoteUri.length; i += 1) {
    hash = Math.imul(hash ^ remoteUri.charCodeAt(i), 16777619);
  }
  return `${safeId}_${(hash >>> 0).toString(16)}`;
}

function extensionForDownload(result, remotePath) {
  const contentTypeHeader = Object.entries(result.headers || {})
    .find(([name]) => name.toLowerCase() === 'content-type')?.[1];
  const mimeType = String(result.mimeType || contentTypeHeader || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  const mimeExtensions = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  if (mimeType in mimeExtensions) {
    return mimeExtensions[mimeType];
  }
  if (mimeType && mimeType !== 'application/octet-stream' && mimeType !== 'binary/octet-stream') {
    throw new Error('UNSUPPORTED_IMAGE_FORMAT');
  }

  const pathExtension = remotePath.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (pathExtension === 'jpeg') return 'jpg';
  if (SUPPORTED_IMAGE_EXTENSIONS.has(pathExtension)) return pathExtension;
  throw new Error('UNSUPPORTED_IMAGE_FORMAT');
}

async function ensureCacheDir() {
  if (!CACHE_DIR) {
    throw new Error('CACHE_UNAVAILABLE');
  }
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

export function getCachedFilePath(id, extension = 'jpg') {
  if (!CACHE_DIR) {
    throw new Error('CACHE_UNAVAILABLE');
  }
  const safeId = String(id || 'wallpaper').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  return `${CACHE_DIR}wallpaper_${safeId}.${extension}`;
}

/**
 * Returns a local file:// path for the wallpaper, downloading it only if it
 * isn't already cached on disk. Reports 0-1 progress via onProgress while a
 * real download is in flight.
 */
export async function getOrDownloadWallpaper(remoteUri, id, onProgress) {
  const parsedUri = validateRemoteUri(remoteUri);
  const cacheKey = safeCacheKey(id, parsedUri.toString());
  await ensureCacheDir();
  const cachePrefix = `wallpaper_${cacheKey}.`;
  const cachedNames = await FileSystem.readDirectoryAsync(CACHE_DIR);
  for (const name of cachedNames) {
    const extension = name.slice(cachePrefix.length);
    if (!name.startsWith(cachePrefix) || !SUPPORTED_IMAGE_EXTENSIONS.has(extension)) continue;
    const cachedPath = `${CACHE_DIR}${name}`;
    const info = await FileSystem.getInfoAsync(cachedPath);
    if (info.exists && info.size > 0) {
      onProgress?.(1);
      return cachedPath;
    }
  }

  const temporaryPath = `${CACHE_DIR}${cacheKey}_${Date.now()}_${Math.random().toString(36).slice(2)}.download`;
  const downloadResumable = FileSystem.createDownloadResumable(
    parsedUri.toString(),
    temporaryPath,
    {},
    (progressEvent) => {
      if (!progressEvent.totalBytesExpectedToWrite) return;
      onProgress?.(progressEvent.totalBytesWritten / progressEvent.totalBytesExpectedToWrite);
    }
  );

  try {
    const result = await downloadResumable.downloadAsync();
    if (!result?.uri || result.status < 200 || result.status >= 300) {
      throw new Error('DOWNLOAD_FAILED');
    }

    const extension = extensionForDownload(result, parsedUri.pathname);
    const downloadedFile = await FileSystem.getInfoAsync(result.uri);
    if (!downloadedFile.exists || downloadedFile.size <= 0) {
      throw new Error('DOWNLOAD_FAILED');
    }

    const localPath = `${CACHE_DIR}${cachePrefix}${extension}`;
    const existing = await FileSystem.getInfoAsync(localPath);
    if (existing.exists && existing.size > 0) {
      await FileSystem.deleteAsync(result.uri, { idempotent: true });
      onProgress?.(1);
      return localPath;
    }
    if (existing.exists) {
      await FileSystem.deleteAsync(localPath, { idempotent: true });
    }

    try {
      await FileSystem.moveAsync({ from: result.uri, to: localPath });
    } catch (moveError) {
      const completedDownload = await FileSystem.getInfoAsync(localPath);
      if (!completedDownload.exists || completedDownload.size <= 0) throw moveError;
      await FileSystem.deleteAsync(result.uri, { idempotent: true });
    }
    onProgress?.(1);
    return localPath;
  } catch (error) {
    const temporaryFile = await FileSystem.getInfoAsync(temporaryPath);
    if (temporaryFile.exists) {
      try {
        await FileSystem.deleteAsync(temporaryPath, { idempotent: true });
      } catch (cleanupError) {
        console.warn('Could not remove incomplete wallpaper download:', cleanupError);
      }
    }
    if (error?.message === 'UNSUPPORTED_IMAGE_FORMAT') throw error;
    if (error?.message === 'DOWNLOAD_FAILED') throw error;
    throw new Error('DOWNLOAD_FAILED');
  }
}

/** True when an error means the OS refused storage/gallery access (not a network or file problem). */
export function isPermissionError(err) {
  const code = String(err?.code || '');
  const message = String(err?.message || '');
  return (
    /PERMISSION/i.test(code) ||
    /\bpermissions?\b.*\b(denied|not granted|required)\b/i.test(message) ||
    /\b(missing|no)\b.*\bpermissions?\b/i.test(message)
  );
}

/**
 * Browser-only download (expo-media-library and the native wallpaper module do
 * not exist on web). Tries a real file download first; if the image host blocks
 * cross-origin fetches it falls back to opening the image so it can be saved.
 * Returns 'downloaded' or 'opened'.
 */
export async function downloadWallpaperOnWeb(remoteUri, id) {
  const parsedUri = validateRemoteUri(remoteUri);
  const fileName = `faithframes_${String(id || 'wallpaper').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60)}`;
  try {
    const response = await fetch(parsedUri.toString());
    if (!response.ok) throw new Error('DOWNLOAD_FAILED');
    const blob = await response.blob();
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[blob.type] || 'jpg';
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${fileName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    return 'downloaded';
  } catch {
    window.open(parsedUri.toString(), '_blank', 'noopener');
    return 'opened';
  }
}

/** Maps low-level errors into short, user-friendly copy for the toast/snackbar. */
export function mapErrorToMessage(err) {
  const code = err?.code || err?.message || '';

  if (code === 'WALLPAPER_NOT_ALLOWED') {
    return 'Changing the wallpaper is turned off on this device.';
  }
  if (code === 'MISSING_IMAGE_URL') {
    return 'This wallpaper does not have an image to save.';
  }
  if (code === 'INVALID_IMAGE_URL') {
    return 'This wallpaper has an invalid image link.';
  }
  if (code === 'UNSUPPORTED_IMAGE_FORMAT') {
    return 'This image format is not supported. Use a JPEG, PNG, or WebP wallpaper.';
  }
  if (code === 'CACHE_UNAVAILABLE') {
    return 'The app could not prepare local storage for this wallpaper.';
  }
  if (code === 'IOS_UNSUPPORTED') {
    return "Apple doesn't allow apps to set the wallpaper automatically.";
  }
  if (code === 'NATIVE_MODULE_MISSING') {
    return 'This build is missing the wallpaper module. Rebuild the app to enable this.';
  }
  if (code === 'DOWNLOAD_FAILED') {
    return "Couldn't download the image. Check your connection and try again.";
  }
  if (code === 'WALLPAPER_NOT_SUPPORTED') {
    return 'This device does not support setting a wallpaper.';
  }
  if (code === 'FILE_NOT_FOUND') {
    return 'The downloaded wallpaper could not be found. Please try again.';
  }
  if (code === 'INVALID_IMAGE_FORMAT') {
    return 'This image could not be decoded. Please choose a JPEG, PNG, or WebP wallpaper.';
  }
  if (code === 'OUT_OF_MEMORY') {
    return 'This image is too large for the device to set as a wallpaper.';
  }
  if (code === 'SET_WALLPAPER_FAILED') {
    return "Couldn't set the wallpaper. Please try again.";
  }
  if (/network|internet|offline/i.test(code)) {
    return "You're offline. Connect to the internet and try again.";
  }
  if (/permission/i.test(code)) {
    return 'Permission was denied, so this action was cancelled.';
  }
  return 'Something went wrong. Please try again.';
}
