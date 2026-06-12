package com.collective.app.ui.discover

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.collective.app.ui.brand.CollectiveBrandHeader
import com.collective.app.ui.components.CollectiveScreen
import com.collective.app.ui.components.CollectiveSectionHeader
import com.collective.app.ui.practice.ComingSoonDirectionRow
import com.collective.app.ui.practice.DirectionDetailSheetContent
import com.collective.app.ui.practice.DirectionFeaturedCard
import com.collective.app.ui.practice.PracticeStepPreviewRow
import com.collective.app.ui.practice.PracticeViewModel
import com.collective.app.ui.practice.selectedDirectionStateOf
import com.collective.app.ui.theme.CollectiveTokens

/**
 * Discover screen — reads directions, steps, and progress from PracticeViewModel.
 * No hardcoded practice lists. PracticeRepository is the single source of truth.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiscoverScreen(
    practiceViewModel: PracticeViewModel,
    onStartFirstPractice: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val directions by practiceViewModel.directions.collectAsState()
    val selectedDirectionId by practiceViewModel.selectedDirectionId.collectAsState()
    val practiceProgress by practiceViewModel.progress.collectAsState()

    val availableDirection = directions.firstOrNull { it.isAvailable }
    val unavailableDirections = directions.filter { !it.isAvailable }

    // Compute state for the featured (available) direction
    val featuredState = availableDirection?.let {
        selectedDirectionStateOf(directions, it.id, practiceProgress)
    }

    var showDirectionSheet by remember { mutableStateOf(false) }
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
                    title = "Discover",
                    subtitle = "Choose a direction. Practice one small step.",
                )
            }

            // Featured available direction
            if (availableDirection != null) {
                item { CollectiveSectionHeader("Featured direction") }
                item {
                    DirectionFeaturedCard(
                        direction = availableDirection,
                        selectedDirectionState = featuredState,
                        onClick = { showDirectionSheet = true },
                    )
                }

                // Read-only step preview list
                if (availableDirection.steps.isNotEmpty()) {
                    item { CollectiveSectionHeader("Practice steps") }
                    items(availableDirection.steps, key = { it.id }) { step ->
                        PracticeStepPreviewRow(step = step)
                    }
                }
            }

            // Coming-soon directions
            if (unavailableDirections.isNotEmpty()) {
                item { CollectiveSectionHeader("Other directions") }
                items(unavailableDirections, key = { it.id }) { direction ->
                    ComingSoonDirectionRow(direction = direction)
                }
            }
        }
    }

    // Direction detail sheet
    if (showDirectionSheet && availableDirection != null) {
        val sheetState = androidx.compose.material3.rememberModalBottomSheetState(
            skipPartiallyExpanded = true,
        )
        ModalBottomSheet(
            onDismissRequest = { showDirectionSheet = false },
            sheetState = sheetState,
            containerColor = CollectiveTokens.Cream,
            dragHandle = { SheetHandle() },
        ) {
            DirectionDetailSheetContent(
                direction = availableDirection,
                selectedDirectionState = featuredState,
                onStart = {
                    practiceViewModel.onSelectDirection(availableDirection.id)
                    showDirectionSheet = false
                    onStartFirstPractice()
                },
                onDismiss = { showDirectionSheet = false },
            )
            Spacer(Modifier.height(28.dp))
        }
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
