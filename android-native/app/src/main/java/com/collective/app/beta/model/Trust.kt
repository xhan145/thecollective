package com.collective.app.beta.model

/**
 * Pure trust math. No Android imports — easy to reason about and unit-test.
 *
 * Trust is earned through practice, proof, useful peer feedback, and contribution. App-experience
 * feedback intentionally awards NO points (we do not want product feedback to be gamed).
 */

fun pointsFor(type: TrustEventType): Int = when (type) {
    TrustEventType.PRACTICE_COMPLETED -> 5
    TrustEventType.PROOF_SUBMITTED -> 5
    TrustEventType.FEEDBACK_GIVEN -> 3
    TrustEventType.FEEDBACK_MARKED_HELPFUL -> 7
    TrustEventType.CONTRIBUTION_ACCEPTED -> 15
}

fun trustLevelFor(score: Int): TrustLevel = when {
    score >= 200 -> TrustLevel.CONTRIBUTOR
    score >= 100 -> TrustLevel.HELPFUL
    score >= 50 -> TrustLevel.RELIABLE
    score >= 20 -> TrustLevel.PRACTICING
    else -> TrustLevel.NEW
}

fun trustLevelLabel(level: TrustLevel): String = when (level) {
    TrustLevel.NEW -> "New"
    TrustLevel.PRACTICING -> "Practicing"
    TrustLevel.RELIABLE -> "Reliable"
    TrustLevel.HELPFUL -> "Helpful"
    TrustLevel.CONTRIBUTOR -> "Contributor"
}

/** Points needed to reach the next level, or null at the top. Used for a calm progress hint. */
fun nextLevelThreshold(level: TrustLevel): Int? = when (level) {
    TrustLevel.NEW -> 20
    TrustLevel.PRACTICING -> 50
    TrustLevel.RELIABLE -> 100
    TrustLevel.HELPFUL -> 200
    TrustLevel.CONTRIBUTOR -> null
}
