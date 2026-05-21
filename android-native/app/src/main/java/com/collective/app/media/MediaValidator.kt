package com.collective.app.media

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import com.collective.app.data.MediaType

data class SelectedMedia(
    val uri: Uri,
    val mediaType: MediaType,
    val displayName: String,
    val sizeBytes: Long,
    val mimeType: String
)

sealed interface MediaValidationResult {
    data class Valid(val media: SelectedMedia) : MediaValidationResult
    data class Invalid(val message: String) : MediaValidationResult
}

object MediaValidator {
    private const val maxImageBytes = 10L * 1024L * 1024L
    private const val maxVideoBytes = 100L * 1024L * 1024L

    private val imageTypes = setOf("image/jpeg", "image/jpg", "image/png", "image/webp")
    private val videoTypes = setOf("video/mp4", "video/quicktime", "video/webm")

    fun inspect(context: Context, uri: Uri): MediaValidationResult {
        val resolver = context.contentResolver
        val mimeType = resolver.getType(uri) ?: return MediaValidationResult.Invalid(
            "That file type is not supported yet."
        )
        val mediaType = when {
            mimeType in imageTypes -> MediaType.IMAGE
            mimeType in videoTypes -> MediaType.VIDEO
            else -> return MediaValidationResult.Invalid("That file type is not supported yet.")
        }
        val displayName = queryDisplayName(context, uri) ?: "Selected proof media"
        val sizeBytes = querySize(context, uri)

        if (sizeBytes > 0) {
            if (mediaType == MediaType.IMAGE && sizeBytes > maxImageBytes) {
                return MediaValidationResult.Invalid("This image is too large for the prototype.")
            }
            if (mediaType == MediaType.VIDEO && sizeBytes > maxVideoBytes) {
                return MediaValidationResult.Invalid("This video is too large for the prototype.")
            }
        }

        return MediaValidationResult.Valid(
            SelectedMedia(
                uri = uri,
                mediaType = mediaType,
                displayName = displayName,
                sizeBytes = sizeBytes,
                mimeType = mimeType
            )
        )
    }

    fun formatFileSize(bytes: Long): String {
        if (bytes <= 0) return "Size unavailable"
        val mb = bytes.toDouble() / (1024.0 * 1024.0)
        return if (mb >= 1) "%.1f MB".format(mb) else "${bytes / 1024L} KB"
    }

    private fun queryDisplayName(context: Context, uri: Uri): String? {
        return context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (cursor.moveToFirst() && index >= 0) cursor.getString(index) else null
        }
    }

    private fun querySize(context: Context, uri: Uri): Long {
        return context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val index = cursor.getColumnIndex(OpenableColumns.SIZE)
            if (cursor.moveToFirst() && index >= 0) cursor.getLong(index) else -1L
        } ?: -1L
    }
}
