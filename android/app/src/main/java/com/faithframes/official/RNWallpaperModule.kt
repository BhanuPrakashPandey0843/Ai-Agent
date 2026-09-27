package com.faithframes.official

import android.app.WallpaperManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileNotFoundException

/**
 * Applies a locally-downloaded image as the device wallpaper (home, lock, or
 * both) using the platform WallpaperManager API. Exposed to JS as
 * `NativeModules.RNWallpaperManager` (see src/native/WallpaperManager.js).
 */
class RNWallpaperModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "RNWallpaperManager"

  /**
   * Decodes the image at [path] into a Bitmap, downsampling large images so
   * we never run out of memory on high-resolution wallpapers. Accepts either
   * a bare filesystem path or a file:// URI.
   */
  private fun decodeSampledBitmap(path: String): Bitmap {
    val cleanPath = if (path.startsWith("file://")) path.removePrefix("file://") else path
    val file = File(cleanPath)
    if (!file.exists() || file.length() <= 0L) {
      throw FileNotFoundException("Wallpaper file not found: $cleanPath")
    }

    val metrics = reactApplicationContext.resources.displayMetrics
    // Cap the decoded bitmap at ~2x the screen's largest dimension — plenty
    // sharp for a wallpaper, while keeping memory use bounded.
    val maxDim = maxOf(metrics.widthPixels, metrics.heightPixels) * 2

    val boundsOptions = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(cleanPath, boundsOptions)
    if (boundsOptions.outWidth <= 0 || boundsOptions.outHeight <= 0) {
      throw IllegalStateException("Could not read image dimensions for $cleanPath")
    }

    var sampleSize = 1
    while (
      (boundsOptions.outWidth / (sampleSize * 2)) >= maxDim ||
      (boundsOptions.outHeight / (sampleSize * 2)) >= maxDim
    ) {
      sampleSize *= 2
    }

    val decodeOptions = BitmapFactory.Options().apply { inSampleSize = sampleSize }
    return BitmapFactory.decodeFile(cleanPath, decodeOptions)
      ?: throw IllegalStateException("Failed to decode wallpaper image at $cleanPath")
  }

  private fun flagsForTarget(target: String?): Int {
    return when (target) {
      "home" -> WallpaperManager.FLAG_SYSTEM
      "lock" -> WallpaperManager.FLAG_LOCK
      else -> WallpaperManager.FLAG_SYSTEM or WallpaperManager.FLAG_LOCK
    }
  }

  /**
   * @param path local file:// path (or bare path) to an already-downloaded image
   * @param target "home" | "lock" | "both" (anything else falls back to both)
   */
  @ReactMethod
  fun setWallpaper(path: String, target: String?, promise: Promise) {
    var bitmap: Bitmap? = null
    try {
      val wallpaperManager = WallpaperManager.getInstance(reactApplicationContext)
      if (!wallpaperManager.isWallpaperSupported) {
        promise.reject("WALLPAPER_NOT_SUPPORTED", "This device does not support wallpapers.")
        return
      }

      bitmap = decodeSampledBitmap(path)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        wallpaperManager.setBitmap(bitmap, null, true, flagsForTarget(target))
      } else {
        // Pre-Nougat devices only have a single system wallpaper slot; there
        // is no separate lock-screen wallpaper API to target.
        wallpaperManager.setBitmap(bitmap)
      }
      promise.resolve(true)
    } catch (e: FileNotFoundException) {
      promise.reject("FILE_NOT_FOUND", e.message, e)
    } catch (e: OutOfMemoryError) {
      promise.reject("OUT_OF_MEMORY", "Not enough memory to set this wallpaper.", RuntimeException(e))
    } catch (e: Exception) {
      promise.reject("SET_WALLPAPER_FAILED", e.message ?: "Failed to set wallpaper", e)
    } finally {
      bitmap?.let { if (!it.isRecycled) it.recycle() }
    }
  }

  /** Whether this device/OS version supports a distinct lock-screen wallpaper. */
  @ReactMethod
  fun isLockScreenSupported(promise: Promise) {
    try {
      val supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N &&
        WallpaperManager.getInstance(reactApplicationContext).isWallpaperSupported
      promise.resolve(supported)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }
}
