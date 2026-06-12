package com.collective.app.ai.dataset

import com.collective.app.ai.model.AiAssistKind

enum class DatasetSplit {
    TRAIN,
    EVAL,
    SAFETY,
}

data class LocalAiDatasetRecord(
    val id: String,
    val split: DatasetSplit,
    val kind: AiAssistKind,
    val userInput: String,
    val context: String,
    val idealResponse: String,
    val mustPreserve: List<String>,
    val mustAvoid: List<String>,
)

data class DatasetSchemaField(
    val name: String,
    val type: String,
    val description: String,
)
