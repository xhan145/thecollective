package com.collective.app.data.model

import com.collective.app.data.FeedbackType
import com.collective.app.data.MediaType
import com.collective.app.data.ProofStatus
import com.collective.app.data.Visibility

data class CollectiveUser(
    val id: String,
    val displayName: String,
    val email: String? = null,
    val isLocalOnly: Boolean = true
)

data class AuthSession(
    val user: CollectiveUser,
    val accessToken: String? = null,
    val expiresAtEpochSeconds: Long? = null
)

data class ProofMediaAttachment(
    val localUri: String,
    val displayName: String,
    val mediaType: MediaType,
    val sizeBytes: Long,
    val mimeType: String
)

data class MediaUploadReceipt(
    val storagePath: String,
    val publicUrl: String?,
    val localOnly: Boolean,
    val message: String
)

data class ProofDraft(
    val title: String,
    val reflectionText: String,
    val feedbackRequest: String,
    val media: ProofMediaAttachment?,
    val practiceArea: String,
    val visibility: Visibility,
    val status: ProofStatus = ProofStatus.SUBMITTED
)

data class FeedbackDraft(
    val proofId: String,
    val feedbackText: String,
    val feedbackType: FeedbackType
)

data class ModerationSignal(
    val targetType: String,
    val targetId: String?,
    val reason: String,
    val severity: Int,
    val blocksSubmission: Boolean
)

data class TrustEventDraft(
    val sourceType: String,
    val sourceId: String,
    val points: Int,
    val reason: String
)
