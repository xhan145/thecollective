package com.collective.app.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.collective.app.ui.brand.CollectiveMark
import com.collective.app.ui.home.CollectivePreviewData
import com.collective.app.ui.home.FocusState
import com.collective.app.ui.home.HomeSheet
import com.collective.app.ui.home.HomeUiState
import com.collective.app.ui.home.HomeViewModel
import com.collective.app.ui.home.PracticeSheetState
import com.collective.app.ui.home.PracticeState
import com.collective.app.ui.home.PracticeType
import com.collective.app.ui.home.ProofSummaryState
import com.collective.app.ui.home.StreakDayState
import com.collective.app.ui.home.StreakState
import com.collective.app.ui.home.TrustSnapshotState
import com.collective.app.ui.feedback.AddFeedbackSheetContent
import com.collective.app.ui.feedback.FeedbackItem
import com.collective.app.ui.feedback.FeedbackViewModel
import com.collective.app.ui.practice.PracticePathChecklist
import com.collective.app.ui.practice.PracticeStepKind
import com.collective.app.ui.practice.PracticeViewModel
import com.collective.app.ui.practice.PathCompleteState
import com.collective.app.ui.practice.SelectedDirectionState
import com.collective.app.ui.practice.selectedDirectionStateOf
import com.collective.app.ui.proof.ProofDetailSheetContent
import com.collective.app.ui.proof.ProofDraftState
import com.collective.app.ui.proof.ProofItem
import com.collective.app.ui.proof.ProofMediaType
import com.collective.app.ui.proof.ProofSummaryCard
import com.collective.app.ui.proof.ProofViewModel
import com.collective.app.ui.proof.SubmitProofSheetContent
import com.collective.app.ui.theme.CollectiveTheme

private object CollectiveHomeTokens {
    val CollectiveGold = Color(0xFFF2A900)
    val CollectiveGoldBright = Color(0xFFFFB000)
    val CollectiveCream = Color(0xFFFFF8EE)
    val CollectiveCard = Color(0xFFFFFDF8)
    val CollectiveText = Color(0xFF111111)
    val CollectiveMuted = Color(0xFF6E6E6E)
    val CollectiveLine = Color(0xFFEFE7D8)
    val CollectiveSoftShadow = Color(0x1F000000)
}

@Composable
fun CollectiveHomeScreen(
    viewModel: HomeViewModel,
    proofViewModel: ProofViewModel,
    feedbackViewModel: FeedbackViewModel,
    practiceViewModel: PracticeViewModel,
    onNavigateToDiscover: () -> Unit,
    onNavigateToActivity: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val uiState by viewModel.uiState.collectAsState()
    val proofItems by proofViewModel.proofItems.collectAsState()
    val latestProof by proofViewModel.latestProof.collectAsState()
    val selectedProof by proofViewModel.selectedProof.collectAsState()
    val proofDraft by proofViewModel.draft.collectAsState()
    val feedbackItems by feedbackViewModel.feedbackItems.collectAsState()
    val feedbackDraft by feedbackViewModel.draft.collectAsState()

    // Practice state from PracticeRepository (single source of truth)
    val directions by practiceViewModel.directions.collectAsState()
    val selectedDirectionId by practiceViewModel.selectedDirectionId.collectAsState()
    val practiceProgress by practiceViewModel.progress.collectAsState()

    // Pure derivation: no mutable state here — recomputes on every relevant change
    val selectedDirectionState = selectedDirectionStateOf(directions, selectedDirectionId, practiceProgress)

    // Override uiState focus/practice from PracticeRepository so Home always reflects real progress.
    // The Home visual layout is unchanged — only the data driving the cards is live.
    val practiceUiState = if (selectedDirectionState != null) {
        val sds = selectedDirectionState
        uiState.copy(
            focus = uiState.focus.copy(
                title = sds.direction.title,
                completedPractices = sds.completedCount,
                totalPractices = sds.totalCount,
                progress = sds.progress,
                practices = sds.direction.steps.map { it.title },
            ),
            practice = if (sds.activeStep != null) {
                uiState.practice.copy(
                    id = sds.activeStep.id,
                    title = sds.activeStep.title,
                    prompt = sds.activeStep.prompt,
                    type = sds.activeStep.kind.toPracticeType(),
                    isCompletedToday = false,
                )
            } else {
                uiState.practice.copy(isCompletedToday = true)
            },
        )
    } else uiState

    // When a proof is submitted, auto-complete the SubmitProof step if it is the active step.
    LaunchedEffect(proofDraft.isSubmitted) {
        if (proofDraft.isSubmitted) {
            val sds = selectedDirectionState
            val active = sds?.activeStep
            if (sds != null && active != null && active.kind == PracticeStepKind.SubmitProof) {
                practiceViewModel.onCompleteStep(sds.direction.id, active.id)
            }
        }
    }

    val latestFeedback = latestProof?.let { proof -> feedbackItems.filter { it.proofId == proof.id } } ?: emptyList()
    CollectiveHomeContent(
        uiState = practiceUiState,
        latestProof = latestProof,
        latestFeedbackCount = latestFeedback.size,
        latestFeedbackInitials = latestFeedback.map { it.authorInitials },
        onNotificationsClicked = viewModel::onNotificationsClicked,
        onTodayFocusClicked = viewModel::onTodayFocusClicked,
        onContinuePracticeClicked = viewModel::onContinuePracticeClicked,
        onRecentProofClicked = {
            latestProof?.let {
                proofViewModel.onProofSelected(it)
                feedbackViewModel.onMarkAllForProofRead(it.id)
            }
            viewModel.onRecentProofClicked()
        },
        onSeeAllProofClicked = {
            viewModel.onAllProofFallbackClicked()
        },
        modifier = modifier,
    )
    HomeSheetHost(
        uiState = practiceUiState,
        viewModel = viewModel,
        proofViewModel = proofViewModel,
        feedbackViewModel = feedbackViewModel,
        practiceViewModel = practiceViewModel,
        selectedDirectionState = selectedDirectionState,
        proofItems = proofItems,
        selectedProof = selectedProof,
        proofDraft = proofDraft,
        feedbackItems = feedbackItems,
        feedbackDraft = feedbackDraft,
        onNavigateToDiscover = onNavigateToDiscover,
        onNavigateToActivity = onNavigateToActivity,
    )
}

/** Maps a PracticeStepKind to the closest PracticeType for the Home practice card. */
private fun PracticeStepKind.toPracticeType(): PracticeType =
    when (this) {
        PracticeStepKind.VoiceNote -> PracticeType.VoiceNote
        PracticeStepKind.ConversationPrompt -> PracticeType.ConversationPrompt
        PracticeStepKind.VideoPractice -> PracticeType.VideoPractice
        else -> PracticeType.Reflection
    }

@Composable
private fun CollectiveHomeContent(
    uiState: HomeUiState,
    latestProof: ProofItem?,
    onNotificationsClicked: () -> Unit,
    onTodayFocusClicked: () -> Unit,
    onContinuePracticeClicked: () -> Unit,
    onRecentProofClicked: () -> Unit,
    onSeeAllProofClicked: () -> Unit,
    modifier: Modifier = Modifier,
    latestFeedbackCount: Int = 0,
    latestFeedbackInitials: List<String> = emptyList(),
) {
    val statusTop = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(CollectiveHomeTokens.CollectiveCream),
    ) {
        NotificationBell(
            count = uiState.notificationCount,
            onClick = onNotificationsClicked,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(top = statusTop + 14.dp, end = 22.dp),
        )

        Column(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .widthIn(max = 390.dp)
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(statusTop + 42.dp))
            CollectiveTopLogoHeader(uiState = uiState)
            Spacer(Modifier.height(17.dp))
            TodayFocusCard(focus = uiState.focus, onOpen = onTodayFocusClicked)
            Spacer(Modifier.height(22.dp))
            SectionLabel("Continue Practice")
            Spacer(Modifier.height(8.dp))
            ContinuePracticeCard(practice = uiState.practice, onClick = onContinuePracticeClicked)
            Spacer(Modifier.height(20.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                SectionLabel("Recent Proof", modifier = Modifier.weight(1f))
                Text(
                    text = "See all",
                    color = CollectiveHomeTokens.CollectiveGold,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .clickable { onSeeAllProofClicked() }
                        .padding(horizontal = 4.dp, vertical = 4.dp),
                )
            }
            Spacer(Modifier.height(8.dp))
            RecentProofCard(proof = latestProof?.toHomeSummary(latestFeedbackCount, latestFeedbackInitials), onClick = onRecentProofClicked)
            Spacer(Modifier.height(18.dp))
            StreakCard(streak = uiState.streak)
            Spacer(Modifier.height(10.dp))
        }
    }
}

@Composable
fun CollectiveTopLogoHeader(uiState: HomeUiState, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        CollectiveLogo(modifier = Modifier.size(width = 190.dp, height = 90.dp))
        Spacer(Modifier.height(2.dp))
        Text(
            text = "${uiState.greeting}, ${uiState.userName}.",
            color = CollectiveHomeTokens.CollectiveText,
            fontSize = 26.sp,
            fontWeight = FontWeight.Bold,
            lineHeight = 31.sp,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = uiState.subtitle,
            color = CollectiveHomeTokens.CollectiveMuted,
            fontSize = 16.sp,
            fontWeight = FontWeight.Normal,
            lineHeight = 19.sp,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
fun CollectiveLogo(modifier: Modifier = Modifier) {
    CollectiveMark(modifier = modifier, color = CollectiveHomeTokens.CollectiveGoldBright, width = 104.dp, height = 104.dp)
}

@Composable
private fun SectionLabel(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text,
        color = CollectiveHomeTokens.CollectiveText,
        fontSize = 16.sp,
        lineHeight = 19.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = modifier.fillMaxWidth(),
    )
}

@Composable
fun TodayFocusCard(focus: FocusState, onOpen: () -> Unit, modifier: Modifier = Modifier) {
    SoftHomeCard(
        modifier = modifier
            .fillMaxWidth()
            .height(126.dp),
        radius = 18.dp,
        contentPadding = PaddingValues(horizontal = 22.dp, vertical = 18.dp),
        onClick = onOpen,
        contentDescription = "Today focus card. ${focus.title}. ${focus.completedPractices} of ${focus.totalPractices} practices completed.",
    ) {
        Row(
            modifier = Modifier.fillMaxSize(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.Center,
            ) {
                Text("Today's Focus", color = CollectiveHomeTokens.CollectiveText, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                Spacer(Modifier.height(8.dp))
                Text(
                    focus.title,
                    color = CollectiveHomeTokens.CollectiveText,
                    fontSize = 20.sp,
                    lineHeight = 23.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(12.dp))
                ProgressBar(progress = focus.progress)
                Spacer(Modifier.height(9.dp))
                Text("${focus.completedPractices} of ${focus.totalPractices} practices completed", color = CollectiveHomeTokens.CollectiveMuted, fontSize = 12.5.sp, lineHeight = 14.sp)
            }
            CircleActionButton(size = 42.dp, onClick = onOpen, contentDescription = "Open today's focus") {
                ArrowRightIcon(Modifier.size(22.dp), Color.White)
            }
        }
    }
}

@Composable
fun ContinuePracticeCard(practice: PracticeState, onClick: () -> Unit, modifier: Modifier = Modifier) {
    SoftHomeCard(
        modifier = modifier
            .fillMaxWidth()
            .height(80.dp),
        radius = 16.dp,
        contentPadding = PaddingValues(16.dp),
        onClick = onClick,
        contentDescription = "Continue practice. ${practice.title.replace("\n", " ")}.",
    ) {
        Row(
            modifier = Modifier.fillMaxSize(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(CollectiveHomeTokens.CollectiveGoldBright)
                    .semantics { contentDescription = "Microphone practice icon" },
                contentAlignment = Alignment.Center,
            ) {
                MicIcon(Modifier.size(29.dp), CollectiveHomeTokens.CollectiveText)
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.Center) {
                Text(
                    practice.title,
                    color = CollectiveHomeTokens.CollectiveText,
                    fontSize = 17.sp,
                    lineHeight = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(2.dp))
                Text(practice.durationSeconds.asTimerText(), color = CollectiveHomeTokens.CollectiveMuted, fontSize = 13.sp, lineHeight = 15.sp)
            }
            CircleActionButton(size = 42.dp, onClick = onClick, contentDescription = "Play practice") {
                PlayIcon(Modifier.size(18.dp), Color.White)
            }
        }
    }
}

@Composable
fun RecentProofCard(proof: ProofSummaryState?, onClick: () -> Unit, modifier: Modifier = Modifier) {
    SoftHomeCard(
        modifier = modifier
            .fillMaxWidth()
            .height(92.dp),
        radius = 16.dp,
        contentPadding = PaddingValues(12.dp),
        onClick = onClick,
        contentDescription = proof?.let { "Recent proof. ${it.title.replace("\n", " ")}." } ?: "Recent proof placeholder.",
    ) {
        Row(
            modifier = Modifier.fillMaxSize(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(13.dp),
        ) {
            ProofThumbnail(Modifier.size(width = 76.dp, height = 68.dp))
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.Center,
            ) {
                Text(
                    proof?.title ?: "Submit proof to start\ncollecting useful feedback.",
                    color = CollectiveHomeTokens.CollectiveText,
                    fontSize = 14.5.sp,
                    lineHeight = 17.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(8.dp))
                if ((proof?.feedbackCount ?: 0) > 0) {
                    val count = proof?.feedbackCount ?: 0
                    val initials = proof?.supporterInitials.orEmpty()
                    val extra = count - initials.take(3).size
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            "Feedback",
                            color = CollectiveHomeTokens.CollectiveGold,
                            fontSize = 13.sp,
                            lineHeight = 15.sp,
                            fontWeight = FontWeight.Medium,
                        )
                        Spacer(Modifier.width(8.dp))
                        SmallAvatarStack(initials = initials)
                        if (extra > 0) {
                            Spacer(Modifier.width(5.dp))
                            Text("+$extra", color = CollectiveHomeTokens.CollectiveMuted, fontSize = 12.sp, lineHeight = 14.sp)
                        }
                    }
                } else {
                    Text(
                        "No feedback yet",
                        color = CollectiveHomeTokens.CollectiveMuted,
                        fontSize = 12.5.sp,
                        lineHeight = 15.sp,
                    )
                }
            }
        }
    }
}

@Composable
private fun ProofThumbnail(modifier: Modifier = Modifier) {
    Canvas(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFFFFEAC2))
            .semantics { contentDescription = "Recent proof thumbnail" },
    ) {
        drawRect(
            Brush.linearGradient(
                listOf(Color(0xFFFFF3D9), Color(0xFFD79537), Color(0xFF5C3A20)),
                start = Offset.Zero,
                end = Offset(size.width, size.height),
            ),
        )
        drawRect(Color.White.copy(alpha = 0.45f), topLeft = Offset(size.width * 0.10f, size.height * 0.08f), size = Size(size.width * 0.38f, size.height * 0.82f))
        drawLine(Color(0xFFB66E22), Offset(size.width * 0.30f, 0f), Offset(size.width * 0.30f, size.height), strokeWidth = 1.3.dp.toPx())
        drawLine(Color.White.copy(alpha = 0.55f), Offset(size.width * 0.08f, size.height * 0.43f), Offset(size.width * 0.52f, size.height * 0.43f), strokeWidth = 1.dp.toPx())
        drawCircle(Color(0xFF2F241D), radius = size.width * 0.085f, center = Offset(size.width * 0.61f, size.height * 0.38f))
        drawRoundRect(
            color = Color(0xFF1F1B18),
            topLeft = Offset(size.width * 0.50f, size.height * 0.47f),
            size = Size(size.width * 0.24f, size.height * 0.36f),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(12.dp.toPx(), 12.dp.toPx()),
        )
        drawCircle(Color(0xFFFFD58D).copy(alpha = 0.52f), radius = size.width * 0.18f, center = Offset(size.width * 0.83f, size.height * 0.18f))
    }
}

@Composable
fun SmallAvatarStack(initials: List<String>, modifier: Modifier = Modifier) {
    val colors = listOf(Color(0xFFB45F31), Color(0xFFE7A65C), Color(0xFF614437))
    val visibleInitials = initials.take(3)
    Box(modifier = modifier.size(width = 44.dp, height = 18.dp)) {
        visibleInitials.forEachIndexed { index, initial ->
            Box(
                modifier = Modifier
                    .offset(x = (index * 13).dp)
                    .size(18.dp)
                    .clip(CircleShape)
                    .background(colors[index % colors.size])
                    .border(1.2.dp, CollectiveHomeTokens.CollectiveCard, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = initial.take(1),
                    color = Color.White,
                    fontSize = 7.5.sp,
                    fontWeight = FontWeight.Bold,
                    lineHeight = 8.sp,
                )
            }
        }
    }
}

@Composable
fun StreakCard(streak: StreakState, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(82.dp)
            .shadow(9.dp, RoundedCornerShape(16.dp), ambientColor = CollectiveHomeTokens.CollectiveSoftShadow, spotColor = CollectiveHomeTokens.CollectiveSoftShadow)
            .clip(RoundedCornerShape(16.dp))
            .background(CollectiveHomeTokens.CollectiveGold)
            .padding(horizontal = 24.dp, vertical = 13.dp),
    ) {
        Row(modifier = Modifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.Center) {
                Text("Your Streak", color = Color(0xFF2E2200), fontSize = 14.sp, lineHeight = 16.sp, fontWeight = FontWeight.Medium)
                Spacer(Modifier.height(4.dp))
                Text("${streak.currentDays} days", color = Color.White, fontSize = 26.sp, lineHeight = 29.sp, fontWeight = FontWeight.Bold)
            }
            WeekDots(days = streak.week)
        }
    }
}

@Composable
private fun WeekDots(days: List<StreakDayState>, modifier: Modifier = Modifier) {
    Row(modifier = modifier, horizontalArrangement = Arrangement.spacedBy(9.dp), verticalAlignment = Alignment.CenterVertically) {
        days.forEach { day ->
            val fill by animateColorAsState(
                targetValue = if (day.isCompleted) Color.White else Color.Transparent,
                label = "streakDayFill",
            )
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Box(
                    modifier = Modifier
                        .size(if (day.isToday) 17.dp else 16.dp)
                        .clip(CircleShape)
                        .background(fill)
                        .border(1.6.dp, Color.White, CircleShape),
                )
                Text(day.label, color = Color.White, fontSize = 9.sp, lineHeight = 9.sp, fontWeight = FontWeight.Medium)
            }
        }
    }
}

@Composable
private fun ProgressBar(progress: Float, modifier: Modifier = Modifier) {
    val animatedProgress by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        label = "homeProgress",
    )
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(8.dp)
            .clip(CircleShape)
            .background(CollectiveHomeTokens.CollectiveLine),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(animatedProgress)
                .height(8.dp)
                .clip(CircleShape)
                .background(CollectiveHomeTokens.CollectiveGold),
        )
    }
}

@Composable
private fun SoftHomeCard(
    modifier: Modifier = Modifier,
    radius: Dp,
    contentPadding: PaddingValues,
    onClick: (() -> Unit)? = null,
    contentDescription: String? = null,
    content: @Composable () -> Unit,
) {
    val interactionSource = remember { MutableInteractionSource() }
    val pressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(targetValue = if (pressed) 0.985f else 1f, label = "cardPress")
    val clickableModifier = if (onClick == null) {
        Modifier
    } else {
        Modifier.clickable(
            interactionSource = interactionSource,
            indication = null,
            onClick = onClick,
        )
    }
    Surface(
        modifier = modifier
            .graphicsLayer(scaleX = scale, scaleY = scale)
            .shadow(
                elevation = 8.dp,
                shape = RoundedCornerShape(radius),
                ambientColor = CollectiveHomeTokens.CollectiveSoftShadow,
                spotColor = CollectiveHomeTokens.CollectiveSoftShadow,
            )
            .then(
                contentDescription?.let {
                    Modifier.semantics {
                        this.contentDescription = it
                        if (onClick != null) role = Role.Button
                    }
                } ?: Modifier,
            )
            .then(clickableModifier),
        color = CollectiveHomeTokens.CollectiveCard,
        shape = RoundedCornerShape(radius),
    ) {
        Box(modifier = Modifier.fillMaxSize().padding(contentPadding)) {
            content()
        }
    }
}

@Composable
private fun CircleActionButton(
    size: Dp,
    onClick: () -> Unit,
    contentDescription: String,
    content: @Composable () -> Unit,
) {
    val interactionSource = remember { MutableInteractionSource() }
    val pressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(targetValue = if (pressed) 0.94f else 1f, label = "circleButtonPress")
    Box(
        modifier = Modifier
            .size(size.coerceAtLeast(48.dp))
            .graphicsLayer(scaleX = scale, scaleY = scale)
            .clip(CircleShape)
            .background(CollectiveHomeTokens.CollectiveGoldBright)
            .semantics {
                this.contentDescription = contentDescription
                role = Role.Button
            }
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick,
            ),
        contentAlignment = Alignment.Center,
    ) {
        Box(modifier = Modifier.size(size), contentAlignment = Alignment.Center) {
            content()
        }
    }
}

@Composable
private fun NotificationBell(count: Int, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(48.dp)
            .clip(CircleShape)
            .semantics {
                contentDescription = if (count > 0) "Notifications, $count new" else "Notifications"
                role = Role.Button
            }
            .clickable { onClick() },
        contentAlignment = Alignment.Center,
    ) {
        BellIcon(Modifier.size(28.dp), CollectiveHomeTokens.CollectiveText)
        if (count > 0) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = (-6).dp, y = 5.dp)
                    .size(16.dp)
                    .clip(CircleShape)
                    .background(CollectiveHomeTokens.CollectiveGoldBright),
                contentAlignment = Alignment.Center,
            ) {
                Text(count.coerceAtMost(9).toString(), color = Color.White, fontSize = 9.sp, lineHeight = 9.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun HomeSheetHost(
    uiState: HomeUiState,
    viewModel: HomeViewModel,
    proofViewModel: ProofViewModel,
    feedbackViewModel: FeedbackViewModel,
    practiceViewModel: PracticeViewModel,
    selectedDirectionState: SelectedDirectionState?,
    proofItems: List<ProofItem>,
    selectedProof: ProofItem?,
    proofDraft: ProofDraftState,
    feedbackItems: List<FeedbackItem>,
    feedbackDraft: com.collective.app.ui.feedback.FeedbackDraftState,
    onNavigateToDiscover: () -> Unit,
    onNavigateToActivity: () -> Unit,
) {
    val sheet = uiState.activeSheet ?: return
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(
        onDismissRequest = {
            if (sheet == HomeSheet.SubmitProof) {
                proofViewModel.onResetDraft()
            }
            viewModel.onDismissSheet()
        },
        sheetState = sheetState,
        containerColor = CollectiveHomeTokens.CollectiveCream,
        dragHandle = { SheetHandle() },
    ) {
        when (sheet) {
            HomeSheet.Notifications -> NotificationsSheet(
                unreadFeedback = feedbackItems.filter { it.status == com.collective.app.ui.feedback.FeedbackStatus.New },
                proofTitleFor = { proofId -> proofItems.firstOrNull { it.id == proofId }?.title },
                onViewFeedback = { proofId ->
                    val proof = proofItems.firstOrNull { it.id == proofId }
                    if (proof != null) {
                        proofViewModel.onProofSelected(proof)
                        feedbackViewModel.onMarkAllForProofRead(proof.id)
                        viewModel.onRecentProofClicked()
                    } else {
                        viewModel.onDismissSheet()
                        onNavigateToActivity()
                    }
                },
            )
            HomeSheet.FocusDetail -> FocusDetailSheet(
                focus = uiState.focus,
                trustSnapshot = uiState.trustSnapshot,
                selectedDirectionState = selectedDirectionState,
                onCompleteStep = { dirId, stepId ->
                    practiceViewModel.onCompleteStep(dirId, stepId)
                },
                onSubmitProofStep = viewModel::onAddProofFromPracticeClicked,
                onContinue = viewModel::onContinuePracticeClicked,
                onDismiss = viewModel::onDismissSheet,
            )
            HomeSheet.Practice -> PracticeSheet(
                practice = uiState.practice,
                state = uiState.practiceSheetState,
                onStartPractice = viewModel::onStartPractice,
                onCompletePractice = {
                    viewModel.onCompletePractice()
                    // Also advance the active step in PracticeRepository.
                    // PracticeViewModel.onCompleteStep guards against double increments.
                    val sds = selectedDirectionState
                    sds?.activeStep?.let { step ->
                        practiceViewModel.onCompleteStep(sds.direction.id, step.id)
                    }
                },
                onAddProof = viewModel::onAddProofFromPracticeClicked,
            )
            HomeSheet.ProofDetail -> {
                val proof = selectedProof ?: proofItems.firstOrNull()
                ProofDetailSheet(
                    proof = proof,
                    feedback = proof?.let { p -> feedbackItems.filter { it.proofId == p.id } } ?: emptyList(),
                    onUseFeedback = feedbackViewModel::onUseFeedback,
                    onAddFeedback = { proofId ->
                        feedbackViewModel.onStartFeedbackForProof(proofId)
                        viewModel.onAddFeedbackClicked()
                    },
                    onClose = {
                        proofViewModel.onClearSelectedProof()
                        viewModel.onDismissSheet()
                    },
                )
            }
            HomeSheet.AddFeedback -> SheetContainer {
                AddFeedbackSheetContent(
                    draft = feedbackDraft,
                    onBodyChanged = feedbackViewModel::onFeedbackBodyChanged,
                    onToneSelected = feedbackViewModel::onFeedbackToneSelected,
                    onSave = feedbackViewModel::onSubmitFeedback,
                    onDone = {
                        feedbackViewModel.onDismissSuccess()
                        viewModel.onRecentProofClicked()
                    },
                )
            }
            HomeSheet.SubmitProof -> SubmitProofSheet(
                draft = proofDraft,
                onTypeSelected = proofViewModel::onProofTypeSelected,
                onBodyChanged = proofViewModel::onBodyChanged,
                onMediaPicked = proofViewModel::onMediaPicked,
                onRemoveAttachment = proofViewModel::onRemoveAttachment,
                onSubmit = { proofViewModel.onSubmitProof() },
                onDone = {
                    proofViewModel.onDismissSuccess()
                    viewModel.onDismissSheet()
                },
            )
            HomeSheet.AllProof -> AllProofSheet(
                proofItems = proofItems,
                onProofSelected = {
                    proofViewModel.onProofSelected(it)
                    viewModel.onRecentProofClicked()
                },
                onOpenDiscover = onNavigateToDiscover,
            )
        }
        Spacer(Modifier.height(28.dp))
    }
}

@Composable
private fun SheetHandle() {
    Box(
        modifier = Modifier
            .padding(top = 10.dp, bottom = 10.dp)
            .size(width = 42.dp, height = 5.dp)
            .clip(CircleShape)
            .background(CollectiveHomeTokens.CollectiveLine),
    )
}

@Composable
private fun SheetContainer(content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(max = 620.dp)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        content = content,
    )
}

@Composable
private fun NotificationsSheet(
    unreadFeedback: List<FeedbackItem>,
    proofTitleFor: (String) -> String?,
    onViewFeedback: (String) -> Unit,
) {
    SheetContainer {
        if (unreadFeedback.isEmpty()) {
            SheetTitle("No new feedback", "Feedback can come next.")
            SheetCard {
                Text("Feedback helps you improve. It does not define you.", color = CollectiveHomeTokens.CollectiveMuted, fontSize = 15.sp, lineHeight = 20.sp)
            }
        } else {
            val count = unreadFeedback.size
            SheetTitle(
                if (count == 1) "1 new feedback note" else "$count new feedback notes",
                "New feedback on your recent proof.",
            )
            unreadFeedback.take(5).forEach { feedback ->
                SheetCard {
                    proofTitleFor(feedback.proofId)?.let {
                        Text(it, color = CollectiveHomeTokens.CollectiveText, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    Text(feedback.body, color = CollectiveHomeTokens.CollectiveMuted, fontSize = 14.sp, lineHeight = 19.sp)
                }
            }
            GoldSheetButton("View feedback", onClick = { onViewFeedback(unreadFeedback.first().proofId) })
        }
    }
}

@Composable
private fun FocusDetailSheet(
    focus: FocusState,
    trustSnapshot: TrustSnapshotState,
    selectedDirectionState: SelectedDirectionState?,
    onCompleteStep: (directionId: String, stepId: String) -> Unit,
    onSubmitProofStep: () -> Unit,
    onContinue: () -> Unit,
    onDismiss: () -> Unit,
) {
    SheetContainer {
        SheetTitle(focus.title, "Choose a direction. Practice one small step.")
        SheetCard {
            Text(
                "${focus.completedPractices} of ${focus.totalPractices} steps completed",
                color = CollectiveHomeTokens.CollectiveText,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(10.dp))
            ProgressBar(progress = focus.progress)
        }

        when {
            selectedDirectionState?.isComplete == true -> {
                PathCompleteState(
                    direction = selectedDirectionState.direction,
                    onDone = onDismiss,
                )
            }
            selectedDirectionState != null -> {
                // Live interactive checklist driven by PracticeRepository
                PracticePathChecklist(
                    selectedDirectionState = selectedDirectionState,
                    onCompleteStep = onCompleteStep,
                    onSubmitProofStep = onSubmitProofStep,
                )
                GoldSheetButton("Continue", onClick = onContinue)
            }
            else -> {
                // Fallback static checklist (no direction selected)
                focus.practices.forEachIndexed { index, practice ->
                    PracticeChecklistRow(
                        index = index + 1,
                        text = practice,
                        completed = index < focus.completedPractices,
                    )
                }
                GoldSheetButton("Continue", onClick = onContinue)
            }
        }

        SheetCard {
            Text(
                "Trust snapshot",
                color = CollectiveHomeTokens.CollectiveText,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                "${trustSnapshot.practicesCompleted} practices, ${trustSnapshot.proofsSubmitted} proofs, ${trustSnapshot.helpfulFeedbackGiven} helpful feedback notes",
                color = CollectiveHomeTokens.CollectiveMuted,
                fontSize = 14.sp,
                lineHeight = 19.sp,
            )
            Text(trustSnapshot.trustLevelLabel, color = CollectiveHomeTokens.CollectiveGold, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun PracticeChecklistRow(index: Int, text: String, completed: Boolean) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(CircleShape)
                .background(if (completed) CollectiveHomeTokens.CollectiveGoldBright else CollectiveHomeTokens.CollectiveCard)
                .border(1.dp, CollectiveHomeTokens.CollectiveLine, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text(if (completed) "✓" else index.toString(), color = if (completed) Color.White else CollectiveHomeTokens.CollectiveMuted, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
        Text(text, color = CollectiveHomeTokens.CollectiveText, fontSize = 15.sp, lineHeight = 20.sp, modifier = Modifier.weight(1f))
    }
}

@Composable
private fun PracticeSheet(
    practice: PracticeState,
    state: PracticeSheetState,
    onStartPractice: () -> Unit,
    onCompletePractice: () -> Unit,
    onAddProof: () -> Unit,
) {
    SheetContainer {
        SheetTitle(practice.title.replace("\n", " "), practice.prompt)
        SheetCard {
            Text(practice.durationSeconds.asTimerText(), color = CollectiveHomeTokens.CollectiveText, fontSize = 34.sp, lineHeight = 38.sp, fontWeight = FontWeight.Bold, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
            Text("Mock timer for the MVP. Real recording can come later.", color = CollectiveHomeTokens.CollectiveMuted, fontSize = 14.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
        }
        AnimatedVisibility(visible = state == PracticeSheetState.Logged, enter = fadeIn(), exit = fadeOut()) {
            SheetCard(color = Color(0xFFFFF0C5)) {
                Text("Practice logged. Small steps count.", color = CollectiveHomeTokens.CollectiveText, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                Text("You can add proof while the moment is still fresh.", color = CollectiveHomeTokens.CollectiveMuted, fontSize = 14.sp, lineHeight = 19.sp)
            }
        }
        if (state == PracticeSheetState.Logged) {
            GoldSheetButton("Add proof", onClick = onAddProof)
        } else {
            GoldSheetButton(if (state == PracticeSheetState.Started) "Practice started" else "Start practice", onClick = onStartPractice)
            QuietSheetButton("I did this already", onClick = onCompletePractice)
        }
    }
}

@Composable
private fun ProofDetailSheet(
    proof: ProofItem?,
    feedback: List<FeedbackItem>,
    onUseFeedback: (String) -> Unit,
    onAddFeedback: (String) -> Unit,
    onClose: () -> Unit,
) {
    if (proof == null) {
        SheetContainer {
            SheetTitle("No proof yet", "Submit one small proof when you are ready.")
            QuietSheetButton("Close", onClick = onClose)
        }
        return
    }
    ProofDetailSheetContent(
        proof = proof,
        feedback = feedback,
        onUseFeedback = onUseFeedback,
        onAddFeedback = onAddFeedback,
        onClose = onClose,
    )
}

@Composable
private fun SubmitProofSheet(
    draft: ProofDraftState,
    onTypeSelected: (ProofMediaType) -> Unit,
    onBodyChanged: (String) -> Unit,
    onMediaPicked: (android.net.Uri, String?, String?) -> Unit,
    onRemoveAttachment: () -> Unit,
    onSubmit: () -> Unit,
    onDone: () -> Unit,
) {
    SubmitProofSheetContent(
        draft = draft,
        onTypeSelected = onTypeSelected,
        onBodyChanged = onBodyChanged,
        onMediaPicked = onMediaPicked,
        onRemoveAttachment = onRemoveAttachment,
        onSubmit = onSubmit,
        onDone = onDone,
    )
}

@Composable
private fun ProofTypeChip(
    label: String,
    type: ProofMediaType,
    selectedType: ProofMediaType,
    onSelected: (ProofMediaType) -> Unit,
    modifier: Modifier = Modifier,
) {
    val selected = type == selectedType
    Box(
        modifier = modifier
            .height(44.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(if (selected) CollectiveHomeTokens.CollectiveGoldBright else CollectiveHomeTokens.CollectiveCard)
            .border(1.dp, if (selected) Color.Transparent else CollectiveHomeTokens.CollectiveLine, RoundedCornerShape(14.dp))
            .clickable { onSelected(type) }
            .padding(horizontal = 8.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(label, color = if (selected) Color.White else CollectiveHomeTokens.CollectiveText, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
    }
}

@Composable
private fun AllProofSheet(
    proofItems: List<ProofItem>,
    onProofSelected: (ProofItem) -> Unit,
    onOpenDiscover: () -> Unit,
) {
    SheetContainer {
        SheetTitle("All proof", "A simple local list for this MVP loop.")
        if (proofItems.isEmpty()) {
            SheetCard {
                Text("No proof yet", color = CollectiveHomeTokens.CollectiveText, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                Text("Submit one small proof when you are ready.", color = CollectiveHomeTokens.CollectiveMuted, fontSize = 14.sp, lineHeight = 19.sp)
            }
        } else {
            proofItems.forEach { proof ->
                ProofSummaryCard(
                    proof = proof,
                    onClick = { onProofSelected(proof) },
                )
            }
        }
        QuietSheetButton("Explore practice", onClick = onOpenDiscover)
    }
}

@Composable
private fun SheetTitle(title: String, subtitle: String) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(title, color = CollectiveHomeTokens.CollectiveText, fontSize = 22.sp, lineHeight = 26.sp, fontWeight = FontWeight.Bold)
        Text(subtitle, color = CollectiveHomeTokens.CollectiveMuted, fontSize = 15.sp, lineHeight = 20.sp)
    }
}

@Composable
private fun SheetCard(
    modifier: Modifier = Modifier,
    color: Color = CollectiveHomeTokens.CollectiveCard,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(color)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
        content = content,
    )
}

@Composable
private fun GoldSheetButton(label: String, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(CollectiveHomeTokens.CollectiveGoldBright)
            .semantics {
                contentDescription = label
                role = Role.Button
            }
            .clickable { onClick() },
        contentAlignment = Alignment.Center,
    ) {
        Text(label, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun QuietSheetButton(label: String, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(50.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(CollectiveHomeTokens.CollectiveCard)
            .border(1.dp, CollectiveHomeTokens.CollectiveLine, RoundedCornerShape(18.dp))
            .semantics {
                contentDescription = label
                role = Role.Button
            }
            .clickable { onClick() },
        contentAlignment = Alignment.Center,
    ) {
        Text(label, color = CollectiveHomeTokens.CollectiveText, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
fun CollectiveBottomNav(
    currentRoute: String,
    onNavigate: (String) -> Unit,
    onCreate: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val bottomInset = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()
    val selected = CollectiveHomeTokens.CollectiveGold
    val muted = CollectiveHomeTokens.CollectiveMuted
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(82.dp + bottomInset)
            .background(CollectiveHomeTokens.CollectiveCream)
            .navigationBarsPadding(),
    ) {
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .height(76.dp)
                .padding(horizontal = 28.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            BottomNavItem(
                label = "Home",
                selected = currentRoute == Routes.BetaHome,
                selectedColor = selected,
                mutedColor = muted,
                icon = { color -> HomeNavIcon(Modifier.size(24.dp), color) },
                onClick = { onNavigate(Routes.BetaHome) },
            )
            BottomNavItem(
                label = "Discover",
                selected = currentRoute == Routes.BetaDiscover || currentRoute == Routes.BetaPractice,
                selectedColor = selected,
                mutedColor = muted,
                icon = { color -> SearchNavIcon(Modifier.size(24.dp), color) },
                onClick = { onNavigate(Routes.BetaDiscover) },
            )
            Spacer(Modifier.width(58.dp))
            BottomNavItem(
                label = "Feedback",
                selected = currentRoute == Routes.BetaFeed || currentRoute.startsWith("beta/peerFeedback"),
                selectedColor = selected,
                mutedColor = muted,
                icon = { color -> ActivityNavIcon(Modifier.size(24.dp), color) },
                onClick = { onNavigate(Routes.BetaFeed) },
            )
            BottomNavItem(
                label = "Profile",
                selected = currentRoute == Routes.BetaProfile,
                selectedColor = selected,
                mutedColor = muted,
                icon = { color -> ProfileNavIcon(Modifier.size(24.dp), color) },
                onClick = { onNavigate(Routes.BetaProfile) },
            )
        }
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .offset(y = (-2).dp)
                .size(58.dp)
                .shadow(9.dp, CircleShape, ambientColor = CollectiveHomeTokens.CollectiveSoftShadow, spotColor = CollectiveHomeTokens.CollectiveSoftShadow)
                .clip(CircleShape)
                .background(CollectiveHomeTokens.CollectiveGoldBright)
                .semantics {
                    contentDescription = "Submit proof"
                    role = Role.Button
                }
                .clickable { onCreate() },
            contentAlignment = Alignment.Center,
        ) {
            PlusIcon(Modifier.size(28.dp), Color.White)
        }
    }
}

@Composable
private fun BottomNavItem(
    label: String,
    selected: Boolean,
    selectedColor: Color,
    mutedColor: Color,
    icon: @Composable (Color) -> Unit,
    onClick: () -> Unit,
) {
    val color = if (selected) selectedColor else mutedColor
    Column(
        modifier = Modifier
            .width(58.dp)
            .height(58.dp)
            .clip(RoundedCornerShape(16.dp))
            .semantics {
                contentDescription = label
                role = Role.Button
            }
            .clickable { onClick() }
            .padding(top = 6.dp, bottom = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        icon(color)
        Text(label, color = color, fontSize = 11.sp, lineHeight = 12.sp, fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal, maxLines = 1)
    }
}

@Composable
private fun BellIcon(modifier: Modifier, color: Color) {
    Canvas(modifier) {
        val stroke = Stroke(width = 1.9.dp.toPx(), cap = StrokeCap.Round)
        val path = Path().apply {
            moveTo(size.width * 0.30f, size.height * 0.60f)
            cubicTo(size.width * 0.31f, size.height * 0.35f, size.width * 0.38f, size.height * 0.22f, size.width * 0.50f, size.height * 0.22f)
            cubicTo(size.width * 0.62f, size.height * 0.22f, size.width * 0.69f, size.height * 0.35f, size.width * 0.70f, size.height * 0.60f)
            lineTo(size.width * 0.80f, size.height * 0.76f)
            lineTo(size.width * 0.20f, size.height * 0.76f)
            close()
        }
        drawPath(path, color, style = stroke)
        drawLine(color, Offset(size.width * 0.44f, size.height * 0.87f), Offset(size.width * 0.56f, size.height * 0.87f), strokeWidth = 1.8.dp.toPx(), cap = StrokeCap.Round)
        drawLine(color, Offset(size.width * 0.50f, size.height * 0.16f), Offset(size.width * 0.50f, size.height * 0.22f), strokeWidth = 1.7.dp.toPx(), cap = StrokeCap.Round)
    }
}

@Composable
private fun ArrowRightIcon(modifier: Modifier, color: Color) {
    Canvas(modifier) {
        val strokeWidth = 2.3.dp.toPx()
        drawLine(color, Offset(size.width * 0.20f, size.height * 0.50f), Offset(size.width * 0.76f, size.height * 0.50f), strokeWidth = strokeWidth, cap = StrokeCap.Round)
        drawLine(color, Offset(size.width * 0.55f, size.height * 0.28f), Offset(size.width * 0.78f, size.height * 0.50f), strokeWidth = strokeWidth, cap = StrokeCap.Round)
        drawLine(color, Offset(size.width * 0.55f, size.height * 0.72f), Offset(size.width * 0.78f, size.height * 0.50f), strokeWidth = strokeWidth, cap = StrokeCap.Round)
    }
}

@Composable
private fun PlayIcon(modifier: Modifier, color: Color) {
    Canvas(modifier) {
        val path = Path().apply {
            moveTo(size.width * 0.30f, size.height * 0.18f)
            lineTo(size.width * 0.78f, size.height * 0.50f)
            lineTo(size.width * 0.30f, size.height * 0.82f)
            close()
        }
        drawPath(path, color)
    }
}

@Composable
private fun MicIcon(modifier: Modifier, color: Color) {
    Canvas(modifier) {
        val stroke = Stroke(width = 2.1.dp.toPx(), cap = StrokeCap.Round)
        drawRoundRect(
            color = color,
            topLeft = Offset(size.width * 0.36f, size.height * 0.12f),
            size = Size(size.width * 0.28f, size.height * 0.48f),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(12.dp.toPx(), 12.dp.toPx()),
            style = stroke,
        )
        drawArc(
            color = color,
            startAngle = 25f,
            sweepAngle = 130f,
            useCenter = false,
            topLeft = Offset(size.width * 0.22f, size.height * 0.38f),
            size = Size(size.width * 0.56f, size.height * 0.38f),
            style = stroke,
        )
        drawLine(color, Offset(size.width * 0.50f, size.height * 0.76f), Offset(size.width * 0.50f, size.height * 0.90f), strokeWidth = stroke.width, cap = StrokeCap.Round)
        drawLine(color, Offset(size.width * 0.34f, size.height * 0.90f), Offset(size.width * 0.66f, size.height * 0.90f), strokeWidth = stroke.width, cap = StrokeCap.Round)
    }
}

@Composable
private fun HomeNavIcon(modifier: Modifier, color: Color) {
    Canvas(modifier) {
        val stroke = Stroke(width = 1.8.dp.toPx(), cap = StrokeCap.Round)
        val path = Path().apply {
            moveTo(size.width * 0.18f, size.height * 0.50f)
            lineTo(size.width * 0.50f, size.height * 0.22f)
            lineTo(size.width * 0.82f, size.height * 0.50f)
            lineTo(size.width * 0.76f, size.height * 0.84f)
            lineTo(size.width * 0.58f, size.height * 0.84f)
            lineTo(size.width * 0.58f, size.height * 0.62f)
            lineTo(size.width * 0.42f, size.height * 0.62f)
            lineTo(size.width * 0.42f, size.height * 0.84f)
            lineTo(size.width * 0.24f, size.height * 0.84f)
            close()
        }
        drawPath(path, color, style = stroke)
    }
}

@Composable
private fun SearchNavIcon(modifier: Modifier, color: Color) {
    Canvas(modifier) {
        val stroke = Stroke(width = 1.8.dp.toPx(), cap = StrokeCap.Round)
        drawCircle(color, radius = size.width * 0.28f, center = Offset(size.width * 0.43f, size.height * 0.42f), style = stroke)
        drawLine(color, Offset(size.width * 0.63f, size.height * 0.63f), Offset(size.width * 0.82f, size.height * 0.82f), strokeWidth = stroke.width, cap = StrokeCap.Round)
    }
}

@Composable
private fun ActivityNavIcon(modifier: Modifier, color: Color) {
    Canvas(modifier) {
        val stroke = Stroke(width = 1.7.dp.toPx(), cap = StrokeCap.Round)
        drawRoundRect(
            color = color,
            topLeft = Offset(size.width * 0.16f, size.height * 0.22f),
            size = Size(size.width * 0.30f, size.height * 0.55f),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(3.dp.toPx(), 3.dp.toPx()),
            style = stroke,
        )
        drawRoundRect(
            color = color,
            topLeft = Offset(size.width * 0.54f, size.height * 0.22f),
            size = Size(size.width * 0.30f, size.height * 0.55f),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(3.dp.toPx(), 3.dp.toPx()),
            style = stroke,
        )
        drawLine(color, Offset(size.width * 0.46f, size.height * 0.24f), Offset(size.width * 0.54f, size.height * 0.22f), strokeWidth = stroke.width, cap = StrokeCap.Round)
        drawLine(color, Offset(size.width * 0.46f, size.height * 0.77f), Offset(size.width * 0.54f, size.height * 0.77f), strokeWidth = stroke.width, cap = StrokeCap.Round)
        drawLine(color, Offset(size.width * 0.24f, size.height * 0.44f), Offset(size.width * 0.38f, size.height * 0.38f), strokeWidth = 1.dp.toPx(), cap = StrokeCap.Round)
        drawLine(color, Offset(size.width * 0.62f, size.height * 0.40f), Offset(size.width * 0.76f, size.height * 0.48f), strokeWidth = 1.dp.toPx(), cap = StrokeCap.Round)
    }
}

@Composable
private fun ProfileNavIcon(modifier: Modifier, color: Color) {
    Canvas(modifier) {
        val stroke = Stroke(width = 1.8.dp.toPx(), cap = StrokeCap.Round)
        drawCircle(color, radius = size.width * 0.18f, center = Offset(size.width * 0.50f, size.height * 0.34f), style = stroke)
        drawArc(
            color = color,
            startAngle = 205f,
            sweepAngle = 130f,
            useCenter = false,
            topLeft = Offset(size.width * 0.22f, size.height * 0.48f),
            size = Size(size.width * 0.56f, size.height * 0.42f),
            style = stroke,
        )
    }
}

@Composable
private fun PlusIcon(modifier: Modifier, color: Color) {
    Canvas(modifier) {
        drawLine(color, Offset(size.width * 0.50f, size.height * 0.22f), Offset(size.width * 0.50f, size.height * 0.78f), strokeWidth = 2.4.dp.toPx(), cap = StrokeCap.Round)
        drawLine(color, Offset(size.width * 0.22f, size.height * 0.50f), Offset(size.width * 0.78f, size.height * 0.50f), strokeWidth = 2.4.dp.toPx(), cap = StrokeCap.Round)
    }
}

private fun Int.asTimerText(): String = "${this / 60}:${(this % 60).toString().padStart(2, '0')}"

private fun ProofItem.toHomeSummary(
    feedbackCount: Int,
    feedbackInitials: List<String>,
): ProofSummaryState =
    ProofSummaryState(
        id = id,
        title = title,
        feedbackCount = feedbackCount,
        supporterInitials = feedbackInitials,
        mediaType = mediaType,
    )

@Preview(name = "Collective Home 390x844", widthDp = 390, heightDp = 844, showBackground = true)
@Composable
private fun CollectiveHomeScreenPreview() {
    CollectiveTheme {
        HomePreviewScaffold(CollectivePreviewData.homeUiState)
    }
}

@Preview(name = "Collective Home Compact 360x780", widthDp = 360, heightDp = 780, showBackground = true)
@Composable
private fun CollectiveHomeScreenCompactPreview() {
    CollectiveTheme {
        HomePreviewScaffold(CollectivePreviewData.homeUiState)
    }
}

@Preview(name = "Collective Home 412x892", widthDp = 412, heightDp = 892, showBackground = true)
@Composable
private fun CollectiveHomeScreenLargePreview() {
    CollectiveTheme {
        HomePreviewScaffold(CollectivePreviewData.homeUiState)
    }
}

@Composable
private fun HomePreviewScaffold(state: HomeUiState) {
    var currentRoute by remember { mutableStateOf(Routes.Home) }
    Scaffold(
        containerColor = CollectiveHomeTokens.CollectiveCream,
        bottomBar = {
            CollectiveBottomNav(
                currentRoute = currentRoute,
                onNavigate = { currentRoute = it },
                onCreate = {},
            )
        },
    ) { innerPadding ->
        CollectiveHomeContent(
            uiState = state,
            latestProof = null,
            onNotificationsClicked = {},
            onTodayFocusClicked = {},
            onContinuePracticeClicked = {},
            onRecentProofClicked = {},
            onSeeAllProofClicked = {},
            modifier = Modifier.padding(innerPadding),
        )
    }
}
