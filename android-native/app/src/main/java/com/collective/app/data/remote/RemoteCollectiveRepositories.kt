package com.collective.app.data.remote

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
import com.collective.app.data.repository.AuthRepository
import com.collective.app.data.repository.FeedbackRepository
import com.collective.app.data.repository.MediaUploadRepository
import com.collective.app.data.repository.ModerationRepository
import com.collective.app.data.repository.ProofRepository
import com.collective.app.data.repository.TrustEventRepository

class RemoteAuthRepository : AuthRepository {
    override fun currentSession(): AppResult<AuthSession?> = remoteNotConnected()
    override fun continueLocally(displayName: String): AppResult<AuthSession> = remoteNotConnected()
    override fun signIn(email: String, password: String): AppResult<AuthSession> = remoteNotConnected()
    override fun signOut(): AppResult<Unit> = remoteNotConnected()
}

class RemoteProofRepository : ProofRepository {
    override fun listProofs(): AppResult<List<ProofSubmission>> = remoteNotConnected(emptyList())
    override fun proofById(id: String): AppResult<ProofSubmission?> = remoteNotConnected(null)
    override fun createProof(draft: ProofDraft): AppResult<ProofSubmission> = remoteNotConnected()
}

class RemoteFeedbackRepository : FeedbackRepository {
    override fun feedbackForProof(proofId: String): AppResult<List<Feedback>> = remoteNotConnected(emptyList())
    override fun addFeedback(draft: FeedbackDraft): AppResult<Feedback> = remoteNotConnected()
}

class RemoteTrustEventRepository : TrustEventRepository {
    override fun recentEvents(): AppResult<List<TrustEvent>> = remoteNotConnected(emptyList())
    override fun userProgress(): AppResult<UserProgress> = remoteNotConnected()
}

class RemoteMediaUploadRepository : MediaUploadRepository {
    override fun prepareProofMedia(media: ProofMediaAttachment): AppResult<MediaUploadReceipt> = remoteNotConnected()
}

class RemoteModerationRepository : ModerationRepository {
    override fun checkProofDraft(draft: ProofDraft): AppResult<List<ModerationSignal>> = remoteNotConnected(emptyList())
    override fun checkFeedbackDraft(draft: FeedbackDraft): AppResult<List<ModerationSignal>> = remoteNotConnected(emptyList())
    override fun report(targetType: String, targetId: String?, reason: String): AppResult<ModerationSignal> = remoteNotConnected()
}

private fun <T> remoteNotConnected(fallback: T? = null): AppResult<T> {
    return AppResult.Offline(
        fallback = fallback,
        message = "Remote Supabase-style adapter is scaffolded. Connect credentials and server routes in the next phase."
    )
}
