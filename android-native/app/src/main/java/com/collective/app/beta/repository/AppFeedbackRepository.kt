package com.collective.app.beta.repository

import com.collective.app.beta.model.AppFeedback
import com.collective.app.beta.model.AppFeedbackStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

/**
 * App-experience feedback for the founder/dev team. Deliberately has NO TrustRepository dependency:
 * submitting app feedback cannot create a trust event. This is private product feedback, never social
 * proof — it is scoped to the cohort but never surfaced in the proof feed.
 */
interface AppFeedbackRepository {
    fun getAppFeedbackForCohort(cohortId: String): StateFlow<List<AppFeedback>>
    fun getAppFeedbackByUser(userId: String): Flow<List<AppFeedback>>
    suspend fun submitAppFeedback(appFeedback: AppFeedback): AppFeedback
    suspend fun updateAppFeedbackStatus(feedbackId: String, status: AppFeedbackStatus)
}

class MockAppFeedbackRepository(
    seedAppFeedback: List<AppFeedback>,
) : AppFeedbackRepository {

    private val _appFeedback = MutableStateFlow(seedAppFeedback)

    override fun getAppFeedbackForCohort(cohortId: String): StateFlow<List<AppFeedback>> =
        _appFeedback.asStateFlow()

    override fun getAppFeedbackByUser(userId: String): Flow<List<AppFeedback>> =
        _appFeedback.map { list -> list.filter { it.userId == userId }.sortedByDescending { it.createdAt } }

    override suspend fun submitAppFeedback(appFeedback: AppFeedback): AppFeedback {
        val saved = appFeedback.copy(
            createdAt = if (appFeedback.createdAt == 0L) System.currentTimeMillis() else appFeedback.createdAt,
        )
        _appFeedback.value = listOf(saved) + _appFeedback.value
        return saved
    }

    override suspend fun updateAppFeedbackStatus(feedbackId: String, status: AppFeedbackStatus) {
        _appFeedback.value = _appFeedback.value.map {
            if (it.id == feedbackId) it.copy(status = status) else it
        }
    }
}
