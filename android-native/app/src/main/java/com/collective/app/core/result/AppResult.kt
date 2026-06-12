package com.collective.app.core.result

sealed interface AppResult<out T> {
    data class Success<T>(val value: T) : AppResult<T>
    data class Error(val message: String, val cause: Throwable? = null) : AppResult<Nothing>
    data class Offline<T>(val fallback: T? = null, val message: String) : AppResult<T>
}

fun <T> AppResult<T>.getOrNull(): T? {
    return when (this) {
        is AppResult.Success -> value
        is AppResult.Offline -> fallback
        is AppResult.Error -> null
    }
}

fun AppResult<*>.messageOrNull(): String? {
    return when (this) {
        is AppResult.Success -> null
        is AppResult.Offline -> message
        is AppResult.Error -> message
    }
}
