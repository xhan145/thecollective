package com.collective.app.data.local

import com.collective.app.core.result.AppResult
import com.collective.app.data.CollectiveRepository
import com.collective.app.data.Feedback
import com.collective.app.data.MediaType
import com.collective.app.data.ProofSubmission
import com.collective.app.data.TrustEvent
import com.collective.app.data.UserProgress
import com.collective.app.data.model.AuthSession
import com.collective.app.data.model.CollectiveUser
import com.collective.app.data.model.FeedbackDraft
import com.collective.app.data.model.MediaUploadReceipt
import com.collective.app.data.model.ModerationSignal
import com.collective.app.data.model.ProofDraft
import com.collective.app.data.model.ProofMediaAttachment
import com.collective.app.data.repository.AuthRepository
import com.collective.app.data.repository.CollectiveRepositories
import com.collective.app.data.repository.FeedbackRepository
import com.collective.app.data.repository.MediaUploadRepository
import com.collective.app.data.repository.ModerationRepository
import com.collective.app.data.repository.ProofRepository
import com.collective.app.data.repository.TrustEventRepository

object LocalCollectiveServiceLocator {
    fun createRepositories(): CollectiveRepositories {
        val store = CollectiveRepository()
        return CollectiveRepositories(
            auth = LocalAuthRepository(),
            proofs = LocalProofRepository(store),
            feedback = LocalFeedbackRepository(store),
            trust = LocalTrustEventRepository(store),
            mediaUploads = LocalMediaUploadRepository(),
            moderation = LocalModerationRepository()
        )
    }
}

class LocalAuthRepository : AuthRepository {
    private var session: AuthSession? = AuthSession(
        user = CollectiveUser(
            id = "local-demo-user",
            displayName = "Local member",
            isLocalOnly = true
        ),
        accessToken = "local-only-session"
    )

    override fun currentSession(): AppResult<AuthSession?> = AppResult.Success(session)

    override fun continueLocally(displayName: String): AppResult<AuthSession> {
        val next = AuthSession(
            user = CollectiveUser(
                id = "local-demo-user",
                displayName = displayName.ifBlank { "Local member" },
                isLocalOnly = true
            ),
            accessToken = "local-only-session"
        )
        session = next
        return AppResult.Success(next)
    }

    override fun signIn(email: String, password: String): AppResult<AuthSession> {
        val fallback = session ?: AuthSession(
            user = CollectiveUser(
                id = "local-demo-user",
                displayName = email.substringBefore("@").ifBlank { "Local member" },
                email = email,
                isLocalOnly = true
            ),
            accessToken = "local-only-session"
        )
        return AppResult.Offline(
            fallback = fallback,
            message = "Remote auth is scaffolded. The app is using local mode until credentials are connected."
        )
    }

    override fun signOut(): AppResult<Unit> {
        session = null
        return AppResult.Success(Unit)
    }
}

class LocalProofRepository(private val store: CollectiveRepository) : ProofRepository {
    override fun listProofs(): AppResult<List<ProofSubmission>> {
        return AppResult.Success(store.rankedProofs())
    }

    override fun proofById(id: String): AppResult<ProofSubmission?> {
        return AppResult.Success(store.proofById(id))
    }

    override fun createProof(draft: ProofDraft): AppResult<ProofSubmission> {
        if (draft.reflectionText.isBlank()) {
            return AppResult.Error("Add a short reflection before sharing proof.")
        }
        val mediaType = draft.media?.mediaType ?: MediaType.NONE
        val proof = store.createProof(
            title = draft.title,
            reflectionText = buildString {
                append(draft.reflectionText.trim())
                if (draft.feedbackRequest.isNotBlank()) {
                    append("\n\nFeedback request: ")
                    append(draft.feedbackRequest.trim())
                }
            },
            mediaUrl = draft.media?.localUri,
            mediaType = mediaType,
            practiceArea = draft.practiceArea,
            visibility = draft.visibility,
            status = draft.status
        )
        return AppResult.Success(proof)
    }
}

class LocalFeedbackRepository(private val store: CollectiveRepository) : FeedbackRepository {
    override fun feedbackForProof(proofId: String): AppResult<List<Feedback>> {
        return AppResult.Success(store.feedbackForProof(proofId))
    }

    override fun addFeedback(draft: FeedbackDraft): AppResult<Feedback> {
        if (draft.feedbackText.trim().length < 12) {
            return AppResult.Error("Add one specific detail before sending feedback.")
        }
        return AppResult.Success(
            store.addFeedback(
                proofId = draft.proofId,
                type = draft.feedbackType,
                text = draft.feedbackText.trim()
            )
        )
    }
}

class LocalTrustEventRepository(private val store: CollectiveRepository) : TrustEventRepository {
    override fun recentEvents(): AppResult<List<TrustEvent>> {
        return AppResult.Success(store.trustEvents.toList())
    }

    override fun userProgress(): AppResult<UserProgress> {
        return AppResult.Success(store.userProgress())
    }
}

class LocalMediaUploadRepository : MediaUploadRepository {
    override fun prepareProofMedia(media: ProofMediaAttachment): AppResult<MediaUploadReceipt> {
        val safeName = media.displayName
            .lowercase()
            .replace(Regex("[^a-z0-9._-]+"), "-")
            .trim('-')
            .ifBlank { "proof-media" }
        return AppResult.Success(
            MediaUploadReceipt(
                storagePath = "local-proof-media/$safeName",
                publicUrl = media.localUri,
                localOnly = true,
                message = "Media is selected locally. Remote storage can be connected later."
            )
        )
    }
}

class LocalModerationRepository : ModerationRepository {
    override fun checkProofDraft(draft: ProofDraft): AppResult<List<ModerationSignal>> {
        return AppResult.Success(checkText("proof", null, draft.reflectionText + " " + draft.feedbackRequest))
    }

    override fun checkFeedbackDraft(draft: FeedbackDraft): AppResult<List<ModerationSignal>> {
        return AppResult.Success(checkText("feedback", draft.proofId, draft.feedbackText))
    }

    override fun report(targetType: String, targetId: String?, reason: String): AppResult<ModerationSignal> {
        return AppResult.Success(
            ModerationSignal(
                targetType = targetType,
                targetId = targetId,
                reason = reason.ifBlank { "Needs review" },
                severity = 2,
                blocksSubmission = false
            )
        )
    }

    private fun checkText(targetType: String, targetId: String?, text: String): List<ModerationSignal> {
        val trimmed = text.trim()
        val signals = mutableListOf<ModerationSignal>()
        if (trimmed.length in 1..11) {
            signals += ModerationSignal(
                targetType = targetType,
                targetId = targetId,
                reason = "Text is too thin to be useful yet.",
                severity = 1,
                blocksSubmission = false
            )
        }
        val unsafeTerms = listOf("worthless", "stupid", "hate you")
        if (unsafeTerms.any { term -> trimmed.contains(term, ignoreCase = true) }) {
            signals += ModerationSignal(
                targetType = targetType,
                targetId = targetId,
                reason = "Text needs a safer and more respectful tone.",
                severity = 3,
                blocksSubmission = true
            )
        }
        return signals
    }
}
