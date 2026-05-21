package com.collective.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.collective.app.data.ActivityItem
import com.collective.app.data.Contributor
import com.collective.app.data.ContributionAction
import com.collective.app.data.FeedPost
import com.collective.app.data.FeedPostType
import com.collective.app.data.FeedbackItem
import com.collective.app.data.FeedbackNote
import com.collective.app.data.LabSpace
import com.collective.app.data.Milestone
import com.collective.app.data.MockData
import com.collective.app.data.PlanOption
import com.collective.app.data.Path
import com.collective.app.data.ProfileStat
import com.collective.app.data.ProgressMetric
import com.collective.app.data.ProgressPath
import com.collective.app.data.Proof
import com.collective.app.data.ProofPost
import com.collective.app.data.TrustSignal
import com.collective.app.data.UserProfile
import com.collective.app.data.Win
import com.collective.app.ui.theme.Border
import com.collective.app.ui.theme.CardBackground
import com.collective.app.ui.theme.CreamBackground
import com.collective.app.ui.theme.DeepText
import com.collective.app.ui.theme.ForestGreen
import com.collective.app.ui.theme.MutedBrown
import com.collective.app.ui.theme.PureWhite
import com.collective.app.ui.theme.Sage
import com.collective.app.ui.theme.SageStrong
import com.collective.app.ui.theme.SecondaryText
import com.collective.app.ui.theme.SoftGold
import com.collective.app.ui.theme.SoftGoldPale
import com.collective.app.ui.theme.SoftPeach
import com.collective.app.ui.theme.SoftPeachPale
import com.collective.app.ui.theme.SoftPurple
import com.collective.app.ui.theme.SoftPurplePale
import com.collective.app.ui.theme.TertiaryText

@Composable
fun SoftCard(
    modifier: Modifier = Modifier.fillMaxWidth(),
    color: Color = CardBackground,
    radius: Dp = 24.dp,
    borderColor: Color = Border.copy(alpha = 0.62f),
    padding: Dp = 16.dp,
    content: @Composable ColumnScope.() -> Unit,
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(radius),
        color = color,
        shadowElevation = 1.dp,
        border = BorderStroke(1.dp, borderColor),
    ) {
        Column(
            modifier = Modifier.padding(padding),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            content = content,
        )
    }
}

@Composable
fun SunburstLogo(modifier: Modifier = Modifier, size: Dp = 36.dp) {
    Box(modifier = modifier.size(size), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.size(size)) {
            val center = Offset(this.size.width / 2f, this.size.height / 2f)
            val rayStart = this.size.minDimension * 0.18f
            val rayEnd = this.size.minDimension * 0.48f
            repeat(18) { index ->
                val angle = Math.toRadians((index * 20).toDouble())
                val start = Offset(
                    x = center.x + kotlin.math.cos(angle).toFloat() * rayStart,
                    y = center.y + kotlin.math.sin(angle).toFloat() * rayStart,
                )
                val end = Offset(
                    x = center.x + kotlin.math.cos(angle).toFloat() * rayEnd,
                    y = center.y + kotlin.math.sin(angle).toFloat() * rayEnd,
                )
                drawLine(SoftGold, start, end, strokeWidth = 3.4f, cap = StrokeCap.Round)
            }
            drawCircle(PureWhite, radius = this.size.minDimension * 0.13f, center = center)
        }
    }
}

@Composable
fun Avatar(initials: String, modifier: Modifier = Modifier, color: Color = Sage) {
    Surface(
        modifier = modifier.size(42.dp),
        shape = CircleShape,
        color = color,
        border = BorderStroke(1.dp, Border),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                initials,
                style = MaterialTheme.typography.labelLarge,
                color = DeepText,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}

@Composable
fun CollectiveTopBar(
    modifier: Modifier = Modifier,
    title: String = "Collective",
    showLogo: Boolean = true,
    showBack: Boolean = false,
    onBack: () -> Unit = {},
    trailing: @Composable (() -> Unit)? = null,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        if (showBack) {
            CircleIconButton(label = "<", onClick = onBack, size = 38.dp)
        } else if (showLogo) {
            SunburstLogo(size = 36.dp)
        }
        Text(
            title,
            modifier = Modifier.weight(1f),
            style = MaterialTheme.typography.displaySmall,
            color = DeepText,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        trailing?.invoke() ?: Row(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            CircleIconButton(label = "Search", onClick = {}, size = 42.dp)
            Avatar(initials = "AC", color = SoftPeachPale)
        }
    }
}

@Composable
fun CircleIconButton(label: String, onClick: () -> Unit, modifier: Modifier = Modifier, size: Dp = 42.dp) {
    Surface(
        modifier = modifier
            .size(size)
            .clickable { onClick() },
        shape = CircleShape,
        color = PureWhite,
        border = BorderStroke(1.dp, Border),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                label,
                style = if (label.length > 2) MaterialTheme.typography.labelSmall else MaterialTheme.typography.titleMedium,
                color = DeepText,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
fun CategoryChip(label: String, selected: Boolean, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.clickable { onClick() },
        shape = CircleShape,
        color = if (selected) ForestGreen else PureWhite,
        border = BorderStroke(1.dp, if (selected) ForestGreen else Border.copy(alpha = 0.55f)),
        tonalElevation = if (selected) 1.dp else 0.dp,
    ) {
        Text(
            text = if (selected) "* $label" else label,
            modifier = Modifier.padding(horizontal = 15.dp, vertical = 9.dp),
            style = MaterialTheme.typography.labelLarge,
            color = if (selected) PureWhite else DeepText,
            maxLines = 1,
        )
    }
}

@Composable
fun PrimaryPillButton(label: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = modifier.height(48.dp),
        shape = CircleShape,
        colors = ButtonDefaults.buttonColors(containerColor = ForestGreen, contentColor = PureWhite),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 1.dp, pressedElevation = 0.dp),
    ) {
        Text(label, style = MaterialTheme.typography.labelLarge)
    }
}

@Composable
fun SecondaryPillButton(
    label: String,
    modifier: Modifier = Modifier,
    color: Color = Sage,
    contentColor: Color = ForestGreen,
    onClick: () -> Unit,
) {
    Surface(
        modifier = modifier
            .height(42.dp)
            .clickable { onClick() },
        shape = CircleShape,
        color = color,
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                label,
                modifier = Modifier.padding(horizontal = 16.dp),
                style = MaterialTheme.typography.labelLarge,
                color = contentColor,
                maxLines = 1,
            )
        }
    }
}

@Composable
fun FeedCard(post: FeedPost, onTryThis: () -> Unit) {
    var support by remember(post.id) { mutableIntStateOf(post.supportCount) }

    SoftCard(radius = 26.dp, padding = 14.dp) {
        post.label?.let {
            val labelColor = when (post.type) {
                FeedPostType.PROGRESS_STORY -> SoftPurplePale
                FeedPostType.MINI_LESSON -> SoftPeachPale
                FeedPostType.ENCOURAGEMENT -> Sage
                else -> SoftGoldPale
            }
            LabelPill(it, color = labelColor)
        }
        when (post.type) {
            FeedPostType.PROOF_VIDEO -> ProofVideoContent(post)
            FeedPostType.PROGRESS_STORY -> ProgressStoryContent(post)
            FeedPostType.MINI_LESSON -> MiniLessonContent(post, onTryThis)
            FeedPostType.ENCOURAGEMENT -> EncouragementContent(post)
        }
        if (post.type != FeedPostType.ENCOURAGEMENT) {
            ActionRow(
                support = support,
                comments = post.commentCount,
                showTryThis = post.type != FeedPostType.MINI_LESSON,
                lessonAction = post.type == FeedPostType.MINI_LESSON,
                onSupport = { support += 1 },
                onTryThis = onTryThis,
            )
        }
    }
}

@Composable
private fun PostHeader(user: UserProfile, subtitle: String, timestamp: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Avatar(user.initials, color = SoftPeachPale, modifier = Modifier.size(40.dp))
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(1.dp)) {
            Text(user.name, style = MaterialTheme.typography.labelLarge, color = DeepText)
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = SecondaryText, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Text(timestamp, style = MaterialTheme.typography.bodyMedium, color = TertiaryText)
        Text("...", style = MaterialTheme.typography.titleMedium, color = TertiaryText)
    }
}

@Composable
private fun ProofVideoContent(post: FeedPost) {
    PostHeader(post.user, post.subtitle, post.timestamp)
    Row(horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(
            post.text,
            modifier = Modifier.weight(1f),
            style = MaterialTheme.typography.bodyLarge,
            color = DeepText,
        )
        VideoPlaceholder(
            duration = post.duration ?: "0:28",
            modifier = Modifier.size(width = 168.dp, height = 112.dp),
        )
    }
}

@Composable
private fun ProgressStoryContent(post: FeedPost) {
    PostHeader(post.user, post.subtitle, post.timestamp)
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
        Row(modifier = Modifier.weight(1.15f), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            PhotoPlaceholder("Before", SoftPeachPale, Modifier.weight(1f).height(120.dp))
            PhotoPlaceholder("After", SoftPurplePale, Modifier.weight(1f).height(120.dp))
        }
        Text(
            post.text,
            modifier = Modifier.weight(0.85f),
            style = MaterialTheme.typography.bodyMedium,
            color = DeepText,
        )
    }
}

@Composable
private fun MiniLessonContent(post: FeedPost, onTryThis: () -> Unit) {
    PostHeader(post.user, post.subtitle, post.timestamp)
    Row(horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.CenterVertically) {
        LessonIllustration(modifier = Modifier.size(width = 126.dp, height = 100.dp))
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(7.dp)) {
            Text(post.title.orEmpty(), style = MaterialTheme.typography.titleMedium, color = DeepText)
            Text(post.body.orEmpty(), style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
            SecondaryPillButton(
                "Try This Tip >",
                modifier = Modifier.width(132.dp),
                color = SoftPeachPale,
                contentColor = MutedBrown,
                onClick = onTryThis,
            )
        }
    }
}

@Composable
private fun EncouragementContent(post: FeedPost) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Avatar(post.user.initials, color = Sage, modifier = Modifier.size(42.dp))
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Text("${post.user.name} supported your proof", style = MaterialTheme.typography.labelLarge, color = DeepText)
            Text(post.text, style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
        }
        SecondaryPillButton("Say Thanks", modifier = Modifier.width(118.dp), onClick = {})
    }
}

@Composable
fun ActionRow(
    support: Int,
    comments: Int,
    showTryThis: Boolean,
    lessonAction: Boolean = false,
    onSupport: () -> Unit,
    onTryThis: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        SmallAction("Support $support", onSupport)
        SmallAction("Comment $comments", {})
        SmallAction("Save", {})
        Spacer(modifier = Modifier.weight(1f))
        if (showTryThis || lessonAction) {
            SecondaryPillButton(
                label = if (lessonAction) "Try This Tip >" else "Try This >",
                modifier = Modifier.width(if (lessonAction) 128.dp else 108.dp),
                color = if (lessonAction) SoftPeachPale else Sage,
                contentColor = if (lessonAction) MutedBrown else ForestGreen,
                onClick = onTryThis,
            )
        }
    }
}

@Composable
private fun SmallAction(label: String, onClick: () -> Unit) {
    TextButton(onClick = onClick, contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 4.dp)) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = MutedBrown, maxLines = 1)
    }
}

@Composable
fun PathHeroCard(path: Path) {
    SoftCard(color = CardBackground, radius = 28.dp, padding = 14.dp) {
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
            HeroImagePlaceholder(modifier = Modifier.size(148.dp))
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(path.tagline, style = MaterialTheme.typography.titleLarge, color = DeepText)
                Text(path.description, style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    StackedAvatars()
                    Text(path.members, style = MaterialTheme.typography.labelSmall, color = SecondaryText)
                    Text("|", color = Border)
                    Text("${path.journeys} journeys", style = MaterialTheme.typography.labelSmall, color = SecondaryText)
                }
            }
            ProgressRing(path.progress, modifier = Modifier.size(94.dp))
        }
    }
}

@Composable
fun ProgressRing(progress: Float, modifier: Modifier = Modifier, label: String = "${(progress * 100).toInt()}%") {
    Box(contentAlignment = Alignment.Center, modifier = modifier) {
        CircularProgressIndicator(
            progress = { progress },
            color = ForestGreen,
            trackColor = Sage,
            strokeWidth = 7.dp,
        )
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(label, style = MaterialTheme.typography.titleLarge, color = DeepText)
            Text("Complete", style = MaterialTheme.typography.labelSmall, color = SecondaryText)
        }
    }
}

@Composable
fun MilestoneRow(milestone: Milestone, index: Int, onStart: () -> Unit) {
    val active = milestone.state == "Active"
    val completed = milestone.state == "Completed"
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = if (active) Sage.copy(alpha = 0.72f) else Color.Transparent,
        shape = RoundedCornerShape(24.dp),
        border = if (active) BorderStroke(1.dp, Border.copy(alpha = 0.55f)) else null,
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = if (active) 14.dp else 10.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                shape = CircleShape,
                color = when {
                    completed -> SageStrong
                    active -> ForestGreen
                    else -> PureWhite
                },
                border = BorderStroke(1.dp, Border),
                modifier = Modifier.size(38.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        if (completed) "Done" else index.toString(),
                        style = MaterialTheme.typography.labelSmall,
                        color = if (active) PureWhite else DeepText,
                    )
                }
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(milestone.title, style = MaterialTheme.typography.titleMedium, color = DeepText)
                Text(milestone.description, style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
            }
            when {
                active -> PrimaryPillButton("Start Practice", modifier = Modifier.width(142.dp), onClick = onStart)
                completed -> LabelPill("Completed", color = Sage)
                else -> Text("Lock", style = MaterialTheme.typography.labelSmall, color = TertiaryText)
            }
        }
    }
}

@Composable
fun ContributorCard(contributor: Contributor, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier.width(184.dp), color = PureWhite, radius = 20.dp, padding = 12.dp) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(9.dp)) {
            Avatar(contributor.initials, color = SoftPeachPale, modifier = Modifier.size(42.dp))
            Column {
                Text(contributor.name, style = MaterialTheme.typography.labelLarge, color = DeepText, maxLines = 1)
                Text(contributor.role, style = MaterialTheme.typography.labelSmall, color = SoftPurple, maxLines = 1)
            }
        }
        Text(contributor.description, style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
    }
}

@Composable
fun ProofCard(proof: Proof, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier.width(184.dp), color = PureWhite, radius = 20.dp, padding = 12.dp) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(9.dp)) {
            Avatar(proof.initials, color = SoftPurplePale, modifier = Modifier.size(38.dp))
            Column {
                Text(proof.user, style = MaterialTheme.typography.labelLarge, color = DeepText, maxLines = 1)
                Text(proof.status, style = MaterialTheme.typography.labelSmall, color = SoftPurple, maxLines = 1)
            }
        }
        Text(proof.text, style = MaterialTheme.typography.bodyMedium, color = DeepText)
        Text("Support ${proof.supportCount}", style = MaterialTheme.typography.labelSmall, color = MutedBrown)
    }
}

@Composable
fun ProgressOverviewCard(metrics: List<ProgressMetric>, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier, color = PureWhite, radius = 26.dp) {
        Text("Overview", style = MaterialTheme.typography.titleMedium, color = DeepText)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Top) {
            metrics.forEachIndexed { index, metric ->
                ProgressStatBlock(metric, modifier = Modifier.weight(1f))
                if (index != metrics.lastIndex) {
                    Box(modifier = Modifier.width(1.dp).height(82.dp).background(Border.copy(alpha = 0.65f)))
                }
            }
        }
    }
}

@Composable
private fun ProgressStatBlock(metric: ProgressMetric, modifier: Modifier = Modifier) {
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Surface(shape = CircleShape, color = metric.accentColor().copy(alpha = 0.16f), modifier = Modifier.size(42.dp)) {
            Box(contentAlignment = Alignment.Center) {
                Text(metric.value.take(1), style = MaterialTheme.typography.titleMedium, color = metric.accentColor())
            }
        }
        Text(metric.value, style = MaterialTheme.typography.headlineSmall, color = DeepText)
        Text(metric.title, style = MaterialTheme.typography.labelLarge, color = DeepText)
        Text(metric.helper, style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
    }
}

@Composable
fun ProgressStatCard(metric: ProgressMetric, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier, color = PureWhite, radius = 22.dp) {
        Text(metric.value, style = MaterialTheme.typography.headlineSmall, color = ForestGreen)
        Text(metric.title, style = MaterialTheme.typography.labelLarge, color = DeepText)
        Text(metric.helper, style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
    }
}

@Composable
fun ProgressPathRow(path: ProgressPath) {
    val color = path.accentColor()
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Surface(shape = RoundedCornerShape(16.dp), color = color.copy(alpha = 0.14f), modifier = Modifier.size(54.dp)) {
            Box(contentAlignment = Alignment.Center) {
                Text(path.name.take(1), color = color, fontWeight = FontWeight.Bold)
            }
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(path.name, style = MaterialTheme.typography.titleMedium, color = DeepText)
            Text(path.subtitle, style = MaterialTheme.typography.bodyMedium, color = SecondaryText, maxLines = 1, overflow = TextOverflow.Ellipsis)
            LinearProgressIndicator(
                progress = { path.progress },
                modifier = Modifier.fillMaxWidth().height(7.dp).clip(CircleShape),
                color = color,
                trackColor = Sage,
            )
        }
        Text("${(path.progress * 100).toInt()}%", style = MaterialTheme.typography.labelLarge, color = DeepText)
        Box(modifier = Modifier.size(54.dp), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(
                progress = { path.progress },
                color = color,
                trackColor = Sage,
                strokeWidth = 6.dp,
            )
            Text(">", style = MaterialTheme.typography.labelLarge, color = color)
        }
    }
}

@Composable
fun PracticeTypeSelector(selected: String, onSelected: (String) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
        listOf("Video", "Audio", "Text", "Photo").forEach { type ->
            Surface(
                modifier = Modifier.weight(1f).height(52.dp).clickable { onSelected(type) },
                shape = RoundedCornerShape(18.dp),
                color = if (selected == type) Sage else PureWhite,
                border = BorderStroke(1.dp, if (selected == type) ForestGreen else Border),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        type,
                        textAlign = TextAlign.Center,
                        style = MaterialTheme.typography.labelLarge,
                        color = if (selected == type) ForestGreen else DeepText,
                    )
                }
            }
        }
    }
}

@Composable
fun VisibilitySelector(selected: String, onSelected: (String) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
        listOf(
            "Public" to "Everyone",
            "Path Only" to "Communication Confidence",
            "Private" to "Only You",
        ).forEach { (title, helper) ->
            Surface(
                modifier = Modifier.weight(1f).height(78.dp).clickable { onSelected(title) },
                shape = RoundedCornerShape(20.dp),
                color = if (selected == title) Sage else PureWhite,
                border = BorderStroke(1.dp, if (selected == title) ForestGreen else Border),
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Text(title, style = MaterialTheme.typography.labelLarge, color = DeepText, textAlign = TextAlign.Center)
                    Text(helper, style = MaterialTheme.typography.labelSmall, color = SecondaryText, textAlign = TextAlign.Center, maxLines = 2)
                }
            }
        }
    }
}

@Composable
fun WinRow(win: Win) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Surface(shape = CircleShape, color = SoftGoldPale, modifier = Modifier.size(42.dp)) {
            Box(contentAlignment = Alignment.Center) { Text(win.title.take(1), color = MutedBrown, fontWeight = FontWeight.Bold) }
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(win.title, style = MaterialTheme.typography.labelLarge, color = DeepText)
            Text(win.helper, style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
            Text(win.timestamp, style = MaterialTheme.typography.labelSmall, color = TertiaryText)
        }
    }
}

@Composable
fun FeedbackRow(note: FeedbackNote) {
    Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Avatar(note.initials, color = SoftPeachPale, modifier = Modifier.size(38.dp))
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(note.author, style = MaterialTheme.typography.labelLarge, color = DeepText)
            Text(note.text, style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
            Text(note.timestamp, style = MaterialTheme.typography.labelSmall, color = TertiaryText)
        }
    }
}

@Composable
fun LabelPill(label: String, color: Color = SoftGoldPale) {
    Surface(shape = CircleShape, color = color) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            style = MaterialTheme.typography.labelSmall,
            color = if (color == ForestGreen) PureWhite else MutedBrown,
            maxLines = 1,
        )
    }
}

@Composable
fun VideoPlaceholder(duration: String, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(22.dp))
            .background(SageStrong),
        contentAlignment = Alignment.Center,
    ) {
        Box(modifier = Modifier.fillMaxWidth().height(22.dp).align(Alignment.BottomCenter).background(DeepText.copy(alpha = 0.08f)))
        Surface(shape = CircleShape, color = PureWhite.copy(alpha = 0.92f), modifier = Modifier.size(48.dp)) {
            Box(contentAlignment = Alignment.Center) { Text("Play", color = ForestGreen, style = MaterialTheme.typography.labelSmall) }
        }
        Surface(
            modifier = Modifier.align(Alignment.BottomEnd).padding(8.dp),
            shape = CircleShape,
            color = DeepText.copy(alpha = 0.72f),
        ) {
            Text(duration, modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp), color = PureWhite, style = MaterialTheme.typography.labelSmall)
        }
    }
}

@Composable
fun PhotoPlaceholder(label: String, color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(color),
        contentAlignment = Alignment.BottomStart,
    ) {
        Surface(shape = CircleShape, color = DeepText.copy(alpha = 0.7f), modifier = Modifier.padding(8.dp)) {
            Text(label, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), style = MaterialTheme.typography.labelSmall, color = PureWhite)
        }
    }
}

@Composable
fun LessonIllustration(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(24.dp))
            .background(SoftPeachPale),
        contentAlignment = Alignment.Center,
    ) {
        Surface(shape = RoundedCornerShape(16.dp), color = SoftPeach, modifier = Modifier.align(Alignment.TopStart).padding(14.dp)) {
            Text("Clear", modifier = Modifier.padding(10.dp), style = MaterialTheme.typography.labelSmall, color = DeepText)
        }
        Surface(shape = RoundedCornerShape(16.dp), color = PureWhite, modifier = Modifier.align(Alignment.BottomEnd).padding(14.dp)) {
            Text("Calm", modifier = Modifier.padding(10.dp), style = MaterialTheme.typography.labelSmall, color = DeepText)
        }
    }
}

@Composable
fun HeroImagePlaceholder(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(24.dp))
            .background(SoftPeachPale),
        contentAlignment = Alignment.Center,
    ) {
        Box(modifier = Modifier.size(86.dp).clip(CircleShape).background(DeepText.copy(alpha = 0.12f)))
        Surface(shape = CircleShape, color = ForestGreen, modifier = Modifier.align(Alignment.BottomEnd).padding(12.dp)) {
            Text("Mic", modifier = Modifier.padding(horizontal = 13.dp, vertical = 8.dp), color = PureWhite, style = MaterialTheme.typography.labelSmall)
        }
    }
}

@Composable
private fun StackedAvatars() {
    Box(modifier = Modifier.width(62.dp).height(32.dp)) {
        Avatar("AC", modifier = Modifier.offset(x = 0.dp).size(30.dp), color = SoftPeachPale)
        Avatar("NP", modifier = Modifier.offset(x = 18.dp).size(30.dp), color = SoftPurplePale)
        Avatar("TM", modifier = Modifier.offset(x = 36.dp).size(30.dp), color = Sage)
    }
}

@Composable
fun SectionTitle(title: String, trailing: String? = null) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(title, style = MaterialTheme.typography.titleLarge, color = DeepText)
        trailing?.let { Text(it, style = MaterialTheme.typography.labelLarge, color = MutedBrown) }
    }
}

@Composable
fun StatusChip(label: String, modifier: Modifier = Modifier, color: Color = Sage, contentColor: Color = ForestGreen) {
    Surface(modifier = modifier, shape = CircleShape, color = color) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
            style = MaterialTheme.typography.labelSmall,
            color = contentColor,
            maxLines = 1,
        )
    }
}

@Composable
fun TrustSignalCard(signal: TrustSignal, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier, color = PureWhite, radius = 22.dp, padding = 14.dp) {
        Text(signal.value, style = MaterialTheme.typography.headlineSmall, color = ForestGreen)
        Text(signal.label, style = MaterialTheme.typography.labelLarge, color = DeepText)
        Text(signal.helper, style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
    }
}

@Composable
fun PracticeCard(title: String, body: String, action: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    SoftCard(modifier = modifier, color = Sage, radius = 26.dp) {
        StatusChip("Today's action", color = PureWhite, contentColor = MutedBrown)
        Text(title, style = MaterialTheme.typography.titleLarge, color = DeepText)
        Text(body, style = MaterialTheme.typography.bodyLarge, color = SecondaryText)
        PrimaryPillButton(action, modifier = Modifier.fillMaxWidth(), onClick = onClick)
    }
}

@Composable
fun FeedbackCard(item: FeedbackItem, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier, color = if (item.tone == "Specific") Sage else SoftPeachPale, radius = 22.dp) {
        StatusChip(item.tone, color = PureWhite, contentColor = MutedBrown)
        Text(item.title, style = MaterialTheme.typography.titleMedium, color = DeepText)
        Text(item.body, style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
    }
}

@Composable
fun ContributionCard(action: ContributionAction, modifier: Modifier = Modifier, onClick: () -> Unit = {}) {
    SoftCard(modifier = modifier, color = PureWhite, radius = 22.dp, padding = 14.dp) {
        StatusChip(action.requirement, color = SoftGoldPale, contentColor = MutedBrown)
        Text(action.title, style = MaterialTheme.typography.titleMedium, color = DeepText)
        Text(action.body, style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
        SecondaryPillButton("Open", modifier = Modifier.fillMaxWidth(), onClick = onClick)
    }
}

@Composable
fun EmptyStateCard(title: String, body: String, action: String? = null, modifier: Modifier = Modifier, onAction: () -> Unit = {}) {
    SoftCard(modifier = modifier, color = Sage, radius = 26.dp) {
        SunburstLogo(size = 38.dp)
        Text(title, style = MaterialTheme.typography.titleLarge, color = DeepText)
        Text(body, style = MaterialTheme.typography.bodyLarge, color = SecondaryText)
        action?.let { PrimaryPillButton(it, modifier = Modifier.fillMaxWidth(), onClick = onAction) }
    }
}

@Composable
fun ActivityRow(item: ActivityItem, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Surface(shape = CircleShape, color = Sage, modifier = Modifier.size(42.dp)) {
            Box(contentAlignment = Alignment.Center) {
                Text(item.category.take(1), style = MaterialTheme.typography.labelLarge, color = ForestGreen)
            }
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(item.title, style = MaterialTheme.typography.labelLarge, color = DeepText)
                Text(item.timestamp, style = MaterialTheme.typography.labelSmall, color = TertiaryText)
            }
            Text(item.body, style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
            StatusChip(item.category, color = SoftPurplePale, contentColor = SoftPurple)
        }
    }
}

@Composable
fun ProfileStatCard(stat: ProfileStat, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier, color = PureWhite, radius = 20.dp, padding = 12.dp) {
        Text(stat.value, style = MaterialTheme.typography.headlineSmall, color = ForestGreen)
        Text(stat.label, style = MaterialTheme.typography.labelLarge, color = DeepText)
    }
}

@Composable
fun PathProgressRow(path: ProgressPath) {
    ProgressPathRow(path)
}

@Composable
fun ProgressCard(title: String, body: String, modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit = {}) {
    SoftCard(modifier = modifier, color = PureWhite, radius = 24.dp) {
        Text(title, style = MaterialTheme.typography.titleLarge, color = DeepText)
        Text(body, style = MaterialTheme.typography.bodyLarge, color = SecondaryText)
        content()
    }
}

@Composable
fun ProofSummaryCard(proof: ProofPost, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier, color = PureWhite, radius = 24.dp) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            StatusChip(proof.mediaType, color = SoftPurplePale, contentColor = SoftPurple)
            StatusChip(proof.visibility, color = Sage, contentColor = ForestGreen)
        }
        Text(proof.title, style = MaterialTheme.typography.titleLarge, color = DeepText)
        Text(proof.reflection, style = MaterialTheme.typography.bodyLarge, color = SecondaryText)
        Text(proof.status, style = MaterialTheme.typography.labelLarge, color = MutedBrown)
    }
}

@Composable
fun PlanOptionCard(plan: PlanOption, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier, color = PureWhite, radius = 22.dp, padding = 14.dp) {
        StatusChip(plan.priceLabel, color = Sage, contentColor = ForestGreen)
        Text(plan.title, style = MaterialTheme.typography.titleMedium, color = DeepText)
        Text(plan.body, style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
    }
}

@Composable
fun LabSpaceCard(lab: LabSpace, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier, color = PureWhite, radius = 22.dp, padding = 14.dp) {
        Text(lab.title, style = MaterialTheme.typography.titleMedium, color = DeepText)
        Text(lab.purpose, style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
        StatusChip(lab.requirement, color = SoftGoldPale, contentColor = MutedBrown)
        Text(lab.activity, style = MaterialTheme.typography.labelLarge, color = ForestGreen)
    }
}

private fun ProgressMetric.accentColor(): Color =
    when {
        title.contains("Momentum", ignoreCase = true) -> ForestGreen
        title.contains("Path", ignoreCase = true) -> SoftPurple
        else -> SoftPeach
    }

private fun ProgressPath.accentColor(): Color =
    when (colorName) {
        "green" -> ForestGreen
        "gold" -> MutedBrown
        else -> SoftPurple
    }

@Preview(showBackground = true)
@Composable
private fun ComponentPreview() {
    Box(modifier = Modifier.background(CreamBackground).padding(20.dp)) {
        FeedCard(post = MockData.feedPosts.first(), onTryThis = {})
    }
}
