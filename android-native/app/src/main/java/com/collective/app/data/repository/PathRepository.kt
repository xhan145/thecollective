package com.collective.app.data.repository

import com.collective.app.core.result.AppResult
import com.collective.app.data.local.LocalCollectiveDataSource
import com.collective.app.data.model.CollectivePathRecord
import com.collective.app.data.model.PracticeRecord

interface PathRepository {
    fun paths(): AppResult<List<CollectivePathRecord>>
    fun practiceForPath(pathId: String): AppResult<PracticeRecord>
}

class DefaultPathRepository(
    private val localDataSource: LocalCollectiveDataSource,
) : PathRepository {
    override fun paths(): AppResult<List<CollectivePathRecord>> =
        AppResult.Success(localDataSource.paths())

    override fun practiceForPath(pathId: String): AppResult<PracticeRecord> =
        AppResult.Success(localDataSource.practice(pathId))
}
