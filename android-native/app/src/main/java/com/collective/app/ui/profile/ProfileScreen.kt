package com.collective.app.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.collective.app.ui.brand.CollectiveBrandHeader
import com.collective.app.ui.brand.CollectiveSheetHeader
import com.collective.app.ui.brand.CollectiveWatermark
import com.collective.app.ui.components.CollectiveBottomSheetScaffoldContent
import com.collective.app.ui.components.CollectiveCard
import com.collective.app.ui.components.CollectivePrimaryButton
import com.collective.app.ui.components.CollectiveScreen
import com.collective.app.ui.components.CollectiveSectionHeader
import com.collective.app.ui.components.CollectiveTrustBadge
import com.collective.app.ui.home.HomeUiState
import com.collective.app.ui.proof.ProofViewModel
import com.collective.app.ui.theme.CollectiveTokens

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    uiState: HomeUiState,
    proofViewModel: ProofViewModel,
    modifier: Modifier = Modifier,
) {
    var showTrustSheet by remember { mutableStateOf(false) }
    val proofItems by proofViewModel.proofItems.collectAsState()
    val statusTop = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()

    CollectiveScreen(modifier = modifier) {
        LazyColumn(
            contentPadding = PaddingValues(
                start = CollectiveTokens.ScreenHorizontalPadding,
                end = CollectiveTokens.ScreenHorizontalPadding,
                top = statusTop + 18.dp,
                bottom = 24.dp,
            ),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            item {
                CollectiveBrandHeader(
                    title = "Profile",
                    subtitle = "Progress you can build on.",
                )
            }
            item { ProfileCard() }
            item {
                CollectiveSectionHeader("Trust snapshot")
                Spacer(Modifier.height(10.dp))
                TrustSnapshotCard(uiState = uiState, proofCount = proofItems.size)
            }
            item {
                ContributionReadinessCard(onLearn = { showTrustSheet = true })
            }
        }
    }

    if (showTrustSheet) {
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ModalBottomSheet(
            onDismissRequest = { showTrustSheet = false },
            sheetState = sheetState,
            containerColor = CollectiveTokens.Cream,
            dragHandle = { SheetHandle() },
        ) {
            HowTrustWorksSheet(onDone = { showTrustSheet = false })
            Spacer(Modifier.height(28.dp))
        }
    }
}

@Composable
private fun ProfileCard() {
    CollectiveCard(radius = CollectiveTokens.LargeCardRadius) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Box(
                modifier = Modifier
                    .size(58.dp)
                    .clip(CircleShape)
                    .background(CollectiveTokens.GoldBright),
                contentAlignment = Alignment.Center,
            ) {
                Text("A", color = androidx.compose.ui.graphics.Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text("Alex", color = CollectiveTokens.Text, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                Text("Building confident communication", color = CollectiveTokens.Muted, fontSize = 12.sp, lineHeight = 16.sp)
                CollectiveTrustBadge("Building trust")
            }
        }
    }
}

@Composable
private fun TrustSnapshotCard(uiState: HomeUiState, proofCount: Int) {
    CollectiveCard(radius = 18.dp) {
        SnapshotRow("Practices completed", uiState.trustSnapshot.practicesCompleted.toString())
        SnapshotRow("Proof submitted", proofCount.toString())
        SnapshotRow("Feedback used", uiState.trustSnapshot.feedbackUsed.toString())
        SnapshotRow("Helpful feedback given", uiState.trustSnapshot.helpfulFeedbackGiven.toString())
        SnapshotRow("Current streak", "${uiState.streak.currentDays} days")
        Text(
            "Trust grows when you practice, submit proof, use feedback, and help others safely.",
            color = CollectiveTokens.Muted,
            fontSize = 12.sp,
            lineHeight = 17.sp,
        )
    }
}

@Composable
private fun SnapshotRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = CollectiveTokens.TextSoft, fontSize = 13.sp)
        Text(value, color = CollectiveTokens.Text, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun ContributionReadinessCard(onLearn: () -> Unit) {
    CollectiveCard(radius = 18.dp) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Contribution", color = CollectiveTokens.Text, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                Text(
                    "You will unlock more ways to help others as your proof and feedback history grows.",
                    color = CollectiveTokens.TextSoft,
                    fontSize = 13.sp,
                    lineHeight = 19.sp,
                )
                CollectiveTrustBadge("Not rushed")
            }
            CollectiveWatermark(modifier = Modifier.size(width = 86.dp, height = 56.dp))
        }
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .clip(RoundedCornerShape(15.dp))
                .background(CollectiveTokens.GoldBright)
                .semantics {
                    contentDescription = "Learn how trust works"
                    role = Role.Button
                }
                .clickable { onLearn() },
            contentAlignment = Alignment.Center,
        ) {
            Text("Learn how trust works", color = androidx.compose.ui.graphics.Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun HowTrustWorksSheet(onDone: () -> Unit) {
    CollectiveBottomSheetScaffoldContent {
        CollectiveSheetHeader(title = "How trust works")
        Text(
            "Collective does not measure trust by likes or followers. Trust grows when you practice, show proof, use feedback, and give helpful feedback to others.",
            color = CollectiveTokens.TextSoft,
            fontSize = 14.sp,
            lineHeight = 20.sp,
        )
        listOf(
            "Complete practices",
            "Submit proof",
            "Use feedback",
            "Give useful feedback",
            "Help beginners safely",
        ).forEach { item ->
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(
                    modifier = Modifier
                        .size(22.dp)
                        .clip(CircleShape)
                        .background(CollectiveTokens.GoldBright),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("\u2713", color = androidx.compose.ui.graphics.Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                Text(item, color = CollectiveTokens.Text, fontSize = 14.sp)
            }
        }
        CollectivePrimaryButton("Got it", onClick = onDone)
    }
}

@Composable
private fun SheetHandle() {
    Box(
        modifier = Modifier
            .padding(top = 10.dp, bottom = 8.dp)
            .size(width = 42.dp, height = 4.dp)
            .clip(CircleShape)
            .background(CollectiveTokens.Line),
    )
}
