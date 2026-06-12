package com.collective.app.ai.model

enum class AiAssistKind {
    REFLECTION_HELPER,
    PRACTICE_HELPER,
    FEEDBACK_DRAFT,
    SAFETY_REVIEW,
    PROOF_SUMMARY,
    PROGRESS_SUMMARY,
    PROFILE_REVIEW,
    EXPLANATION,
}

enum class AiRiskLevel {
    LOW,
    NEEDS_REPHRASE,
    UNSAFE,
}

data class AiContext(
    val pathTitle: String,
    val practiceTitle: String,
    val proofType: String,
    val visibility: String,
)

data class PracticeAssistRequest(
    val context: AiContext,
    val currentInstructions: List<String>,
    val userNeed: String,
)

data class ReflectionAssistRequest(
    val context: AiContext,
    val reflectionText: String,
    val feedbackRequest: String,
)

data class FeedbackDraftRequest(
    val proofSummary: String,
    val feedbackType: String,
    val currentDraft: String,
)

data class SafetyReviewRequest(
    val text: String,
    val intendedUse: AiAssistKind,
)

data class ProgressSummaryRequest(
    val streakDays: Int,
    val weeklyMomentumPercent: Int,
    val activePathCount: Int,
    val recentWins: List<String>,
    val feedbackReceived: List<String>,
)

data class ProfileReviewRequest(
    val displayName: String,
    val bio: String,
    val evidenceStats: Map<String, String>,
    val trustSignals: List<String>,
)

data class AiSignal(
    val name: String,
    val evidence: String,
    val weight: Double,
)

data class AiReasoningTrace(
    val inputSignals: List<AiSignal> = emptyList(),
    val activatedPrinciples: List<String> = emptyList(),
    val confidenceNotes: List<String> = emptyList(),
)

data class AiAssistResponse(
    val kind: AiAssistKind,
    val summary: String,
    val suggestions: List<String>,
    val nextStep: String,
    val reflectionQuestion: String,
    val riskLevel: AiRiskLevel,
    val confidenceScore: Double,
    val safetyNotes: List<String>,
    val trace: AiReasoningTrace = AiReasoningTrace(),
)

data class AiEvalCase(
    val id: String,
    val title: String,
    val input: String,
    val expectedBehavior: String,
    val mustAvoid: List<String>,
)
