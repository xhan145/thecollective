package com.collective.app.ai.local

import com.collective.app.ai.model.FeedbackDraftRequest
import com.collective.app.ai.model.PracticeAssistRequest
import com.collective.app.ai.model.ProfileReviewRequest
import com.collective.app.ai.model.ProgressSummaryRequest
import com.collective.app.ai.model.ReflectionAssistRequest
import com.collective.app.ai.model.SafetyReviewRequest

object CollectiveLocalAiCore {
    private val engine = LocalAiSuggestionEngine()

    fun adjustPractice(request: PracticeAssistRequest) = engine.adjustPractice(request)
    fun clarifyReflection(request: ReflectionAssistRequest) = engine.clarifyReflection(request)
    fun improveFeedback(request: FeedbackDraftRequest) = engine.improveFeedback(request)
    fun reviewBeforeSharing(request: SafetyReviewRequest) = engine.reviewBeforeSharing(request)
    fun summarizeProgress(request: ProgressSummaryRequest) = engine.summarizeProgress(request)
    fun reviewProfile(request: ProfileReviewRequest) = engine.reviewProfile(request)
}
