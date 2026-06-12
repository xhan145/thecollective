package com.collective.app.ui.proof

enum class ProofMediaType {
    Text,
    Image,
    Video,
    Audio,
}

enum class ProofStatus {
    Draft,
    Submitted,
    FeedbackReady,
    UsedForPractice,
}

data class ProofItem(
    val id: String,
    val title: String,
    val body: String,
    val mediaUri: String?,
    val mediaType: ProofMediaType,
    val mediaDisplayName: String?,
    val mediaMimeType: String?,
    val createdAtMillis: Long,
    val feedbackCount: Int,
    val status: ProofStatus,
)

data class ProofDraftState(
    val selectedType: ProofMediaType = ProofMediaType.Text,
    val body: String = "",
    val mediaUri: String? = null,
    val mediaDisplayName: String? = null,
    val mediaMimeType: String? = null,
    val isSubmitting: Boolean = false,
    val isSubmitted: Boolean = false,
    val errorMessage: String? = null,
)

fun inferProofMediaTypeFromMimeType(mimeType: String?): ProofMediaType =
    when {
        mimeType?.startsWith("image/") == true -> ProofMediaType.Image
        mimeType?.startsWith("video/") == true -> ProofMediaType.Video
        mimeType?.startsWith("audio/") == true -> ProofMediaType.Audio
        else -> ProofMediaType.Text
    }

fun proofTypeLabel(type: ProofMediaType): String =
    when (type) {
        ProofMediaType.Text -> "Text reflection"
        ProofMediaType.Image -> "Image proof"
        ProofMediaType.Video -> "Video proof"
        ProofMediaType.Audio -> "Audio proof"
    }

fun proofStatusLabel(status: ProofStatus): String =
    when (status) {
        ProofStatus.Draft -> "Draft"
        ProofStatus.Submitted -> "Submitted"
        ProofStatus.FeedbackReady -> "Feedback ready"
        ProofStatus.UsedForPractice -> "Used for practice"
    }

fun generateProofTitle(body: String, type: ProofMediaType): String {
    val compact = body.trim().replace(Regex("\\s+"), " ")
    if (compact.isBlank()) return proofTypeLabel(type)
    return if (compact.length > 60) {
        "${compact.take(60).trimEnd()}..."
    } else {
        compact
    }
}

fun relativeProofTime(createdAtMillis: Long, nowMillis: Long = System.currentTimeMillis()): String {
    val ageMillis = (nowMillis - createdAtMillis).coerceAtLeast(0L)
    val minuteMillis = 60_000L
    val hourMillis = 60 * minuteMillis
    val dayMillis = 24 * hourMillis
    return when {
        ageMillis < minuteMillis -> "Just now"
        ageMillis < dayMillis -> "${(ageMillis / hourMillis).coerceAtLeast(1L)}h ago"
        else -> "${(ageMillis / dayMillis).coerceAtLeast(1L)}d ago"
    }
}

fun fallbackDisplayName(type: ProofMediaType): String =
    when (type) {
        ProofMediaType.Text -> "Text reflection"
        ProofMediaType.Image -> "Attached image"
        ProofMediaType.Video -> "Attached video"
        ProofMediaType.Audio -> "Attached audio"
    }
