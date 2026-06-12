package com.collective.app.beta.repository

import com.collective.app.beta.model.Feedback
import com.collective.app.beta.model.TrustEventType
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

/**
 * Structured peer feedback. Giving feedback awards the giver FEEDBACK_GIVEN; the proof owner marking
 * it helpful awards the giver FEEDBACK_MARKED_HELPFUL. Distinct from the live
 * `com.collective.app.ui.feedback.FeedbackRepository`.
 */
interface FeedbackRepository {
    /** Live stream of all feedback in the cohort (Feed derives per-proof counts from this). */
    val allFeedback: StateFlow<List<Feedback>>
    fun getFeedbackForProof(proofId: String): Flow<List<Feedback>>
    fun getFeedbackByGiver(giverUserId: String): Flow<List<Feedback>>
    suspend fun addFeedback(feedback: Feedback): Feedback
    suspend fun markHelpful(feedbackId: String)
}

class MockFeedbackRepository(
    seedFeedback: List<Feedback>,
    private val trustRepository: TrustRepository,
) : FeedbackRepository {

    private val _feedback = MutableStateFlow(seedFeedback)
    override val allFeedback: StateFlow<List<Feedback>> = _feedback.asStateFlow()

    override fun getFeedbackForProof(proofId: String): Flow<List<Feedback>> =
        _feedback.map { list -> list.filter { it.proofId == proofId }.sortedByDescending { it.createdAt } }

    override fun getFeedbackByGiver(giverUserId: String): Flow<List<Feedback>> =
        _feedback.map { list -> list.filter { it.giverUserId == giverUserId } }

    override suspend fun addFeedback(feedback: Feedback): Feedback {
        val saved = feedback.copy(
            createdAt = if (feedback.createdAt == 0L) System.currentTimeMillis() else feedback.createdAt,
        )
        _feedback.value = listOf(saved) + _feedback.value
        trustRepository.addTrustEvent(
            userId = saved.giverUserId,
            cohortId = saved.cohortId,
            type = TrustEventType.FEEDBACK_GIVEN,
            sourceId = saved.id,
        )
        return saved
    }

    override suspend fun markHelpful(feedbackId: String) {
        val target = _feedback.value.firstOrNull { it.id == feedbackId } ?: return
        if (target.isMarkedHelpful) return // idempotent: no double trust
        _feedback.value = _feedback.value.map {
            if (it.id == feedbackId) it.copy(isMarkedHelpful = true) else it
        }
        trustRepository.addTrustEvent(
            userId = target.giverUserId,
            cohortId = target.cohortId,
            type = TrustEventType.FEEDBACK_MARKED_HELPFUL,
            sourceId = target.id,
        )
    }
}
