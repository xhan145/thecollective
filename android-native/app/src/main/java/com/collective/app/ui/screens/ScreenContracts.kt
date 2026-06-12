package com.collective.app.ui.screens

enum class CollectiveScreenSurface {
    DISCOVER,
    PRACTICE,
    PROOF,
    FEEDBACK,
    PROGRESS,
    CONTRIBUTION,
    PROFILE
}

data class BackendReadyScreenContract(
    val surface: CollectiveScreenSurface,
    val usesRepositoryLayer: Boolean,
    val supportsOfflineMock: Boolean,
    val hasAiAssistSlot: Boolean
)

object Phase3ScreenContracts {
    val contracts = listOf(
        BackendReadyScreenContract(CollectiveScreenSurface.PRACTICE, true, true, true),
        BackendReadyScreenContract(CollectiveScreenSurface.PROOF, true, true, true),
        BackendReadyScreenContract(CollectiveScreenSurface.FEEDBACK, true, true, true),
        BackendReadyScreenContract(CollectiveScreenSurface.PROGRESS, true, true, false),
        BackendReadyScreenContract(CollectiveScreenSurface.PROFILE, true, true, false)
    )
}
