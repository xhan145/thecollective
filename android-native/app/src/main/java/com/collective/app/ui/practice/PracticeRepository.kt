package com.collective.app.ui.practice

import kotlinx.coroutines.flow.StateFlow

/**
 * Single source of truth for practice directions, step selection, and per-direction progress.
 * Local/mock only — no backend, no Room, no Supabase.
 */
interface PracticeRepository {
    val directions: StateFlow<List<Direction>>
    val selectedDirectionId: StateFlow<String?>
    val progress: StateFlow<Map<String, PracticePathProgress>>

    fun selectDirection(id: String)
    fun completeStep(directionId: String, stepId: String)
    fun getDirection(id: String): Direction?
}
