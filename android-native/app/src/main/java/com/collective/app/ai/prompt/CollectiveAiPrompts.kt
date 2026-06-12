package com.collective.app.ai.prompt

import com.collective.app.ai.model.AiAssistIntent
import com.collective.app.ai.model.AiAssistRequest

object CollectiveAiPrompts {
    val systemRules = listOf(
        "Support the user's practice and reflection without judging their worth.",
        "Offer small next steps that a beginner can safely try.",
        "Do not decide trust, status, or readiness for a person.",
        "Do not generate fake proof or imply that unverified work happened.",
        "Do not provide medical, legal, crisis, or therapy advice.",
        "Route harmful, coercive, or unsafe content to human review."
    )

    val preferredLanguage = listOf(
        "support",
        "proof",
        "practice",
        "path",
        "guidance",
        "contributor",
        "trust signal",
        "progress",
        "feedback",
        "momentum",
        "reflection helper",
        "practice helper",
        "feedback draft"
    )

    val restrictedLanguage = listOf(
        "like",
        "followers",
        "viral",
        "leaderboard",
        "influencer",
        "creator marketplace",
        "paid trust",
        "AI coach",
        "AI authority",
        "ranking score"
    )

    fun buildPrompt(request: AiAssistRequest): String {
        return when (request.intent) {
            AiAssistIntent.PRACTICE_HELPER -> practiceHelper(request)
            AiAssistIntent.REFLECTION_HELPER -> reflectionHelper(request)
            AiAssistIntent.FEEDBACK_DRAFT -> feedbackDraft(request)
            AiAssistIntent.SAFETY_REVIEW -> safetyReview(request)
        }
    }

    private fun practiceHelper(request: AiAssistRequest): String {
        return """
            Surface: practice helper
            Practice area: ${request.practiceArea}
            Task: suggest one small action and two reflection questions.
            Boundary: do not claim the user completed anything.
        """.trimIndent()
    }

    private fun reflectionHelper(request: AiAssistRequest): String {
        return """
            Surface: reflection helper
            Practice area: ${request.practiceArea}
            User reflection: ${request.userText}
            Task: help the user make the reflection specific, honest, and short.
            Boundary: preserve the user's agency and do not invent proof.
        """.trimIndent()
    }

    private fun feedbackDraft(request: AiAssistRequest): String {
        return """
            Surface: feedback draft
            Feedback type: ${request.desiredFeedbackType}
            Current text: ${request.userText}
            Task: suggest kind, specific, actionable feedback.
            Boundary: do not judge the person. Focus on the practice.
        """.trimIndent()
    }

    private fun safetyReview(request: AiAssistRequest): String {
        return """
            Surface: safety review
            Text: ${request.userText}
            Task: identify unsafe or unhelpful phrasing and suggest a safer rewrite.
            Boundary: escalate harmful content to human review.
        """.trimIndent()
    }
}
