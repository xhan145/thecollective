package com.collective.app.beta.ui.discover

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
import com.collective.app.beta.ui.components.BetaTag
import com.collective.app.beta.ui.components.BetaTopBar
import com.collective.app.ui.components.CollectiveCard
import com.collective.app.ui.components.CollectivePrimaryButton
import com.collective.app.ui.theme.CollectiveTokens

@Composable
fun BetaDiscoverScreen(
    viewModel: BetaDiscoverViewModel,
    onBack: () -> Unit,
    onChosen: () -> Unit,
) {
    val directions by viewModel.directions.collectAsState()
    val selectedId by viewModel.selectedDirectionId.collectAsState()

    BetaScreen {
        BetaTopBar(
            title = "Choose a direction",
            subtitle = "Pick one small focus. You can change it anytime.",
            onBack = onBack,
        )
        directions.forEach { direction ->
            val isSelected = direction.id == selectedId
            CollectiveCard {
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
                    if (isSelected) BetaTag("Current")
                }
                if (!isSelected) {
                    CollectivePrimaryButton("Choose") {
                        viewModel.chooseDirection(direction.id)
                        onChosen()
                    }
                }
            }
        }
    }
}
