package com.collective.app.beta.repository

import com.collective.app.beta.model.PracticePrompt
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map

/**
 * Practice prompts for each direction. Named `PromptRepository` (not `PracticeRepository`) to avoid
 * confusion with the live `com.collective.app.ui.practice.PracticeRepository`.
 */
interface PromptRepository {
    fun getPromptsForDirection(directionId: String): Flow<List<PracticePrompt>>
    fun getTodayPrompt(userId: String, directionId: String): Flow<PracticePrompt?>
    fun getPromptNow(promptId: String): PracticePrompt?
    fun promptsForNow(directionId: String): List<PracticePrompt>
}

class MockPromptRepository(
    seedPrompts: List<PracticePrompt>,
) : PromptRepository {

    private val _prompts = MutableStateFlow(seedPrompts)

    override fun getPromptsForDirection(directionId: String): Flow<List<PracticePrompt>> =
        _prompts.map { list -> list.filter { it.directionId == directionId && it.isActive } }

    override fun getTodayPrompt(userId: String, directionId: String): Flow<PracticePrompt?> =
        _prompts.map { list ->
            val forDirection = list.filter { it.directionId == directionId && it.isActive }
            // Deterministic "today" pick: vary by user id hash so different members see different first reps.
            if (forDirection.isEmpty()) {
                null
            } else {
                forDirection[(userId.hashCode().let { if (it < 0) -it else it }) % forDirection.size]
            }
        }

    override fun getPromptNow(promptId: String): PracticePrompt? =
        _prompts.value.firstOrNull { it.id == promptId }

    override fun promptsForNow(directionId: String): List<PracticePrompt> =
        _prompts.value.filter { it.directionId == directionId && it.isActive }
}
