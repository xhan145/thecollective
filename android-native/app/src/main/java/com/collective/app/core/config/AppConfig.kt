package com.collective.app.core.config

enum class BackendMode {
    MOCK,
    REMOTE_READY,
}

data class BackendConfig(
    val mode: BackendMode = BackendMode.MOCK,
    val supabaseUrl: String = "",
    val supabaseAnonKey: String = "",
    val aiEndpointBaseUrl: String = "",
) {
    val hasSupabaseConfig: Boolean
        get() = supabaseUrl.isNotBlank() && supabaseAnonKey.isNotBlank()

    val hasAiEndpoint: Boolean
        get() = aiEndpointBaseUrl.isNotBlank()
}

object AppConfig {
    const val USE_LOCAL_DATABASE = true
    const val USE_MOCK_DATA_SEED = true

    const val ENABLE_REMOTE_BACKEND = false
    const val ENABLE_REMOTE_AUTH = false
    const val ENABLE_REMOTE_AI = false
    const val ENABLE_ON_DEVICE_LLM = false

    const val ENABLE_LOCAL_AI = true
    const val ENABLE_AI_QUALITY_LAB = true
    const val ENABLE_AI_SIGNAL_MAP = true
    const val ENABLE_PROTOTYPE_MAP = true

    const val appName = "Collective"
    const val proofMediaBucket = "proof-media"

    /*
     * Keep demo mode as the default. Android clients must never contain private
     * OpenAI keys; future AI calls should go through a server-side function.
     */
    val backend = BackendConfig()

    val isDemoMode: Boolean
        get() = backend.mode == BackendMode.MOCK || !backend.hasSupabaseConfig
}
