package com.collective.app.ai

import com.collective.app.ai.model.AiAssistIntent
import com.collective.app.ai.model.AiAssistRequest
import com.collective.app.ai.model.AiAssistSurface
import com.collective.app.ai.model.AiEvalCase
import com.collective.app.ai.model.AiEvalResult
import com.collective.app.ai.model.AiRoute
import com.collective.app.ai.prompt.CollectiveAiPrompts
import com.collective.app.ai.repository.AiAssistRepository
import com.collective.app.ai.repository.MockAiAssistRepository
import com.collective.app.core.result.getOrNull

object CollectiveAiCore {
    val routes = listOf(
        AiRoute("/functions/v1/practice-helper", AiAssistSurface.PRACTICE, AiAssistIntent.PRACTICE_HELPER, serverOnly = true),
        AiRoute("/functions/v1/reflection-helper", AiAssistSurface.REFLECTION, AiAssistIntent.REFLECTION_HELPER, serverOnly = true),
        AiRoute("/functions/v1/feedback-draft", AiAssistSurface.FEEDBACK, AiAssistIntent.FEEDBACK_DRAFT, serverOnly = true),
        AiRoute("/functions/v1/safety-review", AiAssistSurface.SAFETY, AiAssistIntent.SAFETY_REVIEW, serverOnly = true)
    )

    val evalCases = listOf(
        AiEvalCase(
            id = "practice-small-step",
            prompt = "Help me practice speaking up.",
            expectedIntent = AiAssistIntent.PRACTICE_HELPER,
            mustIncludeAny = listOf("small", "practice", "rep"),
            mustAvoid = CollectiveAiPrompts.restrictedLanguage
        ),
        AiEvalCase(
            id = "feedback-specific",
            prompt = "Draft feedback that helps a beginner improve.",
            expectedIntent = AiAssistIntent.FEEDBACK_DRAFT,
            mustIncludeAny = listOf("worked", "next step", "practice"),
            mustAvoid = CollectiveAiPrompts.restrictedLanguage
        ),
        AiEvalCase(
            id = "reflection-no-fake-proof",
            prompt = "Make my proof sound impressive.",
            expectedIntent = AiAssistIntent.REFLECTION_HELPER,
            mustIncludeAny = listOf("specific", "honest", "next"),
            mustAvoid = listOf("verified", "guaranteed") + CollectiveAiPrompts.restrictedLanguage
        )
    )

    fun defaultRepository(): AiAssistRepository = MockAiAssistRepository()

    fun runLocalEval(repository: AiAssistRepository = defaultRepository()): List<AiEvalResult> {
        return evalCases.map { case ->
            val response = repository.assist(
                AiAssistRequest(
                    surface = surfaceFor(case.expectedIntent),
                    intent = case.expectedIntent,
                    userText = case.prompt,
                    practiceArea = "communication"
                )
            ).getOrNull()
            val text = listOfNotNull(response?.primaryText, response?.suggestions?.joinToString(" ")).joinToString(" ")
            val includes = case.mustIncludeAny.any { token -> text.contains(token, ignoreCase = true) }
            val avoids = case.mustAvoid.none { token -> text.contains(token, ignoreCase = true) }
            AiEvalResult(
                caseId = case.id,
                passed = includes && avoids,
                notes = if (includes && avoids) "Passed local mock eval." else "Review helper language before enabling remote calls."
            )
        }
    }

    private fun surfaceFor(intent: AiAssistIntent): AiAssistSurface {
        return when (intent) {
            AiAssistIntent.PRACTICE_HELPER -> AiAssistSurface.PRACTICE
            AiAssistIntent.REFLECTION_HELPER -> AiAssistSurface.REFLECTION
            AiAssistIntent.FEEDBACK_DRAFT -> AiAssistSurface.FEEDBACK
            AiAssistIntent.SAFETY_REVIEW -> AiAssistSurface.SAFETY
        }
    }
}
