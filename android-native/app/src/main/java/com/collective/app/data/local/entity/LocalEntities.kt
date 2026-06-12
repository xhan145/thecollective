package com.collective.app.data.local.entity

data class PracticeSessionEntity(
    val id: String,
    val userId: String,
    val pathId: String,
    val practiceId: String,
    val status: String,
    val startedAt: String,
    val completedAt: String?,
)

data class PracticeCompletionEntity(
    val id: String,
    val userId: String,
    val pathId: String,
    val practiceId: String,
    val createdAt: String,
)

data class ProofEntity(
    val id: String,
    val userId: String,
    val pathId: String,
    val title: String,
    val reflectionText: String,
    val feedbackRequest: String,
    val mediaKind: String,
    val mediaLocalUri: String?,
    val visibility: String,
    val status: String,
    val feedbackCount: Int,
    val trustWeight: Int,
    val createdAt: String,
    val updatedAt: String,
)

data class FeedbackEntity(
    val id: String,
    val proofId: String,
    val reviewerId: String,
    val feedbackText: String,
    val feedbackKind: String,
    val helpfulCount: Int,
    val createdAt: String,
)

data class ProofMediaEntity(
    val id: String,
    val proofId: String?,
    val userId: String,
    val mediaKind: String,
    val fileName: String?,
    val fileType: String?,
    val fileSizeBytes: Long?,
    val localUri: String?,
    val storagePath: String?,
    val thumbnailUrl: String?,
    val uploadStatus: String,
    val createdAt: String,
)

data class TrustEventEntity(
    val id: String,
    val userId: String,
    val source: String,
    val sourceId: String,
    val points: Int,
    val reason: String,
    val createdAt: String,
)

data class ActivityEntity(
    val id: String,
    val title: String,
    val body: String,
    val category: String,
    val createdAt: String,
)

data class AiSafetyReviewEntity(
    val id: String,
    val targetType: String,
    val targetId: String?,
    val textSummary: String,
    val intendedUse: String,
    val riskLevel: String,
    val decision: String,
    val notes: String,
    val createdAt: String,
)

data class AiRunEntity(
    val id: String,
    val kind: String,
    val inputSummary: String,
    val outputSummary: String,
    val riskLevel: String,
    val confidenceScore: Double,
    val traceSummary: String,
    val createdAt: String,
)

data class UserPreferenceEntity(
    val key: String,
    val value: String,
    val updatedAt: String,
)
