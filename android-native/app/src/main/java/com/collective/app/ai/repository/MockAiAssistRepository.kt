package com.collective.app.ai.repository

import com.collective.app.ai.model.AiAssistIntent
import com.collective.app.ai.model.AiAssistRequest
import com.collective.app.ai.model.AiAssistResponse
import com.collective.app.ai.model.AiSafetyDecision
import com.collective.app.ai.prompt.CollectiveAiPrompts
import com.collective.app.core.result.AppResult

class MockAiAssistRepository : AiAssistRepository {
    override fun assist(request: AiAssistRequest): AppResult<AiAssistResponse> {
        val safety = safetyDecision(request.userText)
        if (!safety.allowed) {
            return AppResult.Success(
                AiAssistResponse(
                    label = "Safety review",
                    primaryText = safety.rewriteGuidance ?: "Pause and rewrite this with a safer tone.",
                    suggestions = listOf("Focus on the practice, not the person.", "Ask for context before correcting."),
                    safety = safety,
                    requiresHumanReview = safety.requiresHumanReview
                )
            )
        }

        return AppResult.Success(
            when (request.intent) {
                AiAssistIntent.PRACTICE_HELPER -> practiceHelper(request)
                AiAssistIntent.REFLECTION_HELPER -> reflectionHelper(request)
                AiAssistIntent.FEEDBACK_DRAFT -> feedbackDraft(request)
                AiAssistIntent.SAFETY_REVIEW -> safetyReview(request)
            }
        )
    }

    private fun practiceHelper(request: AiAssistRequest): AiAssistResponse {
        val area = request.practiceArea.ifBlank { "your path" }
        return AiAssistResponse(
            label = "Practice helper",
            primaryText = "Keep this rep small: name the situation, try one clear sentence, then notice what changed.",
            suggestions = listOf(
                "What is one sentence you want to say more clearly?",
                "What would make this rep useful, even if it feels imperfect?",
                "After the rep, write one thing that felt more honest."
            ),
            disclaimer = "This helper supports your $area practice. It does not decide progress for you."
        )
    }

    private fun reflectionHelper(request: AiAssistRequest): AiAssistResponse {
        val base = request.userText.trim()
        val primary = if (base.isBlank()) {
            "Try this: I practiced ___. It felt ___ because ___. My next useful step is ___."
        } else {
            "Make the reflection more concrete by naming the action, what changed, and one next step."
        }
        return AiAssistResponse(
            label = "Reflection helper",
            primaryText = primary,
            suggestions = listOf(
                "I practiced one specific moment: ...",
                "The clearest change I noticed was ...",
                "The next rep I want feedback on is ..."
            )
        )
    }

    private fun feedbackDraft(request: AiAssistRequest): AiAssistResponse {
        return AiAssistResponse(
            label = "Feedback draft",
            primaryText = "Useful feedback can be short: name what worked, offer one next step, and keep the person safe.",
            suggestions = listOf(
                "What worked: your point was clear and easy to follow.",
                "One next step: slow down between ideas so the listener has time to absorb them.",
                "Keep going: this already shows real practice."
            )
        )
    }

    private fun safetyReview(request: AiAssistRequest): AiAssistResponse {
        val safety = safetyDecision(request.userText)
        return AiAssistResponse(
            label = "Safety review",
            primaryText = if (safety.allowed) "This looks safe enough for an alpha check." else "This needs a safer rewrite.",
            suggestions = safety.reasons.ifEmpty { listOf("Keep feedback kind, specific, and focused on the practice.") },
            safety = safety,
            requiresHumanReview = safety.requiresHumanReview
        )
    }

    private fun safetyDecision(text: String): AiSafetyDecision {
        val restrictedHit = CollectiveAiPrompts.restrictedLanguage.filterNot { it == "like" }.firstOrNull { word ->
            text.contains(word, ignoreCase = true)
        }
        if (restrictedHit != null) {
            return AiSafetyDecision(
                allowed = false,
                reasons = listOf("Uses language outside Collective's product rules."),
                rewriteGuidance = "Rewrite using support, practice, proof, guidance, or feedback language.",
                requiresHumanReview = false
            )
        }

        val harmfulHit = listOf("worthless", "stupid", "hate you").firstOrNull { word ->
            text.contains(word, ignoreCase = true)
        }
        if (harmfulHit != null) {
            return AiSafetyDecision(
                allowed = false,
                reasons = listOf("Tone may be harmful or personal."),
                rewriteGuidance = "Focus on one practice behavior and one safer next step.",
                requiresHumanReview = true
            )
        }

        return AiSafetyDecision(allowed = true)
    }
}
