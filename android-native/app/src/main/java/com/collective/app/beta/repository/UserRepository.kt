package com.collective.app.beta.repository

import com.collective.app.beta.model.TrustLevel
import com.collective.app.beta.model.UserProfile
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

/**
 * Current-user identity for the cohort. In mock mode we allow switching between seeded users on one
 * device so social interactions can be tested. The interface is shaped so a FirebaseUserRepository
 * (backed by Firebase Auth + a users/{uid} document) can drop in without changing callers.
 */
interface UserRepository {
    fun getCurrentUser(): StateFlow<UserProfile>

    /** All known cohort members (used by the dev switcher and cohort member list). */
    val users: StateFlow<List<UserProfile>>

    suspend fun switchMockUser(userId: String)

    suspend fun updateSelectedDirection(directionId: String)

    fun getUser(userId: String): UserProfile?

    fun observeUser(userId: String): Flow<UserProfile?>

    /** Called by the trust layer after recomputing a user's score/level. */
    fun applyTrust(userId: String, score: Int, level: TrustLevel)
}

class MockUserRepository(
    seedUsers: List<UserProfile>,
    initialUserId: String = seedUsers.first().id,
) : UserRepository {

    private val _users = MutableStateFlow(seedUsers)
    override val users: StateFlow<List<UserProfile>> = _users.asStateFlow()

    private val _currentUser = MutableStateFlow(
        seedUsers.firstOrNull { it.id == initialUserId } ?: seedUsers.first(),
    )

    override fun getCurrentUser(): StateFlow<UserProfile> = _currentUser.asStateFlow()

    override suspend fun switchMockUser(userId: String) {
        _users.value.firstOrNull { it.id == userId }?.let { _currentUser.value = it }
    }

    override suspend fun updateSelectedDirection(directionId: String) {
        val id = _currentUser.value.id
        mutateUser(id) { it.copy(selectedDirectionId = directionId) }
    }

    override fun getUser(userId: String): UserProfile? = _users.value.firstOrNull { it.id == userId }

    override fun observeUser(userId: String): Flow<UserProfile?> =
        _users.map { list -> list.firstOrNull { it.id == userId } }

    override fun applyTrust(userId: String, score: Int, level: TrustLevel) {
        mutateUser(userId) { it.copy(trustScore = score, trustLevel = level) }
    }

    private fun mutateUser(userId: String, transform: (UserProfile) -> UserProfile) {
        _users.value = _users.value.map { if (it.id == userId) transform(it) else it }
        if (_currentUser.value.id == userId) {
            _currentUser.value = _users.value.first { it.id == userId }
        }
    }
}
