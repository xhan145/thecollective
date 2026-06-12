package com.collective.app.ui.feedback

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.text.KeyboardOptions
import com.collective.app.ui.brand.CollectiveSheetHeader
import com.collective.app.ui.brand.CollectiveSuccessMark
import com.collective.app.ui.components.CollectiveCard
import com.collective.app.ui.components.CollectivePrimaryButton
import com.collective.app.ui.components.CollectiveSecondaryButton
import com.collective.app.ui.theme.CollectiveTokens

/**
 * Feedback UI building blocks. Warm cream/gold brand, soft rounded cards.
 * These are intentionally not comment/like/reaction UI — feedback is a private
 * note that helps the next practice.
 */

@Composable
fun FeedbackToneChip(
    tone: FeedbackTone,
    selected: Boolean,
    onSelected: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val label = feedbackToneLabel(tone)
    Box(
        modifier = modifier
            .heightIn(min = 40.dp)
            .clip(RoundedCornerShape(CollectiveTokens.PillRadius))
            .background(if (selected) CollectiveTokens.GoldSoft else CollectiveTokens.Card)
            .border(
                1.dp,
                if (selected) CollectiveTokens.GoldBright else CollectiveTokens.Line,
                RoundedCornerShape(CollectiveTokens.PillRadius),
            )
            .semantics {
                contentDescription = "Select $label tone"
                role = Role.Button
            }
            .clickable { onSelected() }
            .padding(horizontal = 14.dp, vertical = 9.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            color = if (selected) CollectiveTokens.Gold else CollectiveTokens.TextSoft,
            fontSize = 12.sp,
            lineHeight = 14.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
        )
    }
}

@Composable
fun FeedbackToneSelector(
    selectedTone: FeedbackTone,
    onToneSelected: (FeedbackTone) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        FeedbackTone.entries.forEach { tone ->
            FeedbackToneChip(
                tone = tone,
                selected = tone == selectedTone,
                onSelected = { onToneSelected(tone) },
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
private fun FeedbackAuthorAvatar(initials: String, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(36.dp)
            .clip(CircleShape)
            .background(CollectiveTokens.GoldSoft),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = initials.take(2),
            color = CollectiveTokens.Gold,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}

/**
 * Reusable feedback row. Used in Proof Detail, Activity, and anywhere a single
 * feedback note should appear. Optionally tappable (e.g. to open the related proof).
 */
@Composable
fun FeedbackSummaryCard(
    feedback: FeedbackItem,
    modifier: Modifier = Modifier,
    proofTitle: String? = null,
    onUseFeedback: ((String) -> Unit)? = null,
    onClick: (() -> Unit)? = null,
) {
    val used = feedback.status == FeedbackStatus.UsedForPractice
    val cardModifier = if (onClick != null) {
        modifier.semantics {
            contentDescription = "Feedback note from ${feedback.authorName}. ${feedback.body}"
            role = Role.Button
        }
    } else {
        modifier.semantics {
            contentDescription = "Feedback note from ${feedback.authorName}. ${feedback.body}"
        }
    }
    CollectiveCard(modifier = cardModifier, radius = 16.dp, padding = 14.dp) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top,
        ) {
            FeedbackAuthorAvatar(initials = feedback.authorInitials)
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        feedback.authorName,
                        color = CollectiveTokens.Text,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        relativeFeedbackTime(feedback.createdAtMillis),
                        color = CollectiveTokens.Muted,
                        fontSize = 11.sp,
                    )
                }
                FeedbackTonePill(tone = feedback.tone)
                Text(
                    feedback.body,
                    color = CollectiveTokens.TextSoft,
                    fontSize = 14.sp,
                    lineHeight = 19.sp,
                )
                proofTitle?.let {
                    Text(
                        "On: $it",
                        color = CollectiveTokens.Muted,
                        fontSize = 11.sp,
                        lineHeight = 15.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                if (used) {
                    Box(
                        modifier = Modifier.semantics {
                            contentDescription = "Feedback status: used for practice"
                        },
                    ) {
                        FeedbackUsedTag()
                    }
                } else if (onUseFeedback != null) {
                    CollectivePrimaryButton(
                        label = "Use feedback",
                        modifier = Modifier.padding(top = 4.dp),
                        onClick = { onUseFeedback(feedback.id) },
                    )
                }
            }
        }
    }
}

@Composable
private fun FeedbackTonePill(tone: FeedbackTone) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(CollectiveTokens.PillRadius))
            .background(CollectiveTokens.GoldSoft)
            .padding(horizontal = 9.dp, vertical = 3.dp),
    ) {
        Text(
            feedbackToneLabel(tone),
            color = CollectiveTokens.Gold,
            fontSize = 10.sp,
            lineHeight = 12.sp,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun FeedbackUsedTag() {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Box(
            modifier = Modifier
                .size(18.dp)
                .clip(CircleShape)
                .background(CollectiveTokens.GoldBright),
            contentAlignment = Alignment.Center,
        ) {
            Text("✓", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
        Text(
            feedbackStatusLabel(FeedbackStatus.UsedForPractice),
            color = CollectiveTokens.Gold,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
fun FeedbackList(
    feedback: List<FeedbackItem>,
    modifier: Modifier = Modifier,
    onUseFeedback: ((String) -> Unit)? = null,
    onFeedbackClick: ((FeedbackItem) -> Unit)? = null,
    proofTitleFor: ((FeedbackItem) -> String?)? = null,
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        feedback.forEach { item ->
            FeedbackSummaryCard(
                feedback = item,
                proofTitle = proofTitleFor?.invoke(item),
                onUseFeedback = onUseFeedback,
                onClick = onFeedbackClick?.let { handler -> { handler(item) } },
            )
        }
    }
}

@Composable
fun EmptyFeedbackState(modifier: Modifier = Modifier) {
    CollectiveCard(modifier = modifier, radius = 16.dp, padding = 16.dp) {
        Text(
            "No feedback yet. Feedback can come next.",
            color = CollectiveTokens.Text,
            fontSize = 15.sp,
            lineHeight = 20.sp,
            fontWeight = FontWeight.SemiBold,
        )
        Text(
            "Feedback helps you improve. It does not define you.",
            color = CollectiveTokens.Muted,
            fontSize = 13.sp,
            lineHeight = 18.sp,
        )
    }
}

@Composable
fun FeedbackSuccessState(
    onDone: () -> Unit,
    modifier: Modifier = Modifier,
    title: String = "Feedback saved.",
    subtitle: String = "Useful feedback helps trust grow.",
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        CollectiveSuccessMark()
        Text(
            title,
            color = CollectiveTokens.Text,
            fontSize = 20.sp,
            lineHeight = 25.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            subtitle,
            color = CollectiveTokens.Muted,
            fontSize = 14.sp,
            lineHeight = 19.sp,
        )
        CollectivePrimaryButton(label = "Done", onClick = onDone)
    }
}

/**
 * Local prototype "Add feedback note" sheet. Represents another person leaving
 * one useful note on a proof. No public comments — local/mock only.
 */
@Composable
fun AddFeedbackSheetContent(
    draft: FeedbackDraftState,
    onBodyChanged: (String) -> Unit,
    onToneSelected: (FeedbackTone) -> Unit,
    onSave: () -> Unit,
    onDone: () -> Unit,
) {
    if (draft.isSubmitted) {
        FeedbackSuccessState(onDone = onDone)
        return
    }
    CollectiveSheetHeader(
        title = "Add feedback",
        subtitle = "Leave one useful note. Be specific, kind, and practical.",
    )
    Text("Tone", color = CollectiveTokens.Text, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    FeedbackToneSelector(selectedTone = draft.selectedTone, onToneSelected = onToneSelected)
    Text("Feedback note", color = CollectiveTokens.Text, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    OutlinedTextField(
        value = draft.body,
        onValueChange = onBodyChanged,
        modifier = Modifier
            .fillMaxWidth()
            .semantics { contentDescription = "Feedback note input" },
        minLines = 3,
        shape = RoundedCornerShape(16.dp),
        placeholder = { Text("What would help them improve?") },
        keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
        isError = draft.errorMessage != null,
    )
    Text(
        "Feedback should help the next practice, not judge the person.",
        color = CollectiveTokens.Muted,
        fontSize = 12.sp,
        lineHeight = 17.sp,
    )
    draft.errorMessage?.let {
        Text(it, color = CollectiveTokens.Danger, fontSize = 13.sp, lineHeight = 18.sp)
    }
    CollectivePrimaryButton(label = "Save feedback", onClick = onSave)
    CollectiveSecondaryButton(label = "Cancel", onClick = onDone)
}
