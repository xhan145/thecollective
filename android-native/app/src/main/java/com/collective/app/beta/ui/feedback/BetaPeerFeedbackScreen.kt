package com.collective.app.beta.ui.feedback

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.collective.app.beta.model.Feedback
import com.collective.app.beta.ui.components.BetaScreen
import com.collective.app.beta.ui.components.BetaSectionLabel
import com.collective.app.beta.ui.components.BetaTag
import com.collective.app.beta.ui.components.BetaTopBar
import com.collective.app.ui.components.CollectiveCard
import com.collective.app.ui.components.CollectiveEmptyState
import com.collective.app.ui.components.CollectivePrimaryButton
import com.collective.app.ui.components.CollectiveSecondaryButton
import com.collective.app.ui.theme.CollectiveTokens

@Composable
fun BetaPeerFeedbackScreen(
    viewModel: BetaPeerFeedbackViewModel,
    proofId: String,
    onBack: () -> Unit,
    onDone: () -> Unit,
) {
    LaunchedEffect(proofId) { viewModel.setProof(proofId) }
    val state by viewModel.uiState.collectAsState()
    val proof = state.proof

    BetaScreen {
        BetaTopBar(
            title = if (state.isOwner) "Feedback on your proof" else "Give feedback",
            onBack = onBack,
        )

        if (proof == null) {
            CollectiveEmptyState(title = "Proof not found", body = "This proof may no longer be available.")
            return@BetaScreen
        }

        // Proof summary
        CollectiveCard {
            Text(proof.ownerDisplayName, color = CollectiveTokens.Muted, fontSize = 12.sp)
            Text(proof.promptTitle, color = CollectiveTokens.Text, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
            if (proof.reflectionText.isNotBlank()) {
                Text(proof.reflectionText, color = CollectiveTokens.TextSoft, fontSize = 13.sp, lineHeight = 18.sp)
            }
        }

        if (state.isOwner) {
            OwnerFeedbackList(feedback = state.feedback, onMarkHelpful = viewModel::onMarkHelpful)
        } else {
            GiverForm(viewModel = viewModel, state = state, onDone = onDone)
        }
    }
}

@Composable
private fun OwnerFeedbackList(
    feedback: List<Feedback>,
    onMarkHelpful: (String) -> Unit,
) {
    BetaSectionLabel("What your circle shared")
    if (feedback.isEmpty()) {
        CollectiveEmptyState(
            title = "No feedback yet",
            body = "Feedback helps you improve. It does not define you.",
        )
        return
    }
    feedback.forEach { item ->
        CollectiveCard {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(item.giverDisplayName, color = CollectiveTokens.Text, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                if (item.isMarkedHelpful) BetaTag("Helpful ✓", container = CollectiveTokens.GoldSoft)
            }
            FeedbackField("What worked", item.whatWorked)
            FeedbackField("One useful suggestion", item.suggestion)
            FeedbackField("Encouragement", item.encouragement)
            if (!item.isMarkedHelpful) {
                CollectiveSecondaryButton("Mark helpful") { onMarkHelpful(item.id) }
            }
        }
    }
}

@Composable
private fun FeedbackField(label: String, value: String) {
    if (value.isBlank()) return
    Column(verticalArrangement = Arrangement.spacedBy(1.dp)) {
        Text(label, color = CollectiveTokens.Muted, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
        Text(value, color = CollectiveTokens.TextSoft, fontSize = 13.sp, lineHeight = 18.sp)
    }
}

@Composable
private fun GiverForm(
    viewModel: BetaPeerFeedbackViewModel,
    state: PeerFeedbackUiState,
    onDone: () -> Unit,
) {
    val draft = state.draft
    if (draft.submitted) {
        CollectiveCard(color = CollectiveTokens.GoldSoft) {
            Text("Thank you for helping.", color = CollectiveTokens.Text, fontSize = 17.sp, fontWeight = FontWeight.Bold)
            Text(
                "Useful feedback helps someone take their next small step.",
                color = CollectiveTokens.TextSoft,
                fontSize = 13.sp,
            )
        }
        CollectivePrimaryButton("Back to feed", onClick = onDone)
        return
    }

    Text(
        "Feedback should help the person take their next step.",
        color = CollectiveTokens.Muted,
        fontSize = 13.sp,
        lineHeight = 18.sp,
    )

    FeedbackInput("What worked?", draft.whatWorked, viewModel::onWhatWorkedChanged, "Name one thing that landed.")
    FeedbackInput("One useful suggestion", draft.suggestion, viewModel::onSuggestionChanged, "One small, kind next step.")
    FeedbackInput("Encouragement", draft.encouragement, viewModel::onEncouragementChanged, "A short, genuine note.")

    draft.error?.let { Text(it, color = CollectiveTokens.Danger, fontSize = 13.sp) }

    CollectivePrimaryButton(if (draft.isSubmitting) "Sending…" else "Send feedback") { viewModel.onSubmit() }
}

@Composable
private fun FeedbackInput(
    label: String,
    value: String,
    onChange: (String) -> Unit,
    placeholder: String,
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        BetaSectionLabel(label)
        OutlinedTextField(
            value = value,
            onValueChange = onChange,
            modifier = Modifier.fillMaxWidth(),
            minLines = 2,
            shape = RoundedCornerShape(16.dp),
            placeholder = { Text(placeholder) },
        )
    }
}
