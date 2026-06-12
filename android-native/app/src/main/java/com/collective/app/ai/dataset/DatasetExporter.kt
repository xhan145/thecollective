package com.collective.app.ai.dataset

object DatasetExporter {
    fun toJsonLines(records: List<LocalAiDatasetRecord> = SeedDataset.records): String =
        records.joinToString(separator = "\n") { record ->
            buildString {
                append("{")
                appendJson("id", record.id)
                append(",")
                appendJson("split", record.split.name.lowercase())
                append(",")
                appendJson("kind", record.kind.name.lowercase())
                append(",")
                appendJson("user_input", record.userInput)
                append(",")
                appendJson("context", record.context)
                append(",")
                appendJson("ideal_response", record.idealResponse)
                append(",")
                appendJsonArray("must_preserve", record.mustPreserve)
                append(",")
                appendJsonArray("must_avoid", record.mustAvoid)
                append("}")
            }
        }

    private fun StringBuilder.appendJson(key: String, value: String) {
        append("\"").append(escape(key)).append("\":\"").append(escape(value)).append("\"")
    }

    private fun StringBuilder.appendJsonArray(key: String, values: List<String>) {
        append("\"").append(escape(key)).append("\":[")
        append(values.joinToString(",") { "\"${escape(it)}\"" })
        append("]")
    }

    private fun escape(value: String): String =
        value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
}
