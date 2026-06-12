package com.collective.app.beta.ui.appfeedback

import com.collective.app.beta.model.AppFeedback
import com.collective.app.beta.model.AppFeedbackImportance
import com.collective.app.beta.model.AppFeedbackScreen
import com.collective.app.beta.model.AppFeedbackType
import com.collective.app.beta.ui.BetaSession
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AppFeedbackDraft(
    val type: AppFeedbackType? = null,
    val screen: AppFeedbackScreen? = null,
    val importance: AppFeedbackImportance? = null,
    val message: String = "",
    val suggestedImprovement: String = "",
    val isSubmitting: Boolean = false,
    val submitted: Boolean = false,
    val error: String? = null,
)

/**
 * Collects app-experience feedback for the founder/dev team. Deliberately never creates a trust event
 * and never produces social content — it only writes to the AppFeedbackRepository.
 */
class AppFeedbackViewModel(private val session: BetaSession) {

    private val repos = session.repositories
    private val _draft = MutableStateFlow(AppFeedbackDraft())
    val draft: StateFlow<AppFeedbackDraft> = _draft.asStateFlow()

    fun onTypeSelected(type: AppFeedbackType) = _draft.update { it.copy(type = type, error = null) }
    fun onScreenSelected(screen: AppFeedbackScreen) = _draft.update { it.copy(screen = screen, error = null) }
    fun onImportanceSelected(importance: AppFeedbackImportance) =
        _draft.update { it.copy(importance = importance, error = null) }

    fun onMessageChanged(text: String) = _draft.update { it.copy(message = text.take(600), error = null) }
    fun onImprovementChanged(text: String) =
        _draft.update { it.copy(suggestedImprovement = text.take(400), error = null) }

    fun onSubmit() {
        val current = _draft.value
        if (current.message.isBlank()) {
            _draft.update { it.copy(error = "Add a short note so we know what to improve.") }
            return
        }
        val type = current.type ?: AppFeedbackType.OTHER
        val screen = current.screen ?: AppFeedbackScreen.OTHER
        val importance = current.importance ?: AppFeedbackImportance.MEDIUM
        if (current.isSubmitting) return
        _draft.update { it.copy(isSubmitting = true, error = null) }

        val user = session.currentUser.value
        val now = System.currentTimeMillis()
        val appFeedback = AppFeedback(
            id = "appfb-${user.id}-$now",
            userId = user.id,
            userDisplayName = user.displayName,
            cohortId = session.cohortId,
            type = type,
            screen = screen,
            message = current.message.trim(),
            importance = importance,
            suggestedImprovement = current.suggestedImprovement.trim().ifBlank { null },
            createdAt = now,
        )
        session.scope.launch {
            repos.appFeedbackRepository.submitAppFeedback(appFeedback)
            _draft.update { it.copy(isSubmitting = false, submitted = true) }
        }
    }

    fun reset() {
        _draft.value = AppFeedbackDraft()
    }
}
