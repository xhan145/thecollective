package com.collective.app.beta.repository

import com.collective.app.beta.model.Cohort
import com.collective.app.beta.model.UserProfile
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

/**
 * The closed cohort ("Founding Circle"). Feed, proof, peer feedback, and app feedback are all scoped
 * to the current cohort. Membership is derived from the user list in [UserRepository].
 */
interface CohortRepository {
    fun getCurrentCohort(): StateFlow<Cohort>
    fun getCohortMembers(cohortId: String): Flow<List<UserProfile>>
}

class MockCohortRepository(
    cohort: Cohort,
    private val userRepository: UserRepository,
) : CohortRepository {

    private val _cohort = MutableStateFlow(cohort)

    override fun getCurrentCohort(): StateFlow<Cohort> = _cohort.asStateFlow()

    override fun getCohortMembers(cohortId: String): Flow<List<UserProfile>> =
        userRepository.users.map { members -> members.filter { it.cohortId == cohortId } }
}
