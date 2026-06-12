package com.collective.app.beta.ui.dev

import androidx.compose.foundation.clickable
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
import com.collective.app.beta.model.trustLevelLabel
import com.collective.app.beta.ui.BetaSession
import com.collective.app.beta.ui.components.BetaMarker
import com.collective.app.beta.ui.components.BetaScreen
import com.collective.app.beta.ui.components.BetaTag
import com.collective.app.beta.ui.components.BetaTopBar
import com.collective.app.ui.components.CollectiveCard
import com.collective.app.ui.theme.CollectiveTokens

/**
 * Dev-only mock user switcher. Lets one device act as any of the seeded cohort members so the social
 * loop (give feedback as another member, mark helpful as the owner) can be tested end to end.
 */
@Composable
fun BetaUserSwitcherScreen(
    session: BetaSession,
    onDone: () -> Unit,
) {
    val users by session.repositories.userRepository.users.collectAsState()
    val current by session.currentUser.collectAsState()

    BetaScreen {
        BetaTopBar(
            title = "Switch user",
            subtitle = "Dev only — test the social loop as different members.",
            onBack = onDone,
        )
        users.forEach { user ->
            val isCurrent = user.id == current.id
            CollectiveCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        session.switchUser(user.id)
                        onDone()
                    },
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    BetaMarker(user.displayName)
                    Column(modifier = Modifier.weight(1f)) {
                        Text(user.displayName, color = CollectiveTokens.Text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                        Text(
                            "${trustLevelLabel(user.trustLevel)} · ${user.trustScore} pts",
                            color = CollectiveTokens.Muted,
                            fontSize = 12.sp,
                        )
                    }
                    if (isCurrent) BetaTag("Current")
                }
            }
        }
    }
}
