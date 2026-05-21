package com.collective.app.data

data class SkillArea(
    val id: String,
    val title: String,
    val summary: String,
    val includes: List<String>,
    val whyStrong: List<String>,
    val starterPractice: String
)

object CollectiveSkillAreas {
    val items = listOf(
        SkillArea(
            id = "communication",
            title = "Communication",
            summary = "Probably the strongest launch category for visible practice and useful feedback.",
            includes = listOf(
                "Speaking clearly",
                "Expressing ideas",
                "Conversation",
                "Confidence in social situations",
                "Storytelling",
                "Public speaking",
                "Interviewing",
                "Asking good questions"
            ),
            whyStrong = listOf(
                "Almost everyone cares about it",
                "Progress can be shown in video, audio, or text",
                "Feedback is natural",
                "It applies to life, work, and relationships"
            ),
            starterPractice = "Record one clear request, then reflect on what felt direct."
        ),
        SkillArea(
            id = "confidence",
            title = "Confidence / Self-expression",
            summary = "A beginner-friendly entry point for speaking up and reducing hesitation.",
            includes = listOf(
                "Speaking up",
                "Presence",
                "Social confidence",
                "Reducing hesitation",
                "Sharing your thoughts",
                "Trying new things publicly"
            ),
            whyStrong = listOf(
                "Emotionally powerful",
                "Attracts discovery-driven users",
                "Feels life-changing, not just productive",
                "Beginner-friendly"
            ),
            starterPractice = "Share one thought you usually hold back, privately or with one safe person."
        ),
        SkillArea(
            id = "momentum",
            title = "Habits / Momentum / Personal Systems",
            summary = "A practical path for routines, consistency, and early progress.",
            includes = listOf(
                "Routines",
                "Consistency",
                "Time structure",
                "Focus habits",
                "Discipline",
                "Getting out of a slump",
                "Following through"
            ),
            whyStrong = listOf(
                "Broad appeal",
                "Very high retention potential",
                "Works well with proof and check-ins",
                "Helps users feel early progress quickly"
            ),
            starterPractice = "Complete one five-minute reset and attach a photo or short reflection."
        )
    )

    fun titleFor(id: String): String {
        return items.firstOrNull { it.id == id }?.title ?: id.replaceFirstChar { it.uppercase() }
    }
}
