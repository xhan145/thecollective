package com.collective.app.beta.repository

import com.collective.app.beta.config.BetaConfig
import com.collective.app.beta.repository.firebase.FirebaseAppFeedbackRepository
import com.collective.app.beta.repository.firebase.FirebaseCohortRepository
import com.collective.app.beta.repository.firebase.FirebaseDirectionRepository
import com.collective.app.beta.repository.firebase.FirebaseFeedbackRepository
import com.collective.app.beta.repository.firebase.FirebaseProofRepository
import com.collective.app.beta.repository.firebase.FirebasePromptRepository
import com.collective.app.beta.repository.firebase.FirebaseTrustRepository
import com.collective.app.beta.repository.firebase.FirebaseUserRepository
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.CoroutineScope

/**
 * Factory for the Firebase-backed repository set. Only called when [BetaConfig.USE_FIREBASE] is true,
 * so while the flag is false this never runs and Firebase is never initialized — the app stays on mock
 * data and the build needs no google-services.json.
 *
 * NOTE: this touches FirebaseFirestore/Storage/Auth singletons, which require an initialized
 * FirebaseApp (i.e. the google-services plugin applied + google-services.json present). Do not flip
 * USE_FIREBASE to true until that setup is complete — see beta/firebase/FirebaseSchema.md.
 */
fun createFirebaseRepositories(scope: CoroutineScope): BetaRepositories {
    val cohortId = BetaConfig.DEFAULT_COHORT_ID
    val db = FirebaseFirestore.getInstance()
    val auth = FirebaseAuth.getInstance()
    val storage = FirebaseStorage.getInstance()

    val userRepository = FirebaseUserRepository(db, auth, cohortId, scope)
    val trustRepository = FirebaseTrustRepository(db, cohortId, userRepository, scope)
    val cohortRepository = FirebaseCohortRepository(db, cohortId, userRepository, scope)
    val directionRepository = FirebaseDirectionRepository(db, scope)
    val promptRepository = FirebasePromptRepository(db, scope)
    val proofRepository = FirebaseProofRepository(db, storage, cohortId, trustRepository, scope)
    val feedbackRepository = FirebaseFeedbackRepository(db, cohortId, trustRepository, scope)
    val appFeedbackRepository = FirebaseAppFeedbackRepository(db, cohortId, scope)

    return BetaRepositories(
        userRepository = userRepository,
        cohortRepository = cohortRepository,
        directionRepository = directionRepository,
        promptRepository = promptRepository,
        proofRepository = proofRepository,
        feedbackRepository = feedbackRepository,
        trustRepository = trustRepository,
        appFeedbackRepository = appFeedbackRepository,
    )
}
