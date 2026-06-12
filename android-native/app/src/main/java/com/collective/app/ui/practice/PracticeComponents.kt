package com.collective.app.ui.practice

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.collective.app.ui.brand.CollectiveSheetHeader
import com.collective.app.ui.brand.CollectiveSuccessMark
import com.collective.app.ui.components.CollectiveBottomSheetScaffoldContent
import com.collective.app.ui.components.CollectiveCard
import com.collective.app.ui.components.CollectivePrimaryButton
import com.collective.app.ui.components.CollectiveProgressBar
import com.collective.app.ui.components.CollectiveSecondaryButton
import com.collective.app.ui.components.CollectiveTrustBadge
import com.collective.app.ui.theme.CollectiveTokens

/**
 * Reusable components for Practice Path V1.
 * All use CollectiveTokens + shared components. Warm cream/gold brand throughout.
 * No harsh Material defaults. No course, lesson, module, score, level-up copy.
 */

// ---------------------------------------------------------------------------
// Discover: featured card
// ---------------------------------------------------------------------------

@Composable
fun DirectionFeaturedCard(
    direction: Direction,
    selectedDirectionState: SelectedDirectionState?,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val progress = selectedDirectionState?.progress ?: 0f
    val completedCount = selectedDirectionState?.completedCount ?: 0
    val totalCount = selectedDirectionState?.totalCount ?: direction.steps.size
    val isInProgress = completedCount > 0
    val buttonLabel = if (isInProgress) "Continue" else "Start direction"

    CollectiveCard(
        modifier = modifier
            .semantics {
                contentDescription = "${direction.title} direction. ${if (isInProgress) "In progress" else "Not started"}."
                role = Role.Button
            }
            .clickable { onClick() },
        radius = 18.dp,
    ) {
        Text(
            direction.title,
            color = CollectiveTokens.Text,
            fontSize = 17.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            direction.tagline,
            color = CollectiveTokens.TextSoft,
            fontSize = 13.sp,
            lineHeight = 19.sp,
        )
        Text(
            "${totalCount} practice steps",
            color = CollectiveTokens.Muted,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
        )
        CollectiveProgressBar(progress = progress)
        if (isInProgress) {
            Text(
                "$completedCount of $totalCount steps completed",
                color = CollectiveTokens.Muted,
                fontSize = 12.sp,
            )
        }
        CollectivePrimaryButton(
            label = buttonLabel,
            modifier = Modifier.semantics { contentDescription = "$buttonLabel ${direction.title}" },
            onClick = onClick,
        )
    }
}

// ---------------------------------------------------------------------------
// Discover: step preview row (read-only, shown under "Practice paths")
// ---------------------------------------------------------------------------

@Composable
fun PracticeStepPreviewRow(
    step: PracticeStep,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 56.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(CollectiveTokens.Card)
            .semantics { contentDescription = "Practice step: ${step.title}" }
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .clip(CircleShape)
                .background(CollectiveTokens.GoldSoft),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                step.title.take(1),
                color = CollectiveTokens.Gold,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
            )
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(step.title, color = CollectiveTokens.Text, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            Text(
                practiceStepKindLabel(step.kind),
                color = CollectiveTokens.Muted,
                fontSize = 11.sp,
            )
        }
        CollectiveTrustBadge("Beginner")
    }
}

// ---------------------------------------------------------------------------
// Discover: coming-soon row (not tappable)
// ---------------------------------------------------------------------------

@Composable
fun ComingSoonDirectionRow(
    direction: Direction,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(62.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(CollectiveTokens.Card)
            .semantics { contentDescription = "${direction.title} direction. Coming soon." }
            .padding(horizontal = 13.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(11.dp))
                .background(CollectiveTokens.GoldSoft),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                direction.title.take(1),
                color = CollectiveTokens.Gold,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
            )
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                direction.title,
                color = CollectiveTokens.TextSoft,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Text(direction.tagline, color = CollectiveTokens.Muted, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        CollectiveTrustBadge("Coming soon")
    }
}

// ---------------------------------------------------------------------------
// Discover: direction detail sheet
// ---------------------------------------------------------------------------

@Composable
fun DirectionDetailSheetContent(
    direction: Direction,
    selectedDirectionState: SelectedDirectionState?,
    onStart: () -> Unit,
    onDismiss: () -> Unit,
) {
    val isInProgress = (selectedDirectionState?.completedCount ?: 0) > 0
    val buttonLabel = if (isInProgress) "Continue" else "Start direction"

    CollectiveBottomSheetScaffoldContent {
        CollectiveSheetHeader(
            title = direction.title,
            subtitle = direction.tagline,
        )

        Text(
            direction.summary,
            color = CollectiveTokens.TextSoft,
            fontSize = 14.sp,
            lineHeight = 20.sp,
        )

        if (direction.whatYouPractice.isNotEmpty()) {
            Text(
                "You will practice",
                color = CollectiveTokens.Text,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
            )
            direction.whatYouPractice.forEach { item ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .clip(CircleShape)
                            .background(CollectiveTokens.GoldSoft)
                            .border(1.dp, CollectiveTokens.Gold, CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            "✓",
                            color = CollectiveTokens.Gold,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                    Text(item, color = CollectiveTokens.TextSoft, fontSize = 14.sp)
                }
            }
        }

        if (direction.steps.isNotEmpty()) {
            PathProgressHeader(
                direction = direction,
                selectedDirectionState = selectedDirectionState,
            )
        }

        CollectivePrimaryButton(
            label = buttonLabel,
            modifier = Modifier.semantics {
                contentDescription = "$buttonLabel ${direction.title}"
                role = Role.Button
            },
            onClick = onStart,
        )
        CollectiveSecondaryButton(
            label = "Maybe later",
            onClick = onDismiss,
        )
    }
}

// ---------------------------------------------------------------------------
// Shared: direction progress header (used in detail sheet + elsewhere)
// ---------------------------------------------------------------------------

@Composable
fun PathProgressHeader(
    direction: Direction,
    selectedDirectionState: SelectedDirectionState?,
    modifier: Modifier = Modifier,
) {
    val completedCount = selectedDirectionState?.completedCount ?: 0
    val totalCount = selectedDirectionState?.totalCount ?: direction.steps.size
    val progress = selectedDirectionState?.progress ?: 0f

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                "$completedCount of $totalCount steps completed",
                color = CollectiveTokens.TextSoft,
                fontSize = 12.sp,
            )
            if (selectedDirectionState?.isComplete == true) {
                CollectiveTrustBadge("Complete")
            }
        }
        CollectiveProgressBar(progress = progress)
    }
}

// ---------------------------------------------------------------------------
// Home / FocusDetailSheet: interactive practice checklist
// ---------------------------------------------------------------------------

/**
 * Renders all steps with done / active / upcoming visual states.
 * Active non-special steps are tappable → onCompleteStep.
 * Active SubmitProof steps → onSubmitProofStep.
 * Active UseFeedback steps show a quiet hint (auto-completed via feedback flow).
 */
@Composable
fun PracticePathChecklist(
    selectedDirectionState: SelectedDirectionState,
    onCompleteStep: (directionId: String, stepId: String) -> Unit,
    onSubmitProofStep: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        selectedDirectionState.direction.steps.forEachIndexed { index, step ->
            val isCompleted = step.id in selectedDirectionState.completedStepIds
            val isActive = step.id == selectedDirectionState.activeStep?.id
            val onClick: (() -> Unit)? = when {
                !isActive -> null
                step.kind == PracticeStepKind.UseFeedback -> null // auto-completed
                step.kind == PracticeStepKind.SubmitProof -> onSubmitProofStep
                else -> { { onCompleteStep(selectedDirectionState.direction.id, step.id) } }
            }
            PracticeStepRow(
                step = step,
                index = index + 1,
                isCompleted = isCompleted,
                isActive = isActive,
                onClick = onClick,
            )
            // Hint text for special active steps
            if (isActive && step.kind == PracticeStepKind.UseFeedback) {
                Text(
                    "Use a feedback note to complete this step.",
                    color = CollectiveTokens.Muted,
                    fontSize = 12.sp,
                    lineHeight = 16.sp,
                    modifier = Modifier.padding(start = 40.dp),
                )
            } else if (isActive && step.kind == PracticeStepKind.SubmitProof) {
                Text(
                    "Submit proof to complete this step.",
                    color = CollectiveTokens.Muted,
                    fontSize = 12.sp,
                    lineHeight = 16.sp,
                    modifier = Modifier.padding(start = 40.dp),
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Individual step row (done / active / upcoming)
// ---------------------------------------------------------------------------

@Composable
fun PracticeStepRow(
    step: PracticeStep,
    index: Int,
    isCompleted: Boolean,
    isActive: Boolean,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
) {
    val stepDesc = when {
        isCompleted -> "Step $index: ${step.title}. Completed."
        isActive && onClick != null -> "Step $index: ${step.title}. Active. Tap to complete."
        isActive -> "Step $index: ${step.title}. Active."
        else -> "Step $index: ${step.title}. Upcoming."
    }
    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 44.dp)
            .then(
                if (onClick != null) {
                    Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .semantics {
                            contentDescription = stepDesc
                            role = Role.Button
                        }
                        .clickable { onClick() }
                } else {
                    Modifier.semantics { contentDescription = stepDesc }
                },
            )
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // Step circle indicator
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(CircleShape)
                .background(
                    when {
                        isCompleted -> CollectiveTokens.GoldBright
                        isActive -> CollectiveTokens.GoldSoft
                        else -> CollectiveTokens.Card
                    },
                )
                .border(
                    width = if (isActive) 1.5.dp else 1.dp,
                    color = when {
                        isCompleted -> CollectiveTokens.GoldBright
                        isActive -> CollectiveTokens.Gold
                        else -> CollectiveTokens.Line
                    },
                    shape = CircleShape,
                ),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = if (isCompleted) "✓" else index.toString(),
                color = when {
                    isCompleted -> androidx.compose.ui.graphics.Color.White
                    isActive -> CollectiveTokens.Gold
                    else -> CollectiveTokens.Muted
                },
                fontSize = if (isCompleted) 13.sp else 12.sp,
                fontWeight = if (isCompleted || isActive) FontWeight.Bold else FontWeight.Normal,
            )
        }

        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(1.dp)) {
            Text(
                text = step.title,
                color = when {
                    isCompleted -> CollectiveTokens.Muted
                    isActive -> CollectiveTokens.Text
                    else -> CollectiveTokens.TextSoft
                },
                fontSize = 14.sp,
                fontWeight = if (isActive) FontWeight.SemiBold else FontWeight.Normal,
                textDecoration = if (isCompleted) TextDecoration.LineThrough else TextDecoration.None,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            if (!isCompleted) {
                Text(
                    text = practiceStepKindLabel(step.kind),
                    color = CollectiveTokens.Muted,
                    fontSize = 11.sp,
                )
            }
        }

        if (isActive && onClick != null && step.kind != PracticeStepKind.UseFeedback &&
            step.kind != PracticeStepKind.SubmitProof
        ) {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(CollectiveTokens.GoldSoft),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    ">",
                    color = CollectiveTokens.Gold,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Path complete state (shown when all steps are done)
// ---------------------------------------------------------------------------

@Composable
fun PathCompleteState(
    direction: Direction,
    onDone: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        CollectiveSuccessMark()
        Text(
            "Path complete.",
            color = CollectiveTokens.Text,
            fontSize = 22.sp,
            lineHeight = 27.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            "Small steps count.",
            color = CollectiveTokens.Muted,
            fontSize = 14.sp,
            lineHeight = 20.sp,
        )
        Text(
            "You completed all ${direction.steps.size} steps of ${direction.title}.",
            color = CollectiveTokens.TextSoft,
            fontSize = 13.sp,
            lineHeight = 18.sp,
        )
        Spacer(Modifier.width(1.dp))
        CollectivePrimaryButton(label = "Done", onClick = onDone)
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

private fun practiceStepKindLabel(kind: PracticeStepKind): String =
    when (kind) {
        PracticeStepKind.Reflection -> "Reflection"
        PracticeStepKind.VoiceNote -> "60-second voice note"
        PracticeStepKind.ConversationPrompt -> "Conversation prompt"
        PracticeStepKind.VideoPractice -> "Reflection + proof"
        PracticeStepKind.SubmitProof -> "Submit proof"
        PracticeStepKind.UseFeedback -> "Use feedback"
    }
