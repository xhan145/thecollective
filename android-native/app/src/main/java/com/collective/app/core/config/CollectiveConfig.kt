package com.collective.app.core.config

enum class BackendMode {
    MOCK,
    REMOTE
}

data class CollectiveFeatureFlags(
    val authEnabled: Boolean = false,
    val remoteProofUploadEnabled: Boolean = false,
    val remoteFeedbackEnabled: Boolean = false,
    val aiAssistEnabled: Boolean = true,
    val trustPipelineEnabled: Boolean = true,
    val moderationEnabled: Boolean = true
)

data class CollectiveEnvironment(
    val backendMode: BackendMode = BackendMode.MOCK,
    val supabaseUrl: String = "",
    val aiFunctionUrl: String = "",
    val storageBucket: String = "proof-media",
    val offlineFallbackEnabled: Boolean = true
) {
    val isRemoteReady: Boolean
        get() = backendMode == BackendMode.REMOTE && supabaseUrl.isNotBlank()
}

data class CollectiveAppConfig(
    val appName: String = "Collective",
    val phase: String = "Phase 3",
    val environment: CollectiveEnvironment = CollectiveEnvironment(),
    val featureFlags: CollectiveFeatureFlags = CollectiveFeatureFlags()
)

object CollectiveRuntimeConfig {
    val current: CollectiveAppConfig = CollectiveAppConfig()
}
