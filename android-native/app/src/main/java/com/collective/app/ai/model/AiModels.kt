package com.collective.app.ai.model

enum class AiAssistSurface {
    PRACTICE,
    PROOF,
    FEEDBACK,
    REFLECTION,
    SAFETY
}

enum class AiAssistIntent {
    PRACTICE_HELPER,
    REFLECTION_HELPER,
    FEEDBACK_DRAFT,
    SAFETY_REVIEW
}

data class AiAssistRequest(
    val surface: AiAssistSurface,
    val intent: AiAssistIntent,
    val userText: String = "",
    val practiceArea: String = "",
    val proofTitle: String = "",
    val desiredFeedbackType: String = ""
)

data class AiSafetyDecision(
    val allowed: Boolean,
    val reasons: List<String> = emptyList(),
    val rewriteGuidance: String? = null,
    val requiresHumanReview: Boolean = false
)

data class AiAssistResponse(
    val label: String,
    val primaryText: String,
    val suggestions: List<String>,
    val safety: AiSafetyDecision = AiSafetyDecision(allowed = true),
    val requiresHumanReview: Boolean = false,
    val disclaimer: String = "A helper can suggest wording, but people decide what is useful."
)

data class AiRoute(
    val path: String,
    val surface: AiAssistSurface,
    val intent: AiAssistIntent,
    val serverOnly: Boolean
)

data class AiEvalCase(
    val id: String,
    val prompt: String,
    val expectedIntent: AiAssistIntent,
    val mustIncludeAny: List<String>,
    val mustAvoid: List<String>
)

data class AiEvalResult(
    val caseId: String,
    val passed: Boolean,
    val notes: String
)
