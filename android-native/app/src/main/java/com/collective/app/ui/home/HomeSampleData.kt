package com.collective.app.ui.home

import com.collective.app.ui.proof.ProofMediaType

object CollectivePreviewData {
    val homeUiState = HomeUiState(
        userName = "Alex",
        greeting = "Good morning",
        subtitle = "Small steps. Real progress.",
        focus = FocusState(
            title = "Confident Communication",
            completedPractices = 2,
            totalPractices = 3,
            progress = 0.72f,
            practices = listOf(
                "Record a 60-second voice note",
                "Rewrite one unclear thought",
                "Ask one useful question",
            ),
        ),
        practice = PracticeState(
            id = "voice-note-60",
            title = "Record a 60-second\nvoice note",
            prompt = "Say one idea out loud as if you were sharing it with a teammate.",
            durationSeconds = 60,
            type = PracticeType.VoiceNote,
            isCompletedToday = false,
        ),
        recentProof = ProofSummaryState(
            id = "proof-clarity-meeting",
            title = "Explained my ideas more\nclearly in our team meeting.",
            feedbackCount = 3,
            supporterInitials = listOf("A", "J", "M"),
            mediaType = ProofMediaType.Image,
        ),
        streak = StreakState(
            currentDays = 7,
            week = listOf(
                StreakDayState("M", isCompleted = true, isToday = false),
                StreakDayState("T", isCompleted = true, isToday = false),
                StreakDayState("W", isCompleted = true, isToday = false),
                StreakDayState("T", isCompleted = true, isToday = false),
                StreakDayState("F", isCompleted = true, isToday = false),
                StreakDayState("S", isCompleted = true, isToday = false),
                StreakDayState("S", isCompleted = false, isToday = true),
            ),
        ),
        trustSnapshot = TrustSnapshotState(
            practicesCompleted = 2,
            proofsSubmitted = 1,
            feedbackUsed = 1,
            helpfulFeedbackGiven = 4,
            trustLevelLabel = "Building trust",
        ),
        notificationCount = 1,
    )
}
