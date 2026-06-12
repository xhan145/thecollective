package com.collective.app.data.repository

import com.collective.app.ai.model.AiAssistResponse
import com.collective.app.ai.model.AiRiskLevel
import com.collective.app.core.result.AppResult
import com.collective.app.data.local.LocalClock
import com.collective.app.data.local.db.CollectiveLocalDatabase
import com.collective.app.data.local.entity.AiSafetyReviewEntity
import java.util.UUID

interface AiSafetyReviewRepository {
    fun recentReviews(): AppResult<List<AiSafetyReviewEntity>>
    fun recordReview(
        targetType: String,
        targetId: String?,
        text: String,
        intendedUse: String,
        response: AiAssistResponse,
    ): AppResult<AiSafetyReviewEntity>
}

class DefaultAiSafetyReviewRepository(
    private val database: CollectiveLocalDatabase?,
) : AiSafetyReviewRepository {
    override fun recentReviews(): AppResult<List<AiSafetyReviewEntity>> =
        AppResult.Success(database?.aiSafetyReviews?.all().orEmpty())

    override fun recordReview(
        targetType: String,
        targetId: String?,
        text: String,
        intendedUse: String,
        response: AiAssistResponse,
    ): AppResult<AiSafetyReviewEntity> {
        val review = AiSafetyReviewEntity(
            id = "ai-safety-${UUID.randomUUID()}",
            targetType = targetType,
            targetId = targetId,
            textSummary = text.take(220),
            intendedUse = intendedUse,
            riskLevel = response.riskLevel.name,
            decision = response.riskLevel.toLocalDecision(),
            notes = response.safetyNotes.take(3).joinToString(" | "),
            createdAt = LocalClock.nowIso(),
        )
        database?.aiSafetyReviews?.insert(review)
        return AppResult.Success(review)
    }
}

private fun AiRiskLevel.toLocalDecision(): String =
    when (this) {
        AiRiskLevel.LOW -> "ALLOW"
        AiRiskLevel.NEEDS_REPHRASE -> "REVIEW"
        AiRiskLevel.UNSAFE -> "REVIEW_BEFORE_SHARING"
    }
