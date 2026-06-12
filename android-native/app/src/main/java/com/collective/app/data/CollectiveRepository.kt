package com.collective.app.data

import androidx.compose.runtime.mutableStateListOf
import java.time.Instant

class CollectiveRepository {
    private val currentUserId = "local-demo-user"

    val proofs = mutableStateListOf(
        ProofSubmission(
            id = "proof-communication-1",
            userId = "demo-maya",
            title = "One honest sentence rehearsal",
            reflectionText = "I practiced saying the request without apologizing first. The second take sounded clearer.",
            mediaUrl = null,
            mediaType = MediaType.VIDEO,
            mediaThumbnailUrl = null,
            practiceArea = "communication",
            visibility = Visibility.FEEDBACK_ONLY,
            status = ProofStatus.SUBMITTED,
            aiSummary = "A short communication practice with a focused request for clarity feedback.",
            feedbackCount = 0,
            trustWeight = 46,
            createdAt = "2026-05-17T17:20:00Z",
            updatedAt = "2026-05-17T17:20:00Z",
            consistentPracticeCount = 5
        ),
        ProofSubmission(
            id = "proof-momentum-1",
            userId = "demo-sam",
            title = "Five-minute desk reset",
            reflectionText = "The photo made the small action feel real instead of theoretical.",
            mediaUrl = null,
            mediaType = MediaType.IMAGE,
            mediaThumbnailUrl = null,
            practiceArea = "momentum",
            visibility = Visibility.PUBLIC,
            status = ProofStatus.FEEDBACK_RECEIVED,
            aiSummary = "A low-friction momentum proof showing visible completion.",
            feedbackCount = 2,
            trustWeight = 62,
            createdAt = "2026-05-17T13:05:00Z",
            updatedAt = "2026-05-17T15:12:00Z",
            consistentPracticeCount = 8
        ),
        ProofSubmission(
            id = "proof-confidence-1",
            userId = "demo-rin",
            title = "Private message draft",
            reflectionText = "I wrote the message more warmly after naming what I actually wanted to say.",
            mediaUrl = null,
            mediaType = MediaType.IMAGE,
            mediaThumbnailUrl = null,
            practiceArea = "confidence",
            visibility = Visibility.FEEDBACK_ONLY,
            status = ProofStatus.SUBMITTED,
            aiSummary = "A screenshot proof asking for feedback on clarity and warmth.",
            feedbackCount = 0,
            trustWeight = 28,
            createdAt = "2026-05-16T21:40:00Z",
            updatedAt = "2026-05-16T21:40:00Z",
            consistentPracticeCount = 3
        )
    )

    val feedback = mutableStateListOf(
        Feedback(
            id = "feedback-1",
            proofId = "proof-momentum-1",
            reviewerId = "demo-reviewer-1",
            feedbackText = "The proof is specific. A useful next step could be choosing tomorrow's first five-minute action now.",
            feedbackType = FeedbackType.SUGGESTION,
            helpfulCount = 3,
            createdAt = "2026-05-17T15:12:00Z"
        ),
        Feedback(
            id = "feedback-2",
            proofId = "proof-momentum-1",
            reviewerId = "demo-reviewer-2",
            feedbackText = "The small scope is working here. Keep the next action just as visible.",
            feedbackType = FeedbackType.ENCOURAGEMENT,
            helpfulCount = 2,
            createdAt = "2026-05-17T15:20:00Z"
        )
    )

    val trustEvents = mutableStateListOf(
        TrustEvent("trust-1", currentUserId, TrustSourceType.PROOF_SUBMISSION, "proof-communication-1", 8, "Submitted video proof", "2026-05-17T17:20:00Z"),
        TrustEvent("trust-2", currentUserId, TrustSourceType.FEEDBACK_RECEIVED, "feedback-1", 5, "Received helpful feedback", "2026-05-17T15:12:00Z"),
        TrustEvent("trust-3", currentUserId, TrustSourceType.PROOF_SUBMISSION, "proof-confidence-1", 8, "Submitted image proof", "2026-05-16T21:40:00Z")
    )

    fun rankedProofs(): List<ProofSubmission> {
        return proofs
            .filter { it.status != ProofStatus.ARCHIVED && it.status != ProofStatus.DRAFT }
            .sortedWith(
                compareByDescending<ProofSubmission> { proof ->
                    val noFeedbackBoost = if (proof.feedbackCount == 0) 18 else 0
                    val practiceBoost = proof.consistentPracticeCount * 2
                    val recency = runCatching { Instant.parse(proof.createdAt).toEpochMilli() / 1000000L }
                        .getOrDefault(0L)
                    recency + noFeedbackBoost + practiceBoost
                }
            )
    }

    fun proofById(id: String): ProofSubmission? {
        return proofs.firstOrNull { it.id == id }
    }

    fun feedbackForProof(proofId: String): List<Feedback> {
        return feedback.filter { it.proofId == proofId }
    }

    fun createProof(
        title: String,
        reflectionText: String,
        mediaUrl: String?,
        mediaType: MediaType,
        practiceArea: String,
        visibility: Visibility,
        status: ProofStatus
    ): ProofSubmission {
        val now = Instant.now().toString()
        val proof = ProofSubmission(
            id = "proof-${System.currentTimeMillis()}",
            userId = currentUserId,
            title = title.ifBlank { CollectiveSkillAreas.titleFor(practiceArea) + " proof" },
            reflectionText = reflectionText,
            mediaUrl = mediaUrl,
            mediaType = mediaType,
            mediaThumbnailUrl = null,
            practiceArea = practiceArea,
            visibility = visibility,
            status = status,
            aiSummary = if (status == ProofStatus.SUBMITTED) "A proof reflection ready for useful human feedback." else null,
            feedbackCount = 0,
            trustWeight = if (status == ProofStatus.SUBMITTED) 8 else 1,
            createdAt = now,
            updatedAt = now,
            consistentPracticeCount = 1
        )
        proofs.add(0, proof)
        if (status == ProofStatus.SUBMITTED) {
            trustEvents.add(
                0,
                TrustEvent(
                    "trust-${System.currentTimeMillis()}",
                    currentUserId,
                    TrustSourceType.PROOF_SUBMISSION,
                    proof.id,
                    8,
                    "Submitted practice proof",
                    now
                )
            )
        }
        return proof
    }

    fun addFeedback(proofId: String, type: FeedbackType, text: String): Feedback {
        val now = Instant.now().toString()
        val record = Feedback(
            id = "feedback-${System.currentTimeMillis()}",
            proofId = proofId,
            reviewerId = currentUserId,
            feedbackText = text,
            feedbackType = type,
            helpfulCount = 0,
            createdAt = now
        )
        feedback.add(0, record)
        val index = proofs.indexOfFirst { it.id == proofId }
        if (index >= 0) {
            val old = proofs[index]
            proofs[index] = old.copy(
                feedbackCount = old.feedbackCount + 1,
                status = ProofStatus.FEEDBACK_RECEIVED,
                updatedAt = now
            )
        }
        trustEvents.add(
            0,
            TrustEvent(
                "trust-given-${System.currentTimeMillis()}",
                currentUserId,
                TrustSourceType.FEEDBACK_GIVEN,
                record.id,
                6,
                "Gave specific feedback",
                now
            )
        )
        return record
    }

    fun userProgress(): UserProgress {
        val score = trustEvents.sumOf { it.points }
        return UserProgress(
            userId = currentUserId,
            trustScore = score,
            trustLevel = calculateTrustLevel(score),
            proofCount = proofs.count { it.status != ProofStatus.DRAFT },
            feedbackGivenCount = feedback.count { it.reviewerId == currentUserId },
            feedbackReceivedCount = proofs.sumOf { it.feedbackCount },
            currentPracticeStreak = 1
        )
    }
}
