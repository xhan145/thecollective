package com.collective.app.beta.ui.practice

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material3.Text
import com.collective.app.beta.model.PracticePrompt
import com.collective.app.beta.ui.components.BetaScreen
import com.collective.app.beta.ui.components.BetaSectionLabel
import com.collective.app.beta.ui.components.BetaTag
import com.collective.app.beta.ui.components.BetaTopBar
import com.collective.app.beta.ui.components.proofTypeLabel
import com.collective.app.ui.components.CollectiveCard
import com.collective.app.ui.components.CollectiveEmptyState
import com.collective.app.ui.components.CollectivePrimaryButton
import com.collective.app.ui.theme.CollectiveTokens

@Composable
fun BetaPracticeScreen(
    viewModel: BetaPracticeViewModel,
    onStartProof: (PracticePrompt) -> Unit,
    onChangeDirection: () -> Unit,
) {
    val state by viewModel.uiState.collectAsState()

    BetaScreen {
        BetaTopBar(title = "Practice", subtitle = state.direction?.title ?: "Choose a direction first")

        val prompt = state.selectedPrompt
        if (state.direction == null || prompt == null) {
            CollectiveEmptyState(
                title = "No practice started",
                body = "Choose one small step.",
                actionLabel = "Choose a direction",
                onAction = onChangeDirection,
            )
            return@BetaScreen
        }

        // Focused prompt
        CollectiveCard {
            Text(prompt.title, color = CollectiveTokens.Text, fontSize = 19.sp, lineHeight = 24.sp, fontWeight = FontWeight.Bold)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                BetaTag(prompt.proofTypes.joinToString(" / ") { proofTypeLabel(it) })
                Text("About ${prompt.estimatedMinutes} min", color = CollectiveTokens.Muted, fontSize = 12.sp)
            }
            Text(prompt.shortDescription, color = CollectiveTokens.TextSoft, fontSize = 14.sp, lineHeight = 19.sp)
            if (prompt.whyItHelps.isNotBlank()) {
                Text("Why this helps: ${prompt.whyItHelps}", color = CollectiveTokens.Muted, fontSize = 13.sp, lineHeight = 18.sp)
            }
            if (prompt.examples.isNotEmpty()) {
                var showExamples by remember(prompt.id) { mutableStateOf(false) }
                Text(
                    if (showExamples) "Hide examples" else "See examples",
                    modifier = Modifier.clickable { showExamples = !showExamples },
                    color = CollectiveTokens.Gold,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                )
                if (showExamples) {
                    prompt.examples.forEach { example ->
                        Text("• $example", color = CollectiveTokens.Muted, fontSize = 13.sp, lineHeight = 18.sp)
                    }
                }
            }
            CollectivePrimaryButton("Start proof") { onStartProof(prompt) }
        }

        // Choose another prompt
        if (state.prompts.size > 1) {
            BetaSectionLabel("Choose another prompt")
            CollectiveCard {
                state.prompts.forEach { other ->
                    val isSelected = other.id == prompt.id
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { viewModel.selectPrompt(other.id) },
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                other.title,
                                color = if (isSelected) CollectiveTokens.Text else CollectiveTokens.TextSoft,
                                fontSize = 14.sp,
                                fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                            )
                        }
                        if (isSelected) BetaTag("Selected")
                    }
                }
            }
        }
    }
}
