package com.collective.app.beta.repository

import com.collective.app.beta.model.TrustEvent
import com.collective.app.beta.model.TrustEventType
import com.collective.app.beta.model.TrustSummary
import com.collective.app.beta.model.pointsFor
import com.collective.app.beta.model.trustLevelFor
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map

/**
 * The single owner of trust. Every trust-earning action (submit proof, give feedback, get marked
 * helpful, complete practice) routes through [addTrustEvent], which appends an event, recomputes the
 * user's score + level, and pushes the result back onto the [UserProfile] via [UserRepository].
 *
 * App-experience feedback never touches this repository, so it can never affect trust.
 */
interface TrustRepository {
    fun getTrustEvents(userId: String): Flow<List<TrustEvent>>
    suspend fun addTrustEvent(
        userId: String,
        cohortId: String,
        type: TrustEventType,
        sourceId: String? = null,
    ): TrustEvent
    fun getTrustSummary(userId: String): Flow<TrustSummary>
}

class MockTrustRepository(
    seedEvents: List<TrustEvent>,
    private val userRepository: UserRepository,
) : TrustRepository {

    private val _events = MutableStateFlow(seedEvents)

    init {
        // Make seeded users' scores consistent with their seeded trust events.
        userRepository.users.value.forEach { user ->
            recomputeFor(user.id)
        }
    }

    override fun getTrustEvents(userId: String): Flow<List<TrustEvent>> =
        _events.map { list -> list.filter { it.userId == userId }.sortedByDescending { it.createdAt } }

    override suspend fun addTrustEvent(
        userId: String,
        cohortId: String,
        type: TrustEventType,
        sourceId: String?,
    ): TrustEvent {
        val event = TrustEvent(
            id = "trust-${type.name.lowercase()}-${System.currentTimeMillis()}-${userId}",
            userId = userId,
            cohortId = cohortId,
            type = type,
            points = pointsFor(type),
            sourceId = sourceId,
            createdAt = System.currentTimeMillis(),
        )
        _events.value = _events.value + event
        recomputeFor(userId)
        return event
    }

    override fun getTrustSummary(userId: String): Flow<TrustSummary> =
        combine(_events, userRepository.users) { events, _ ->
            summaryFor(userId, events)
        }

    private fun recomputeFor(userId: String) {
        val score = _events.value.filter { it.userId == userId }.sumOf { it.points }
        userRepository.applyTrust(userId, score, trustLevelFor(score))
    }

    private fun summaryFor(userId: String, events: List<TrustEvent>): TrustSummary {
        val mine = events.filter { it.userId == userId }
        val score = mine.sumOf { it.points }
        return TrustSummary(
            trustScore = score,
            trustLevel = trustLevelFor(score),
            practicesCompleted = mine.count { it.type == TrustEventType.PRACTICE_COMPLETED },
            proofsSubmitted = mine.count { it.type == TrustEventType.PROOF_SUBMITTED },
            feedbackGiven = mine.count { it.type == TrustEventType.FEEDBACK_GIVEN },
            helpfulFeedbackGiven = mine.count { it.type == TrustEventType.FEEDBACK_MARKED_HELPFUL },
            contributionsMade = mine.count { it.type == TrustEventType.CONTRIBUTION_ACCEPTED },
        )
    }
}
