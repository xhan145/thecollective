package com.collective.app.beta.repository.firebase

import android.net.Uri
import com.collective.app.beta.model.AppFeedback
import com.collective.app.beta.model.AppFeedbackStatus
import com.collective.app.beta.model.Cohort
import com.collective.app.beta.model.Direction
import com.collective.app.beta.model.Feedback
import com.collective.app.beta.model.PracticePrompt
import com.collective.app.beta.model.Proof
import com.collective.app.beta.model.ProofStatus
import com.collective.app.beta.model.TrustEvent
import com.collective.app.beta.model.TrustEventType
import com.collective.app.beta.model.TrustLevel
import com.collective.app.beta.model.TrustSummary
import com.collective.app.beta.model.UserProfile
import com.collective.app.beta.model.pointsFor
import com.collective.app.beta.model.trustLevelFor
import com.collective.app.beta.repository.AppFeedbackRepository
import com.collective.app.beta.repository.CohortRepository
import com.collective.app.beta.repository.DirectionRepository
import com.collective.app.beta.repository.FeedbackRepository
import com.collective.app.beta.repository.ProofRepository
import com.collective.app.beta.repository.PromptRepository
import com.collective.app.beta.repository.TrustRepository
import com.collective.app.beta.repository.UserRepository
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.QuerySnapshot
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

/**
 * Firebase-backed repository implementations (Firestore + Storage + Auth). They satisfy the same
 * interfaces as the mocks, so swapping is a single decision in createBetaRepositories. These compile
 * against the Firebase SDK on the classpath but are only constructed when BetaConfig.USE_FIREBASE is
 * true; while it is false, nothing here runs and no google-services.json is required.
 */

private fun <T> CoroutineScope.snapshotState(
    query: Query,
    initial: T,
    transform: (QuerySnapshot) -> T,
): StateFlow<T> = callbackFlow {
    val registration = query.addSnapshotListener { snapshot, _ ->
        if (snapshot != null) trySend(transform(snapshot))
    }
    awaitClose { registration.remove() }
}.stateIn(this, SharingStarted.Eagerly, initial)

private fun <T> CoroutineScope.docState(
    ref: DocumentReference,
    initial: T,
    transform: (DocumentSnapshot?) -> T,
): StateFlow<T> = callbackFlow {
    val registration = ref.addSnapshotListener { snapshot, _ -> trySend(transform(snapshot)) }
    awaitClose { registration.remove() }
}.stateIn(this, SharingStarted.Eagerly, initial)

// ----- User -----------------------------------------------------------------------------------

class FirebaseUserRepository(
    private val db: FirebaseFirestore,
    private val auth: FirebaseAuth,
    private val cohortId: String,
    private val scope: CoroutineScope,
) : UserRepository {

    override val users: StateFlow<List<UserProfile>> = scope.snapshotState(
        db.collection(FirebasePaths.USERS).whereEqualTo("cohortId", cohortId),
        emptyList(),
    ) { snap -> snap.documents.map { userProfileFrom(it, cohortId) } }

    private val placeholder = UserProfile(id = auth.currentUser?.uid.orEmpty(), displayName = "", cohortId = cohortId)

    private val currentUserState: StateFlow<UserProfile> = run {
        val uid = auth.currentUser?.uid
        if (uid.isNullOrBlank()) {
            MutableStateFlow(placeholder)
        } else {
            scope.docState(db.collection(FirebasePaths.USERS).document(uid), placeholder) { snap ->
                if (snap != null && snap.exists()) userProfileFrom(snap, cohortId) else placeholder
            }
        }
    }

    override fun getCurrentUser(): StateFlow<UserProfile> = currentUserState

    // No mock switching with real auth; the signed-in Firebase user is authoritative.
    override suspend fun switchMockUser(userId: String) = Unit

    override suspend fun updateSelectedDirection(directionId: String) {
        val uid = auth.currentUser?.uid ?: return
        db.collection(FirebasePaths.USERS).document(uid).update("selectedDirectionId", directionId).await()
    }

    override fun getUser(userId: String): UserProfile? = users.value.firstOrNull { it.id == userId }

    override fun observeUser(userId: String): Flow<UserProfile?> =
        users.map { list -> list.firstOrNull { it.id == userId } }

    override fun applyTrust(userId: String, score: Int, level: TrustLevel) {
        scope.launch {
            db.collection(FirebasePaths.USERS).document(userId)
                .update(mapOf("trustScore" to score, "trustLevel" to level.name))
                .await()
        }
    }
}

// ----- Cohort ---------------------------------------------------------------------------------

class FirebaseCohortRepository(
    db: FirebaseFirestore,
    private val cohortId: String,
    private val userRepository: UserRepository,
    scope: CoroutineScope,
) : CohortRepository {

    private val cohortState: StateFlow<Cohort> = scope.docState(
        db.document(FirebasePaths.cohort(cohortId)),
        Cohort(id = cohortId, name = "Founding Circle"),
    ) { snap -> if (snap != null && snap.exists()) cohortFrom(snap, cohortId) else Cohort(id = cohortId, name = "Founding Circle") }

    override fun getCurrentCohort(): StateFlow<Cohort> = cohortState

    override fun getCohortMembers(cohortId: String): Flow<List<UserProfile>> =
        userRepository.users.map { members -> members.filter { it.cohortId == cohortId } }
}

// ----- Direction ------------------------------------------------------------------------------

class FirebaseDirectionRepository(
    db: FirebaseFirestore,
    private val scope: CoroutineScope,
) : DirectionRepository {

    private val directionsState: StateFlow<List<Direction>> = scope.snapshotState(
        db.collection(FirebasePaths.DIRECTIONS),
        emptyList(),
    ) { snap -> snap.documents.map { directionFrom(it) } }

    override fun getDirections(): StateFlow<List<Direction>> = directionsState

    override fun getDirection(directionId: String): Flow<Direction?> =
        directionsState.map { list -> list.firstOrNull { it.id == directionId } }

    override fun getDirectionNow(directionId: String): Direction? =
        directionsState.value.firstOrNull { it.id == directionId }
}

// ----- Prompts --------------------------------------------------------------------------------

class FirebasePromptRepository(
    db: FirebaseFirestore,
    private val scope: CoroutineScope,
) : PromptRepository {

    private val allPrompts: StateFlow<List<PracticePrompt>> = scope.snapshotState(
        db.collection(FirebasePaths.PROMPTS),
        emptyList(),
    ) { snap -> snap.documents.map { practicePromptFrom(it) } }

    override fun getPromptsForDirection(directionId: String): Flow<List<PracticePrompt>> =
        allPrompts.map { list -> list.filter { it.directionId == directionId && it.isActive } }

    override fun getTodayPrompt(userId: String, directionId: String): Flow<PracticePrompt?> =
        allPrompts.map { list ->
            val forDirection = list.filter { it.directionId == directionId && it.isActive }
            if (forDirection.isEmpty()) null
            else forDirection[(userId.hashCode().let { if (it < 0) -it else it }) % forDirection.size]
        }

    override fun getPromptNow(promptId: String): PracticePrompt? =
        allPrompts.value.firstOrNull { it.id == promptId }

    override fun promptsForNow(directionId: String): List<PracticePrompt> =
        allPrompts.value.filter { it.directionId == directionId && it.isActive }
}

// ----- Proof ----------------------------------------------------------------------------------

class FirebaseProofRepository(
    private val db: FirebaseFirestore,
    private val storage: FirebaseStorage,
    private val cohortId: String,
    private val trustRepository: TrustRepository,
    scope: CoroutineScope,
) : ProofRepository {

    private val feedState: StateFlow<List<Proof>> = scope.snapshotState(
        db.collection(FirebasePaths.proofs(cohortId)).orderBy("createdAt", Query.Direction.DESCENDING),
        emptyList(),
    ) { snap -> snap.documents.map { proofFrom(it, cohortId) } }

    override fun getProofFeed(cohortId: String): StateFlow<List<Proof>> = feedState

    override fun getProofsByUser(userId: String): Flow<List<Proof>> =
        feedState.map { list -> list.filter { it.ownerUserId == userId } }

    override fun getProof(proofId: String): Flow<Proof?> =
        feedState.map { list -> list.firstOrNull { it.id == proofId } }

    override fun getProofNow(proofId: String): Proof? = feedState.value.firstOrNull { it.id == proofId }

    override suspend fun saveDraftProof(proof: Proof) {
        val draft = proof.copy(status = ProofStatus.DRAFT, updatedAt = System.currentTimeMillis())
        db.collection(FirebasePaths.proofs(cohortId)).document(draft.id).set(draft.toMap()).await()
    }

    override suspend fun submitProof(proof: Proof): Proof {
        val uploaded = proof.attachments.map { attachment ->
            val localUri = attachment.localUri
            if (localUri == null) {
                attachment
            } else {
                val ref = storage.reference.child(
                    FirebasePaths.storageAttachment(cohortId, proof.ownerUserId, proof.id, attachment.id),
                )
                ref.putFile(Uri.parse(localUri)).await()
                attachment.copy(remoteUrl = ref.downloadUrl.await().toString())
            }
        }
        val finalProof = proof.copy(
            attachments = uploaded,
            status = ProofStatus.SUBMITTED,
            updatedAt = System.currentTimeMillis(),
        )
        db.collection(FirebasePaths.proofs(cohortId)).document(finalProof.id).set(finalProof.toMap()).await()
        trustRepository.addTrustEvent(
            userId = finalProof.ownerUserId,
            cohortId = cohortId,
            type = TrustEventType.PROOF_SUBMITTED,
            sourceId = finalProof.id,
        )
        return finalProof
    }
}

// ----- Feedback -------------------------------------------------------------------------------

class FirebaseFeedbackRepository(
    private val db: FirebaseFirestore,
    private val cohortId: String,
    private val trustRepository: TrustRepository,
    scope: CoroutineScope,
) : FeedbackRepository {

    override val allFeedback: StateFlow<List<Feedback>> = scope.snapshotState(
        db.collection(FirebasePaths.feedback(cohortId)),
        emptyList(),
    ) { snap -> snap.documents.map { feedbackFrom(it, cohortId) }.sortedByDescending { it.createdAt } }

    override fun getFeedbackForProof(proofId: String): Flow<List<Feedback>> =
        allFeedback.map { list -> list.filter { it.proofId == proofId } }

    override fun getFeedbackByGiver(giverUserId: String): Flow<List<Feedback>> =
        allFeedback.map { list -> list.filter { it.giverUserId == giverUserId } }

    override suspend fun addFeedback(feedback: Feedback): Feedback {
        db.collection(FirebasePaths.feedback(cohortId)).document(feedback.id).set(feedback.toMap()).await()
        trustRepository.addTrustEvent(
            userId = feedback.giverUserId,
            cohortId = cohortId,
            type = TrustEventType.FEEDBACK_GIVEN,
            sourceId = feedback.id,
        )
        return feedback
    }

    override suspend fun markHelpful(feedbackId: String) {
        val target = allFeedback.value.firstOrNull { it.id == feedbackId } ?: return
        if (target.isMarkedHelpful) return
        db.collection(FirebasePaths.feedback(cohortId)).document(feedbackId).update("isMarkedHelpful", true).await()
        trustRepository.addTrustEvent(
            userId = target.giverUserId,
            cohortId = cohortId,
            type = TrustEventType.FEEDBACK_MARKED_HELPFUL,
            sourceId = feedbackId,
        )
    }
}

// ----- Trust ----------------------------------------------------------------------------------

class FirebaseTrustRepository(
    private val db: FirebaseFirestore,
    private val cohortId: String,
    private val userRepository: UserRepository,
    scope: CoroutineScope,
) : TrustRepository {

    private val allEvents: StateFlow<List<TrustEvent>> = scope.snapshotState(
        db.collection(FirebasePaths.trustEvents(cohortId)),
        emptyList(),
    ) { snap -> snap.documents.map { trustEventFrom(it, cohortId) } }

    override fun getTrustEvents(userId: String): Flow<List<TrustEvent>> =
        allEvents.map { list -> list.filter { it.userId == userId }.sortedByDescending { it.createdAt } }

    override suspend fun addTrustEvent(
        userId: String,
        cohortId: String,
        type: TrustEventType,
        sourceId: String?,
    ): TrustEvent {
        val event = TrustEvent(
            id = "trust-${type.name.lowercase()}-${System.currentTimeMillis()}-$userId",
            userId = userId,
            cohortId = cohortId,
            type = type,
            points = pointsFor(type),
            sourceId = sourceId,
            createdAt = System.currentTimeMillis(),
        )
        db.collection(FirebasePaths.trustEvents(cohortId)).document(event.id).set(event.toMap()).await()
        val snapshot = db.collection(FirebasePaths.trustEvents(cohortId))
            .whereEqualTo("userId", userId).get().await()
        val score = snapshot.documents.sumOf { (it.getLong("points") ?: 0L).toInt() }
        userRepository.applyTrust(userId, score, trustLevelFor(score))
        return event
    }

    override fun getTrustSummary(userId: String): Flow<TrustSummary> =
        allEvents.map { events -> summaryFor(userId, events) }

    private fun summaryFor(userId: String, events: List<TrustEvent>): TrustSummary {
        val mine = events.filter { it.userId == userId }
        val score = mine.sumOf { it.points }
        return TrustSummary(
            trustScore = score,
            trustLevel = trustLevelFor(score),
            practicesCompleted = mine.count { it.type == TrustEventType.PRACTICE_COMPLETED },
            proofsSubmitted = mine.count { it.type == TrustEventType.PROOF_SUBMITTED },
            feedbackGiven = mine.count { it.type == TrustEventType.FEEDBACK_GIVEN },
            helpfulFeedbackGiven = mine.count { it.type == TrustEventType.FEEDBACK_MARKED_HELPFUL },
            contributionsMade = mine.count { it.type == TrustEventType.CONTRIBUTION_ACCEPTED },
        )
    }
}

// ----- App feedback ---------------------------------------------------------------------------

class FirebaseAppFeedbackRepository(
    private val db: FirebaseFirestore,
    private val cohortId: String,
    scope: CoroutineScope,
) : AppFeedbackRepository {

    private val cohortFeedback: StateFlow<List<AppFeedback>> = scope.snapshotState(
        db.collection(FirebasePaths.appFeedback(cohortId)),
        emptyList(),
    ) { snap -> snap.documents.map { appFeedbackFrom(it, cohortId) }.sortedByDescending { it.createdAt } }

    override fun getAppFeedbackForCohort(cohortId: String): StateFlow<List<AppFeedback>> = cohortFeedback

    override fun getAppFeedbackByUser(userId: String): Flow<List<AppFeedback>> =
        cohortFeedback.map { list -> list.filter { it.userId == userId } }

    override suspend fun submitAppFeedback(appFeedback: AppFeedback): AppFeedback {
        db.collection(FirebasePaths.appFeedback(cohortId)).document(appFeedback.id).set(appFeedback.toMap()).await()
        return appFeedback
    }

    override suspend fun updateAppFeedbackStatus(feedbackId: String, status: AppFeedbackStatus) {
        db.collection(FirebasePaths.appFeedback(cohortId)).document(feedbackId).update("status", status.name).await()
    }
}
