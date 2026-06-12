package com.collective.app.beta.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.collective.app.beta.model.ProofType
import com.collective.app.ui.components.CollectiveScreen
import com.collective.app.ui.theme.CollectiveTokens

/**
 * Shared building blocks for the beta screens. These wrap the existing Collective brand
 * tokens/components so the beta loop stays visually consistent (cream background, gold actions, soft
 * cards, calm type) without restyling anything.
 */

/** Standard scrollable beta screen body: cream background, status-bar inset, comfortable padding. */
@Composable
fun BetaScreen(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    CollectiveScreen(modifier = modifier) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = CollectiveTokens.ScreenHorizontalPadding)
                .padding(top = 12.dp, bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            content = content,
        )
    }
}

@Composable
fun BetaTopBar(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    onBack: (() -> Unit)? = null,
) {
    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            if (onBack != null) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(CollectiveTokens.Card)
                        .border(1.dp, CollectiveTokens.Line, CircleShape)
                        .clickable { onBack() },
                    contentAlignment = Alignment.Center,
                ) {
                    Text("‹", color = CollectiveTokens.Text, fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
                }
            }
            Text(
                text = title,
                color = CollectiveTokens.Text,
                fontSize = 26.sp,
                lineHeight = 30.sp,
                fontWeight = FontWeight.Bold,
            )
        }
        if (subtitle != null) {
            Text(text = subtitle, color = CollectiveTokens.Muted, fontSize = 14.sp, lineHeight = 19.sp)
        }
    }
}

/** Small muted section label (e.g. "TODAY'S PRACTICE"). */
@Composable
fun BetaSectionLabel(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text.uppercase(),
        modifier = modifier,
        color = CollectiveTokens.Muted,
        fontSize = 11.sp,
        lineHeight = 14.sp,
        fontWeight = FontWeight.SemiBold,
    )
}

/** Selectable pill chip used by the choice fields (feedback type / screen / importance). */
@Composable
fun BetaChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val bg = if (selected) CollectiveTokens.GoldSoft else CollectiveTokens.Card
    val border = if (selected) CollectiveTokens.Gold else CollectiveTokens.Line
    val textColor = if (selected) CollectiveTokens.Text else CollectiveTokens.TextSoft
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(999.dp))
            .background(bg)
            .border(1.dp, border, RoundedCornerShape(999.dp))
            .clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 9.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            color = textColor,
            fontSize = 13.sp,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
        )
    }
}

/** A small, calm status tag (e.g. "Needs feedback"). */
@Composable
fun BetaTag(
    label: String,
    modifier: Modifier = Modifier,
    container: Color = CollectiveTokens.GoldSoft,
    content: Color = CollectiveTokens.TextSoft,
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(999.dp))
            .background(container)
            .padding(horizontal = 10.dp, vertical = 5.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(label, color = content, fontSize = 11.sp, lineHeight = 13.sp, fontWeight = FontWeight.SemiBold)
    }
}

/** Row of selectable chips that wraps. */
@OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
fun BetaChipGroup(
    options: List<String>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    FlowRow(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        options.forEachIndexed { index, label ->
            BetaChip(label = label, selected = index == selectedIndex, onClick = { onSelect(index) })
        }
    }
}

/** A round letter marker for a direction or user, used instead of icon assets. */
@Composable
fun BetaMarker(
    letter: String,
    modifier: Modifier = Modifier,
    container: Color = CollectiveTokens.GoldSoft,
    content: Color = CollectiveTokens.TextSoft,
) {
    Box(
        modifier = modifier
            .size(40.dp)
            .clip(CircleShape)
            .background(container),
        contentAlignment = Alignment.Center,
    ) {
        Text(letter.take(1).uppercase(), color = content, fontSize = 16.sp, fontWeight = FontWeight.Bold)
    }
}

fun proofTypeLabel(type: ProofType): String = when (type) {
    ProofType.IMAGE -> "Photo"
    ProofType.VIDEO -> "Video"
    ProofType.AUDIO -> "Audio"
    ProofType.TEXT -> "Text"
}
