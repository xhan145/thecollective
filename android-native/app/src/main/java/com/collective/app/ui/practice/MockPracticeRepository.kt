package com.collective.app.ui.practice

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * In-memory practice repository for the local prototype.
 * Seeds one available direction ("confident-communication") and three coming-soon directions.
 * Default selectedDirectionId = "confident-communication" so Home always has a useful starting
 * point on first launch without asking the user to choose.
 */
class MockPracticeRepository : PracticeRepository {

    private val _directions = MutableStateFlow(seedDirections())
    override val directions: StateFlow<List<Direction>> = _directions.asStateFlow()

    private val _selectedDirectionId = MutableStateFlow<String?>("confident-communication")
    override val selectedDirectionId: StateFlow<String?> = _selectedDirectionId.asStateFlow()

    private val _progress = MutableStateFlow<Map<String, PracticePathProgress>>(emptyMap())
    override val progress: StateFlow<Map<String, PracticePathProgress>> = _progress.asStateFlow()

    override fun selectDirection(id: String) {
        if (_directions.value.any { it.id == id && it.isAvailable }) {
            _selectedDirectionId.value = id
        }
    }

    override fun completeStep(directionId: String, stepId: String) {
        val current = _progress.value
        val existing = current[directionId] ?: PracticePathProgress(directionId, emptySet())
        if (stepId in existing.completedStepIds) return
        _progress.value = current + (directionId to existing.copy(
            completedStepIds = existing.completedStepIds + stepId,
        ))
    }

    override fun getDirection(id: String): Direction? =
        _directions.value.firstOrNull { it.id == id }

    private fun seedDirections(): List<Direction> = listOf(
        Direction(
            id = "confident-communication",
            title = "Confident Communication",
            tagline = "Speak clearly, ask better questions, and share your ideas with calm confidence.",
            summary = "Build the habit of saying clear, useful things in everyday moments.",
            whatYouPractice = listOf("Clarity", "Calm delivery", "Useful questions"),
            isAvailable = true,
            steps = listOf(
                PracticeStep(
                    id = "cc-step-1",
                    title = "Say one clear thing",
                    prompt = "Choose one idea and say it out loud in one sentence. Keep it simple.",
                    kind = PracticeStepKind.Reflection,
                    estimatedSeconds = 60,
                ),
                PracticeStep(
                    id = "cc-step-2",
                    title = "Record a 60-second voice note",
                    prompt = "Say one idea out loud as if you were sharing it with a teammate.",
                    kind = PracticeStepKind.VoiceNote,
                    estimatedSeconds = 60,
                ),
                PracticeStep(
                    id = "cc-step-3",
                    title = "Ask one useful question",
                    prompt = "Ask a question that opens up a conversation rather than closing it.",
                    kind = PracticeStepKind.ConversationPrompt,
                    estimatedSeconds = 120,
                ),
                PracticeStep(
                    id = "cc-step-4",
                    title = "Explain your idea simply",
                    prompt = "Explain one idea as if the other person has never heard of it.",
                    kind = PracticeStepKind.VideoPractice,
                    estimatedSeconds = 90,
                ),
                PracticeStep(
                    id = "cc-step-5",
                    title = "Submit proof",
                    prompt = "Show what you practiced. It does not need to be perfect.",
                    kind = PracticeStepKind.SubmitProof,
                    estimatedSeconds = 0,
                ),
                PracticeStep(
                    id = "cc-step-6",
                    title = "Use feedback",
                    prompt = "Read your feedback and mark one note as used for practice.",
                    kind = PracticeStepKind.UseFeedback,
                    estimatedSeconds = 0,
                ),
            ),
        ),
        Direction(
            id = "momentum",
            title = "Momentum",
            tagline = "Build consistency without pressure.",
            summary = "Show up regularly with small, honest reps.",
            whatYouPractice = listOf("Consistency", "Starting small", "Finishing often"),
            isAvailable = false,
            steps = emptyList(),
        ),
        Direction(
            id = "better-feedback",
            title = "Better feedback",
            tagline = "Learn to give useful responses.",
            summary = "Give feedback that actually helps someone's next practice.",
            whatYouPractice = listOf("Kindness", "Specificity", "Useful suggestions"),
            isAvailable = false,
            steps = emptyList(),
        ),
        Direction(
            id = "showing-your-work",
            title = "Showing your work",
            tagline = "Turn effort into proof.",
            summary = "Practice making your progress visible in a simple, honest way.",
            whatYouPractice = listOf("Proof capture", "Reflection", "Honest sharing"),
            isAvailable = false,
            steps = emptyList(),
        ),
    )
}
