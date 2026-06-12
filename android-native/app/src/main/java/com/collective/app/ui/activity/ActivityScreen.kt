package com.collective.app.ui.activity

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
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.collective.app.ui.brand.CollectiveBrandHeader
import com.collective.app.ui.components.CollectiveBottomSheetScaffoldContent
import com.collective.app.ui.components.CollectiveCard
import com.collective.app.ui.components.CollectiveEmptyState
import com.collective.app.ui.components.CollectiveScreen
import com.collective.app.ui.components.CollectiveSectionHeader
import com.collective.app.ui.feedback.AddFeedbackSheetContent
import com.collective.app.ui.feedback.FeedbackList
import com.collective.app.ui.feedback.FeedbackViewModel
import com.collective.app.ui.proof.ProofDetailSheetContent
import com.collective.app.ui.proof.ProofSummaryCard
import com.collective.app.ui.proof.ProofViewModel
import com.collective.app.ui.theme.CollectiveTokens

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActivityScreen(
    proofViewModel: ProofViewModel,
    feedbackViewModel: FeedbackViewModel,
    onSubmitProof: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val proofItems by proofViewModel.proofItems.collectAsState()
    val feedbackItems by feedbackViewModel.feedbackItems.collectAsState()
    val selectedProof by proofViewModel.selectedProof.collectAsState()
    val draft by feedbackViewModel.draft.collectAsState()
    var addFeedbackMode by remember { mutableStateOf(false) }
    val statusTop = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()

    val feedbackCountFor: (String) -> Int = { proofId -> feedbackItems.count { it.proofId == proofId } }
    val proofTitleFor: (String) -> String? = { proofId -> proofItems.firstOrNull { it.id == proofId }?.title }

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
                    title = "Activity",
                    subtitle = "Your proof, feedback, and progress.",
                )
            }
            if (proofItems.isEmpty()) {
                item {
                    CollectiveEmptyState(
                        title = "No proof yet",
                        body = "Submit one small proof when you are ready.",
                        actionLabel = "Submit proof",
                        onAction = onSubmitProof,
                    )
                }
            } else {
                item { CollectiveSectionHeader(title = "Recent proof") }
                items(proofItems, key = { it.id }) { proof ->
                    ProofSummaryCard(
                        proof = proof,
                        feedbackCount = feedbackCountFor(proof.id),
                        onClick = {
                            addFeedbackMode = false
                            feedbackViewModel.onMarkAllForProofRead(proof.id)
                            proofViewModel.onProofSelected(proof)
                        },
                    )
                }
            }

            item { CollectiveSectionHeader(title = "Feedback received") }
            if (feedbackItems.isEmpty()) {
                item {
                    CollectiveCard(radius = 18.dp) {
                        Text("No feedback yet", color = CollectiveTokens.Text, fontSize = 15.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
                        Text("Feedback helps you improve. It does not define you.", color = CollectiveTokens.Muted, fontSize = 13.sp, lineHeight = 18.sp)
                    }
                }
            } else {
                item {
                    Text(
                        "Feedback helps you improve. It does not define you.",
                        color = CollectiveTokens.Muted,
                        fontSize = 13.sp,
                        lineHeight = 18.sp,
                    )
                }
                item {
                    FeedbackList(
                        feedback = feedbackItems,
                        proofTitleFor = { proofTitleFor(it.proofId) },
                        onFeedbackClick = { feedback ->
                            proofItems.firstOrNull { it.id == feedback.proofId }?.let { proof ->
                                addFeedbackMode = false
                                feedbackViewModel.onMarkAllForProofRead(proof.id)
                                proofViewModel.onProofSelected(proof)
                            }
                        },
                    )
                }
            }
        }
    }

    if (selectedProof != null) {
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ModalBottomSheet(
            onDismissRequest = {
                addFeedbackMode = false
                feedbackViewModel.onResetDraft()
                proofViewModel.onClearSelectedProof()
            },
            sheetState = sheetState,
            containerColor = CollectiveTokens.Cream,
            dragHandle = { SheetHandle() },
        ) {
            selectedProof?.let { proof ->
                if (addFeedbackMode) {
                    CollectiveBottomSheetScaffoldContent {
                        AddFeedbackSheetContent(
                            draft = draft,
                            onBodyChanged = feedbackViewModel::onFeedbackBodyChanged,
                            onToneSelected = feedbackViewModel::onFeedbackToneSelected,
                            onSave = feedbackViewModel::onSubmitFeedback,
                            onDone = {
                                feedbackViewModel.onDismissSuccess()
                                addFeedbackMode = false
                            },
                        )
                    }
                } else {
                    ProofDetailSheetContent(
                        proof = proof,
                        feedback = feedbackItems.filter { it.proofId == proof.id },
                        onUseFeedback = feedbackViewModel::onUseFeedback,
                        onAddFeedback = { proofId ->
                            feedbackViewModel.onStartFeedbackForProof(proofId)
                            addFeedbackMode = true
                        },
                        onClose = {
                            proofViewModel.onClearSelectedProof()
                        },
                    )
                }
            }
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
