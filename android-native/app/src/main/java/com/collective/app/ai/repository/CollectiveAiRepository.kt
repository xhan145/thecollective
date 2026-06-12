package com.collective.app.ai.repository

import com.collective.app.ai.model.AiAssistResponse
import com.collective.app.ai.model.FeedbackDraftRequest
import com.collective.app.ai.model.PracticeAssistRequest
import com.collective.app.ai.model.ProfileReviewRequest
import com.collective.app.ai.model.ProgressSummaryRequest
import com.collective.app.ai.model.ReflectionAssistRequest
import com.collective.app.ai.model.SafetyReviewRequest

interface CollectiveAiRepository {
    fun practiceAssist(request: PracticeAssistRequest): AiAssistResponse
    fun reflectionAssist(request: ReflectionAssistRequest): AiAssistResponse
    fun feedbackDraft(request: FeedbackDraftRequest): AiAssistResponse
    fun safetyReview(request: SafetyReviewRequest): AiAssistResponse
    fun progressSummary(request: ProgressSummaryRequest): AiAssistResponse
    fun profileReview(request: ProfileReviewRequest): AiAssistResponse
}
