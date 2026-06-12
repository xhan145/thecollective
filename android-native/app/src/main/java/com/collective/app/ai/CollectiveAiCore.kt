package com.collective.app.ai

import com.collective.app.ai.prompt.AiEvalCases
import com.collective.app.ai.prompt.CollectiveAiPrompts
import com.collective.app.ai.repository.CollectiveAiRepository
import com.collective.app.ai.repository.MockCollectiveAiRepository

object CollectiveAiCore {
    val repository: CollectiveAiRepository = MockCollectiveAiRepository()

    /*
     * These route names describe the future server-side edge functions.
     * Android should call these endpoints only through a configured backend.
     */
    object Routes {
        const val practiceAssist = "/ai/practice-assist"
        const val reflectionAssist = "/ai/reflection-assist"
        const val feedbackDraft = "/ai/feedback-draft"
        const val safetyReview = "/ai/safety-review"
        const val proofSummary = "/ai/proof-summary"
        const val progressSummary = "/ai/progress-summary"
        const val profileReview = "/ai/profile-review"
    }

    val prompts = CollectiveAiPrompts
    val evalCases = AiEvalCases.v0
}
