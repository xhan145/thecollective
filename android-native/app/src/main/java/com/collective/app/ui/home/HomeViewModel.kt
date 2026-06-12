package com.collective.app.ui.home

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class HomeViewModel(
    private val repository: HomeRepository = MockHomeRepository(),
) {
    private val _uiState = MutableStateFlow(repository.initialState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    fun onTodayFocusClicked() {
        showSheet(HomeSheet.FocusDetail)
    }

    fun onContinuePracticeClicked() {
        _uiState.value = _uiState.value.copy(practiceSheetState = PracticeSheetState.Ready)
        showSheet(HomeSheet.Practice)
    }

    fun onStartPractice() {
        _uiState.value = _uiState.value.copy(practiceSheetState = PracticeSheetState.Started)
    }

    fun onCompletePractice() {
        _uiState.value = repository.completePractice(_uiState.value)
    }

    fun onSubmitProofClicked() {
        showSheet(HomeSheet.SubmitProof)
    }

    fun onProofSubmitted() {
        showSheet(HomeSheet.SubmitProof)
    }

    fun onNotificationsClicked() {
        showSheet(HomeSheet.Notifications)
    }

    fun onSeeAllProofClicked() {
        _uiState.value = _uiState.value.copy(activeSheet = null)
    }

    fun onRecentProofClicked() {
        showSheet(HomeSheet.ProofDetail)
    }

    fun onAllProofFallbackClicked() {
        showSheet(HomeSheet.AllProof)
    }

    fun onBottomNavClicked(route: String) {
        _uiState.value = _uiState.value.copy(activeSheet = null)
    }

    fun onDismissSheet() {
        _uiState.value = _uiState.value.copy(
            activeSheet = null,
        )
    }

    fun onAddProofFromPracticeClicked() {
        _uiState.value = _uiState.value.copy(
            activeSheet = HomeSheet.SubmitProof,
        )
    }

    fun onAddFeedbackClicked() {
        showSheet(HomeSheet.AddFeedback)
    }

    fun onProofCountChanged(count: Int) {
        if (_uiState.value.trustSnapshot.proofsSubmitted == count) return
        _uiState.value = _uiState.value.copy(
            trustSnapshot = _uiState.value.trustSnapshot.copy(
                proofsSubmitted = count,
            ),
        )
    }

    /** Called when a feedback note transitions into "used for practice". */
    fun onFeedbackUsed() {
        val current = _uiState.value.trustSnapshot
        val next = current.feedbackUsed + 1
        _uiState.value = _uiState.value.copy(
            trustSnapshot = current.copy(
                feedbackUsed = next,
                trustLevelLabel = trustLabelForFeedbackUsed(next),
            ),
        )
    }

    /** Called when a practice step transitions into completed for the first time. */
    fun onPracticeCompleted() {
        val current = _uiState.value.trustSnapshot
        val next = current.practicesCompleted + 1
        _uiState.value = _uiState.value.copy(
            trustSnapshot = current.copy(
                practicesCompleted = next,
                trustLevelLabel = trustLabelForPracticesCompleted(next),
            ),
        )
    }

    /** Notification bell reflects the number of unread feedback notes. */
    fun onUnreadFeedbackCountChanged(count: Int) {
        if (_uiState.value.notificationCount == count) return
        _uiState.value = _uiState.value.copy(notificationCount = count)
    }

    private fun showSheet(sheet: HomeSheet) {
        _uiState.value = _uiState.value.copy(
            activeSheet = sheet,
        )
    }
}

internal fun trustLabelForPracticesCompleted(count: Int): String =
    when {
        count >= 10 -> "Helpful contributor"
        count >= 5 -> "Practicing with proof"
        count >= 1 -> "Practicing"
        else -> "Building trust"
    }

internal fun trustLabelForFeedbackUsed(feedbackUsed: Int): String =
    when {
        feedbackUsed >= 7 -> "Helpful contributor"
        feedbackUsed >= 3 -> "Practicing with proof"
        else -> "Building trust"
    }
