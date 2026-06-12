package com.collective.app.beta.repository

import com.collective.app.beta.config.BetaConfig
import com.collective.app.beta.data.BetaSeed
import kotlinx.coroutines.CoroutineScope

/**
 * Holder for the full beta repository set. Construction order respects the dependency graph
 * (acyclic): User ← Trust, Trust ← (Proof, Feedback), User ← Cohort. AppFeedback stands alone with no
 * trust dependency.
 *
 * Swapping to Firebase is a single decision here (see [createBetaRepositories]); every caller depends
 * only on the interfaces, so nothing else changes.
 */
class BetaRepositories(
    val userRepository: UserRepository,
    val cohortRepository: CohortRepository,
    val directionRepository: DirectionRepository,
    val promptRepository: PromptRepository,
    val proofRepository: ProofRepository,
    val feedbackRepository: FeedbackRepository,
    val trustRepository: TrustRepository,
    val appFeedbackRepository: AppFeedbackRepository,
)

/**
 * Builds the active repository set. While [BetaConfig.USE_FIREBASE] is false (default) this returns the
 * in-memory mock set seeded from [BetaSeed]. When true it will return the Firebase-backed set (wired in
 * FirebaseRepositories.kt). The [scope] is used by the Firebase implementations for snapshot streams.
 */
fun createBetaRepositories(scope: CoroutineScope): BetaRepositories {
    if (BetaConfig.USE_FIREBASE) {
        return createFirebaseRepositories(scope)
    }
    return createMockRepositories()
}

private fun createMockRepositories(): BetaRepositories {
    val userRepository = MockUserRepository(BetaSeed.users)
    val trustRepository = MockTrustRepository(BetaSeed.trustEvents, userRepository)
    val cohortRepository = MockCohortRepository(BetaSeed.cohort, userRepository)
    val directionRepository = MockDirectionRepository(BetaSeed.directions)
    val promptRepository = MockPromptRepository(BetaSeed.prompts)
    val proofRepository = MockProofRepository(BetaSeed.proofs, trustRepository)
    val feedbackRepository = MockFeedbackRepository(BetaSeed.feedback, trustRepository)
    val appFeedbackRepository = MockAppFeedbackRepository(BetaSeed.appFeedback)
    return BetaRepositories(
        userRepository = userRepository,
        cohortRepository = cohortRepository,
        directionRepository = directionRepository,
        promptRepository = promptRepository,
        proofRepository = proofRepository,
        feedbackRepository = feedbackRepository,
        trustRepository = trustRepository,
        appFeedbackRepository = appFeedbackRepository,
    )
}
