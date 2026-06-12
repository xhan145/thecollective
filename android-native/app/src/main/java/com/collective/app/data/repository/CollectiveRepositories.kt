package com.collective.app.data.repository

import com.collective.app.core.result.AppResult
import com.collective.app.data.Feedback
import com.collective.app.data.ProofSubmission
import com.collective.app.data.TrustEvent
import com.collective.app.data.UserProgress
import com.collective.app.data.model.AuthSession
import com.collective.app.data.model.FeedbackDraft
import com.collective.app.data.model.MediaUploadReceipt
import com.collective.app.data.model.ModerationSignal
import com.collective.app.data.model.ProofDraft
import com.collective.app.data.model.ProofMediaAttachment

interface AuthRepository {
    fun currentSession(): AppResult<AuthSession?>
    fun continueLocally(displayName: String = "Local member"): AppResult<AuthSession>
    fun signIn(email: String, password: String): AppResult<AuthSession>
    fun signOut(): AppResult<Unit>
}

interface ProofRepository {
    fun listProofs(): AppResult<List<ProofSubmission>>
    fun proofById(id: String): AppResult<ProofSubmission?>
    fun createProof(draft: ProofDraft): AppResult<ProofSubmission>
}

interface FeedbackRepository {
    fun feedbackForProof(proofId: String): AppResult<List<Feedback>>
    fun addFeedback(draft: FeedbackDraft): AppResult<Feedback>
}

interface TrustEventRepository {
    fun recentEvents(): AppResult<List<TrustEvent>>
    fun userProgress(): AppResult<UserProgress>
}

interface MediaUploadRepository {
    fun prepareProofMedia(media: ProofMediaAttachment): AppResult<MediaUploadReceipt>
}

interface ModerationRepository {
    fun checkProofDraft(draft: ProofDraft): AppResult<List<ModerationSignal>>
    fun checkFeedbackDraft(draft: FeedbackDraft): AppResult<List<ModerationSignal>>
    fun report(targetType: String, targetId: String?, reason: String): AppResult<ModerationSignal>
}

data class CollectiveRepositories(
    val auth: AuthRepository,
    val proofs: ProofRepository,
    val feedback: FeedbackRepository,
    val trust: TrustEventRepository,
    val mediaUploads: MediaUploadRepository,
    val moderation: ModerationRepository
)
