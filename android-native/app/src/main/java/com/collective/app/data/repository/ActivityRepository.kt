package com.collective.app.data.repository

import com.collective.app.core.result.AppResult
import com.collective.app.data.local.LocalCollectiveDataSource
import com.collective.app.data.local.entity.ActivityEntity

interface ActivityRepository {
    fun recentActivity(): AppResult<List<ActivityEntity>>
}

class DefaultActivityRepository(
    private val localDataSource: LocalCollectiveDataSource,
) : ActivityRepository {
    override fun recentActivity(): AppResult<List<ActivityEntity>> =
        AppResult.Success(localDataSource.activityItems())
}
