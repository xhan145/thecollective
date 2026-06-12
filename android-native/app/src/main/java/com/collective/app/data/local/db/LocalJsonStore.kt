package com.collective.app.data.local.db

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

class LocalJsonStore(context: Context) {
    private val preferences: SharedPreferences =
        context.getSharedPreferences("collective_v05_alpha_store", Context.MODE_PRIVATE)

    fun readTable(name: String): List<JSONObject> {
        val raw = preferences.getString(name, "[]").orEmpty()
        val array = runCatching { JSONArray(raw) }.getOrElse { JSONArray() }
        return buildList {
            for (index in 0 until array.length()) {
                array.optJSONObject(index)?.let(::add)
            }
        }
    }

    fun writeTable(name: String, rows: List<JSONObject>) {
        val array = JSONArray()
        rows.forEach { array.put(it) }
        preferences.edit().putString(name, array.toString()).apply()
    }

    fun putPreference(key: String, value: String) {
        preferences.edit().putString(key, value).apply()
    }

    fun getPreference(key: String, defaultValue: String = ""): String =
        preferences.getString(key, defaultValue) ?: defaultValue
}
