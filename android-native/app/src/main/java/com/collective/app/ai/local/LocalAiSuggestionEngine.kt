package com.collective.app.ai.local

import com.collective.app.ai.AiSafetyPolicy
import com.collective.app.ai.model.AiAssistKind
import com.collective.app.ai.model.AiAssistResponse
import com.collective.app.ai.model.AiReasoningTrace
import com.collective.app.ai.model.AiRiskLevel
import com.collective.app.ai.model.FeedbackDraftRequest
import com.collective.app.ai.model.PracticeAssistRequest
import com.collective.app.ai.model.ProfileReviewRequest
import com.collective.app.ai.model.ProgressSummaryRequest
import com.collective.app.ai.model.ReflectionAssistRequest
import com.collective.app.ai.model.SafetyReviewRequest

class LocalAiSuggestionEngine {
    fun adjustPractice(request: PracticeAssistRequest): AiAssistResponse {
        val signals = LocalAiSignalExtractor.fromPractice(request.currentInstructions, request.userNeed)
        return AiAssistResponse(
            kind = AiAssistKind.PRACTICE_HELPER,
            summary = "A smaller version of this practice can still build real momentum.",
            suggestions = listOf(
                "Reduce the rep to one clear sentence if the full version feels heavy.",
                "Keep the three-part structure: what worked, one next step, encouragement.",
                "Finish by writing what felt easier, even if the rep was imperfect.",
            ),
            nextStep = "Try one low-pressure version before moving to proof.",
            reflectionQuestion = "What is the smallest honest version of this practice you can do today?",
            riskLevel = AiRiskLevel.LOW,
            confidenceScore = confidenceFrom(signals),
            safetyNotes = listOf("This is an adjustment helper, not a judgment of ability."),
            trace = traceFor(signals, "Practice over passive content", "Beginner safety", "User keeps control"),
        )
    }

    fun clarifyReflection(request: ReflectionAssistRequest): AiAssistResponse {
        val signals = LocalAiSignalExtractor.fromText("${request.reflectionText} ${request.feedbackRequest}")
        val proofType = request.context.proofType.lowercase()
        val mediaNote = when (proofType) {
            "video" -> "Use the reflection and metadata now; full video analysis belongs in a later server-side pass."
            "audio" -> "Use the reflection and metadata now; transcription can be added later server-side."
            "photo", "image" -> "Use the reflection and metadata now; image analysis can be added later."
            else -> "A short honest reflection is enough to make this proof useful."
        }
        return AiAssistResponse(
            kind = AiAssistKind.REFLECTION_HELPER,
            summary = "Your proof is clearest when it names the real practice rep.",
            suggestions = listOf(
                "Name the exact moment you practiced.",
                "Mention what felt clearer, easier, or still uncomfortable.",
                "Ask for one kind of feedback instead of broad judgment.",
            ),
            nextStep = mediaNote,
            reflectionQuestion = "What did you try that you would not have tried a week ago?",
            riskLevel = AiRiskLevel.LOW,
            confidenceScore = confidenceFrom(signals),
            safetyNotes = listOf("Supportive helper only; trust remains based on contribution events."),
            trace = traceFor(signals, "Real progress over appearance", "AI support, not AI authority", "Proof over performance"),
        )
    }

    fun improveFeedback(request: FeedbackDraftRequest): AiAssistResponse {
        val safety = AiSafetyPolicy.review(
            SafetyReviewRequest(
                text = request.currentDraft,
                intendedUse = AiAssistKind.FEEDBACK_DRAFT,
            ),
        )
        val signals = LocalAiSignalExtractor.fromText(request.currentDraft)
        val suggestion = if (request.currentDraft.isBlank()) {
            "Try: What worked was __. One next step could be __. Keep going because __."
        } else {
            "Make it more useful by naming one observed behavior and one next step."
        }
        return AiAssistResponse(
            kind = AiAssistKind.FEEDBACK_DRAFT,
            summary = "Useful feedback is kind, specific, and tied to the practice.",
            suggestions = listOf(suggestion, "Avoid broad praise alone; connect support to what they practiced."),
            nextStep = "Respond to the practice, not the person.",
            reflectionQuestion = "What is one small next step they can actually try?",
            riskLevel = safety.riskLevel,
            confidenceScore = if (safety.riskLevel == AiRiskLevel.LOW) confidenceFrom(signals) else 0.62,
            safetyNotes = safety.notes,
            trace = traceFor(signals, "Usefulness over attention", "Contribution over clout", "Beginner safety"),
        )
    }

    fun reviewBeforeSharing(request: SafetyReviewRequest): AiAssistResponse {
        val safety = AiSafetyPolicy.review(request)
        val signals = LocalAiSignalExtractor.fromText(request.text)
        return AiAssistResponse(
            kind = AiAssistKind.SAFETY_REVIEW,
            summary = "Review checks for beginner-safe, practice-focused language.",
            suggestions = safety.notes,
            nextStep = if (safety.riskLevel == AiRiskLevel.UNSAFE) "Rewrite before sharing." else "Ready to keep refining.",
            reflectionQuestion = "Can this help someone take one next step?",
            riskLevel = safety.riskLevel,
            confidenceScore = if (safety.riskLevel == AiRiskLevel.LOW) 0.9 else 0.62,
            safetyNotes = safety.notes,
            trace = traceFor(signals, "Beginner safety", "User keeps control"),
        )
    }

    fun summarizeProgress(request: ProgressSummaryRequest): AiAssistResponse {
        val signals = LocalAiSignalExtractor.fromProgress(request.streakDays, request.weeklyMomentumPercent, request.activePathCount)
        val next = if (request.activePathCount > 3) {
            "Choose one path to keep light today so momentum stays manageable."
        } else {
            "Share one small win or ask for one useful piece of feedback."
        }
        return AiAssistResponse(
            kind = AiAssistKind.PROGRESS_SUMMARY,
            summary = "Your recent progress is built from consistency, not public attention.",
            suggestions = listOf(
                "Keep the next action small enough to complete today.",
                "Use recent feedback as one practical next step.",
            ),
            nextStep = next,
            reflectionQuestion = "Which recent win gives you the clearest next rep?",
            riskLevel = AiRiskLevel.LOW,
            confidenceScore = confidenceFrom(signals),
            safetyNotes = listOf("This summary does not rank you or decide trust."),
            trace = traceFor(signals, "Earned trust, not paid trust", "Momentum-building", "No vanity metrics"),
        )
    }

    fun reviewProfile(request: ProfileReviewRequest): AiAssistResponse {
        val signals = request.evidenceStats.map { (key, value) ->
            com.collective.app.ai.model.AiSignal(key, value, 0.62)
        } + request.trustSignals.map {
            com.collective.app.ai.model.AiSignal("trust_signal", it, 0.7)
        }
        return AiAssistResponse(
            kind = AiAssistKind.PROFILE_REVIEW,
            summary = "This profile reads as evidence-based when it shows practice, proof, and contribution.",
            suggestions = listOf(
                "Keep the bio focused on what you are practicing.",
                "Feature a proof that shows effort or learning, not polish.",
            ),
            nextStep = "Review your featured proof before sharing more widely.",
            reflectionQuestion = "Does this profile show what you are building, not who you are trying to impress?",
            riskLevel = AiRiskLevel.LOW,
            confidenceScore = confidenceFrom(signals),
            safetyNotes = listOf("Profile review avoids status, ranking, and public scoring."),
            trace = traceFor(signals, "Evidence-based profile", "Contribution over clout", "User keeps control"),
        )
    }

    private fun confidenceFrom(signals: List<com.collective.app.ai.model.AiSignal>): Double {
        if (signals.isEmpty()) return 0.55
        val average = signals.map { it.weight }.average()
        return average.coerceIn(0.45, 0.9)
    }

    private fun traceFor(
        signals: List<com.collective.app.ai.model.AiSignal>,
        vararg principles: String,
    ): AiReasoningTrace =
        AiReasoningTrace(
            inputSignals = signals.take(5),
            activatedPrinciples = principles.toList(),
            confidenceNotes = listOf(
                "Local-only heuristic pass",
                "No private API key or internet required",
                "Suggestion can be ignored or edited",
            ),
        )
}
