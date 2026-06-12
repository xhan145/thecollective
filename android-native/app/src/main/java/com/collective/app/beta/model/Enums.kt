package com.collective.app.beta.model

/**
 * Domain enums for the closed-beta social loop. These intentionally live in the beta package and are
 * distinct from the legacy data-layer enums and the live ui-layer enums to avoid name collisions
 * (e.g. there are already two 4-value TrustLevel enums elsewhere in the project).
 *
 * All values use Firebase-compatible names (stored as their `.name` string in Firestore).
 */

enum class ProofType { IMAGE, VIDEO, AUDIO, TEXT }

enum class ProofStatus { DRAFT, SUBMITTED, ARCHIVED }

enum class PracticeDifficulty { STARTER, GROWING, CHALLENGE }

/** Calm progress ladder. Never framed as rank or popularity. */
enum class TrustLevel { NEW, PRACTICING, RELIABLE, HELPFUL, CONTRIBUTOR }

enum class TrustEventType {
    PRACTICE_COMPLETED,
    PROOF_SUBMITTED,
    FEEDBACK_GIVEN,
    FEEDBACK_MARKED_HELPFUL,
    CONTRIBUTION_ACCEPTED,
}

enum class AppFeedbackType {
    CONFUSING,
    USEFUL,
    BUG,
    IDEA,
    TOO_MUCH_TEXT,
    MISSING_FEATURE,
    OTHER,
}

enum class AppFeedbackScreen {
    HOME,
    PRACTICE,
    PROOF_CAPTURE,
    FEED,
    PEER_FEEDBACK,
    TRUST_PROFILE,
    ONBOARDING,
    OTHER,
}

enum class AppFeedbackImportance { SMALL, MEDIUM, IMPORTANT, BLOCKING }

enum class AppFeedbackStatus { NEW, REVIEWED, PLANNED, RESOLVED, CLOSED }
