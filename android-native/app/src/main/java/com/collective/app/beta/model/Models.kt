package com.collective.app.beta.model

/**
 * Closed-beta domain models. Field shapes mirror the product spec and use only Firebase-compatible
 * primitives (String ids, Long epoch-millis timestamps, Lists, and nullable fields) so the same data
 * classes can be (de)serialized by Firestore later. Nullable/optional fields carry defaults so adding
 * fields in future never breaks existing construction sites.
 */

data class UserProfile(
    val id: String,
    val displayName: String,
    val photoUrl: String? = null,
    val cohortId: String,
    val selectedDirectionId: String? = null,
    val trustLevel: TrustLevel = TrustLevel.NEW,
    val trustScore: Int = 0,
    val createdAt: Long = 0L,
) {
    val initials: String
        get() = displayName.trim()
            .split(" ")
            .filter { it.isNotBlank() }
            .take(2)
            .joinToString("") { it.first().uppercase() }
            .ifBlank { "?" }
}

data class Cohort(
    val id: String,
    val name: String,
    val inviteCode: String? = null,
    val isClosed: Boolean = true,
    val createdAt: Long = 0L,
)

/** A focused practice direction (the launch wedge). Not a course or content feed. */
data class Direction(
    val id: String,
    val title: String,
    val description: String,
    val wedge: String,
    val isActive: Boolean = true,
)

data class PracticePrompt(
    val id: String,
    val directionId: String,
    val title: String,
    val shortDescription: String,
    val estimatedMinutes: Int,
    val proofTypes: List<ProofType> = listOf(ProofType.TEXT),
    val difficulty: PracticeDifficulty = PracticeDifficulty.STARTER,
    val isActive: Boolean = true,
    /** One short sentence: why this small step helps. */
    val whyItHelps: String = "",
    /** Optional concrete examples, collapsed by default in the UI. */
    val examples: List<String> = emptyList(),
)

data class ProofAttachment(
    val id: String,
    val type: ProofType,
    val localUri: String? = null,
    val remoteUrl: String? = null,
    val mimeType: String? = null,
    val durationMs: Long? = null,
    val createdAt: Long = 0L,
)

data class Proof(
    val id: String,
    val ownerUserId: String,
    val ownerDisplayName: String,
    val cohortId: String,
    val directionId: String,
    val promptId: String,
    val promptTitle: String,
    val reflectionText: String = "",
    val attachments: List<ProofAttachment> = emptyList(),
    val status: ProofStatus = ProofStatus.SUBMITTED,
    val feedbackCount: Int = 0,
    val createdAt: Long = 0L,
    val updatedAt: Long = 0L,
) {
    /** The dominant proof type for compact previews. Falls back to TEXT when there is no media. */
    val primaryType: ProofType
        get() = attachments.firstOrNull()?.type ?: ProofType.TEXT
}

/** Beginner-safe structured peer feedback: three short fields, never a generic comment box. */
data class Feedback(
    val id: String,
    val proofId: String,
    val proofOwnerUserId: String,
    val giverUserId: String,
    val giverDisplayName: String,
    val cohortId: String,
    val whatWorked: String = "",
    val suggestion: String = "",
    val encouragement: String = "",
    val isMarkedHelpful: Boolean = false,
    val createdAt: Long = 0L,
)

data class TrustEvent(
    val id: String,
    val userId: String,
    val cohortId: String,
    val type: TrustEventType,
    val points: Int,
    val sourceId: String? = null,
    val createdAt: Long = 0L,
)

/** Read-only calm progress summary derived from trust events + the user's recomputed score/level. */
data class TrustSummary(
    val trustScore: Int = 0,
    val trustLevel: TrustLevel = TrustLevel.NEW,
    val practicesCompleted: Int = 0,
    val proofsSubmitted: Int = 0,
    val feedbackGiven: Int = 0,
    val helpfulFeedbackGiven: Int = 0,
    val contributionsMade: Int = 0,
)

/**
 * App-experience feedback for the founder/dev team. This is NOT social proof content and must never
 * appear in the feed or affect trust score.
 */
data class AppFeedback(
    val id: String,
    val userId: String,
    val userDisplayName: String,
    val cohortId: String,
    val type: AppFeedbackType,
    val screen: AppFeedbackScreen,
    val message: String,
    val importance: AppFeedbackImportance,
    val suggestedImprovement: String? = null,
    val status: AppFeedbackStatus = AppFeedbackStatus.NEW,
    val createdAt: Long = 0L,
)
