package com.collective.app.beta.config

/**
 * Central switches for the closed-beta build.
 *
 * The beta social loop runs entirely on in-memory mock repositories by default so the app builds and
 * demos with no backend. Real Firebase repository implementations are written and compiled, but they
 * are only constructed (and Firebase only touched) when [USE_FIREBASE] is true. Keep this false until a
 * Firebase project + google-services.json exist and the google-services plugin is applied.
 */
object BetaConfig {
    /** Flip to true only after wiring a real Firebase project. See beta/firebase/FirebaseSchema.md. */
    const val USE_FIREBASE: Boolean = false

    /** The single closed cohort for the founding beta. */
    const val DEFAULT_COHORT_ID: String = "founding-circle"

    /** Seeded founder/admin user id — gates the Beta Feedback Review screen in mock mode. */
    const val FOUNDER_USER_ID: String = "user-alex"
}
