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

/**
 * RNWallpaperModule
 *
 * Bridges the Android WallpaperManager APIs to JavaScript so the app can
 * actually apply a downloaded image as the Home Screen and/or Lock Screen
 * wallpaper, instead of only saving it to the gallery.
 *
 * Requires the file to already exist locally (e.g. downloaded via
 * expo-file-system) — this module never touches the network itself.
 */
class RNWallpaperModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "RNWallpaperManager"

  /**
   * Applies the image at [filePath] as the device wallpaper.
   * [target] must be one of: "home", "lock", "both".
   */
  @ReactMethod
  fun setWallpaper(filePath: String, target: String, promise: Promise) {
    try {
      val cleanPath = filePath.removePrefix("file://")
      val file = File(cleanPath)

      if (!file.exists()) {
        promise.reject("FILE_NOT_FOUND", "Wallpaper file not found at: $cleanPath")
        return
      }

      // Decode at a size that comfortably covers any device screen without
      // risking an OOM on very large source images.
      val bitmap = decodeSampledBitmap(file, 2048, 2048)
      if (bitmap == null) {
        promise.reject("DECODE_ERROR", "Could not decode the image file.")
        return
      }

      val wallpaperManager = WallpaperManager.getInstance(reactApplicationContext)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        val flag = when (target) {
          "home" -> WallpaperManager.FLAG_SYSTEM
          "lock" -> WallpaperManager.FLAG_LOCK
          else -> WallpaperManager.FLAG_SYSTEM or WallpaperManager.FLAG_LOCK
        }
        wallpaperManager.setBitmap(bitmap, null, true, flag)
      } else {
        // Lock screen wallpaper API was introduced in API 24 (Android N).
        // Older devices can only receive the home screen wallpaper.
        wallpaperManager.setBitmap(bitmap)
      }

      if (!bitmap.isRecycled) bitmap.recycle()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("SET_WALLPAPER_ERROR", e.message ?: "Failed to set wallpaper", e)
    }
  }

  /** Lets JS know whether this device/OS version supports a separate lock-screen wallpaper. */
  @ReactMethod
  fun isLockScreenSupported(promise: Promise) {
    promise.resolve(Build.VERSION.SDK_INT >= Build.VERSION_CODES.N)
  }

  private fun decodeSampledBitmap(file: File, reqWidth: Int, reqHeight: Int): Bitmap? {
    val boundsOptions = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(file.absolutePath, boundsOptions)

    var sampleSize = 1
    val (height, width) = boundsOptions.outHeight to boundsOptions.outWidth
    if (height > reqHeight || width > reqWidth) {
      val halfHeight = height / 2
      val halfWidth = width / 2
      while ((halfHeight / sampleSize) >= reqHeight && (halfWidth / sampleSize) >= reqWidth) {
        sampleSize *= 2
      }
    }

    val decodeOptions = BitmapFactory.Options().apply { inSampleSize = sampleSize }
    return BitmapFactory.decodeFile(file.absolutePath, decodeOptions)
  }
}
