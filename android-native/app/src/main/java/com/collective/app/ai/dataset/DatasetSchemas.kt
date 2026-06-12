package com.collective.app.ai.dataset

object DatasetSchemas {
    val localAssistRecord = listOf(
        DatasetSchemaField("id", "String", "Stable local example id."),
        DatasetSchemaField("split", "DatasetSplit", "Train, eval, or safety review bucket."),
        DatasetSchemaField("kind", "AiAssistKind", "Practice, proof, feedback, progress, profile, or safety assist."),
        DatasetSchemaField("userInput", "String", "User-owned text or metadata. Never fabricated proof."),
        DatasetSchemaField("context", "String", "Path/practice/proof context."),
        DatasetSchemaField("idealResponse", "String", "Short supportive answer that preserves meaning."),
        DatasetSchemaField("mustPreserve", "List<String>", "Product values or user meaning that must remain intact."),
        DatasetSchemaField("mustAvoid", "List<String>", "Language or behavior that violates Collective principles."),
    )
}
