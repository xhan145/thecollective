package com.collective.app.beta.ui.appfeedback

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.collective.app.beta.model.AppFeedbackImportance
import com.collective.app.beta.model.AppFeedbackScreen
import com.collective.app.beta.model.AppFeedbackType
import com.collective.app.beta.ui.components.BetaChipGroup
import com.collective.app.beta.ui.components.BetaScreen
import com.collective.app.beta.ui.components.BetaSectionLabel
import com.collective.app.beta.ui.components.BetaTopBar
import com.collective.app.ui.components.CollectiveCard
import com.collective.app.ui.components.CollectivePrimaryButton
import com.collective.app.ui.theme.CollectiveTokens

private val TYPE_OPTIONS = AppFeedbackType.entries.toList()
private val SCREEN_OPTIONS = AppFeedbackScreen.entries.toList()
private val IMPORTANCE_OPTIONS = AppFeedbackImportance.entries.toList()

@Composable
fun AppFeedbackScreen(
    viewModel: AppFeedbackViewModel,
    onBack: () -> Unit,
    onDone: () -> Unit,
) {
    val draft by viewModel.draft.collectAsState()

    if (draft.submitted) {
        BetaScreen {
            BetaTopBar(title = "Thank you")
            CollectiveCard(color = CollectiveTokens.GoldSoft) {
                Text("Thank you.", color = CollectiveTokens.Text, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text(
                    "This helps us build Collective with the people using it.",
                    color = CollectiveTokens.TextSoft,
                    fontSize = 14.sp,
                    lineHeight = 19.sp,
                )
            }
            CollectivePrimaryButton("Done") {
                viewModel.reset()
                onDone()
            }
        }
        return
    }

    BetaScreen {
        BetaTopBar(
            title = "Help shape Collective",
            subtitle = "Tell us what felt clear, confusing, or useful. Your feedback helps us improve the beta.",
            onBack = onBack,
        )

        BetaSectionLabel("Feedback type")
        BetaChipGroup(
            options = TYPE_OPTIONS.map(::typeLabel),
            selectedIndex = draft.type?.let { TYPE_OPTIONS.indexOf(it) } ?: -1,
            onSelect = { viewModel.onTypeSelected(TYPE_OPTIONS[it]) },
        )

        BetaSectionLabel("Main feedback")
        OutlinedTextField(
            value = draft.message,
            onValueChange = viewModel::onMessageChanged,
            modifier = Modifier.fillMaxWidth(),
            minLines = 3,
            shape = RoundedCornerShape(16.dp),
            placeholder = { Text("What should we know?") },
        )

        BetaSectionLabel("Where did this happen?")
        BetaChipGroup(
            options = SCREEN_OPTIONS.map(::screenLabel),
            selectedIndex = draft.screen?.let { SCREEN_OPTIONS.indexOf(it) } ?: -1,
            onSelect = { viewModel.onScreenSelected(SCREEN_OPTIONS[it]) },
        )

        BetaSectionLabel("How important is this?")
        BetaChipGroup(
            options = IMPORTANCE_OPTIONS.map(::importanceLabel),
            selectedIndex = draft.importance?.let { IMPORTANCE_OPTIONS.indexOf(it) } ?: -1,
            onSelect = { viewModel.onImportanceSelected(IMPORTANCE_OPTIONS[it]) },
        )

        BetaSectionLabel("Suggested improvement (optional)")
        OutlinedTextField(
            value = draft.suggestedImprovement,
            onValueChange = viewModel::onImprovementChanged,
            modifier = Modifier.fillMaxWidth(),
            minLines = 2,
            shape = RoundedCornerShape(16.dp),
            placeholder = { Text("What would make this better?") },
        )

        draft.error?.let { Text(it, color = CollectiveTokens.Danger, fontSize = 13.sp) }

        CollectivePrimaryButton(if (draft.isSubmitting) "Sending…" else "Send feedback") { viewModel.onSubmit() }
    }
}

private fun typeLabel(type: AppFeedbackType) = when (type) {
    AppFeedbackType.CONFUSING -> "Confusing"
    AppFeedbackType.USEFUL -> "Useful"
    AppFeedbackType.BUG -> "Bug"
    AppFeedbackType.IDEA -> "Idea"
    AppFeedbackType.TOO_MUCH_TEXT -> "Too much text"
    AppFeedbackType.MISSING_FEATURE -> "Missing feature"
    AppFeedbackType.OTHER -> "Other"
}

private fun screenLabel(screen: AppFeedbackScreen) = when (screen) {
    AppFeedbackScreen.HOME -> "Home"
    AppFeedbackScreen.PRACTICE -> "Practice"
    AppFeedbackScreen.PROOF_CAPTURE -> "Proof capture"
    AppFeedbackScreen.FEED -> "Feed"
    AppFeedbackScreen.PEER_FEEDBACK -> "Feedback"
    AppFeedbackScreen.TRUST_PROFILE -> "Trust/Profile"
    AppFeedbackScreen.ONBOARDING -> "Onboarding"
    AppFeedbackScreen.OTHER -> "Other"
}

private fun importanceLabel(importance: AppFeedbackImportance) = when (importance) {
    AppFeedbackImportance.SMALL -> "Small"
    AppFeedbackImportance.MEDIUM -> "Medium"
    AppFeedbackImportance.IMPORTANT -> "Important"
    AppFeedbackImportance.BLOCKING -> "Blocking me"
}
