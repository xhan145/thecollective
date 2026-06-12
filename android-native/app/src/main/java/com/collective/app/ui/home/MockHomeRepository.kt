package com.collective.app.ui.home

class MockHomeRepository : HomeRepository {
    override fun initialState(): HomeUiState = CollectivePreviewData.homeUiState

    override fun completePractice(state: HomeUiState): HomeUiState {
        // Focus now comes from PracticeRepository — do not mutate it here.
        // Trust increment is handled by PracticeViewModel's onPracticeStepCompletedForTrust
        // callback so we don't double-count here.
        // Only update streak and practice sheet state.
        val wasTodayIncomplete = state.streak.week.any { it.isToday && !it.isCompleted }
        return state.copy(
            practice = state.practice.copy(isCompletedToday = true),
            streak = state.streak.copy(
                currentDays = if (wasTodayIncomplete) state.streak.currentDays + 1 else state.streak.currentDays,
                week = state.streak.week.map { day ->
                    if (day.isToday) day.copy(isCompleted = true) else day
                },
            ),
            practiceSheetState = PracticeSheetState.Logged,
        )
    }
}
