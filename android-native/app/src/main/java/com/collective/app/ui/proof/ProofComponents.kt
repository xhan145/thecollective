package com.collective.app.ui.proof

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.collective.app.ui.brand.CollectiveSheetHeader
import com.collective.app.ui.components.CollectiveBottomSheetScaffoldContent
import com.collective.app.ui.components.CollectivePrimaryButton
import com.collective.app.ui.components.CollectiveSecondaryButton
import com.collective.app.ui.components.CollectiveTrustBadge
import com.collective.app.ui.feedback.EmptyFeedbackState
import com.collective.app.ui.feedback.FeedbackItem
import com.collective.app.ui.feedback.FeedbackList
import com.collective.app.ui.theme.CollectiveTokens

@Composable
fun ProofTypeSelector(
    selectedType: ProofMediaType,
    onSelected: (ProofMediaType) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = modifier.fillMaxWidth()) {
        ProofMediaType.entries.forEach { type ->
            ProofTypeChip(
                label = type.shortLabel(),
                type = type,
                selected = type == selectedType,
                onSelected = { onSelected(type) },
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
fun ProofAttachmentPickerCard(
    draft: ProofDraftState,
    onAttach: () -> Unit,
    onRemove: () -> Unit,
    modifier: Modifier = Modifier,
) {
    if (draft.mediaUri != null) {
        ProofAttachmentPreview(draft = draft, onRemove = onRemove, modifier = modifier)
        return
    }

    val text = when (draft.selectedType) {
        ProofMediaType.Text -> "Text reflection selected"
        ProofMediaType.Image -> "Attach image"
        ProofMediaType.Video -> "Attach video"
        ProofMediaType.Audio -> "Attach audio"
    }
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(58.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(CollectiveTokens.Card)
            .border(1.dp, CollectiveTokens.Line, RoundedCornerShape(16.dp))
            .semantics {
                contentDescription = if (draft.selectedType == ProofMediaType.Text) text else "Attach media"
                role = Role.Button
            }
            .clickable { onAttach() }
            .padding(horizontal = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        ProofMediaIcon(type = draft.selectedType, modifier = Modifier.size(36.dp))
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(text, color = CollectiveTokens.Text, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            Text(
                text = if (draft.selectedType == ProofMediaType.Text) "No media required" else "Optional",
                color = CollectiveTokens.Muted,
                fontSize = 12.sp,
            )
        }
        if (draft.selectedType != ProofMediaType.Text) {
            Text("+", color = CollectiveTokens.Gold, fontSize = 22.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun ProofAttachmentPreview(
    draft: ProofDraftState,
    onRemove: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(76.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(CollectiveTokens.Card)
            .border(1.dp, CollectiveTokens.Line, RoundedCornerShape(18.dp))
            .padding(10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        ProofMediaPreview(type = draft.selectedType, modifier = Modifier.size(width = 58.dp, height = 56.dp))
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text("${draft.selectedType.name} attached", color = CollectiveTokens.Text, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Text(draft.mediaDisplayName ?: fallbackDisplayName(draft.selectedType), color = CollectiveTokens.Muted, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(CollectiveTokens.GoldSoft)
                .semantics {
                    contentDescription = "Remove attachment"
                    role = Role.Button
                }
                .clickable { onRemove() },
            contentAlignment = Alignment.Center,
        ) {
            Text("x", color = CollectiveTokens.Gold, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun ProofSummaryCard(
    proof: ProofItem,
    modifier: Modifier = Modifier,
    feedbackCount: Int = proof.feedbackCount,
    onClick: () -> Unit,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(86.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(CollectiveTokens.Card)
            .semantics {
                contentDescription = "Open proof detail. ${proof.title}"
                role = Role.Button
            }
            .clickable { onClick() }
            .padding(10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        ProofMediaPreview(type = proof.mediaType, modifier = Modifier.size(width = 60.dp, height = 60.dp))
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(proof.title, color = CollectiveTokens.Text, fontSize = 13.sp, lineHeight = 17.sp, fontWeight = FontWeight.SemiBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
            val feedbackLabel = if (feedbackCount > 0) "$feedbackCount feedback" else "No feedback yet"
            Text("${proofTypeLabel(proof.mediaType)} - ${relativeProofTime(proof.createdAtMillis)} - $feedbackLabel", color = CollectiveTokens.Muted, fontSize = 11.sp, maxLines = 1)
        }
        if (feedbackCount > 0) {
            CollectiveTrustBadge("Feedback")
        }
    }
}

/**
 * Shared proof detail. Reads its feedback list from the FeedbackRepository
 * (passed in by the caller) so the feedback count and items are always live.
 */
@Composable
fun ProofDetailSheetContent(
    proof: ProofItem,
    feedback: List<FeedbackItem>,
    onUseFeedback: (String) -> Unit,
    onAddFeedback: (String) -> Unit,
    onClose: () -> Unit,
) {
    CollectiveBottomSheetScaffoldContent {
        CollectiveSheetHeader(title = proof.title)
        ProofMediaPreview(type = proof.mediaType, modifier = Modifier.fillMaxWidth().height(148.dp))
        Text(proof.body.ifBlank { "Proof can stay simple while you practice." }, color = CollectiveTokens.TextSoft, fontSize = 14.sp, lineHeight = 20.sp)
        Text("${proofTypeLabel(proof.mediaType)} - ${relativeProofTime(proof.createdAtMillis)} - ${feedback.size} feedback", color = CollectiveTokens.Muted, fontSize = 12.sp)
        proof.mediaDisplayName?.let {
            Text(it, color = CollectiveTokens.Muted, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        if (feedback.isNotEmpty()) {
            Text("Feedback", color = CollectiveTokens.Text, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Text("Feedback helps you improve. It does not define you.", color = CollectiveTokens.Muted, fontSize = 12.sp, lineHeight = 17.sp)
            FeedbackList(feedback = feedback, onUseFeedback = onUseFeedback)
        } else {
            EmptyFeedbackState()
        }
        CollectiveSecondaryButton("Add feedback note", onClick = { onAddFeedback(proof.id) })
        CollectivePrimaryButton("Close", onClick = onClose)
    }
}

@Composable
fun ProofMediaIcon(type: ProofMediaType, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(CollectiveTokens.GoldSoft),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            type.shortLabel(),
            color = CollectiveTokens.Gold,
            fontSize = 13.sp,
            lineHeight = 15.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
private fun ProofTypeChip(
    label: String,
    type: ProofMediaType,
    selected: Boolean,
    onSelected: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .height(62.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(if (selected) CollectiveTokens.GoldSoft else CollectiveTokens.Card)
            .border(1.dp, if (selected) CollectiveTokens.GoldBright else CollectiveTokens.Line, RoundedCornerShape(12.dp))
            .semantics {
                contentDescription = "Select ${proofTypeLabel(type)}"
                role = Role.Button
            }
            .clickable { onSelected() }
            .padding(horizontal = 6.dp, vertical = 7.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        ProofMediaIcon(type = type, modifier = Modifier.size(25.dp))
        Text(label, color = if (selected) CollectiveTokens.Gold else CollectiveTokens.TextSoft, fontSize = 10.sp, lineHeight = 12.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun ProofMediaPreview(type: ProofMediaType, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(
                Brush.linearGradient(
                    listOf(CollectiveTokens.GoldSoft, CollectiveTokens.Card, CollectiveTokens.Gold.copy(alpha = 0.18f)),
                ),
            )
            .semantics { contentDescription = "${proofTypeLabel(type)} media preview" },
        contentAlignment = Alignment.Center,
    ) {
        when (type) {
            ProofMediaType.Video -> Text("Play", color = CollectiveTokens.Gold, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            ProofMediaType.Audio -> Text("Audio", color = CollectiveTokens.Gold, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            ProofMediaType.Image -> Text("Image", color = CollectiveTokens.Gold, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            ProofMediaType.Text -> Text("Text", color = CollectiveTokens.Gold, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
    }
}

private fun ProofMediaType.shortLabel(): String =
    when (this) {
        ProofMediaType.Text -> "Text"
        ProofMediaType.Image -> "Image"
        ProofMediaType.Video -> "Video"
        ProofMediaType.Audio -> "Audio"
    }
