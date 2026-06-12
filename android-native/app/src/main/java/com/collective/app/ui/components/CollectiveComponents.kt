package com.collective.app.ui.components

import com.collective.app.ui.theme.CollectiveTokens
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.ui.graphics.Color
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
import com.collective.app.ui.brand.CollectiveMiniMark

@Composable
fun SoftCard(
    modifier: Modifier = Modifier.fillMaxWidth(),
    color: Color = CollectiveTokens.Card,
    radius: Dp = 24.dp,
    borderColor: Color = CollectiveTokens.Line.copy(alpha = 0.62f),
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

// The old SunburstLogo was retired with the brand redesign; surfaces that showed it
// now render the approved C + people + book mark via CollectiveMiniMark.

@Composable
fun Avatar(initials: String, modifier: Modifier = Modifier, color: Color = CollectiveTokens.GoldSoft) {
    Surface(
        modifier = modifier.size(42.dp),
        shape = CircleShape,
        color = color,
        border = BorderStroke(1.dp, CollectiveTokens.Line),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                initials,
                style = MaterialTheme.typography.labelLarge,
                color = CollectiveTokens.Text,
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
            CollectiveMiniMark(size = 36.dp, contentDescription = "Collective")
        }
        Text(
            title,
            modifier = Modifier.weight(1f),
            style = MaterialTheme.typography.displaySmall,
            color = CollectiveTokens.Text,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        trailing?.invoke() ?: Row(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            CircleIconButton(label = "Search", onClick = {}, size = 42.dp)
            Avatar(initials = "AC", color = CollectiveTokens.GoldSoft)
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
        color = Color.White,
        border = BorderStroke(1.dp, CollectiveTokens.Line),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                label,
                style = if (label.length > 2) MaterialTheme.typography.labelSmall else MaterialTheme.typography.titleMedium,
                color = CollectiveTokens.Text,
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
        color = if (selected) CollectiveTokens.Gold else Color.White,
        border = BorderStroke(1.dp, if (selected) CollectiveTokens.Gold else CollectiveTokens.Line.copy(alpha = 0.55f)),
        tonalElevation = if (selected) 1.dp else 0.dp,
    ) {
        Text(
            text = if (selected) "* $label" else label,
            modifier = Modifier.padding(horizontal = 15.dp, vertical = 9.dp),
            style = MaterialTheme.typography.labelLarge,
            color = if (selected) Color.White else CollectiveTokens.Text,
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
        colors = ButtonDefaults.buttonColors(containerColor = CollectiveTokens.Gold, contentColor = Color.White),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 1.dp, pressedElevation = 0.dp),
    ) {
        Text(label, style = MaterialTheme.typography.labelLarge)
    }
}

@Composable
fun SecondaryPillButton(
    label: String,
    modifier: Modifier = Modifier,
    color: Color = CollectiveTokens.GoldSoft,
    contentColor: Color = CollectiveTokens.Gold,
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
                FeedPostType.PROGRESS_STORY -> CollectiveTokens.GoldSoft
                FeedPostType.MINI_LESSON -> CollectiveTokens.GoldSoft
                FeedPostType.ENCOURAGEMENT -> CollectiveTokens.GoldSoft
                else -> CollectiveTokens.GoldSoft
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
        Avatar(user.initials, color = CollectiveTokens.GoldSoft, modifier = Modifier.size(40.dp))
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(1.dp)) {
            Text(user.name, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text)
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Text(timestamp, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
        Text("...", style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Muted)
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
            color = CollectiveTokens.Text,
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
            PhotoPlaceholder("Before", CollectiveTokens.GoldSoft, Modifier.weight(1f).height(120.dp))
            PhotoPlaceholder("After", CollectiveTokens.GoldSoft, Modifier.weight(1f).height(120.dp))
        }
        Text(
            post.text,
            modifier = Modifier.weight(0.85f),
            style = MaterialTheme.typography.bodyMedium,
            color = CollectiveTokens.Text,
        )
    }
}

@Composable
private fun MiniLessonContent(post: FeedPost, onTryThis: () -> Unit) {
    PostHeader(post.user, post.subtitle, post.timestamp)
    Row(horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.CenterVertically) {
        LessonIllustration(modifier = Modifier.size(width = 126.dp, height = 100.dp))
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(7.dp)) {
            Text(post.title.orEmpty(), style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Text)
            Text(post.body.orEmpty(), style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
            SecondaryPillButton(
                "Try This Tip >",
                modifier = Modifier.width(132.dp),
                color = CollectiveTokens.GoldSoft,
                contentColor = CollectiveTokens.GoldDeep,
                onClick = onTryThis,
            )
        }
    }
}

@Composable
private fun EncouragementContent(post: FeedPost) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Avatar(post.user.initials, color = CollectiveTokens.GoldSoft, modifier = Modifier.size(42.dp))
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Text("${post.user.name} supported your proof", style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text)
            Text(post.text, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
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
                color = if (lessonAction) CollectiveTokens.GoldSoft else CollectiveTokens.GoldSoft,
                contentColor = if (lessonAction) CollectiveTokens.GoldDeep else CollectiveTokens.Gold,
                onClick = onTryThis,
            )
        }
    }
}

@Composable
private fun SmallAction(label: String, onClick: () -> Unit) {
    TextButton(onClick = onClick, contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 4.dp)) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.GoldDeep, maxLines = 1)
    }
}

@Composable
fun PathHeroCard(path: Path) {
    SoftCard(color = CollectiveTokens.Card, radius = 28.dp, padding = 14.dp) {
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
            HeroImagePlaceholder(modifier = Modifier.size(148.dp))
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(path.tagline, style = MaterialTheme.typography.titleLarge, color = CollectiveTokens.Text)
                Text(path.description, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    StackedAvatars()
                    Text(path.members, style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.Muted)
                    Text("|", color = CollectiveTokens.Line)
                    Text("${path.journeys} journeys", style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.Muted)
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
            color = CollectiveTokens.Gold,
            trackColor = CollectiveTokens.GoldSoft,
            strokeWidth = 7.dp,
        )
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(label, style = MaterialTheme.typography.titleLarge, color = CollectiveTokens.Text)
            Text("Complete", style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.Muted)
        }
    }
}

@Composable
fun MilestoneRow(milestone: Milestone, index: Int, onStart: () -> Unit) {
    val active = milestone.state == "Active"
    val completed = milestone.state == "Completed"
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = if (active) CollectiveTokens.GoldSoft.copy(alpha = 0.72f) else Color.Transparent,
        shape = RoundedCornerShape(24.dp),
        border = if (active) BorderStroke(1.dp, CollectiveTokens.Line.copy(alpha = 0.55f)) else null,
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = if (active) 14.dp else 10.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Surface(
                shape = CircleShape,
                color = when {
                    completed -> CollectiveTokens.GoldSoft
                    active -> CollectiveTokens.Gold
                    else -> Color.White
                },
                border = BorderStroke(1.dp, CollectiveTokens.Line),
                modifier = Modifier.size(38.dp),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        if (completed) "Done" else index.toString(),
                        style = MaterialTheme.typography.labelSmall,
                        color = if (active) Color.White else CollectiveTokens.Text,
                    )
                }
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(milestone.title, style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Text)
                Text(milestone.description, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
            }
            when {
                active -> PrimaryPillButton("Start Practice", modifier = Modifier.width(142.dp), onClick = onStart)
                completed -> LabelPill("Completed", color = CollectiveTokens.GoldSoft)
                else -> Text("Lock", style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.Muted)
            }
        }
    }
}

@Composable
fun ContributorCard(contributor: Contributor, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier.width(184.dp), color = Color.White, radius = 20.dp, padding = 12.dp) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(9.dp)) {
            Avatar(contributor.initials, color = CollectiveTokens.GoldSoft, modifier = Modifier.size(42.dp))
            Column {
                Text(contributor.name, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text, maxLines = 1)
                Text(contributor.role, style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.GoldDeep, maxLines = 1)
            }
        }
        Text(contributor.description, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
    }
}

@Composable
fun ProofCard(proof: Proof, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier.width(184.dp), color = Color.White, radius = 20.dp, padding = 12.dp) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(9.dp)) {
            Avatar(proof.initials, color = CollectiveTokens.GoldSoft, modifier = Modifier.size(38.dp))
            Column {
                Text(proof.user, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text, maxLines = 1)
                Text(proof.status, style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.GoldDeep, maxLines = 1)
            }
        }
        Text(proof.text, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Text)
        Text("Support ${proof.supportCount}", style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.GoldDeep)
    }
}

@Composable
fun ProgressOverviewCard(metrics: List<ProgressMetric>, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier, color = Color.White, radius = 26.dp) {
        Text("Overview", style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Text)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Top) {
            metrics.forEachIndexed { index, metric ->
                ProgressStatBlock(metric, modifier = Modifier.weight(1f))
                if (index != metrics.lastIndex) {
                    Box(modifier = Modifier.width(1.dp).height(82.dp).background(CollectiveTokens.Line.copy(alpha = 0.65f)))
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
        Text(metric.value, style = MaterialTheme.typography.headlineSmall, color = CollectiveTokens.Text)
        Text(metric.title, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text)
        Text(metric.helper, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
    }
}

@Composable
fun ProgressStatCard(metric: ProgressMetric, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier, color = Color.White, radius = 22.dp) {
        Text(metric.value, style = MaterialTheme.typography.headlineSmall, color = CollectiveTokens.Gold)
        Text(metric.title, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text)
        Text(metric.helper, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
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
            Text(path.name, style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Text)
            Text(path.subtitle, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
            LinearProgressIndicator(
                progress = { path.progress },
                modifier = Modifier.fillMaxWidth().height(7.dp).clip(CircleShape),
                color = color,
                trackColor = CollectiveTokens.GoldSoft,
            )
        }
        Text("${(path.progress * 100).toInt()}%", style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text)
        Box(modifier = Modifier.size(54.dp), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(
                progress = { path.progress },
                color = color,
                trackColor = CollectiveTokens.GoldSoft,
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
                color = if (selected == type) CollectiveTokens.GoldSoft else Color.White,
                border = BorderStroke(1.dp, if (selected == type) CollectiveTokens.Gold else CollectiveTokens.Line),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        type,
                        textAlign = TextAlign.Center,
                        style = MaterialTheme.typography.labelLarge,
                        color = if (selected == type) CollectiveTokens.Gold else CollectiveTokens.Text,
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
                color = if (selected == title) CollectiveTokens.GoldSoft else Color.White,
                border = BorderStroke(1.dp, if (selected == title) CollectiveTokens.Gold else CollectiveTokens.Line),
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Text(title, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text, textAlign = TextAlign.Center)
                    Text(helper, style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.Muted, textAlign = TextAlign.Center, maxLines = 2)
                }
            }
        }
    }
}

@Composable
fun WinRow(win: Win) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Surface(shape = CircleShape, color = CollectiveTokens.GoldSoft, modifier = Modifier.size(42.dp)) {
            Box(contentAlignment = Alignment.Center) { Text(win.title.take(1), color = CollectiveTokens.GoldDeep, fontWeight = FontWeight.Bold) }
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(win.title, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text)
            Text(win.helper, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
            Text(win.timestamp, style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.Muted)
        }
    }
}

@Composable
fun FeedbackRow(note: FeedbackNote) {
    Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Avatar(note.initials, color = CollectiveTokens.GoldSoft, modifier = Modifier.size(38.dp))
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(note.author, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text)
            Text(note.text, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
            Text(note.timestamp, style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.Muted)
        }
    }
}

@Composable
fun LabelPill(label: String, color: Color = CollectiveTokens.GoldSoft) {
    Surface(shape = CircleShape, color = color) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            style = MaterialTheme.typography.labelSmall,
            color = if (color == CollectiveTokens.Gold) Color.White else CollectiveTokens.GoldDeep,
            maxLines = 1,
        )
    }
}

@Composable
fun VideoPlaceholder(duration: String, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(22.dp))
            .background(CollectiveTokens.GoldSoft),
        contentAlignment = Alignment.Center,
    ) {
        Box(modifier = Modifier.fillMaxWidth().height(22.dp).align(Alignment.BottomCenter).background(CollectiveTokens.Text.copy(alpha = 0.08f)))
        Surface(shape = CircleShape, color = Color.White.copy(alpha = 0.92f), modifier = Modifier.size(48.dp)) {
            Box(contentAlignment = Alignment.Center) { Text("Play", color = CollectiveTokens.Gold, style = MaterialTheme.typography.labelSmall) }
        }
        Surface(
            modifier = Modifier.align(Alignment.BottomEnd).padding(8.dp),
            shape = CircleShape,
            color = CollectiveTokens.Text.copy(alpha = 0.72f),
        ) {
            Text(duration, modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp), color = Color.White, style = MaterialTheme.typography.labelSmall)
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
        Surface(shape = CircleShape, color = CollectiveTokens.Text.copy(alpha = 0.7f), modifier = Modifier.padding(8.dp)) {
            Text(label, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), style = MaterialTheme.typography.labelSmall, color = Color.White)
        }
    }
}

@Composable
fun LessonIllustration(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(24.dp))
            .background(CollectiveTokens.GoldSoft),
        contentAlignment = Alignment.Center,
    ) {
        Surface(shape = RoundedCornerShape(16.dp), color = CollectiveTokens.GoldBright, modifier = Modifier.align(Alignment.TopStart).padding(14.dp)) {
            Text("Clear", modifier = Modifier.padding(10.dp), style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.Text)
        }
        Surface(shape = RoundedCornerShape(16.dp), color = Color.White, modifier = Modifier.align(Alignment.BottomEnd).padding(14.dp)) {
            Text("Calm", modifier = Modifier.padding(10.dp), style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.Text)
        }
    }
}

@Composable
fun HeroImagePlaceholder(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(24.dp))
            .background(CollectiveTokens.GoldSoft),
        contentAlignment = Alignment.Center,
    ) {
        Box(modifier = Modifier.size(86.dp).clip(CircleShape).background(CollectiveTokens.Text.copy(alpha = 0.12f)))
        Surface(shape = CircleShape, color = CollectiveTokens.Gold, modifier = Modifier.align(Alignment.BottomEnd).padding(12.dp)) {
            Text("Mic", modifier = Modifier.padding(horizontal = 13.dp, vertical = 8.dp), color = Color.White, style = MaterialTheme.typography.labelSmall)
        }
    }
}

@Composable
private fun StackedAvatars() {
    Box(modifier = Modifier.width(62.dp).height(32.dp)) {
        Avatar("AC", modifier = Modifier.offset(x = 0.dp).size(30.dp), color = CollectiveTokens.GoldSoft)
        Avatar("NP", modifier = Modifier.offset(x = 18.dp).size(30.dp), color = CollectiveTokens.GoldSoft)
        Avatar("TM", modifier = Modifier.offset(x = 36.dp).size(30.dp), color = CollectiveTokens.GoldSoft)
    }
}

@Composable
fun SectionTitle(title: String, trailing: String? = null) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(title, style = MaterialTheme.typography.titleLarge, color = CollectiveTokens.Text)
        trailing?.let { Text(it, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.GoldDeep) }
    }
}

@Composable
fun StatusChip(label: String, modifier: Modifier = Modifier, color: Color = CollectiveTokens.GoldSoft, contentColor: Color = CollectiveTokens.Gold) {
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
    SoftCard(modifier = modifier, color = Color.White, radius = 22.dp, padding = 14.dp) {
        Text(signal.value, style = MaterialTheme.typography.headlineSmall, color = CollectiveTokens.Gold)
        Text(signal.label, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text)
        Text(signal.helper, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
    }
}

@Composable
fun PracticeCard(title: String, body: String, action: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    SoftCard(modifier = modifier, color = CollectiveTokens.GoldSoft, radius = 26.dp) {
        StatusChip("Today's action", color = Color.White, contentColor = CollectiveTokens.GoldDeep)
        Text(title, style = MaterialTheme.typography.titleLarge, color = CollectiveTokens.Text)
        Text(body, style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Muted)
        PrimaryPillButton(action, modifier = Modifier.fillMaxWidth(), onClick = onClick)
    }
}

@Composable
fun FeedbackCard(item: FeedbackItem, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier, color = if (item.tone == "Specific") CollectiveTokens.GoldSoft else CollectiveTokens.GoldSoft, radius = 22.dp) {
        StatusChip(item.tone, color = Color.White, contentColor = CollectiveTokens.GoldDeep)
        Text(item.title, style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Text)
        Text(item.body, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
    }
}

@Composable
fun ContributionCard(action: ContributionAction, modifier: Modifier = Modifier, onClick: () -> Unit = {}) {
    SoftCard(modifier = modifier, color = Color.White, radius = 22.dp, padding = 14.dp) {
        StatusChip(action.requirement, color = CollectiveTokens.GoldSoft, contentColor = CollectiveTokens.GoldDeep)
        Text(action.title, style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Text)
        Text(action.body, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
        SecondaryPillButton("Open", modifier = Modifier.fillMaxWidth(), onClick = onClick)
    }
}

@Composable
fun EmptyStateCard(title: String, body: String, action: String? = null, modifier: Modifier = Modifier, onAction: () -> Unit = {}) {
    SoftCard(modifier = modifier, color = CollectiveTokens.GoldSoft, radius = 26.dp) {
        CollectiveMiniMark(size = 38.dp, contentDescription = "Collective")
        Text(title, style = MaterialTheme.typography.titleLarge, color = CollectiveTokens.Text)
        Text(body, style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Muted)
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
        Surface(shape = CircleShape, color = CollectiveTokens.GoldSoft, modifier = Modifier.size(42.dp)) {
            Box(contentAlignment = Alignment.Center) {
                Text(item.category.take(1), style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Gold)
            }
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(item.title, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text)
                Text(item.timestamp, style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.Muted)
            }
            Text(item.body, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
            StatusChip(item.category, color = CollectiveTokens.GoldSoft, contentColor = CollectiveTokens.GoldDeep)
        }
    }
}

@Composable
fun ProfileStatCard(stat: ProfileStat, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier, color = Color.White, radius = 20.dp, padding = 12.dp) {
        Text(stat.value, style = MaterialTheme.typography.headlineSmall, color = CollectiveTokens.Gold)
        Text(stat.label, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text)
    }
}

@Composable
fun PathProgressRow(path: ProgressPath) {
    ProgressPathRow(path)
}

@Composable
fun ProgressCard(title: String, body: String, modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit = {}) {
    SoftCard(modifier = modifier, color = Color.White, radius = 24.dp) {
        Text(title, style = MaterialTheme.typography.titleLarge, color = CollectiveTokens.Text)
        Text(body, style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Muted)
        content()
    }
}

@Composable
fun ProofSummaryCard(proof: ProofPost, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier, color = Color.White, radius = 24.dp) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            StatusChip(proof.mediaType, color = CollectiveTokens.GoldSoft, contentColor = CollectiveTokens.GoldDeep)
            StatusChip(proof.visibility, color = CollectiveTokens.GoldSoft, contentColor = CollectiveTokens.Gold)
        }
        Text(proof.title, style = MaterialTheme.typography.titleLarge, color = CollectiveTokens.Text)
        Text(proof.reflection, style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Muted)
        Text(proof.status, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.GoldDeep)
    }
}

@Composable
fun PlanOptionCard(plan: PlanOption, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier, color = Color.White, radius = 22.dp, padding = 14.dp) {
        StatusChip(plan.priceLabel, color = CollectiveTokens.GoldSoft, contentColor = CollectiveTokens.Gold)
        Text(plan.title, style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Text)
        Text(plan.body, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
    }
}

@Composable
fun LabSpaceCard(lab: LabSpace, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier, color = Color.White, radius = 22.dp, padding = 14.dp) {
        Text(lab.title, style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Text)
        Text(lab.purpose, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
        StatusChip(lab.requirement, color = CollectiveTokens.GoldSoft, contentColor = CollectiveTokens.GoldDeep)
        Text(lab.activity, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Gold)
    }
}

private fun ProgressMetric.accentColor(): Color =
    when {
        title.contains("Momentum", ignoreCase = true) -> CollectiveTokens.Gold
        title.contains("Path", ignoreCase = true) -> CollectiveTokens.GoldDeep
        else -> CollectiveTokens.GoldBright
    }

private fun ProgressPath.accentColor(): Color =
    when (colorName) {
        "green" -> CollectiveTokens.Gold
        "gold" -> CollectiveTokens.GoldDeep
        else -> CollectiveTokens.GoldDeep
    }

@Preview(showBackground = true)
@Composable
private fun ComponentPreview() {
    Box(modifier = Modifier.background(CollectiveTokens.Cream).padding(20.dp)) {
        FeedCard(post = MockData.feedPosts.first(), onTryThis = {})
    }
}
