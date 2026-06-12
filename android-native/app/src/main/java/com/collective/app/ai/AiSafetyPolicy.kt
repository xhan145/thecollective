package com.collective.app.ai

import com.collective.app.ai.model.AiAssistKind
import com.collective.app.ai.model.AiRiskLevel
import com.collective.app.ai.model.SafetyReviewRequest

data class SafetyReview(
    val riskLevel: AiRiskLevel,
    val notes: List<String>,
)

object AiSafetyPolicy {
    private val blockedPhrases = listOf(
        "you are worthless",
        "trust score",
        "viral",
        "followers",
        "leaderboard",
        "paid trust",
    )

    fun review(request: SafetyReviewRequest): SafetyReview {
        val normalized = request.text.lowercase()
        val blocked = blockedPhrases.filter { normalized.contains(it) }
        if (blocked.isNotEmpty()) {
            return SafetyReview(
                riskLevel = AiRiskLevel.UNSAFE,
                notes = blocked.map { "Avoid '$it' in Collective copy." },
            )
        }

        val notes = mutableListOf<String>()
        if (request.intendedUse == AiAssistKind.FEEDBACK_DRAFT && request.text.trim().length in 1..18) {
            notes += "Feedback may be too short to be specific and useful."
        }
        if (normalized.contains("always") || normalized.contains("never")) {
            notes += "Absolute language can feel harsh; make it specific to this practice."
        }

        return SafetyReview(
            riskLevel = if (notes.isEmpty()) AiRiskLevel.LOW else AiRiskLevel.NEEDS_REPHRASE,
            notes = if (notes.isEmpty()) listOf("Looks practice-focused and beginner-safe.") else notes,
        )
    }
}
