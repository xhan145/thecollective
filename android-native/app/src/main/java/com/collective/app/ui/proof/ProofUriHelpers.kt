package com.collective.app.ui.proof

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns

fun getDisplayNameForUri(context: Context, uri: Uri): String? =
    try {
        context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
            val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (index >= 0 && cursor.moveToFirst()) cursor.getString(index) else null
        }
    } catch (_: Exception) {
        null
    }

fun getMimeTypeForUri(context: Context, uri: Uri): String? =
    try {
        context.contentResolver.getType(uri)
    } catch (_: Exception) {
        null
    }
