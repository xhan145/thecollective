package com.collective.app.ui.feedback

/**
 * Feedback in Collective is for improvement, not judgment.
 * It is a private, local-only feedback note attached to a single proof.
 * It is never a comment, like, reaction, or public reply.
 */
enum class FeedbackTone {
    Encouraging,
    Specific,
    PracticeSuggestion,
}

enum class FeedbackStatus {
    New,
    Read,
    UsedForPractice,
}

data class FeedbackItem(
    val id: String,
    val proofId: String,
    val body: String,
    val tone: FeedbackTone,
    val authorName: String,
    val authorInitials: String,
    val createdAtMillis: Long,
    val status: FeedbackStatus,
)

data class FeedbackDraftState(
    val proofId: String? = null,
    val body: String = "",
    val selectedTone: FeedbackTone = FeedbackTone.Specific,
    val errorMessage: String? = null,
    val isSubmitting: Boolean = false,
    val isSubmitted: Boolean = false,
)

fun feedbackToneLabel(tone: FeedbackTone): String =
    when (tone) {
        FeedbackTone.Encouraging -> "Encouraging"
        FeedbackTone.Specific -> "Specific"
        FeedbackTone.PracticeSuggestion -> "Practice suggestion"
    }

fun feedbackStatusLabel(status: FeedbackStatus): String =
    when (status) {
        FeedbackStatus.New -> "New"
        FeedbackStatus.Read -> "Read"
        FeedbackStatus.UsedForPractice -> "Used for practice"
    }

fun relativeFeedbackTime(createdAtMillis: Long, nowMillis: Long = System.currentTimeMillis()): String {
    val ageMillis = (nowMillis - createdAtMillis).coerceAtLeast(0L)
    val minuteMillis = 60_000L
    val hourMillis = 60 * minuteMillis
    val dayMillis = 24 * hourMillis
    return when {
        ageMillis < minuteMillis -> "Just now"
        ageMillis < dayMillis -> "${(ageMillis / hourMillis).coerceAtLeast(1L)}h ago"
        else -> "${(ageMillis / dayMillis).coerceAtLeast(1L)}d ago"
    }
}
