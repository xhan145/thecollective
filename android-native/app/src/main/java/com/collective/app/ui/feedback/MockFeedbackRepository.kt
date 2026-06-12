package com.collective.app.ui.feedback

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * In-memory feedback store for the local prototype. Newest feedback first.
 * Seeds attach to the stable proof IDs created by MockProofRepository so the
 * loop (proof -> feedback -> use feedback) works out of the box.
 */
class MockFeedbackRepository : FeedbackRepository {
    private val _feedbackItems = MutableStateFlow(seedFeedbackItems())
    override val feedbackItems: StateFlow<List<FeedbackItem>> = _feedbackItems.asStateFlow()

    override fun getFeedbackForProof(proofId: String): List<FeedbackItem> =
        _feedbackItems.value
            .filter { it.proofId == proofId }
            .sortedByDescending { it.createdAtMillis }

    override fun submitFeedback(draft: FeedbackDraftState): FeedbackItem {
        val proofId = draft.proofId.orEmpty()
        val now = System.currentTimeMillis()
        val item = FeedbackItem(
            id = "feedback-local-$now",
            proofId = proofId,
            body = draft.body.trim(),
            tone = draft.selectedTone,
            authorName = "A practice partner",
            authorInitials = "P",
            createdAtMillis = now,
            status = FeedbackStatus.New,
        )
        _feedbackItems.value = listOf(item) + _feedbackItems.value
        return item
    }

    override fun markFeedbackRead(feedbackId: String) {
        _feedbackItems.value = _feedbackItems.value.map { item ->
            if (item.id == feedbackId && item.status == FeedbackStatus.New) {
                item.copy(status = FeedbackStatus.Read)
            } else {
                item
            }
        }
    }

    override fun markFeedbackUsed(feedbackId: String) {
        _feedbackItems.value = _feedbackItems.value.map { item ->
            if (item.id == feedbackId) item.copy(status = FeedbackStatus.UsedForPractice) else item
        }
    }

    override fun markAllForProofRead(proofId: String) {
        _feedbackItems.value = _feedbackItems.value.map { item ->
            if (item.proofId == proofId && item.status == FeedbackStatus.New) {
                item.copy(status = FeedbackStatus.Read)
            } else {
                item
            }
        }
    }

    private fun seedFeedbackItems(): List<FeedbackItem> {
        val now = System.currentTimeMillis()
        val hour = 60 * 60 * 1000L
        val day = 24 * hour
        // Attached to the "Explained my ideas more clearly in our team meeting." proof.
        val teamMeetingProofId = "proof-team-meeting"
        val planningProofId = "proof-planning-question"
        return listOf(
            FeedbackItem(
                id = "feedback-seed-1",
                proofId = teamMeetingProofId,
                body = "Clearer than last time.",
                tone = FeedbackTone.Encouraging,
                authorName = "Maya",
                authorInitials = "M",
                createdAtMillis = now - 1 * hour,
                status = FeedbackStatus.New,
            ),
            FeedbackItem(
                id = "feedback-seed-2",
                proofId = teamMeetingProofId,
                body = "Your example made the idea easier to follow.",
                tone = FeedbackTone.Specific,
                authorName = "Jordan",
                authorInitials = "J",
                createdAtMillis = now - 3 * hour,
                status = FeedbackStatus.New,
            ),
            FeedbackItem(
                id = "feedback-seed-3",
                proofId = teamMeetingProofId,
                body = "Try slowing down the first sentence.",
                tone = FeedbackTone.PracticeSuggestion,
                authorName = "Alex",
                authorInitials = "A",
                createdAtMillis = now - 5 * hour,
                status = FeedbackStatus.Read,
            ),
            FeedbackItem(
                id = "feedback-seed-4",
                proofId = planningProofId,
                body = "Good question. It opened up the discussion.",
                tone = FeedbackTone.Encouraging,
                authorName = "Sam",
                authorInitials = "S",
                createdAtMillis = now - 2 * day,
                status = FeedbackStatus.Read,
            ),
        )
    }
}
