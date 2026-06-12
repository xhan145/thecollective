package com.collective.app.beta.ui.proof

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
import com.collective.app.beta.ui.components.BetaScreen
import com.collective.app.beta.ui.components.BetaSectionLabel
import com.collective.app.beta.ui.components.BetaTag
import com.collective.app.beta.ui.components.BetaTopBar
import com.collective.app.beta.ui.components.proofTypeLabel
import com.collective.app.ui.components.CollectiveCard
import com.collective.app.ui.components.CollectiveEmptyState
import com.collective.app.ui.components.CollectivePrimaryButton
import com.collective.app.ui.components.CollectiveSecondaryButton
import com.collective.app.ui.theme.CollectiveTokens

@Composable
fun BetaProofCaptureScreen(
    viewModel: BetaProofViewModel,
    onSubmitted: () -> Unit,
    onBack: () -> Unit,
) {
    val draft by viewModel.draft.collectAsState()

    LaunchedEffect(Unit) {
        // Reopening capture after a previous submission should start a fresh draft.
        if (draft.submittedProofId != null) viewModel.reset()
        viewModel.startDefaultIfEmpty()
    }

    // Success state
    if (draft.submittedProofId != null) {
        BetaScreen {
            BetaTopBar(title = "Proof submitted")
            CollectiveCard(color = CollectiveTokens.GoldSoft) {
                Text("Nice work showing up.", color = CollectiveTokens.Text, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text(
                    "Your proof is shared with your Founding Circle. Others can leave you useful feedback.",
                    color = CollectiveTokens.TextSoft,
                    fontSize = 14.sp,
                    lineHeight = 19.sp,
                )
            }
            CollectivePrimaryButton("See your circle's feedback") {
                viewModel.reset()
                onSubmitted()
            }
        }
        return
    }

    BetaScreen {
        BetaTopBar(title = "Show your proof", onBack = onBack)

        if (draft.promptId.isBlank()) {
            CollectiveEmptyState(
                title = "Pick a practice first",
                body = "Choose a direction and a prompt, then come back to capture your proof.",
                actionLabel = "Go back",
                onAction = onBack,
            )
            return@BetaScreen
        }

        // Prompt summary
        CollectiveCard {
            BetaSectionLabel("Practicing")
            Text(draft.promptTitle, color = CollectiveTokens.Text, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
        }

        // Attachment
        BetaSectionLabel("Add proof (optional)")
        val attachment = draft.attachment
        if (attachment == null) {
            BetaMediaPicker(onPicked = viewModel::onMediaPicked)
        } else {
            CollectiveCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text("${proofTypeLabel(attachment.type)} attached", color = CollectiveTokens.Text, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                        Text(attachment.mimeType ?: "Ready to submit", color = CollectiveTokens.Muted, fontSize = 12.sp)
                    }
                    BetaTag("Attached", container = CollectiveTokens.GoldSoft)
                }
                CollectiveSecondaryButton("Remove", onClick = viewModel::onRemoveAttachment)
            }
        }

        // Reflection
        BetaSectionLabel("Reflection")
        OutlinedTextField(
            value = draft.reflectionText,
            onValueChange = viewModel::onReflectionChanged,
            modifier = Modifier.fillMaxWidth(),
            minLines = 4,
            shape = RoundedCornerShape(16.dp),
            placeholder = { Text("Show what you practiced. It does not need to be perfect.") },
        )

        Text(
            "Shared only with your Founding Circle. Not public.",
            color = CollectiveTokens.Muted,
            fontSize = 12.sp,
        )

        draft.error?.let {
            Text(it, color = CollectiveTokens.Danger, fontSize = 13.sp)
        }

        CollectivePrimaryButton(if (draft.isSubmitting) "Submitting…" else "Submit proof") {
            viewModel.onSubmit()
        }
    }
}
