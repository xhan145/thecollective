package com.collective.app.ai

import com.collective.app.data.FeedbackType
import com.collective.app.data.ProofSubmission

object AiSupportService {
    fun summarizeProof(proof: ProofSubmission): String {
        return proof.aiSummary ?: "This proof captures a small practice step and a reflection that can receive useful feedback."
    }

    fun suggestReflectionPrompts(practiceArea: String): List<String> {
        return listOf(
            "What did you practice, specifically?",
            "What felt easier or clearer than before?",
            "What is one next step that would make this more useful?"
        )
    }

    fun suggestFeedbackPrompts(type: FeedbackType): List<String> {
        return when (type) {
            FeedbackType.ENCOURAGEMENT -> listOf("Name one concrete thing that worked.")
            FeedbackType.SUGGESTION -> listOf("Offer one next step they can try soon.")
            FeedbackType.QUESTION -> listOf("Ask a question that helps them reflect.")
            FeedbackType.CORRECTION -> listOf("Be gentle, specific, and focused on the practice.")
        }
    }

    fun flagLowQualityFeedback(text: String): Boolean {
        val trimmed = text.trim()
        return trimmed.length < 12 || trimmed.equals("good job", ignoreCase = true)
    }
}

/*
AI boundaries for Collective:
- AI supports reflection and phrasing.
- AI does not judge user worth.
- AI does not decide trust.
- AI does not replace human feedback.
- AI does not generate fake proof.
- AI does not give medical, legal, or therapy advice.
*/
