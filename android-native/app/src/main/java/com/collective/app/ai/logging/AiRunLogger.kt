package com.collective.app.ai.logging

import com.collective.app.ai.model.AiAssistResponse
import com.collective.app.data.local.LocalClock
import com.collective.app.data.local.db.CollectiveLocalDatabase
import com.collective.app.data.local.entity.AiRunEntity
import java.util.UUID

interface AiRunLogger {
    fun log(inputSummary: String, response: AiAssistResponse)
}

object NoopAiRunLogger : AiRunLogger {
    override fun log(inputSummary: String, response: AiAssistResponse) = Unit
}

class LocalAiRunLogger(
    private val database: CollectiveLocalDatabase,
) : AiRunLogger {
    override fun log(inputSummary: String, response: AiAssistResponse) {
        val traceSummary = response.trace.inputSignals
            .take(3)
            .joinToString("; ") { "${it.name}:${"%.2f".format(it.weight)}" }
            .ifBlank { "No local signals yet" }
        database.aiRuns.insert(
            AiRunEntity(
                id = "ai-run-${UUID.randomUUID()}",
                kind = response.kind.name,
                inputSummary = inputSummary.take(180),
                outputSummary = response.summary.take(220),
                riskLevel = response.riskLevel.name,
                confidenceScore = response.confidenceScore,
                traceSummary = traceSummary,
                createdAt = LocalClock.nowIso(),
            ),
        )
    }
}

object AiRunLoggerProvider {
    private var logger: AiRunLogger = NoopAiRunLogger

    fun initialize(database: CollectiveLocalDatabase) {
        logger = LocalAiRunLogger(database)
    }

    fun log(inputSummary: String, response: AiAssistResponse) {
        logger.log(inputSummary, response)
    }
}
