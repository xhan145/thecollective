package com.collective.app.ui.home

interface HomeRepository {
    fun initialState(): HomeUiState
    fun completePractice(state: HomeUiState): HomeUiState
}
