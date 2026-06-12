package com.collective.app.beta.ui.appfeedback

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material3.Text
import com.collective.app.beta.model.AppFeedbackStatus
import com.collective.app.beta.ui.components.BetaChipGroup
import com.collective.app.beta.ui.components.BetaScreen
import com.collective.app.beta.ui.components.BetaTag
import com.collective.app.beta.ui.components.BetaTopBar
import com.collective.app.ui.components.CollectiveCard
import com.collective.app.ui.components.CollectiveEmptyState
import com.collective.app.ui.theme.CollectiveTokens

private val STATUS_OPTIONS = AppFeedbackStatus.entries.toList()

@Composable
fun BetaFeedbackReviewScreen(
    viewModel: BetaFeedbackReviewViewModel,
    onBack: () -> Unit,
) {
    val items by viewModel.items.collectAsState()

    BetaScreen {
        BetaTopBar(
            title = "Beta feedback review",
            subtitle = "What the Founding Circle is telling us. Founder view only.",
            onBack = onBack,
        )

        if (items.isEmpty()) {
            CollectiveEmptyState(title = "No app feedback yet", body = "Submitted app feedback will show up here.")
            return@BetaScreen
        }

        items.forEach { item ->
            CollectiveCard {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    BetaTag(item.type.name.lowercase().replace('_', ' '))
                    BetaTag(item.importance.name.lowercase(), container = CollectiveTokens.Cream)
                }
                Text(item.message, color = CollectiveTokens.Text, fontSize = 14.sp, lineHeight = 19.sp)
                item.suggestedImprovement?.let {
                    Text("Suggested: $it", color = CollectiveTokens.Muted, fontSize = 12.sp, lineHeight = 16.sp)
                }
                Text(
                    "${item.userDisplayName} · ${item.screen.name.lowercase().replace('_', ' ')}",
                    color = CollectiveTokens.Muted,
                    fontSize = 12.sp,
                )
                BetaChipGroup(
                    options = STATUS_OPTIONS.map { it.name.lowercase().replaceFirstChar { c -> c.uppercase() } },
                    selectedIndex = STATUS_OPTIONS.indexOf(item.status),
                    onSelect = { viewModel.updateStatus(item.id, STATUS_OPTIONS[it]) },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}
