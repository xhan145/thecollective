package com.collective.app.data

enum class MediaType(val label: String) {
    NONE("No media"),
    IMAGE("Image"),
    VIDEO("Video")
}

enum class Visibility(val label: String, val helper: String) {
    PRIVATE("Private", "Only you can see this proof."),
    FEEDBACK_ONLY("Feedback-only", "Visible to reviewers who can help."),
    PUBLIC("Public", "Visible in the practice stream.")
}

enum class ProofStatus(val label: String) {
    DRAFT("Draft"),
    SUBMITTED("Submitted"),
    FEEDBACK_RECEIVED("Feedback received"),
    ARCHIVED("Archived")
}

enum class FeedbackType(val label: String, val helper: String) {
    ENCOURAGEMENT("Encouragement", "Name what is working."),
    SUGGESTION("Suggestion", "Offer one useful next step."),
    QUESTION("Question", "Ask for helpful context."),
    CORRECTION("Correction", "Gently clarify what could improve.")
}

enum class TrustSourceType {
    PROOF_SUBMISSION,
    FEEDBACK_GIVEN,
    FEEDBACK_RECEIVED,
    CONTRIBUTION
}

enum class TrustLevel(val label: String) {
    NEW("New"),
    PRACTICING("Practicing"),
    RELIABLE("Reliable"),
    CONTRIBUTOR("Contributor")
}

data class ProofSubmission(
    val id: String,
    val userId: String,
    val title: String,
    val reflectionText: String,
    val mediaUrl: String?,
    val mediaType: MediaType,
    val mediaThumbnailUrl: String?,
    val practiceArea: String,
    val visibility: Visibility,
    val status: ProofStatus,
    val aiSummary: String?,
    val feedbackCount: Int,
    val trustWeight: Int,
    val createdAt: String,
    val updatedAt: String,
    val consistentPracticeCount: Int = 0
)

data class Feedback(
    val id: String,
    val proofId: String,
    val reviewerId: String,
    val feedbackText: String,
    val feedbackType: FeedbackType,
    val helpfulCount: Int,
    val createdAt: String
)

data class TrustEvent(
    val id: String,
    val userId: String,
    val sourceType: TrustSourceType,
    val sourceId: String,
    val points: Int,
    val reason: String,
    val createdAt: String
)

data class UserProgress(
    val userId: String,
    val trustScore: Int,
    val trustLevel: TrustLevel,
    val proofCount: Int,
    val feedbackGivenCount: Int,
    val feedbackReceivedCount: Int,
    val currentPracticeStreak: Int
)

fun calculateTrustLevel(score: Int): TrustLevel {
    return when {
        score >= 150 -> TrustLevel.CONTRIBUTOR
        score >= 75 -> TrustLevel.RELIABLE
        score >= 25 -> TrustLevel.PRACTICING
        else -> TrustLevel.NEW
    }
}
