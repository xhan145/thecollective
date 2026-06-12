package com.collective.app.beta.ui.home

import com.collective.app.beta.model.Direction
import com.collective.app.beta.model.PracticePrompt
import com.collective.app.beta.model.TrustSummary
import com.collective.app.beta.model.trustLevelLabel
import com.collective.app.beta.ui.BetaSession
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlin.math.abs

data class HomeActivityItem(
    val displayName: String,
    val promptTitle: String,
    val directionTitle: String,
)

data class BetaHomeUiState(
    val userName: String = "",
    val cohortName: String = "Founding Circle",
    val direction: Direction? = null,
    val todayPrompt: PracticePrompt? = null,
    val trust: TrustSummary = TrustSummary(),
    val trustLevelLabel: String = "New",
    val recentActivity: List<HomeActivityItem> = emptyList(),
    val cohortPracticedThisWeek: Int = 0,
)

/**
 * Home dashboard state: warm greeting, current direction, today's practice, a small trust summary, and
 * a short recent-cohort-activity preview. Intentionally calm and compact — no clout metrics.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class BetaHomeViewModel(private val session: BetaSession) {

    private val repos = session.repositories

    val uiState: StateFlow<BetaHomeUiState> =
        session.currentUser.flatMapLatest { user ->
            combine(
                repos.directionRepository.getDirections(),
                repos.trustRepository.getTrustSummary(user.id),
                repos.proofRepository.getProofFeed(session.cohortId),
            ) { directions, trust, proofs ->
                val direction = user.selectedDirectionId?.let { id -> directions.firstOrNull { it.id == id } }
                val todayPrompt = direction?.let { pickTodayPrompt(user.id, it.id) }
                val recent = proofs
                    .sortedByDescending { it.createdAt }
                    .take(3)
                    .map { proof ->
                        HomeActivityItem(
                            displayName = proof.ownerDisplayName,
                            promptTitle = proof.promptTitle,
                            directionTitle = directions.firstOrNull { it.id == proof.directionId }?.title
                                ?: proof.directionId,
                        )
                    }
                BetaHomeUiState(
                    userName = user.displayName,
                    direction = direction,
                    todayPrompt = todayPrompt,
                    trust = trust,
                    trustLevelLabel = trustLevelLabel(trust.trustLevel),
                    recentActivity = recent,
                    cohortPracticedThisWeek = proofs.map { it.ownerUserId }.distinct().size,
                )
            }
        }.stateIn(session.scope, SharingStarted.Eagerly, BetaHomeUiState())

    private fun pickTodayPrompt(userId: String, directionId: String): PracticePrompt? {
        val prompts = repos.promptRepository.promptsForNow(directionId)
        if (prompts.isEmpty()) return null
        return prompts[abs(userId.hashCode()) % prompts.size]
    }
}
