package com.collective.app.beta.ui.feed

import com.collective.app.beta.model.Proof
import com.collective.app.beta.model.ProofStatus
import com.collective.app.beta.ui.BetaSession
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn

enum class FeedCardState { YOUR_PROOF, NEEDS_FEEDBACK, FEEDBACK_GIVEN, PRACTICED_RECENTLY }

data class FeedRow(
    val proof: Proof,
    val directionTitle: String,
    val feedbackCount: Int,
    val isOwner: Boolean,
    val cardState: FeedCardState,
) {
    val ctaLabel: String get() = if (isOwner) "View feedback" else "Give feedback"
    val statusLabel: String
        get() = when (cardState) {
            FeedCardState.YOUR_PROOF -> "Your proof"
            FeedCardState.NEEDS_FEEDBACK -> "Needs feedback"
            FeedCardState.FEEDBACK_GIVEN -> "Feedback given"
            FeedCardState.PRACTICED_RECENTLY -> "Practiced recently"
        }
}

/**
 * Cohort-scoped feed of practice proof. Order: proofs needing the current user's feedback first
 * (newest, de-clustered so one member never repeats back-to-back), then everything else newest-first.
 * No likes, followers, or rank — ever.
 */
class BetaFeedViewModel(private val session: BetaSession) {

    private val repos = session.repositories

    val feed: StateFlow<List<FeedRow>> =
        combine(
            session.currentUser,
            repos.proofRepository.getProofFeed(session.cohortId),
            repos.feedbackRepository.allFeedback,
            repos.directionRepository.getDirections(),
        ) { user, proofs, feedback, directions ->
            val uid = user.id
            val directionTitle = directions.associate { it.id to it.title }
            val countByProof = feedback.groupingBy { it.proofId }.eachCount()
            val givenByMe = feedback.filter { it.giverUserId == uid }.map { it.proofId }.toSet()

            val submitted = proofs.filter { it.status == ProofStatus.SUBMITTED }

            fun rowFor(proof: Proof): FeedRow {
                val isOwner = proof.ownerUserId == uid
                val state = when {
                    isOwner -> FeedCardState.YOUR_PROOF
                    proof.id in givenByMe -> FeedCardState.FEEDBACK_GIVEN
                    (countByProof[proof.id] ?: 0) == 0 -> FeedCardState.NEEDS_FEEDBACK
                    else -> FeedCardState.PRACTICED_RECENTLY
                }
                return FeedRow(
                    proof = proof,
                    directionTitle = directionTitle[proof.directionId] ?: proof.directionId,
                    feedbackCount = countByProof[proof.id] ?: 0,
                    isOwner = isOwner,
                    cardState = state,
                )
            }

            val rows = submitted.map(::rowFor)
            val needs = rows.filter { it.cardState == FeedCardState.NEEDS_FEEDBACK }
                .sortedByDescending { it.proof.createdAt }
            val rest = rows.filter { it.cardState != FeedCardState.NEEDS_FEEDBACK }
                .sortedByDescending { it.proof.createdAt }

            deClusterByOwner(needs) + rest
        }.stateIn(session.scope, SharingStarted.Eagerly, emptyList())

    /** Greedy round-robin across owners so the same person never appears twice in a row. */
    private fun deClusterByOwner(rows: List<FeedRow>): List<FeedRow> {
        if (rows.size <= 1) return rows
        val byOwner = LinkedHashMap<String, ArrayDeque<FeedRow>>()
        rows.forEach { row ->
            byOwner.getOrPut(row.proof.ownerUserId) { ArrayDeque() }.add(row)
        }
        val result = ArrayList<FeedRow>(rows.size)
        while (byOwner.values.any { it.isNotEmpty() }) {
            for (queue in byOwner.values) {
                if (queue.isNotEmpty()) result.add(queue.removeFirst())
            }
        }
        return result
    }
}
