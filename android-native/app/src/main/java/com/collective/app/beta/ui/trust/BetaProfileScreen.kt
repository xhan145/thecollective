package com.collective.app.beta.ui.trust

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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material3.Text
import com.collective.app.beta.ui.components.BetaMarker
import com.collective.app.beta.ui.components.BetaScreen
import com.collective.app.beta.ui.components.BetaSectionLabel
import com.collective.app.beta.ui.components.BetaTopBar
import com.collective.app.ui.components.CollectiveCard
import com.collective.app.ui.components.CollectiveProgressBar
import com.collective.app.ui.components.CollectiveSecondaryButton
import com.collective.app.ui.components.CollectiveTrustBadge
import com.collective.app.ui.theme.CollectiveTokens

@Composable
fun BetaProfileScreen(
    viewModel: BetaTrustViewModel,
    onGiveAppFeedback: () -> Unit,
    onOpenReview: () -> Unit,
    onSwitchUser: () -> Unit,
) {
    val state by viewModel.uiState.collectAsState()
    val trust = state.trust

    BetaScreen {
        BetaTopBar(title = "Profile")

        // Identity + level
        CollectiveCard {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                BetaMarker(state.userName)
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(state.userName, color = CollectiveTokens.Text, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    CollectiveTrustBadge(state.levelLabel)
                }
                Text("${trust.trustScore} pts", color = CollectiveTokens.Muted, fontSize = 13.sp)
            }
            val threshold = state.nextThreshold
            if (threshold != null) {
                CollectiveProgressBar(progress = trust.trustScore.toFloat() / threshold.toFloat())
                Text(
                    "${(threshold - trust.trustScore).coerceAtLeast(0)} points to your next level",
                    color = CollectiveTokens.Muted,
                    fontSize = 12.sp,
                )
            } else {
                CollectiveProgressBar(progress = 1f)
                Text("Top level reached. Thank you for contributing.", color = CollectiveTokens.Muted, fontSize = 12.sp)
            }
        }

        // Stats
        BetaSectionLabel("Your progress")
        CollectiveCard {
            StatRow("Practices completed", trust.practicesCompleted)
            StatRow("Proof submitted", trust.proofsSubmitted)
            StatRow("Feedback given", trust.feedbackGiven)
            StatRow("Helpful feedback", trust.helpfulFeedbackGiven)
            StatRow("Contributions", trust.contributionsMade)
            Text(
                "Trust is earned through practice, proof, useful feedback, and contribution.",
                color = CollectiveTokens.Muted,
                fontSize = 12.sp,
                lineHeight = 17.sp,
            )
        }

        // My proof history
        BetaSectionLabel("Your proof")
        CollectiveCard {
            if (state.myProofs.isEmpty()) {
                Text("No proof yet. Your submissions will appear here.", color = CollectiveTokens.Muted, fontSize = 13.sp)
            } else {
                state.myProofs.forEach { proof ->
                    Column(verticalArrangement = Arrangement.spacedBy(1.dp)) {
                        Text(proof.promptTitle, color = CollectiveTokens.Text, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                        if (proof.reflectionText.isNotBlank()) {
                            Text(proof.reflectionText, color = CollectiveTokens.Muted, fontSize = 12.sp, lineHeight = 16.sp)
                        }
                    }
                }
            }
        }

        // Secondary actions
        CollectiveSecondaryButton("Give app feedback", onClick = onGiveAppFeedback)
        if (state.isFounder) {
            CollectiveSecondaryButton("Beta feedback review", onClick = onOpenReview)
        }
        CollectiveSecondaryButton("Switch user (dev)", onClick = onSwitchUser)
    }
}

@Composable
private fun StatRow(label: String, value: Int) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, color = CollectiveTokens.TextSoft, fontSize = 14.sp)
        Text("$value", color = CollectiveTokens.Text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
    }
}
