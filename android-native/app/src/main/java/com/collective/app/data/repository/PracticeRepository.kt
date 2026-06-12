package com.collective.app.data.repository

import com.collective.app.core.result.AppResult
import com.collective.app.data.local.LocalCollectiveDataSource
import com.collective.app.data.local.entity.PracticeCompletionEntity
import com.collective.app.data.local.entity.PracticeSessionEntity

interface PracticeRepository {
    fun startPractice(pathId: String, practiceId: String): AppResult<PracticeSessionEntity>
    fun completePractice(pathId: String, practiceId: String): AppResult<PracticeCompletionEntity>
    fun sessionCount(): Int
    fun completionCount(): Int
}

class DefaultPracticeRepository(
    private val localDataSource: LocalCollectiveDataSource,
) : PracticeRepository {
    override fun startPractice(pathId: String, practiceId: String): AppResult<PracticeSessionEntity> =
        AppResult.Success(localDataSource.startPractice(pathId, practiceId))

    override fun completePractice(pathId: String, practiceId: String): AppResult<PracticeCompletionEntity> =
        AppResult.Success(localDataSource.completePractice(pathId, practiceId))

    override fun sessionCount(): Int = localDataSource.practiceSessionCount()

    override fun completionCount(): Int = localDataSource.practiceCompletionCount()
}
