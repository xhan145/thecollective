package com.collective.app.data.local.db

import android.content.Context
import com.collective.app.data.local.dao.ActivityDao
import com.collective.app.data.local.dao.AiRunDao
import com.collective.app.data.local.dao.AiSafetyReviewDao
import com.collective.app.data.local.dao.FeedbackDao
import com.collective.app.data.local.dao.PracticeCompletionDao
import com.collective.app.data.local.dao.PracticeSessionDao
import com.collective.app.data.local.dao.ProofDao
import com.collective.app.data.local.dao.ProofMediaDao
import com.collective.app.data.local.dao.TrustEventDao
import com.collective.app.data.local.dao.UserPreferenceDao
import com.collective.app.data.local.entity.ActivityEntity
import com.collective.app.data.local.entity.AiRunEntity
import com.collective.app.data.local.entity.AiSafetyReviewEntity
import com.collective.app.data.local.entity.FeedbackEntity
import com.collective.app.data.local.entity.PracticeCompletionEntity
import com.collective.app.data.local.entity.PracticeSessionEntity
import com.collective.app.data.local.entity.ProofEntity
import com.collective.app.data.local.entity.ProofMediaEntity
import com.collective.app.data.local.entity.TrustEventEntity
import com.collective.app.data.local.entity.UserPreferenceEntity
import org.json.JSONObject

/*
 * Local database boundary for v0.5 alpha.
 * The app keeps a DAO/entity split so this can move directly onto Room when
 * Room artifacts are available in the Android build environment.
 */
class CollectiveLocalDatabase(context: Context) {
    private val store = LocalJsonStore(context.applicationContext)

    val practiceSessions: PracticeSessionDao = JsonPracticeSessionDao(store)
    val practiceCompletions: PracticeCompletionDao = JsonPracticeCompletionDao(store)
    val proofs: ProofDao = JsonProofDao(store)
    val proofMedia: ProofMediaDao = JsonProofMediaDao(store)
    val feedback: FeedbackDao = JsonFeedbackDao(store)
    val trustEvents: TrustEventDao = JsonTrustEventDao(store)
    val activity: ActivityDao = JsonActivityDao(store)
    val aiRuns: AiRunDao = JsonAiRunDao(store)
    val aiSafetyReviews: AiSafetyReviewDao = JsonAiSafetyReviewDao(store)
    val userPreferences: UserPreferenceDao = JsonUserPreferenceDao(store)
}

private class JsonPracticeSessionDao(private val store: LocalJsonStore) : PracticeSessionDao {
    override fun all(): List<PracticeSessionEntity> =
        store.readTable("practice_sessions").map {
            PracticeSessionEntity(
                id = it.getString("id"),
                userId = it.getString("userId"),
                pathId = it.getString("pathId"),
                practiceId = it.getString("practiceId"),
                status = it.getString("status"),
                startedAt = it.getString("startedAt"),
                completedAt = it.nullableString("completedAt"),
            )
        }

    override fun upsert(entity: PracticeSessionEntity) {
        val existing = store.readTable("practice_sessions").filterNot { it.optString("id") == entity.id }
        store.writeTable("practice_sessions", listOf(entity.toJson()) + existing)
    }
}

private class JsonPracticeCompletionDao(private val store: LocalJsonStore) : PracticeCompletionDao {
    override fun all(): List<PracticeCompletionEntity> =
        store.readTable("practice_completions").map {
            PracticeCompletionEntity(
                id = it.getString("id"),
                userId = it.getString("userId"),
                pathId = it.getString("pathId"),
                practiceId = it.getString("practiceId"),
                createdAt = it.getString("createdAt"),
            )
        }

    override fun insert(entity: PracticeCompletionEntity) {
        store.writeTable("practice_completions", listOf(entity.toJson()) + store.readTable("practice_completions"))
    }
}

private class JsonProofDao(private val store: LocalJsonStore) : ProofDao {
    override fun all(): List<ProofEntity> =
        store.readTable("proofs").map {
            ProofEntity(
                id = it.getString("id"),
                userId = it.getString("userId"),
                pathId = it.getString("pathId"),
                title = it.getString("title"),
                reflectionText = it.getString("reflectionText"),
                feedbackRequest = it.getString("feedbackRequest"),
                mediaKind = it.getString("mediaKind"),
                mediaLocalUri = it.nullableString("mediaLocalUri"),
                visibility = it.getString("visibility"),
                status = it.getString("status"),
                feedbackCount = it.getInt("feedbackCount"),
                trustWeight = it.getInt("trustWeight"),
                createdAt = it.getString("createdAt"),
                updatedAt = it.getString("updatedAt"),
            )
        }

    override fun upsert(entity: ProofEntity) {
        val existing = store.readTable("proofs").filterNot { it.optString("id") == entity.id }
        store.writeTable("proofs", listOf(entity.toJson()) + existing)
    }

    override fun update(entity: ProofEntity) = upsert(entity)
}

private class JsonProofMediaDao(private val store: LocalJsonStore) : ProofMediaDao {
    override fun all(): List<ProofMediaEntity> =
        store.readTable("proof_media").map {
            ProofMediaEntity(
                id = it.getString("id"),
                proofId = it.nullableString("proofId"),
                userId = it.getString("userId"),
                mediaKind = it.getString("mediaKind"),
                fileName = it.nullableString("fileName"),
                fileType = it.nullableString("fileType"),
                fileSizeBytes = it.nullableLong("fileSizeBytes"),
                localUri = it.nullableString("localUri"),
                storagePath = it.nullableString("storagePath"),
                thumbnailUrl = it.nullableString("thumbnailUrl"),
                uploadStatus = it.getString("uploadStatus"),
                createdAt = it.getString("createdAt"),
            )
        }

    override fun upsert(entity: ProofMediaEntity) {
        val existing = store.readTable("proof_media").filterNot { it.optString("id") == entity.id }
        store.writeTable("proof_media", listOf(entity.toJson()) + existing)
    }
}

private class JsonFeedbackDao(private val store: LocalJsonStore) : FeedbackDao {
    override fun all(): List<FeedbackEntity> =
        store.readTable("feedback").map {
            FeedbackEntity(
                id = it.getString("id"),
                proofId = it.getString("proofId"),
                reviewerId = it.getString("reviewerId"),
                feedbackText = it.getString("feedbackText"),
                feedbackKind = it.getString("feedbackKind"),
                helpfulCount = it.getInt("helpfulCount"),
                createdAt = it.getString("createdAt"),
            )
        }

    override fun insert(entity: FeedbackEntity) {
        store.writeTable("feedback", listOf(entity.toJson()) + store.readTable("feedback"))
    }
}

private class JsonTrustEventDao(private val store: LocalJsonStore) : TrustEventDao {
    override fun all(): List<TrustEventEntity> =
        store.readTable("trust_events").map {
            TrustEventEntity(
                id = it.getString("id"),
                userId = it.getString("userId"),
                source = it.getString("source"),
                sourceId = it.getString("sourceId"),
                points = it.getInt("points"),
                reason = it.getString("reason"),
                createdAt = it.getString("createdAt"),
            )
        }

    override fun insert(entity: TrustEventEntity) {
        store.writeTable("trust_events", listOf(entity.toJson()) + store.readTable("trust_events"))
    }
}

private class JsonActivityDao(private val store: LocalJsonStore) : ActivityDao {
    override fun all(): List<ActivityEntity> =
        store.readTable("activity").map {
            ActivityEntity(
                id = it.getString("id"),
                title = it.getString("title"),
                body = it.getString("body"),
                category = it.getString("category"),
                createdAt = it.getString("createdAt"),
            )
        }

    override fun insert(entity: ActivityEntity) {
        store.writeTable("activity", listOf(entity.toJson()) + store.readTable("activity"))
    }
}

private class JsonAiRunDao(private val store: LocalJsonStore) : AiRunDao {
    override fun all(): List<AiRunEntity> =
        store.readTable("ai_runs").map {
            AiRunEntity(
                id = it.getString("id"),
                kind = it.getString("kind"),
                inputSummary = it.getString("inputSummary"),
                outputSummary = it.getString("outputSummary"),
                riskLevel = it.getString("riskLevel"),
                confidenceScore = it.getDouble("confidenceScore"),
                traceSummary = it.getString("traceSummary"),
                createdAt = it.getString("createdAt"),
            )
        }

    override fun insert(entity: AiRunEntity) {
        store.writeTable("ai_runs", listOf(entity.toJson()) + store.readTable("ai_runs").take(99))
    }

    override fun clear() {
        store.writeTable("ai_runs", emptyList())
    }
}

private class JsonAiSafetyReviewDao(private val store: LocalJsonStore) : AiSafetyReviewDao {
    override fun all(): List<AiSafetyReviewEntity> =
        store.readTable("ai_safety_reviews").map {
            AiSafetyReviewEntity(
                id = it.getString("id"),
                targetType = it.getString("targetType"),
                targetId = it.nullableString("targetId"),
                textSummary = it.getString("textSummary"),
                intendedUse = it.getString("intendedUse"),
                riskLevel = it.getString("riskLevel"),
                decision = it.getString("decision"),
                notes = it.getString("notes"),
                createdAt = it.getString("createdAt"),
            )
        }

    override fun insert(entity: AiSafetyReviewEntity) {
        store.writeTable("ai_safety_reviews", listOf(entity.toJson()) + store.readTable("ai_safety_reviews").take(99))
    }
}

private class JsonUserPreferenceDao(private val store: LocalJsonStore) : UserPreferenceDao {
    override fun all(): List<UserPreferenceEntity> =
        store.readTable("user_preferences").map {
            UserPreferenceEntity(
                key = it.getString("key"),
                value = it.getString("value"),
                updatedAt = it.getString("updatedAt"),
            )
        }

    override fun upsert(entity: UserPreferenceEntity) {
        val existing = store.readTable("user_preferences").filterNot { it.optString("key") == entity.key }
        store.writeTable("user_preferences", listOf(entity.toJson()) + existing)
    }
}

private fun PracticeSessionEntity.toJson() = JSONObject()
    .put("id", id)
    .put("userId", userId)
    .put("pathId", pathId)
    .put("practiceId", practiceId)
    .put("status", status)
    .put("startedAt", startedAt)
    .put("completedAt", completedAt)

private fun PracticeCompletionEntity.toJson() = JSONObject()
    .put("id", id)
    .put("userId", userId)
    .put("pathId", pathId)
    .put("practiceId", practiceId)
    .put("createdAt", createdAt)

private fun ProofEntity.toJson() = JSONObject()
    .put("id", id)
    .put("userId", userId)
    .put("pathId", pathId)
    .put("title", title)
    .put("reflectionText", reflectionText)
    .put("feedbackRequest", feedbackRequest)
    .put("mediaKind", mediaKind)
    .put("mediaLocalUri", mediaLocalUri)
    .put("visibility", visibility)
    .put("status", status)
    .put("feedbackCount", feedbackCount)
    .put("trustWeight", trustWeight)
    .put("createdAt", createdAt)
    .put("updatedAt", updatedAt)

private fun ProofMediaEntity.toJson() = JSONObject()
    .put("id", id)
    .put("proofId", proofId)
    .put("userId", userId)
    .put("mediaKind", mediaKind)
    .put("fileName", fileName)
    .put("fileType", fileType)
    .put("fileSizeBytes", fileSizeBytes)
    .put("localUri", localUri)
    .put("storagePath", storagePath)
    .put("thumbnailUrl", thumbnailUrl)
    .put("uploadStatus", uploadStatus)
    .put("createdAt", createdAt)

private fun FeedbackEntity.toJson() = JSONObject()
    .put("id", id)
    .put("proofId", proofId)
    .put("reviewerId", reviewerId)
    .put("feedbackText", feedbackText)
    .put("feedbackKind", feedbackKind)
    .put("helpfulCount", helpfulCount)
    .put("createdAt", createdAt)

private fun TrustEventEntity.toJson() = JSONObject()
    .put("id", id)
    .put("userId", userId)
    .put("source", source)
    .put("sourceId", sourceId)
    .put("points", points)
    .put("reason", reason)
    .put("createdAt", createdAt)

private fun ActivityEntity.toJson() = JSONObject()
    .put("id", id)
    .put("title", title)
    .put("body", body)
    .put("category", category)
    .put("createdAt", createdAt)

private fun AiRunEntity.toJson() = JSONObject()
    .put("id", id)
    .put("kind", kind)
    .put("inputSummary", inputSummary)
    .put("outputSummary", outputSummary)
    .put("riskLevel", riskLevel)
    .put("confidenceScore", confidenceScore)
    .put("traceSummary", traceSummary)
    .put("createdAt", createdAt)

private fun AiSafetyReviewEntity.toJson() = JSONObject()
    .put("id", id)
    .put("targetType", targetType)
    .put("targetId", targetId)
    .put("textSummary", textSummary)
    .put("intendedUse", intendedUse)
    .put("riskLevel", riskLevel)
    .put("decision", decision)
    .put("notes", notes)
    .put("createdAt", createdAt)

private fun UserPreferenceEntity.toJson() = JSONObject()
    .put("key", key)
    .put("value", value)
    .put("updatedAt", updatedAt)

private fun JSONObject.nullableString(name: String): String? =
    if (has(name) && !isNull(name)) optString(name).ifBlank { null } else null

private fun JSONObject.nullableLong(name: String): Long? =
    if (has(name) && !isNull(name)) optLong(name) else null
