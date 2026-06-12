package com.collective.app.beta.ui.practice

import com.collective.app.beta.model.Direction
import com.collective.app.beta.model.PracticePrompt
import com.collective.app.beta.ui.BetaSession
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlin.math.abs

data class BetaPracticeUiState(
    val direction: Direction? = null,
    val prompts: List<PracticePrompt> = emptyList(),
    val selectedPrompt: PracticePrompt? = null,
)

/** Shows the current direction's prompts and the focused prompt to act on. */
class BetaPracticeViewModel(private val session: BetaSession) {

    private val repos = session.repositories
    private val _selectedPromptId = MutableStateFlow<String?>(null)

    val uiState: StateFlow<BetaPracticeUiState> =
        combine(
            session.currentUser,
            repos.directionRepository.getDirections(),
            _selectedPromptId,
        ) { user, directions, selectedId ->
            val direction = user.selectedDirectionId?.let { id -> directions.firstOrNull { it.id == id } }
            val prompts = direction?.let { repos.promptRepository.promptsForNow(it.id) } ?: emptyList()
            val selected = prompts.firstOrNull { it.id == selectedId } ?: pickToday(user.id, prompts)
            BetaPracticeUiState(direction = direction, prompts = prompts, selectedPrompt = selected)
        }.stateIn(session.scope, SharingStarted.Eagerly, BetaPracticeUiState())

    fun selectPrompt(promptId: String) {
        _selectedPromptId.value = promptId
    }

    private fun pickToday(userId: String, prompts: List<PracticePrompt>): PracticePrompt? {
        if (prompts.isEmpty()) return null
        return prompts[abs(userId.hashCode()) % prompts.size]
    }
}
