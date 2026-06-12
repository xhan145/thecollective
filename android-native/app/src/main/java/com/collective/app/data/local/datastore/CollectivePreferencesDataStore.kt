package com.collective.app.data.local.datastore

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/*
 * DataStore-compatible facade for v0.5 alpha.
 * Real Preferences DataStore can replace this once the artifact is available.
 */
class CollectivePreferencesDataStore(context: Context) {
    private val preferences = context.getSharedPreferences("collective_v05_preferences", Context.MODE_PRIVATE)
    private val _lastRoute = MutableStateFlow(preferences.getString("last_route", "home") ?: "home")
    private val _preferredProofVisibility = MutableStateFlow(preferences.getString("preferred_proof_visibility", "Path Only") ?: "Path Only")
    val lastRoute: StateFlow<String> = _lastRoute
    val preferredProofVisibility: StateFlow<String> = _preferredProofVisibility

    fun setLastRoute(route: String) {
        preferences.edit().putString("last_route", route).apply()
        _lastRoute.value = route
    }

    fun setPreferredProofVisibility(visibility: String) {
        preferences.edit().putString("preferred_proof_visibility", visibility).apply()
        _preferredProofVisibility.value = visibility
    }

    fun markAiLabSeen() {
        preferences.edit().putBoolean("ai_lab_seen", true).apply()
    }

    fun hasSeenAiLab(): Boolean = preferences.getBoolean("ai_lab_seen", false)
}
