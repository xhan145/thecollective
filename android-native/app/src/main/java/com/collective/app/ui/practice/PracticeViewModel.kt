package com.collective.app.ui.practice

import kotlinx.coroutines.flow.StateFlow

/**
 * Plain state holder following the same pattern as ProofViewModel / FeedbackViewModel.
 * No DI framework. Owns no state directly — delegates to PracticeRepository.
 *
 * onPracticeStepCompletedForTrust is invoked only when a step transitions from incomplete
 * to complete for the first time, so trust can grow locally without this class knowing
 * about the trust model.
 */
class PracticeViewModel(
    private val repository: PracticeRepository,
    private val onPracticeStepCompletedForTrust: () -> Unit = {},
) {
    val directions: StateFlow<List<Direction>> = repository.directions
    val selectedDirectionId: StateFlow<String?> = repository.selectedDirectionId
    val progress: StateFlow<Map<String, PracticePathProgress>> = repository.progress

    fun onSelectDirection(id: String) {
        repository.selectDirection(id)
    }

    /**
     * Completes a step. Guards against duplicate increments: the trust callback fires only
     * if the step was not already completed before this call.
     */
    fun onCompleteStep(directionId: String, stepId: String) {
        val alreadyCompleted = repository.progress.value[directionId]
            ?.completedStepIds
            ?.contains(stepId) == true
        repository.completeStep(directionId, stepId)
        if (!alreadyCompleted) {
            onPracticeStepCompletedForTrust()
        }
    }
}
