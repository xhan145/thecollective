package com.collective.app.data.local

import com.collective.app.data.MockData
import com.collective.app.data.local.db.CollectiveLocalDatabase
import com.collective.app.data.local.entity.ActivityEntity
import com.collective.app.data.local.entity.PracticeCompletionEntity
import com.collective.app.data.local.entity.PracticeSessionEntity
import com.collective.app.data.local.mapper.toEntity
import com.collective.app.data.local.mapper.toModel
import com.collective.app.data.model.AuthSession
import com.collective.app.data.model.CollectivePathRecord
import com.collective.app.data.model.FeedbackDraft
import com.collective.app.data.model.FeedbackKind
import com.collective.app.data.model.FeedbackRecord
import com.collective.app.data.model.PracticeRecord
import com.collective.app.data.model.ProofDraft
import com.collective.app.data.model.ProofLifecycleStatus
import com.collective.app.data.model.ProofRecord
import com.collective.app.data.model.ProofVisibility
import com.collective.app.data.model.TrustEventRecord
import com.collective.app.data.model.TrustEventSource
import java.util.UUID

class LocalCollectiveDataSource(
    private val database: CollectiveLocalDatabase? = null,
) {
    private val demoUserId = "local-demo-user"
    private val proofs = database?.proofs?.all()?.map { it.toModel() }?.toMutableList() ?: mutableListOf()
    private val proofMedia = database?.proofMedia?.all()?.map { it.toModel() }?.toMutableList() ?: mutableListOf()
    private val feedback = database?.feedback?.all()?.map { it.toModel() }?.toMutableList() ?: mutableListOf()
    private val trustEvents = database?.trustEvents?.all()?.map { it.toModel() }?.toMutableList() ?: mutableListOf()
    private val practiceSessions = database?.practiceSessions?.all()?.toMutableList() ?: mutableListOf()
    private val completions = database?.practiceCompletions?.all()?.toMutableList() ?: mutableListOf()
    private val activity = database?.activity?.all()?.toMutableList() ?: mutableListOf()

    fun currentSession(): AuthSession =
        AuthSession(
            userId = demoUserId,
            displayName = MockData.currentUser.name,
            isAnonymousDemo = true,
        )

    fun paths(): List<CollectivePathRecord> =
        MockData.progressPaths.map {
            CollectivePathRecord(
                id = it.name.lowercase(),
                title = it.name,
                subtitle = it.subtitle,
                progressPercent = (it.progress * 100).toInt(),
            )
        }

    fun practice(pathId: String): PracticeRecord =
        PracticeRecord(
            id = "practice-$pathId-feedback-3-part",
            pathId = pathId,
            title = MockData.practicePrompt.prompt,
            instructions = MockData.practicePrompt.tips,
            estimatedSeconds = 30,
        )

    fun listProofs(): List<ProofRecord> = proofs.map(::withStoredMedia)

    fun startPractice(pathId: String, practiceId: String): PracticeSessionEntity {
        val now = LocalClock.nowIso()
        val session = PracticeSessionEntity(
            id = "practice-session-${UUID.randomUUID()}",
            userId = demoUserId,
            pathId = pathId,
            practiceId = practiceId,
            status = "STARTED",
            startedAt = now,
            completedAt = null,
        )
        practiceSessions.add(0, session)
        database?.practiceSessions?.upsert(session)
        recordActivity(
            title = "Practice started",
            body = "One small rep is active for $pathId.",
            category = "Practice",
            createdAt = now,
        )
        return session
    }

    fun completePractice(pathId: String, practiceId: String): PracticeCompletionEntity {
        val now = LocalClock.nowIso()
        val completion = PracticeCompletionEntity(
            id = "practice-completion-${UUID.randomUUID()}",
            userId = demoUserId,
            pathId = pathId,
            practiceId = practiceId,
            createdAt = now,
        )
        completions.add(0, completion)
        database?.practiceCompletions?.insert(completion)
        completeLatestStartedSession(pathId = pathId, practiceId = practiceId, completedAt = now)
        recordTrustEvent(
            source = TrustEventSource.PRACTICE_COMPLETED,
            sourceId = completion.id,
            points = 4,
            reason = "Completed a practice rep",
            createdAt = now,
        )
        recordActivity(
            title = "Practice completed",
            body = "You finished a small rep for $pathId.",
            category = "Practice",
            createdAt = now,
        )
        return completion
    }

    fun createProof(draft: ProofDraft): ProofRecord {
        val now = LocalClock.nowIso()
        val proofId = "proof-${UUID.randomUUID()}"
        val attachedMedia = draft.media?.copy(proofId = proofId)
        val proof = ProofRecord(
            id = proofId,
            userId = demoUserId,
            pathId = draft.pathId,
            title = draft.title.ifBlank { "Practice proof" },
            reflectionText = draft.reflectionText,
            feedbackRequest = draft.feedbackRequest,
            media = attachedMedia,
            visibility = draft.visibility,
            status = ProofLifecycleStatus.SUBMITTED,
            feedbackCount = 0,
            trustWeight = 8,
            createdAt = now,
            updatedAt = now,
        )
        proofs.add(0, proof)
        database?.proofs?.upsert(proof.toEntity())
        attachedMedia?.let {
            proofMedia.add(0, it)
            database?.proofMedia?.upsert(it.toEntity())
        }
        recordTrustEvent(
            source = TrustEventSource.PROOF_SUBMISSION,
            sourceId = proof.id,
            points = 8,
            reason = "Submitted practice proof",
            createdAt = now,
        )
        recordActivity(
            title = "Proof shared",
            body = "A proof was saved locally for ${draft.pathId}.",
            category = "Proofs",
            createdAt = now,
        )
        return proof
    }

    fun addFeedback(draft: FeedbackDraft): FeedbackRecord {
        val now = LocalClock.nowIso()
        val record = FeedbackRecord(
            id = "feedback-${UUID.randomUUID()}",
            proofId = draft.proofId,
            reviewerId = demoUserId,
            feedbackText = draft.feedbackText,
            feedbackKind = draft.feedbackKind,
            helpfulCount = 0,
            createdAt = now,
        )
        feedback.add(0, record)
        database?.feedback?.insert(record.toEntity())
        val index = proofs.indexOfFirst { it.id == draft.proofId }
        if (index >= 0) {
            val updated = proofs[index].copy(
                feedbackCount = proofs[index].feedbackCount + 1,
                status = com.collective.app.data.model.ProofLifecycleStatus.FEEDBACK_RECEIVED,
                updatedAt = now,
            )
            proofs[index] = updated
            database?.proofs?.update(updated.toEntity())
        }
        recordTrustEvent(
            source = TrustEventSource.FEEDBACK_GIVEN,
            sourceId = record.id,
            points = 6,
            reason = "Gave specific, beginner-safe feedback",
            createdAt = now,
        )
        recordActivity(
            title = "Feedback sent",
            body = "You helped someone take a clearer next step.",
            category = "Feedback",
            createdAt = now,
        )
        return record
    }

    fun trustEvents(): List<TrustEventRecord> = trustEvents.toList()

    fun practiceSessionCount(): Int = practiceSessions.size

    fun practiceCompletionCount(): Int = completions.size

    fun mediaAttachmentCount(): Int = proofMedia.size

    fun activityItems(): List<ActivityEntity> = activity.toList()

    fun defaultVisibility(): ProofVisibility = ProofVisibility.FEEDBACK_ONLY

    fun defaultFeedbackKind(): FeedbackKind = FeedbackKind.SUGGESTION

    private fun recordTrustEvent(
        source: TrustEventSource,
        sourceId: String,
        points: Int,
        reason: String,
        createdAt: String,
    ) {
        val event = TrustEventRecord(
            id = "trust-${UUID.randomUUID()}",
            userId = demoUserId,
            source = source,
            sourceId = sourceId,
            points = points,
            reason = reason,
            createdAt = createdAt,
        )
        trustEvents.add(0, event)
        database?.trustEvents?.insert(event.toEntity())
    }

    private fun recordActivity(title: String, body: String, category: String, createdAt: String) {
        val item = ActivityEntity(
            id = "activity-${UUID.randomUUID()}",
            title = title,
            body = body,
            category = category,
            createdAt = createdAt,
        )
        activity.add(0, item)
        database?.activity?.insert(item)
    }

    private fun completeLatestStartedSession(pathId: String, practiceId: String, completedAt: String) {
        val sessionIndex = practiceSessions.indexOfFirst {
            it.status == "STARTED" && it.pathId == pathId && it.practiceId == practiceId
        }
        if (sessionIndex < 0) return
        val updated = practiceSessions[sessionIndex].copy(status = "COMPLETED", completedAt = completedAt)
        practiceSessions[sessionIndex] = updated
        database?.practiceSessions?.upsert(updated)
    }

    private fun withStoredMedia(proof: ProofRecord): ProofRecord =
        proof.copy(media = proofMedia.firstOrNull { it.proofId == proof.id } ?: proof.media)
}
