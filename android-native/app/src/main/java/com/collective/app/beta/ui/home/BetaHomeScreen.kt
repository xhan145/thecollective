package com.collective.app.beta.ui.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
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
import com.collective.app.beta.ui.components.BetaTag
import com.collective.app.ui.brand.CollectiveMiniMark
import com.collective.app.ui.components.CollectiveCard
import com.collective.app.ui.components.CollectivePrimaryButton
import com.collective.app.ui.components.CollectiveSecondaryButton
import com.collective.app.ui.components.CollectiveTrustBadge
import com.collective.app.ui.theme.CollectiveTokens

@Composable
fun BetaHomeScreen(
    viewModel: BetaHomeViewModel,
    onPracticeNow: () -> Unit,
    onGiveFeedback: () -> Unit,
    onOpenAppFeedback: () -> Unit,
    onChangeDirection: () -> Unit,
    onSwitchUser: () -> Unit,
) {
    val state by viewModel.uiState.collectAsState()

    BetaScreen {
        // Greeting with the brand mark
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            CollectiveMiniMark(size = 42.dp, contentDescription = "Collective")
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = if (state.userName.isBlank()) "Welcome" else "Hi, ${state.userName}",
                    color = CollectiveTokens.Text,
                    fontSize = 26.sp,
                    lineHeight = 30.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text("Small steps. Real progress.", color = CollectiveTokens.Muted, fontSize = 14.sp)
            }
        }

        // Viewing-as / mock switcher (dev affordance)
        Row(
            modifier = Modifier.fillMaxWidth().clickable { onSwitchUser() },
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                "Viewing as ${state.userName} · ${state.cohortName}",
                color = CollectiveTokens.Muted,
                fontSize = 12.sp,
            )
            Text("Switch", color = CollectiveTokens.Gold, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }

        // Current direction
        BetaSectionLabel("Your direction")
        CollectiveCard {
            val direction = state.direction
            if (direction == null) {
                Text("Choose a direction", color = CollectiveTokens.Text, fontSize = 17.sp, fontWeight = FontWeight.SemiBold)
                Text(
                    "Pick a small focus to practice toward.",
                    color = CollectiveTokens.Muted,
                    fontSize = 13.sp,
                )
                CollectiveSecondaryButton("Choose a direction", onClick = onChangeDirection)
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    BetaMarker(direction.title)
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(direction.title, color = CollectiveTokens.Text, fontSize = 17.sp, fontWeight = FontWeight.SemiBold)
                        Text(direction.description, color = CollectiveTokens.Muted, fontSize = 13.sp, lineHeight = 17.sp)
                    }
                    Text(
                        "Change",
                        modifier = Modifier.clickable { onChangeDirection() },
                        color = CollectiveTokens.Gold,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }
        }

        // Today's practice
        BetaSectionLabel("Today's practice")
        CollectiveCard {
            val prompt = state.todayPrompt
            if (prompt == null) {
                Text("Ready when you are", color = CollectiveTokens.Text, fontSize = 17.sp, fontWeight = FontWeight.SemiBold)
                Text(
                    "Choose a direction to see your first small step.",
                    color = CollectiveTokens.Muted,
                    fontSize = 13.sp,
                )
                CollectiveSecondaryButton("Choose a direction", onClick = onChangeDirection)
            } else {
                Text(prompt.title, color = CollectiveTokens.Text, fontSize = 17.sp, fontWeight = FontWeight.SemiBold)
                Text(prompt.shortDescription, color = CollectiveTokens.Muted, fontSize = 13.sp, lineHeight = 17.sp)
                Text("About ${prompt.estimatedMinutes} min", color = CollectiveTokens.Muted, fontSize = 12.sp)
                CollectivePrimaryButton("Practice now", onClick = onPracticeNow)
            }
        }

        // Trust summary (calm)
        BetaSectionLabel("Your progress")
        CollectiveCard {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                CollectiveTrustBadge(state.trustLevelLabel)
                Text("${state.trust.trustScore} points", color = CollectiveTokens.Muted, fontSize = 13.sp)
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                TrustStat(state.trust.practicesCompleted, "Practices")
                TrustStat(state.trust.proofsSubmitted, "Proof")
                TrustStat(state.trust.feedbackGiven, "Feedback")
                TrustStat(state.trust.helpfulFeedbackGiven, "Helpful")
            }
            Text(
                "How trust works: trust is built through practice, proof, useful feedback, and contribution.",
                color = CollectiveTokens.Muted,
                fontSize = 12.sp,
                lineHeight = 17.sp,
            )
        }

        // Cohort activity preview
        BetaSectionLabel("In your circle")
        CollectiveCard {
            if (state.recentActivity.isEmpty()) {
                Text("No activity yet. Be the first to practice.", color = CollectiveTokens.Muted, fontSize = 13.sp)
            } else {
                state.recentActivity.forEach { item ->
                    Text(
                        "${item.displayName} practiced ${item.directionTitle.lowercase()}",
                        color = CollectiveTokens.Text,
                        fontSize = 14.sp,
                    )
                }
                Text(
                    "${state.cohortPracticedThisWeek} people practiced recently",
                    color = CollectiveTokens.Muted,
                    fontSize = 12.sp,
                )
            }
        }

        // App feedback card
        CollectiveCard(color = CollectiveTokens.GoldSoft) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Help shape Collective", color = CollectiveTokens.Text, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                BetaTag("Beta", container = CollectiveTokens.Card)
            }
            Text(
                "Tell us what felt clear, confusing, or useful.",
                color = CollectiveTokens.TextSoft,
                fontSize = 13.sp,
            )
            CollectiveSecondaryButton("Give app feedback", onClick = onOpenAppFeedback)
        }

        // Secondary CTA
        CollectiveSecondaryButton("Give feedback to your circle", onClick = onGiveFeedback)
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun TrustStat(value: Int, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(1.dp)) {
        Text("$value", color = CollectiveTokens.Text, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Text(label, color = CollectiveTokens.Muted, fontSize = 11.sp)
    }
}
