package com.collective.app.ai.local

import com.collective.app.ai.model.AiSignal

object LocalAiSignalExtractor {
    fun fromText(text: String): List<AiSignal> {
        val trimmed = text.trim()
        if (trimmed.isBlank()) {
            return listOf(
                AiSignal("empty_input", "No user text yet", 0.35),
            )
        }

        val words = trimmed.split(Regex("\\s+")).filter { it.isNotBlank() }
        val signals = mutableListOf<AiSignal>()
        signals += AiSignal("specificity", "${words.size} words supplied", (words.size.coerceAtMost(60) / 60.0))

        if (trimmed.contains("felt", ignoreCase = true) || trimmed.contains("try", ignoreCase = true)) {
            signals += AiSignal("reflection_language", "Mentions trying or feeling", 0.72)
        }
        if (trimmed.contains("feedback", ignoreCase = true) || trimmed.contains("help", ignoreCase = true)) {
            signals += AiSignal("feedback_intent", "Asks for help or feedback", 0.76)
        }
        if (trimmed.contains("but", ignoreCase = true) || trimmed.contains("next", ignoreCase = true)) {
            signals += AiSignal("next_step_ready", "Contains contrast or next-step language", 0.68)
        }
        return signals
    }

    fun fromPractice(instructions: List<String>, userNeed: String): List<AiSignal> {
        val signals = mutableListOf(
            AiSignal("practice_steps", "${instructions.size} practice steps", (instructions.size.coerceAtMost(4) / 4.0)),
        )
        signals += fromText(userNeed).map { it.copy(weight = it.weight * 0.85) }
        if (instructions.any { it.contains("encouragement", ignoreCase = true) }) {
            signals += AiSignal("beginner_safe_closure", "Practice ends with encouragement", 0.74)
        }
        return signals
    }

    fun fromProgress(streakDays: Int, momentumPercent: Int, activePathCount: Int): List<AiSignal> =
        listOf(
            AiSignal("consistency", "$streakDays day streak", (streakDays.coerceAtMost(14) / 14.0)),
            AiSignal("momentum", "$momentumPercent% weekly momentum", (momentumPercent.coerceIn(0, 100) / 100.0)),
            AiSignal("focus_load", "$activePathCount active paths", if (activePathCount <= 3) 0.72 else 0.42),
        )
}
