package com.collective.app.data.repository

import com.collective.app.core.config.AppConfig
import com.collective.app.core.result.AppResult
import com.collective.app.data.local.LocalCollectiveDataSource
import com.collective.app.data.model.FeedbackDraft
import com.collective.app.data.model.FeedbackRecord
import com.collective.app.data.remote.RemoteCollectiveDataSource
import com.collective.app.data.remote.SupabaseRemoteCollectiveDataSource

interface FeedbackRepository {
    fun addFeedback(draft: FeedbackDraft): AppResult<FeedbackRecord>
}

class DefaultFeedbackRepository(
    private val localDataSource: LocalCollectiveDataSource,
    private val remoteDataSource: RemoteCollectiveDataSource = SupabaseRemoteCollectiveDataSource(),
) : FeedbackRepository {
    override fun addFeedback(draft: FeedbackDraft): AppResult<FeedbackRecord> {
        if (!AppConfig.isDemoMode) {
            val remoteResult = remoteDataSource.addFeedback(draft)
            if (remoteResult is AppResult.Success) return remoteResult
        }
        return AppResult.Success(localDataSource.addFeedback(draft))
    }
}
