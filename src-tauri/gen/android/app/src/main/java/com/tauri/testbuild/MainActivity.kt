package com.tauri.testbuild

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : TauriActivity() {
  companion object {
    private const val APP_PERMISSION_REQUEST_CODE = 100
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    requestStartupPermissions()
  }

  private fun requestStartupPermissions() {
    val permissions = mutableListOf(Manifest.permission.CAMERA)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      permissions += Manifest.permission.BLUETOOTH_SCAN
      permissions += Manifest.permission.BLUETOOTH_CONNECT
      permissions += Manifest.permission.BLUETOOTH_ADVERTISE
    } else {
      permissions += Manifest.permission.BLUETOOTH
      permissions += Manifest.permission.BLUETOOTH_ADMIN
      permissions += Manifest.permission.ACCESS_FINE_LOCATION
    }

    val missingPermissions = permissions
      .filter { ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED }
      .toTypedArray()

    if (missingPermissions.isNotEmpty()) {
      ActivityCompat.requestPermissions(
        this,
        missingPermissions,
        APP_PERMISSION_REQUEST_CODE
      )
    }
  }
}
