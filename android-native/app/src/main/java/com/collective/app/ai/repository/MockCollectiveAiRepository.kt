package com.collective.app.ai.repository

import com.collective.app.ai.logging.AiRunLoggerProvider
import com.collective.app.ai.local.CollectiveLocalAiCore
import com.collective.app.ai.model.AiAssistResponse
import com.collective.app.ai.model.FeedbackDraftRequest
import com.collective.app.ai.model.PracticeAssistRequest
import com.collective.app.ai.model.ProfileReviewRequest
import com.collective.app.ai.model.ProgressSummaryRequest
import com.collective.app.ai.model.ReflectionAssistRequest
import com.collective.app.ai.model.SafetyReviewRequest

class MockCollectiveAiRepository : CollectiveAiRepository {
    override fun practiceAssist(request: PracticeAssistRequest): AiAssistResponse =
        CollectiveLocalAiCore.adjustPractice(request).also {
            AiRunLoggerProvider.log("practice:${request.userNeed}", it)
        }

    override fun reflectionAssist(request: ReflectionAssistRequest): AiAssistResponse =
        CollectiveLocalAiCore.clarifyReflection(request).also {
            AiRunLoggerProvider.log("reflection:${request.reflectionText} request:${request.feedbackRequest}", it)
        }

    override fun feedbackDraft(request: FeedbackDraftRequest): AiAssistResponse =
        CollectiveLocalAiCore.improveFeedback(request).also {
            AiRunLoggerProvider.log("feedback:${request.currentDraft}", it)
        }

    override fun safetyReview(request: SafetyReviewRequest): AiAssistResponse =
        CollectiveLocalAiCore.reviewBeforeSharing(request).also {
            AiRunLoggerProvider.log("safety:${request.text}", it)
        }

    override fun progressSummary(request: ProgressSummaryRequest): AiAssistResponse =
        CollectiveLocalAiCore.summarizeProgress(request).also {
            AiRunLoggerProvider.log("progress:${request.streakDays}/${request.weeklyMomentumPercent}", it)
        }

    override fun profileReview(request: ProfileReviewRequest): AiAssistResponse =
        CollectiveLocalAiCore.reviewProfile(request).also {
            AiRunLoggerProvider.log("profile:${request.displayName}:${request.bio}", it)
        }
}
