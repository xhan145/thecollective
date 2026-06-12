package com.collective.app.data.repository

import com.collective.app.core.config.AppConfig
import com.collective.app.core.result.AppResult
import com.collective.app.data.local.LocalCollectiveDataSource
import com.collective.app.data.model.ProofDraft
import com.collective.app.data.model.ProofRecord
import com.collective.app.data.remote.RemoteCollectiveDataSource
import com.collective.app.data.remote.SupabaseRemoteCollectiveDataSource

interface ProofRepository {
    fun listProofs(): AppResult<List<ProofRecord>>
    fun createProof(draft: ProofDraft): AppResult<ProofRecord>
}

class DefaultProofRepository(
    private val localDataSource: LocalCollectiveDataSource,
    private val remoteDataSource: RemoteCollectiveDataSource = SupabaseRemoteCollectiveDataSource(),
) : ProofRepository {
    override fun listProofs(): AppResult<List<ProofRecord>> =
        AppResult.Success(localDataSource.listProofs())

    override fun createProof(draft: ProofDraft): AppResult<ProofRecord> {
        if (!AppConfig.isDemoMode) {
            val remoteResult = remoteDataSource.createProof(draft)
            if (remoteResult is AppResult.Success) return remoteResult
        }
        return AppResult.Success(localDataSource.createProof(draft))
    }
}
