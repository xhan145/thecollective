package com.collective.app.beta.ui.feed

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material3.Text
import com.collective.app.beta.model.ProofType
import com.collective.app.beta.ui.components.BetaMarker
import com.collective.app.beta.ui.components.BetaScreen
import com.collective.app.beta.ui.components.BetaTag
import com.collective.app.beta.ui.components.BetaTopBar
import com.collective.app.beta.ui.components.proofTypeLabel
import com.collective.app.ui.components.CollectiveCard
import com.collective.app.ui.components.CollectiveEmptyState
import com.collective.app.ui.components.CollectiveSecondaryButton
import com.collective.app.ui.theme.CollectiveTokens

@Composable
fun BetaFeedScreen(
    viewModel: BetaFeedViewModel,
    onOpenProof: (String) -> Unit,
) {
    val feed by viewModel.feed.collectAsState()

    BetaScreen {
        BetaTopBar(title = "Feedback", subtitle = "Practice and proof from your circle. Leave feedback that helps.")

        if (feed.isEmpty()) {
            CollectiveEmptyState(
                title = "No proof yet",
                body = "Submit one small proof when you are ready.",
            )
            return@BetaScreen
        }

        feed.forEach { row ->
            CollectiveCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    BetaMarker(row.proof.ownerDisplayName)
                    Column(modifier = Modifier.weight(1f)) {
                        Text(row.proof.ownerDisplayName, color = CollectiveTokens.Text, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                        Text(row.directionTitle, color = CollectiveTokens.Muted, fontSize = 12.sp)
                    }
                    BetaTag(row.statusLabel, container = tagColor(row.cardState))
                }

                Text(row.proof.promptTitle, color = CollectiveTokens.Text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)

                if (row.proof.primaryType != ProofType.TEXT) {
                    BetaTag(proofTypeLabel(row.proof.primaryType), container = CollectiveTokens.Cream)
                }

                if (row.proof.reflectionText.isNotBlank()) {
                    Text(
                        row.proof.reflectionText,
                        color = CollectiveTokens.TextSoft,
                        fontSize = 13.sp,
                        lineHeight = 18.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        "${row.feedbackCount} feedback",
                        color = CollectiveTokens.Muted,
                        fontSize = 12.sp,
                    )
                }
                CollectiveSecondaryButton(row.ctaLabel) { onOpenProof(row.proof.id) }
            }
        }
    }
}

private fun tagColor(state: FeedCardState) = when (state) {
    FeedCardState.NEEDS_FEEDBACK -> CollectiveTokens.GoldSoft
    FeedCardState.YOUR_PROOF -> CollectiveTokens.Cream
    FeedCardState.FEEDBACK_GIVEN -> CollectiveTokens.Cream
    FeedCardState.PRACTICED_RECENTLY -> CollectiveTokens.Cream
}
