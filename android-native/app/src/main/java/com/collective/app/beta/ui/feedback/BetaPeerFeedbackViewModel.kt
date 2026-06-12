package com.collective.app.beta.ui.feedback

import com.collective.app.beta.model.Feedback
import com.collective.app.beta.model.Proof
import com.collective.app.beta.ui.BetaSession
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PeerFeedbackDraft(
    val whatWorked: String = "",
    val suggestion: String = "",
    val encouragement: String = "",
    val isSubmitting: Boolean = false,
    val submitted: Boolean = false,
    val error: String? = null,
)

data class PeerFeedbackUiState(
    val proof: Proof? = null,
    val isOwner: Boolean = false,
    val feedback: List<Feedback> = emptyList(),
    val draft: PeerFeedbackDraft = PeerFeedbackDraft(),
)

/**
 * Backs both sides of one route: the owner views feedback on their proof and can mark items helpful;
 * other members fill the three short structured fields. Which side renders is decided by [isOwner].
 */
@OptIn(ExperimentalCoroutinesApi::class)
class BetaPeerFeedbackViewModel(private val session: BetaSession) {

    private val repos = session.repositories
    private val _proofId = MutableStateFlow<String?>(null)
    private val _draft = MutableStateFlow(PeerFeedbackDraft())

    private val proofAndFeedback =
        _proofId.flatMapLatest { id ->
            if (id == null) {
                flowOf<Pair<Proof?, List<Feedback>>>(null to emptyList())
            } else {
                combine(
                    repos.proofRepository.getProof(id),
                    repos.feedbackRepository.getFeedbackForProof(id),
                ) { proof, feedback -> proof to feedback }
            }
        }

    val uiState: StateFlow<PeerFeedbackUiState> =
        combine(proofAndFeedback, session.currentUser, _draft) { (proof, feedback), user, draft ->
            PeerFeedbackUiState(
                proof = proof,
                isOwner = proof != null && proof.ownerUserId == user.id,
                feedback = feedback,
                draft = draft,
            )
        }.stateIn(session.scope, SharingStarted.Eagerly, PeerFeedbackUiState())

    val draft: StateFlow<PeerFeedbackDraft> = _draft.asStateFlow()

    fun setProof(proofId: String) {
        _proofId.value = proofId
        _draft.value = PeerFeedbackDraft()
    }

    fun onWhatWorkedChanged(text: String) = _draft.update { it.copy(whatWorked = text.take(200), error = null) }
    fun onSuggestionChanged(text: String) = _draft.update { it.copy(suggestion = text.take(200), error = null) }
    fun onEncouragementChanged(text: String) = _draft.update { it.copy(encouragement = text.take(200), error = null) }

    fun onSubmit() {
        val proof = uiState.value.proof ?: return
        val current = _draft.value
        if (current.whatWorked.isBlank() && current.suggestion.isBlank() && current.encouragement.isBlank()) {
            _draft.update { it.copy(error = "Add a few words in at least one field.") }
            return
        }
        if (current.isSubmitting) return
        _draft.update { it.copy(isSubmitting = true, error = null) }

        val user = session.currentUser.value
        val now = System.currentTimeMillis()
        val feedback = Feedback(
            id = "fb-${user.id}-$now",
            proofId = proof.id,
            proofOwnerUserId = proof.ownerUserId,
            giverUserId = user.id,
            giverDisplayName = user.displayName,
            cohortId = session.cohortId,
            whatWorked = current.whatWorked.trim(),
            suggestion = current.suggestion.trim(),
            encouragement = current.encouragement.trim(),
            createdAt = now,
        )
        session.scope.launch {
            repos.feedbackRepository.addFeedback(feedback)
            _draft.update { it.copy(isSubmitting = false, submitted = true) }
        }
    }

    fun onMarkHelpful(feedbackId: String) {
        session.scope.launch { repos.feedbackRepository.markHelpful(feedbackId) }
    }
}
