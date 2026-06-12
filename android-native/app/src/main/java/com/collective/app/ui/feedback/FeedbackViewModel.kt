package com.collective.app.ui.feedback

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Plain state holder following the same pattern as ProofViewModel (no DI framework).
 * Owns the feedback draft + selection state; the repository remains the single
 * source of truth for the feedback list.
 *
 * @param onFeedbackUsedForTrust invoked only when a feedback item transitions into
 *   UsedForPractice for the first time, so trust can grow locally without this
 *   class knowing about the trust model.
 */
class FeedbackViewModel(
    private val repository: FeedbackRepository,
    private val onFeedbackUsedForTrust: () -> Unit = {},
) {
    val feedbackItems: StateFlow<List<FeedbackItem>> = repository.feedbackItems

    private val _draft = MutableStateFlow(FeedbackDraftState())
    val draft: StateFlow<FeedbackDraftState> = _draft.asStateFlow()

    private val _selectedFeedback = MutableStateFlow<FeedbackItem?>(null)
    val selectedFeedback: StateFlow<FeedbackItem?> = _selectedFeedback.asStateFlow()

    fun feedbackForProof(proofId: String): List<FeedbackItem> =
        repository.getFeedbackForProof(proofId)

    fun onFeedbackBodyChanged(text: String) {
        _draft.value = _draft.value.copy(
            body = text.take(280),
            errorMessage = null,
            isSubmitted = false,
        )
    }

    fun onFeedbackToneSelected(tone: FeedbackTone) {
        _draft.value = _draft.value.copy(selectedTone = tone, errorMessage = null)
    }

    fun onStartFeedbackForProof(proofId: String) {
        _draft.value = FeedbackDraftState(proofId = proofId)
    }

    fun onSubmitFeedback() {
        val current = _draft.value
        if (current.proofId.isNullOrBlank()) {
            _draft.value = current.copy(
                errorMessage = "Open a proof before adding feedback.",
                isSubmitting = false,
                isSubmitted = false,
            )
            return
        }
        if (current.body.isBlank()) {
            _draft.value = current.copy(
                errorMessage = "Write one useful note before submitting feedback.",
                isSubmitting = false,
                isSubmitted = false,
            )
            return
        }
        _draft.value = current.copy(isSubmitting = true, errorMessage = null)
        repository.submitFeedback(current)
        _draft.value = current.copy(
            isSubmitting = false,
            isSubmitted = true,
            errorMessage = null,
        )
    }

    fun onMarkFeedbackRead(feedbackId: String) {
        repository.markFeedbackRead(feedbackId)
    }

    fun onMarkAllForProofRead(proofId: String) {
        repository.markAllForProofRead(proofId)
    }

    fun onUseFeedback(feedbackId: String) {
        val item = repository.feedbackItems.value.firstOrNull { it.id == feedbackId } ?: return
        if (item.status == FeedbackStatus.UsedForPractice) return
        repository.markFeedbackUsed(feedbackId)
        onFeedbackUsedForTrust()
    }

    fun onSelectFeedback(feedback: FeedbackItem?) {
        _selectedFeedback.value = feedback
    }

    fun onResetDraft() {
        _draft.value = FeedbackDraftState()
    }

    fun onDismissSuccess() {
        onResetDraft()
    }
}
