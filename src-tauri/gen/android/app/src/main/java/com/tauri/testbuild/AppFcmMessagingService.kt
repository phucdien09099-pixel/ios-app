package com.tauri.testbuild

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class AppFcmMessagingService : FirebaseMessagingService() {
  companion object {
    private const val CHANNEL_ID = "fcm_default"
    private const val TOKEN_PREFS = "fcm_plugin"
    private const val TOKEN_KEY = "fcm_token"
  }

  override fun onNewToken(token: String) {
    // Keep the same buffer used by tauri-plugin-fcm so getToken() can recover it.
    getSharedPreferences(TOKEN_PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(TOKEN_KEY, token)
      .apply()
  }

  override fun onMessageReceived(message: RemoteMessage) {
    val title = message.notification?.title
      ?: message.data["title"]
      ?: getString(R.string.app_name)
    val body = message.notification?.body ?: message.data["body"]

    createNotificationChannel()

    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
      flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
      message.data.forEach { (key, value) -> putExtra(key, value) }
    }
    val pendingIntent = launchIntent?.let {
      PendingIntent.getActivity(
        this,
        0,
        it,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }

    val notification = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(applicationInfo.icon)
      .setContentTitle(title)
      .setContentText(body)
      .setStyle(body?.let { NotificationCompat.BigTextStyle().bigText(it) })
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setAutoCancel(true)
      .setContentIntent(pendingIntent)
      .build()

    NotificationManagerCompat.from(this)
      .notify((System.currentTimeMillis() and 0x7fffffff).toInt(), notification)
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val channel = NotificationChannel(
      CHANNEL_ID,
      "Thông báo",
      NotificationManager.IMPORTANCE_HIGH,
    )
    getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
  }
}
