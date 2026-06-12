package com.collective.app.ui.home

import com.collective.app.ui.proof.ProofMediaType

data class HomeUiState(
    val userName: String,
    val greeting: String,
    val subtitle: String,
    val focus: FocusState,
    val practice: PracticeState,
    val recentProof: ProofSummaryState?,
    val streak: StreakState,
    val trustSnapshot: TrustSnapshotState,
    val notificationCount: Int,
    val activeSheet: HomeSheet? = null,
    val practiceSheetState: PracticeSheetState = PracticeSheetState.Ready,
    val isLoading: Boolean = false,
    val proofSubmissionMessage: String? = null,
)

data class FocusState(
    val title: String,
    val completedPractices: Int,
    val totalPractices: Int,
    val progress: Float,
    val practices: List<String>,
)

data class PracticeState(
    val id: String,
    val title: String,
    val prompt: String,
    val durationSeconds: Int,
    val type: PracticeType,
    val isCompletedToday: Boolean,
)

enum class PracticeType {
    VoiceNote,
    Reflection,
    ConversationPrompt,
    VideoPractice,
}

data class ProofSummaryState(
    val id: String,
    val title: String,
    val feedbackCount: Int,
    val supporterInitials: List<String>,
    val mediaType: ProofMediaType,
)

data class StreakState(
    val currentDays: Int,
    val week: List<StreakDayState>,
)

data class StreakDayState(
    val label: String,
    val isCompleted: Boolean,
    val isToday: Boolean,
)

data class TrustSnapshotState(
    val practicesCompleted: Int,
    val proofsSubmitted: Int,
    val feedbackUsed: Int,
    val helpfulFeedbackGiven: Int,
    val trustLevelLabel: String,
)

enum class HomeSheet {
    Notifications,
    FocusDetail,
    Practice,
    ProofDetail,
    SubmitProof,
    AllProof,
    AddFeedback,
}

enum class PracticeSheetState {
    Ready,
    Started,
    Logged,
}
