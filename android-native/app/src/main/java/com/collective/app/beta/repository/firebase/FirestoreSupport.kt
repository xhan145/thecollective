package com.collective.app.beta.repository.firebase

import com.collective.app.beta.model.AppFeedback
import com.collective.app.beta.model.AppFeedbackImportance
import com.collective.app.beta.model.AppFeedbackScreen
import com.collective.app.beta.model.AppFeedbackStatus
import com.collective.app.beta.model.AppFeedbackType
import com.collective.app.beta.model.Cohort
import com.collective.app.beta.model.Direction
import com.collective.app.beta.model.Feedback
import com.collective.app.beta.model.PracticeDifficulty
import com.collective.app.beta.model.PracticePrompt
import com.collective.app.beta.model.Proof
import com.collective.app.beta.model.ProofAttachment
import com.collective.app.beta.model.ProofStatus
import com.collective.app.beta.model.ProofType
import com.collective.app.beta.model.TrustEvent
import com.collective.app.beta.model.TrustEventType
import com.collective.app.beta.model.TrustLevel
import com.collective.app.beta.model.UserProfile
import com.google.firebase.firestore.DocumentSnapshot

/**
 * Firestore collection paths and manual model <-> map converters for the closed-beta loop. Manual
 * mapping (rather than `toObject`) keeps enum/string handling explicit and avoids no-arg-constructor
 * requirements on the data classes.
 */
object FirebasePaths {
    const val USERS = "users"
    const val COHORTS = "cohorts"
    const val DIRECTIONS = "directions"
    const val PROMPTS = "practicePrompts"
    const val INVITES = "invites"

    fun cohort(cohortId: String) = "$COHORTS/$cohortId"
    fun members(cohortId: String) = "$COHORTS/$cohortId/members"
    fun proofs(cohortId: String) = "$COHORTS/$cohortId/proofs"
    fun feedback(cohortId: String) = "$COHORTS/$cohortId/feedback"
    fun trustEvents(cohortId: String) = "$COHORTS/$cohortId/trustEvents"
    fun appFeedback(cohortId: String) = "$COHORTS/$cohortId/appFeedback"

    fun storageAttachment(cohortId: String, userId: String, proofId: String, attachmentId: String) =
        "proofs/$cohortId/$userId/$proofId/$attachmentId"
}

private inline fun <reified T : Enum<T>> enumOrDefault(value: Any?, default: T): T =
    (value as? String)?.let { name -> runCatching { enumValueOf<T>(name) }.getOrNull() } ?: default

// ----- UserProfile ----------------------------------------------------------------------------

fun UserProfile.toMap(): Map<String, Any?> = mapOf(
    "id" to id,
    "displayName" to displayName,
    "photoUrl" to photoUrl,
    "cohortId" to cohortId,
    "selectedDirectionId" to selectedDirectionId,
    "trustLevel" to trustLevel.name,
    "trustScore" to trustScore,
    "createdAt" to createdAt,
)

fun userProfileFrom(doc: DocumentSnapshot, fallbackCohortId: String): UserProfile = UserProfile(
    id = doc.id,
    displayName = doc.getString("displayName").orEmpty(),
    photoUrl = doc.getString("photoUrl"),
    cohortId = doc.getString("cohortId") ?: fallbackCohortId,
    selectedDirectionId = doc.getString("selectedDirectionId"),
    trustLevel = enumOrDefault(doc.getString("trustLevel"), TrustLevel.NEW),
    trustScore = doc.getLong("trustScore")?.toInt() ?: 0,
    createdAt = doc.getLong("createdAt") ?: 0L,
)

// ----- Cohort ---------------------------------------------------------------------------------

fun cohortFrom(doc: DocumentSnapshot, fallbackId: String): Cohort = Cohort(
    id = doc.getString("id") ?: fallbackId,
    name = doc.getString("name").orEmpty(),
    inviteCode = doc.getString("inviteCode"),
    isClosed = doc.getBoolean("isClosed") ?: true,
    createdAt = doc.getLong("createdAt") ?: 0L,
)

// ----- Direction ------------------------------------------------------------------------------

fun directionFrom(doc: DocumentSnapshot): Direction = Direction(
    id = doc.id,
    title = doc.getString("title").orEmpty(),
    description = doc.getString("description").orEmpty(),
    wedge = doc.getString("wedge").orEmpty(),
    isActive = doc.getBoolean("isActive") ?: true,
)

// ----- PracticePrompt -------------------------------------------------------------------------

fun practicePromptFrom(doc: DocumentSnapshot): PracticePrompt = PracticePrompt(
    id = doc.id,
    directionId = doc.getString("directionId").orEmpty(),
    title = doc.getString("title").orEmpty(),
    shortDescription = doc.getString("shortDescription").orEmpty(),
    estimatedMinutes = doc.getLong("estimatedMinutes")?.toInt() ?: 0,
    proofTypes = (doc.get("proofTypes") as? List<*>)
        ?.mapNotNull { it as? String }
        ?.map { enumOrDefault(it, ProofType.TEXT) }
        ?: listOf(ProofType.TEXT),
    difficulty = enumOrDefault(doc.getString("difficulty"), PracticeDifficulty.STARTER),
    isActive = doc.getBoolean("isActive") ?: true,
    whyItHelps = doc.getString("whyItHelps").orEmpty(),
    examples = (doc.get("examples") as? List<*>)?.mapNotNull { it as? String } ?: emptyList(),
)

// ----- Proof + ProofAttachment ----------------------------------------------------------------

fun ProofAttachment.toMap(): Map<String, Any?> = mapOf(
    "id" to id,
    "type" to type.name,
    "localUri" to localUri,
    "remoteUrl" to remoteUrl,
    "mimeType" to mimeType,
    "durationMs" to durationMs,
    "createdAt" to createdAt,
)

private fun attachmentFrom(map: Map<*, *>): ProofAttachment = ProofAttachment(
    id = map["id"] as? String ?: "",
    type = enumOrDefault(map["type"], ProofType.TEXT),
    localUri = map["localUri"] as? String,
    remoteUrl = map["remoteUrl"] as? String,
    mimeType = map["mimeType"] as? String,
    durationMs = (map["durationMs"] as? Number)?.toLong(),
    createdAt = (map["createdAt"] as? Number)?.toLong() ?: 0L,
)

fun Proof.toMap(): Map<String, Any?> = mapOf(
    "id" to id,
    "ownerUserId" to ownerUserId,
    "ownerDisplayName" to ownerDisplayName,
    "cohortId" to cohortId,
    "directionId" to directionId,
    "promptId" to promptId,
    "promptTitle" to promptTitle,
    "reflectionText" to reflectionText,
    "attachments" to attachments.map { it.toMap() },
    "status" to status.name,
    "feedbackCount" to feedbackCount,
    "createdAt" to createdAt,
    "updatedAt" to updatedAt,
)

fun proofFrom(doc: DocumentSnapshot, fallbackCohortId: String): Proof = Proof(
    id = doc.id,
    ownerUserId = doc.getString("ownerUserId").orEmpty(),
    ownerDisplayName = doc.getString("ownerDisplayName").orEmpty(),
    cohortId = doc.getString("cohortId") ?: fallbackCohortId,
    directionId = doc.getString("directionId").orEmpty(),
    promptId = doc.getString("promptId").orEmpty(),
    promptTitle = doc.getString("promptTitle").orEmpty(),
    reflectionText = doc.getString("reflectionText").orEmpty(),
    attachments = (doc.get("attachments") as? List<*>)
        ?.mapNotNull { it as? Map<*, *> }
        ?.map { attachmentFrom(it) }
        ?: emptyList(),
    status = enumOrDefault(doc.getString("status"), ProofStatus.SUBMITTED),
    feedbackCount = doc.getLong("feedbackCount")?.toInt() ?: 0,
    createdAt = doc.getLong("createdAt") ?: 0L,
    updatedAt = doc.getLong("updatedAt") ?: 0L,
)

// ----- Feedback -------------------------------------------------------------------------------

fun Feedback.toMap(): Map<String, Any?> = mapOf(
    "id" to id,
    "proofId" to proofId,
    "proofOwnerUserId" to proofOwnerUserId,
    "giverUserId" to giverUserId,
    "giverDisplayName" to giverDisplayName,
    "cohortId" to cohortId,
    "whatWorked" to whatWorked,
    "suggestion" to suggestion,
    "encouragement" to encouragement,
    "isMarkedHelpful" to isMarkedHelpful,
    "createdAt" to createdAt,
)

fun feedbackFrom(doc: DocumentSnapshot, fallbackCohortId: String): Feedback = Feedback(
    id = doc.id,
    proofId = doc.getString("proofId").orEmpty(),
    proofOwnerUserId = doc.getString("proofOwnerUserId").orEmpty(),
    giverUserId = doc.getString("giverUserId").orEmpty(),
    giverDisplayName = doc.getString("giverDisplayName").orEmpty(),
    cohortId = doc.getString("cohortId") ?: fallbackCohortId,
    whatWorked = doc.getString("whatWorked").orEmpty(),
    suggestion = doc.getString("suggestion").orEmpty(),
    encouragement = doc.getString("encouragement").orEmpty(),
    isMarkedHelpful = doc.getBoolean("isMarkedHelpful") ?: false,
    createdAt = doc.getLong("createdAt") ?: 0L,
)

// ----- TrustEvent -----------------------------------------------------------------------------

fun TrustEvent.toMap(): Map<String, Any?> = mapOf(
    "id" to id,
    "userId" to userId,
    "cohortId" to cohortId,
    "type" to type.name,
    "points" to points,
    "sourceId" to sourceId,
    "createdAt" to createdAt,
)

fun trustEventFrom(doc: DocumentSnapshot, fallbackCohortId: String): TrustEvent = TrustEvent(
    id = doc.id,
    userId = doc.getString("userId").orEmpty(),
    cohortId = doc.getString("cohortId") ?: fallbackCohortId,
    type = enumOrDefault(doc.getString("type"), TrustEventType.PRACTICE_COMPLETED),
    points = doc.getLong("points")?.toInt() ?: 0,
    sourceId = doc.getString("sourceId"),
    createdAt = doc.getLong("createdAt") ?: 0L,
)

// ----- AppFeedback ----------------------------------------------------------------------------

fun AppFeedback.toMap(): Map<String, Any?> = mapOf(
    "id" to id,
    "userId" to userId,
    "userDisplayName" to userDisplayName,
    "cohortId" to cohortId,
    "type" to type.name,
    "screen" to screen.name,
    "message" to message,
    "importance" to importance.name,
    "suggestedImprovement" to suggestedImprovement,
    "status" to status.name,
    "createdAt" to createdAt,
)

fun appFeedbackFrom(doc: DocumentSnapshot, fallbackCohortId: String): AppFeedback = AppFeedback(
    id = doc.id,
    userId = doc.getString("userId").orEmpty(),
    userDisplayName = doc.getString("userDisplayName").orEmpty(),
    cohortId = doc.getString("cohortId") ?: fallbackCohortId,
    type = enumOrDefault(doc.getString("type"), AppFeedbackType.OTHER),
    screen = enumOrDefault(doc.getString("screen"), AppFeedbackScreen.OTHER),
    message = doc.getString("message").orEmpty(),
    importance = enumOrDefault(doc.getString("importance"), AppFeedbackImportance.MEDIUM),
    suggestedImprovement = doc.getString("suggestedImprovement"),
    status = enumOrDefault(doc.getString("status"), AppFeedbackStatus.NEW),
    createdAt = doc.getLong("createdAt") ?: 0L,
)
