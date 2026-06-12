package com.collective.app.beta.ui.proof

import com.collective.app.beta.model.PracticePrompt
import com.collective.app.beta.model.Proof
import com.collective.app.beta.model.ProofAttachment
import com.collective.app.beta.model.ProofStatus
import com.collective.app.beta.ui.BetaSession
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlin.math.abs

data class BetaProofDraft(
    val promptId: String = "",
    val promptTitle: String = "",
    val directionId: String = "",
    val reflectionText: String = "",
    /** Single attachment for MVP; the Proof model stores a list for Firebase scalability. */
    val attachment: ProofAttachment? = null,
    val isSubmitting: Boolean = false,
    val submittedProofId: String? = null,
    val error: String? = null,
)

/** Owns the proof-capture draft and writes a submitted Proof into the cohort store. */
class BetaProofViewModel(private val session: BetaSession) {

    private val repos = session.repositories
    private val _draft = MutableStateFlow(BetaProofDraft())
    val draft: StateFlow<BetaProofDraft> = _draft.asStateFlow()

    fun startForPrompt(prompt: PracticePrompt) {
        _draft.value = BetaProofDraft(
            promptId = prompt.id,
            promptTitle = prompt.title,
            directionId = prompt.directionId,
        )
    }

    /**
     * When proof capture is opened without a chosen prompt (e.g. the center "+" button), seed the
     * draft with the current user's "today" prompt for their selected direction, if any.
     */
    fun startDefaultIfEmpty() {
        if (_draft.value.promptId.isNotBlank() || _draft.value.submittedProofId != null) return
        val user = session.currentUser.value
        val directionId = user.selectedDirectionId ?: return
        val prompts = repos.promptRepository.promptsForNow(directionId)
        if (prompts.isEmpty()) return
        startForPrompt(prompts[abs(user.id.hashCode()) % prompts.size])
    }

    fun onReflectionChanged(text: String) {
        _draft.update { it.copy(reflectionText = text.take(500), error = null) }
    }

    fun onMediaPicked(attachment: ProofAttachment) {
        _draft.update { it.copy(attachment = attachment, error = null) }
    }

    fun onRemoveAttachment() {
        _draft.update { it.copy(attachment = null) }
    }

    fun onSubmit() {
        val current = _draft.value
        if (current.reflectionText.isBlank() && current.attachment == null) {
            _draft.update { it.copy(error = "Add a short reflection or attach proof before submitting.") }
            return
        }
        if (current.isSubmitting) return
        _draft.update { it.copy(isSubmitting = true, error = null) }

        val user = session.currentUser.value
        val now = System.currentTimeMillis()
        val proof = Proof(
            id = "proof-${user.id}-$now",
            ownerUserId = user.id,
            ownerDisplayName = user.displayName,
            cohortId = session.cohortId,
            directionId = current.directionId,
            promptId = current.promptId,
            promptTitle = current.promptTitle,
            reflectionText = current.reflectionText.trim(),
            attachments = listOfNotNull(current.attachment),
            status = ProofStatus.SUBMITTED,
            feedbackCount = 0,
            createdAt = now,
            updatedAt = now,
        )
        session.scope.launch {
            val saved = repos.proofRepository.submitProof(proof)
            _draft.update { it.copy(isSubmitting = false, submittedProofId = saved.id) }
        }
    }

    fun reset() {
        _draft.value = BetaProofDraft()
    }
}
