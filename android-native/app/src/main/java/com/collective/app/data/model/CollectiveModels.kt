package com.collective.app.data.model

enum class MediaKind {
    NONE,
    TEXT,
    IMAGE,
    VIDEO,
    AUDIO,
    DOCUMENT,
    LINK,
}

enum class UploadStatus {
    LOCAL_ONLY,
    READY_TO_UPLOAD,
    UPLOADING,
    UPLOADED,
    FAILED,
}

enum class ProofVisibility {
    PRIVATE,
    FEEDBACK_ONLY,
    PATH,
    PUBLIC,
}

enum class ProofLifecycleStatus {
    DRAFT,
    SUBMITTED,
    FEEDBACK_RECEIVED,
    ARCHIVED,
}

enum class FeedbackKind {
    ENCOURAGEMENT,
    SUGGESTION,
    QUESTION,
    CORRECTION,
}

enum class TrustEventSource {
    PROOF_SUBMISSION,
    FEEDBACK_GIVEN,
    FEEDBACK_RECEIVED,
    CONTRIBUTION,
    PRACTICE_COMPLETED,
}

enum class TrustLevel {
    NEW,
    PRACTICING,
    RELIABLE,
    CONTRIBUTOR,
}

data class AuthSession(
    val userId: String,
    val displayName: String,
    val isAnonymousDemo: Boolean,
)

data class CollectiveUser(
    val id: String,
    val displayName: String,
    val bio: String,
    val trustLevel: TrustLevel,
)

data class CollectivePathRecord(
    val id: String,
    val title: String,
    val subtitle: String,
    val progressPercent: Int,
)

data class PracticeRecord(
    val id: String,
    val pathId: String,
    val title: String,
    val instructions: List<String>,
    val estimatedSeconds: Int,
)

data class ProofMediaRecord(
    val id: String,
    val proofId: String?,
    val userId: String,
    val mediaKind: MediaKind,
    val fileName: String?,
    val fileType: String?,
    val fileSizeBytes: Long?,
    val localUri: String?,
    val storagePath: String?,
    val thumbnailUrl: String?,
    val uploadStatus: UploadStatus,
    val createdAt: String,
)

data class ProofDraft(
    val pathId: String,
    val practiceId: String?,
    val title: String,
    val reflectionText: String,
    val feedbackRequest: String,
    val media: ProofMediaRecord?,
    val visibility: ProofVisibility,
)

data class ProofRecord(
    val id: String,
    val userId: String,
    val pathId: String,
    val title: String,
    val reflectionText: String,
    val feedbackRequest: String,
    val media: ProofMediaRecord?,
    val visibility: ProofVisibility,
    val status: ProofLifecycleStatus,
    val feedbackCount: Int,
    val trustWeight: Int,
    val createdAt: String,
    val updatedAt: String,
)

data class FeedbackDraft(
    val proofId: String,
    val feedbackText: String,
    val feedbackKind: FeedbackKind,
)

data class FeedbackRecord(
    val id: String,
    val proofId: String,
    val reviewerId: String,
    val feedbackText: String,
    val feedbackKind: FeedbackKind,
    val helpfulCount: Int,
    val createdAt: String,
)

data class TrustEventRecord(
    val id: String,
    val userId: String,
    val source: TrustEventSource,
    val sourceId: String,
    val points: Int,
    val reason: String,
    val createdAt: String,
)

fun calculateTrustLevelV0(score: Int): TrustLevel =
    when {
        score >= 150 -> TrustLevel.CONTRIBUTOR
        score >= 75 -> TrustLevel.RELIABLE
        score >= 25 -> TrustLevel.PRACTICING
        else -> TrustLevel.NEW
    }
