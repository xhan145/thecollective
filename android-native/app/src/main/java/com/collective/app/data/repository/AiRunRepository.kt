package com.collective.app.data.repository

import com.collective.app.core.result.AppResult
import com.collective.app.data.local.db.CollectiveLocalDatabase
import com.collective.app.data.local.entity.AiRunEntity

interface AiRunRepository {
    fun recentRuns(): AppResult<List<AiRunEntity>>
    fun clearRuns(): AppResult<Unit>
}

class DefaultAiRunRepository(
    private val database: CollectiveLocalDatabase?,
) : AiRunRepository {
    override fun recentRuns(): AppResult<List<AiRunEntity>> =
        AppResult.Success(database?.aiRuns?.all().orEmpty())

    override fun clearRuns(): AppResult<Unit> {
        database?.aiRuns?.clear()
        return AppResult.Success(Unit)
    }
}
