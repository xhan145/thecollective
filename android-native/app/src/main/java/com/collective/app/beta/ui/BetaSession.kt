package com.collective.app.beta.ui

import com.collective.app.beta.config.BetaConfig
import com.collective.app.beta.model.UserProfile
import com.collective.app.beta.repository.BetaRepositories
import com.collective.app.beta.repository.createBetaRepositories
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

/**
 * App-session holder for the closed-beta layer. Created once in the composition root and shared by all
 * beta ViewModels. Owns the repository set, the cohort id, and the single source of truth for the
 * current user (so switching the mock user recomposes every screen).
 */
class BetaSession {
    /** App-lifetime scope for repository snapshot streams and write operations. */
    val scope: CoroutineScope = CoroutineScope(Dispatchers.Main.immediate + SupervisorJob())

    val repositories: BetaRepositories = createBetaRepositories(scope)

    val cohortId: String = BetaConfig.DEFAULT_COHORT_ID

    val currentUser: StateFlow<UserProfile> = repositories.userRepository.getCurrentUser()

    val currentUserId: String get() = currentUser.value.id

    val isFounder: Boolean get() = currentUser.value.id == BetaConfig.FOUNDER_USER_ID

    fun switchUser(userId: String) {
        scope.launch { repositories.userRepository.switchMockUser(userId) }
    }

    fun selectDirection(directionId: String) {
        scope.launch { repositories.userRepository.updateSelectedDirection(directionId) }
    }
}
