package com.collective.app.beta.ui.appfeedback

import com.collective.app.beta.model.AppFeedback
import com.collective.app.beta.model.AppFeedbackStatus
import com.collective.app.beta.ui.BetaSession
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/** Founder/dev-only review of submitted app feedback (mock mode). A simple list + local status edit. */
class BetaFeedbackReviewViewModel(private val session: BetaSession) {

    private val repos = session.repositories

    val items: StateFlow<List<AppFeedback>> =
        repos.appFeedbackRepository.getAppFeedbackForCohort(session.cohortId)
            .map { list -> list.sortedByDescending { it.createdAt } }
            .stateIn(session.scope, SharingStarted.Eagerly, emptyList())

    fun updateStatus(feedbackId: String, status: AppFeedbackStatus) {
        session.scope.launch { repos.appFeedbackRepository.updateAppFeedbackStatus(feedbackId, status) }
    }
}
