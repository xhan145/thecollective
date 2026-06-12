package com.collective.app.data.repository

import com.collective.app.core.result.AppResult
import com.collective.app.data.local.LocalCollectiveDataSource
import com.collective.app.data.model.AuthSession

interface AuthRepository {
    fun currentSession(): AppResult<AuthSession>
    fun isRemoteAuthConfigured(): Boolean
}

class MockAuthRepository(
    private val localDataSource: LocalCollectiveDataSource,
) : AuthRepository {
    override fun currentSession(): AppResult<AuthSession> =
        AppResult.Success(localDataSource.currentSession())

    override fun isRemoteAuthConfigured(): Boolean = false
}
