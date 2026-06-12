package com.collective.app.data.repository

import com.collective.app.core.result.AppResult
import com.collective.app.data.local.LocalCollectiveDataSource
import com.collective.app.data.model.TrustEventRecord
import com.collective.app.data.model.calculateTrustLevelV0

data class TrustSummary(
    val trustScore: Int,
    val trustLevelLabel: String,
    val recentEvents: List<TrustEventRecord>,
)

interface TrustRepository {
    fun trustSummary(): AppResult<TrustSummary>
}

class DefaultTrustRepository(
    private val localDataSource: LocalCollectiveDataSource,
) : TrustRepository {
    override fun trustSummary(): AppResult<TrustSummary> {
        val events = localDataSource.trustEvents()
        val score = events.sumOf { it.points }
        return AppResult.Success(
            TrustSummary(
                trustScore = score,
                trustLevelLabel = calculateTrustLevelV0(score).name.lowercase().replaceFirstChar { it.uppercase() },
                recentEvents = events.take(5),
            ),
        )
    }
}
