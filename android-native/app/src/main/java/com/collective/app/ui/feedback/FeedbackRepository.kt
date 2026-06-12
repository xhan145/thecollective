package com.collective.app.ui.feedback

import kotlinx.coroutines.flow.StateFlow

/**
 * Single source of truth for feedback in the local MVP.
 * Feedback is always linked to a proof by proofId. Local/mock only — no backend.
 */
interface FeedbackRepository {
    val feedbackItems: StateFlow<List<FeedbackItem>>

    fun getFeedbackForProof(proofId: String): List<FeedbackItem>

    fun submitFeedback(draft: FeedbackDraftState): FeedbackItem

    fun markFeedbackRead(feedbackId: String)

    fun markFeedbackUsed(feedbackId: String)

    fun markAllForProofRead(proofId: String)
}
