package com.collective.app.ui.practice

/**
 * Core models for Practice Path V1.
 * A Direction is a small, focused practice path — not a course, module, or content feed.
 * Steps are local/mock only. No scoring, no streak shame, no leaderboards.
 */

enum class PracticeStepKind {
    Reflection,
    VoiceNote,
    ConversationPrompt,
    VideoPractice,
    SubmitProof,
    UseFeedback,
}

data class PracticeStep(
    val id: String,
    val title: String,
    val prompt: String,
    val kind: PracticeStepKind,
    val estimatedSeconds: Int,
)

data class Direction(
    val id: String,
    val title: String,
    val tagline: String,
    val summary: String,
    val whatYouPractice: List<String>,
    val steps: List<PracticeStep>,
    val isAvailable: Boolean,
)

data class PracticePathProgress(
    val directionId: String,
    val completedStepIds: Set<String>,
)

data class SelectedDirectionState(
    val direction: Direction,
    val completedStepIds: Set<String>,
    val activeStep: PracticeStep?,
    val completedCount: Int,
    val totalCount: Int,
    val progress: Float,
    val isComplete: Boolean,
)

/**
 * Pure function: derive SelectedDirectionState from the repository's three state values.
 * activeStep = first step whose id is not in completedStepIds.
 * Returns null when no direction is selected or the id does not exist.
 */
fun selectedDirectionStateOf(
    directions: List<Direction>,
    selectedId: String?,
    progress: Map<String, PracticePathProgress>,
): SelectedDirectionState? {
    val direction = directions.firstOrNull { it.id == selectedId } ?: return null
    val pathProgress = progress[selectedId]
    val completedStepIds = pathProgress?.completedStepIds ?: emptySet()
    val totalCount = direction.steps.size
    val completedCount = completedStepIds.size.coerceAtMost(totalCount)
    val progressFloat = if (totalCount == 0) 0f else completedCount.toFloat() / totalCount
    val activeStep = direction.steps.firstOrNull { it.id !in completedStepIds }
    val isComplete = activeStep == null && totalCount > 0
    return SelectedDirectionState(
        direction = direction,
        completedStepIds = completedStepIds,
        activeStep = activeStep,
        completedCount = completedCount,
        totalCount = totalCount,
        progress = progressFloat,
        isComplete = isComplete,
    )
}
