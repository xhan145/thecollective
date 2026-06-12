package com.collective.app.ui

import com.collective.app.ui.theme.CollectiveTokens
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.collective.app.ai.CollectiveAiCore
import com.collective.app.ai.model.AiAssistResponse
import com.collective.app.ai.model.AiAssistKind
import com.collective.app.ai.model.AiContext
import com.collective.app.ai.model.AiReasoningTrace
import com.collective.app.ai.model.AiRiskLevel
import com.collective.app.ai.model.AiSignal
import com.collective.app.ai.model.FeedbackDraftRequest
import com.collective.app.ai.model.PracticeAssistRequest
import com.collective.app.ai.model.ProfileReviewRequest
import com.collective.app.ai.model.ProgressSummaryRequest
import com.collective.app.ai.model.ReflectionAssistRequest
import com.collective.app.ai.model.SafetyReviewRequest
import com.collective.app.ai.dataset.SeedDataset
import com.collective.app.ai.visualization.LocalNeuralTraceView
import com.collective.app.beta.ui.BetaSession
import com.collective.app.beta.ui.appfeedback.AppFeedbackScreen
import com.collective.app.beta.ui.appfeedback.AppFeedbackViewModel
import com.collective.app.beta.ui.appfeedback.BetaFeedbackReviewScreen
import com.collective.app.beta.ui.appfeedback.BetaFeedbackReviewViewModel
import com.collective.app.beta.ui.dev.BetaUserSwitcherScreen
import com.collective.app.beta.ui.discover.BetaDiscoverScreen
import com.collective.app.beta.ui.discover.BetaDiscoverViewModel
import com.collective.app.beta.ui.feed.BetaFeedScreen
import com.collective.app.beta.ui.feed.BetaFeedViewModel
import com.collective.app.beta.ui.feedback.BetaPeerFeedbackScreen
import com.collective.app.beta.ui.feedback.BetaPeerFeedbackViewModel
import com.collective.app.beta.ui.home.BetaHomeScreen
import com.collective.app.beta.ui.home.BetaHomeViewModel
import com.collective.app.beta.ui.practice.BetaPracticeScreen
import com.collective.app.beta.ui.practice.BetaPracticeViewModel
import com.collective.app.beta.ui.proof.BetaProofCaptureScreen
import com.collective.app.beta.ui.proof.BetaProofViewModel
import com.collective.app.beta.ui.trust.BetaProfileScreen
import com.collective.app.beta.ui.trust.BetaTrustViewModel
import com.collective.app.core.result.AppResult
import com.collective.app.core.result.getOrNull
import com.collective.app.data.MediaType
import com.collective.app.data.MockData
import com.collective.app.data.local.entity.ActivityEntity
import com.collective.app.data.model.FeedbackDraft
import com.collective.app.data.model.FeedbackKind
import com.collective.app.data.model.MediaKind
import com.collective.app.data.model.ProofDraft
import com.collective.app.data.model.ProofMediaRecord
import com.collective.app.data.model.ProofVisibility
import com.collective.app.data.repository.ProofMediaInput
import com.collective.app.data.repository.RepositoryProvider
import com.collective.app.domain.usecase.CompletePracticeUseCase
import com.collective.app.media.MediaValidationResult
import com.collective.app.media.MediaValidator
import com.collective.app.media.SelectedMedia
import com.collective.app.ui.components.ActivityRow
import com.collective.app.ui.components.Avatar
import com.collective.app.ui.components.CategoryChip
import com.collective.app.ui.components.CircleIconButton
import com.collective.app.ui.components.CollectiveTopBar
import com.collective.app.ui.components.ContributionCard
import com.collective.app.ui.components.ContributorCard
import com.collective.app.ui.components.EmptyStateCard
import com.collective.app.ui.components.FeedCard
import com.collective.app.ui.components.FeedbackCard
import com.collective.app.ui.components.FeedbackRow
import com.collective.app.ui.components.HeroImagePlaceholder
import com.collective.app.ui.components.LabelPill
import com.collective.app.ui.components.LabSpaceCard
import com.collective.app.ui.components.MilestoneRow
import com.collective.app.ui.components.PathHeroCard
import com.collective.app.ui.components.PathProgressRow
import com.collective.app.ui.components.PlanOptionCard
import com.collective.app.ui.components.PracticeCard
import com.collective.app.ui.components.PracticeTypeSelector
import com.collective.app.ui.components.PrimaryPillButton
import com.collective.app.ui.components.ProfileStatCard
import com.collective.app.ui.components.ProgressOverviewCard
import com.collective.app.ui.components.ProofCard
import com.collective.app.ui.components.ProofSummaryCard
import com.collective.app.ui.components.SectionTitle
import com.collective.app.ui.components.SecondaryPillButton
import com.collective.app.ui.components.SoftCard
import com.collective.app.ui.brand.CollectiveMiniMark
import com.collective.app.ui.components.StatusChip
import com.collective.app.ui.components.TrustSignalCard
import com.collective.app.ui.components.VideoPlaceholder
import com.collective.app.ui.components.VisibilitySelector
import com.collective.app.ui.components.WinRow
import com.collective.app.ui.activity.ActivityScreen as LoopActivityScreen
import com.collective.app.ui.discover.DiscoverScreen
import com.collective.app.ui.home.HomeViewModel
import com.collective.app.ui.practice.PracticeViewModel
import com.collective.app.ui.proof.ProofViewModel
import com.collective.app.ui.profile.ProfileScreen as LoopProfileScreen
import kotlinx.coroutines.launch

@Composable
fun CollectiveNavGraph(
    currentRoute: String,
    snackbarHostState: SnackbarHostState,
    homeViewModel: HomeViewModel,
    proofViewModel: ProofViewModel,
    feedbackViewModel: com.collective.app.ui.feedback.FeedbackViewModel,
    practiceViewModel: PracticeViewModel,
    betaSession: BetaSession,
    modifier: Modifier = Modifier,
    navigate: (String) -> Unit,
) {
    val homeUiState by homeViewModel.uiState.collectAsState()

    // Closed-beta loop ViewModels — plain classes created once, keyed on the stable session.
    val betaHomeVm = remember(betaSession) { BetaHomeViewModel(betaSession) }
    val betaDiscoverVm = remember(betaSession) { BetaDiscoverViewModel(betaSession) }
    val betaPracticeVm = remember(betaSession) { BetaPracticeViewModel(betaSession) }
    val betaProofVm = remember(betaSession) { BetaProofViewModel(betaSession) }
    val betaFeedVm = remember(betaSession) { BetaFeedViewModel(betaSession) }
    val betaPeerFeedbackVm = remember(betaSession) { BetaPeerFeedbackViewModel(betaSession) }
    val betaTrustVm = remember(betaSession) { BetaTrustViewModel(betaSession) }
    val appFeedbackVm = remember(betaSession) { AppFeedbackViewModel(betaSession) }
    val betaReviewVm = remember(betaSession) { BetaFeedbackReviewViewModel(betaSession) }

    Box(modifier = modifier) {
        when {
            // ----- Closed-beta social loop (exact matches + beta/ prefixes win before legacy) -----
            currentRoute == Routes.BetaHome -> BetaHomeScreen(
                viewModel = betaHomeVm,
                onPracticeNow = { navigate(Routes.BetaPractice) },
                onGiveFeedback = { navigate(Routes.BetaFeed) },
                onOpenAppFeedback = { navigate(Routes.BetaAppFeedback) },
                onChangeDirection = { navigate(Routes.BetaDiscover) },
                onSwitchUser = { navigate(Routes.BetaUserSwitcher) },
            )
            currentRoute == Routes.BetaDiscover -> BetaDiscoverScreen(
                viewModel = betaDiscoverVm,
                onBack = { navigate(Routes.BetaHome) },
                onChosen = { navigate(Routes.BetaPractice) },
            )
            currentRoute == Routes.BetaPractice -> BetaPracticeScreen(
                viewModel = betaPracticeVm,
                onStartProof = { prompt ->
                    betaProofVm.startForPrompt(prompt)
                    navigate(Routes.BetaProofCapture)
                },
                onChangeDirection = { navigate(Routes.BetaDiscover) },
            )
            currentRoute == Routes.BetaProofCapture -> BetaProofCaptureScreen(
                viewModel = betaProofVm,
                onSubmitted = { navigate(Routes.BetaFeed) },
                onBack = { navigate(Routes.BetaHome) },
            )
            currentRoute == Routes.BetaFeed -> BetaFeedScreen(
                viewModel = betaFeedVm,
                onOpenProof = { proofId -> navigate(Routes.betaPeerFeedback(proofId)) },
            )
            currentRoute.startsWith("beta/peerFeedback") -> BetaPeerFeedbackScreen(
                viewModel = betaPeerFeedbackVm,
                proofId = currentRoute.substringAfterLast('/'),
                onBack = { navigate(Routes.BetaFeed) },
                onDone = { navigate(Routes.BetaFeed) },
            )
            currentRoute == Routes.BetaProfile -> BetaProfileScreen(
                viewModel = betaTrustVm,
                onGiveAppFeedback = { navigate(Routes.BetaAppFeedback) },
                onOpenReview = { navigate(Routes.BetaFeedbackReview) },
                onSwitchUser = { navigate(Routes.BetaUserSwitcher) },
            )
            currentRoute == Routes.BetaAppFeedback -> AppFeedbackScreen(
                viewModel = appFeedbackVm,
                onBack = { navigate(Routes.BetaHome) },
                onDone = { navigate(Routes.BetaHome) },
            )
            currentRoute == Routes.BetaFeedbackReview -> BetaFeedbackReviewScreen(
                viewModel = betaReviewVm,
                onBack = { navigate(Routes.BetaProfile) },
            )
            currentRoute == Routes.BetaUserSwitcher -> BetaUserSwitcherScreen(
                session = betaSession,
                onDone = { navigate(Routes.BetaHome) },
            )

            currentRoute == Routes.Onboarding -> OnboardingScreen(onContinue = { navigate(Routes.Home) })
            currentRoute == Routes.Home -> CollectiveHomeScreen(
                viewModel = homeViewModel,
                proofViewModel = proofViewModel,
                feedbackViewModel = feedbackViewModel,
                practiceViewModel = practiceViewModel,
                onNavigateToDiscover = { navigate(Routes.Discover) },
                onNavigateToActivity = { navigate(Routes.Activity) },
            )
            currentRoute == Routes.Discover -> DiscoverScreen(
                practiceViewModel = practiceViewModel,
                onStartFirstPractice = { navigate(Routes.Home) },
            )
            currentRoute.startsWith("pathDetail") -> PathDetailScreen(
                onBack = { navigate(Routes.Home) },
                onStartPractice = { navigate(Routes.practice("communication")) },
            )
            currentRoute.startsWith("practice") -> PracticeScreen(
                snackbarHostState = snackbarHostState,
                onBack = { navigate(Routes.pathDetail("communication")) },
                onFinish = { navigate(Routes.proofSubmission("communication")) },
            )
            currentRoute.startsWith("proofSubmission") -> ProofSubmissionScreen(
                snackbarHostState = snackbarHostState,
                onBack = { navigate(Routes.practice("communication")) },
                onShared = { navigate(Routes.feedback("demo-proof")) },
            )
            currentRoute.startsWith("feedback") -> FeedbackScreen(snackbarHostState = snackbarHostState)
            currentRoute == Routes.Progress -> ProgressScreen()
            currentRoute == Routes.Profile -> LoopProfileScreen(
                uiState = homeUiState,
                proofViewModel = proofViewModel,
            )
            currentRoute == Routes.Activity -> LoopActivityScreen(
                proofViewModel = proofViewModel,
                feedbackViewModel = feedbackViewModel,
                onSubmitProof = homeViewModel::onSubmitProofClicked,
            )
            currentRoute == Routes.ContributionHub -> ContributionHubScreen(onFindHelp = { navigate(Routes.feedback("demo-proof")) })
            currentRoute == Routes.Mentorship -> MentorshipScreen()
            currentRoute == Routes.CouncilLabs -> CouncilLabsScreen()
            currentRoute == Routes.SponsoredAccess -> SponsoredAccessScreen()
            currentRoute == Routes.BusinessStudio -> BusinessStudioScreen()
            currentRoute == Routes.CommunityIdeas -> CommunityIdeasScreen(snackbarHostState = snackbarHostState)
            currentRoute == Routes.ContributorCouncil -> ContributorCouncilScreen()
            currentRoute == Routes.AiQualityLab -> AiQualityLabScreen()
            currentRoute == Routes.PrototypeMap -> PrototypeMapScreen(onOpen = navigate)
            else -> HomeScreen(
                onOpenPath = { navigate(Routes.pathDetail("communication")) },
                onStartPractice = { navigate(Routes.practice("communication")) },
            )
        }
    }
}

@Composable
private fun AppList(content: androidx.compose.foundation.lazy.LazyListScope.() -> Unit) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(CollectiveTokens.Cream)
            .padding(WindowInsets.safeDrawing.asPaddingValues()),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 6.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
        content = content,
    )
}

@Composable
private fun PageTitle(title: String, subtitle: String, label: String? = null) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        label?.let { StatusChip(it, color = CollectiveTokens.GoldSoft, contentColor = CollectiveTokens.GoldDeep) }
        Text(title, style = MaterialTheme.typography.displaySmall, color = CollectiveTokens.Text)
        Text(subtitle, style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Muted)
    }
}

@Composable
private fun OnboardingScreen(onContinue: () -> Unit) {
    var selectedGoal by remember { mutableStateOf(MockData.onboardingGoals.first()) }
    AppList {
        item { CollectiveTopBar() }
        item {
            PageTitle(
                title = "What do you want to become better at?",
                subtitle = "Choose a direction. We will help you practice, prove progress, and build trust over time.",
            )
        }
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                MockData.onboardingGoals.chunked(2).forEach { row ->
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                        row.forEach { goal ->
                            SelectableGoal(goal = goal, selected = selectedGoal == goal, modifier = Modifier.weight(1f)) {
                                selectedGoal = goal
                            }
                        }
                        if (row.size == 1) Box(modifier = Modifier.weight(1f))
                    }
                }
            }
        }
        item {
            PracticeCard(
                title = "Start with one path",
                body = "Today's action: choose a small direction and take one honest rep.",
                action = "Continue",
                onClick = onContinue,
            )
        }
        item { TrustSignalsRow() }
    }
}

@Composable
private fun SelectableGoal(goal: String, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    Surface(
        modifier = modifier.height(86.dp).clickable { onClick() },
        shape = RoundedCornerShape(22.dp),
        color = if (selected) CollectiveTokens.GoldSoft else Color.White,
        border = androidx.compose.foundation.BorderStroke(1.dp, if (selected) CollectiveTokens.Gold else CollectiveTokens.Line),
    ) {
        Box(modifier = Modifier.padding(14.dp), contentAlignment = Alignment.CenterStart) {
            Text(goal, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text)
        }
    }
}

@Composable
private fun HomeScreen(onOpenPath: () -> Unit, onStartPractice: () -> Unit) {
    var selectedCategory by remember { mutableStateOf("For You") }
    val localProofs = RepositoryProvider.proofRepository.listProofs().getOrNull().orEmpty()
    AppList {
        item { CollectiveTopBar() }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp), contentPadding = PaddingValues(horizontal = 2.dp)) {
                items(MockData.categories) { category ->
                    CategoryChip(
                        label = category,
                        selected = selectedCategory == category,
                        onClick = {
                            selectedCategory = category
                            if (category == "Communication") onOpenPath()
                        },
                    )
                }
            }
        }
        item {
            PracticeCard(
                title = "Today's action",
                body = "Practice one small communication rep.",
                action = "Start Practice",
                onClick = onStartPractice,
            )
        }
        item { TrustSignalsRow() }
        if (localProofs.isNotEmpty()) {
            item {
                SoftCard(color = CollectiveTokens.GoldSoft, radius = 24.dp) {
                    SectionTitle("Saved on this device")
                    Text("${localProofs.size} local proof${if (localProofs.size == 1) "" else "s"} in your offline loop", style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Text)
                    Text(localProofs.first().reflectionText, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
                }
            }
        }
        items(MockData.feedPosts, key = { it.id }) { post ->
            FeedCard(post = post, onTryThis = onStartPractice)
        }
    }
}

@Composable
private fun TrustSignalsRow() {
    LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp), contentPadding = PaddingValues(end = 20.dp)) {
        items(MockData.trustSignals) { signal ->
            TrustSignalCard(signal = signal, modifier = Modifier.width(190.dp))
        }
    }
}

@Composable
private fun PathDetailScreen(onBack: () -> Unit, onStartPractice: () -> Unit) {
    val path = MockData.communicationPath
    AppList {
        item {
            CollectiveTopBar(
                title = "Communication",
                showLogo = false,
                showBack = true,
                onBack = onBack,
                trailing = {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                        CollectiveMiniMark(size = 34.dp, contentDescription = "Collective")
                        CircleIconButton("Save", onClick = {}, size = 40.dp)
                    }
                },
            )
        }
        item { PathHeroCard(path) }
        item { PrimaryPillButton("Start Practice", modifier = Modifier.fillMaxWidth(), onClick = onStartPractice) }
        item { SectionTitle("Milestones", "5 steps") }
        items(MockData.milestones) { milestone ->
            MilestoneRow(
                milestone = milestone,
                index = MockData.milestones.indexOf(milestone) + 1,
                onStart = onStartPractice,
            )
        }
        item { SectionTitle("Guidance from the Community", "See all >") }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp), contentPadding = PaddingValues(end = 20.dp)) {
                items(MockData.contributors) { ContributorCard(it) }
            }
        }
        item { SectionTitle("Proof from Others", "See all >") }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp), contentPadding = PaddingValues(end = 20.dp)) {
                items(MockData.proofs) { ProofCard(it) }
            }
        }
        item { SectionTitle("Related Practices") }
        item {
            SoftCard {
                Text("Give useful feedback in 3 parts", style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Text)
                Text("A low-pressure rep for becoming more specific, kind, and clear.", style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Muted)
            }
        }
        item { SectionTitle("Trust Signals") }
        item { TrustSignalsRow() }
    }
}

@Composable
private fun PracticeScreen(snackbarHostState: SnackbarHostState, onBack: () -> Unit, onFinish: () -> Unit) {
    val prompt = MockData.practicePrompt
    var practicing by remember { mutableStateOf(false) }
    var activeSessionId by remember { mutableStateOf<String?>(null) }
    val aiRepository = remember { CollectiveAiCore.repository }
    val practiceRepository = remember { RepositoryProvider.practiceRepository }
    val completePracticeUseCase = remember { CompletePracticeUseCase() }
    val practiceId = remember { "practice-${prompt.pathId}-feedback-3-part" }
    val practiceAssist = remember(practicing) {
        aiRepository.practiceAssist(
            PracticeAssistRequest(
                context = AiContext(
                    pathTitle = "Communication Confidence",
                    practiceTitle = prompt.prompt,
                    proofType = "Video",
                    visibility = "Path Only",
                ),
                currentInstructions = prompt.tips,
                userNeed = if (practicing) "Help me finish this clearly." else "Help me make this practice feel smaller.",
            ),
        )
    }
    val scope = rememberCoroutineScope()
    AppList {
        item { CollectiveTopBar() }
        item {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                CircleIconButton("<", onClick = onBack, size = 38.dp)
                Text("Communication Confidence", modifier = Modifier.weight(1f), style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Text)
                Text("Path Progress", style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Muted)
                LabelPill("68%", color = CollectiveTokens.GoldSoft)
            }
        }
        item {
            PageTitle(title = prompt.prompt, subtitle = prompt.description, label = prompt.label)
        }
        item { AiAssistCard(title = "Adjust this practice", response = practiceAssist) }
        item {
            SoftCard(color = CollectiveTokens.Card, radius = 26.dp) {
                SectionTitle("Practice instructions")
                prompt.tips.forEachIndexed { index, tip ->
                    Text("${index + 1}. $tip", style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Text)
                }
            }
        }
        item {
            SoftCard(color = Color.White, radius = 26.dp) {
                SectionTitle("Example")
                Text(
                    "What worked: your point was clear. One improvement: pause before the next idea. Encouragement: this is already easier to follow.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = CollectiveTokens.Muted,
                )
                VideoPlaceholder(duration = "0:30", modifier = Modifier.fillMaxWidth().height(150.dp))
            }
        }
        item {
            SoftCard(color = CollectiveTokens.GoldSoft, radius = 28.dp) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(18.dp)) {
                    Surface(shape = CircleShape, color = Color.White, modifier = Modifier.size(122.dp), border = androidx.compose.foundation.BorderStroke(5.dp, CollectiveTokens.Gold)) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                            Text(if (practicing) "0:12" else "0:00", style = MaterialTheme.typography.headlineSmall, color = CollectiveTokens.Text)
                            Text("/ 0:30", style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Muted)
                        }
                    }
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(if (practicing) "Practicing" else "Ready for one rep", style = MaterialTheme.typography.titleLarge, color = CollectiveTokens.Text)
                        Text(
                            if (activeSessionId == null) "Starting saves this practice locally."
                            else "Session saved on this device.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = CollectiveTokens.Muted,
                        )
                        PrimaryPillButton(if (practicing) "Finish Practice" else "Start Practice", modifier = Modifier.fillMaxWidth()) {
                            if (practicing) {
                                completePracticeUseCase(prompt.pathId, practiceId)
                                onFinish()
                            } else {
                                when (val result = practiceRepository.startPractice(prompt.pathId, practiceId)) {
                                    is AppResult.Success -> activeSessionId = result.data.id
                                    is AppResult.Failure -> activeSessionId = null
                                }
                                practicing = true
                                scope.launch { snackbarHostState.showSnackbar("Practice started. Keep it simple and useful.") }
                            }
                        }
                        SecondaryPillButton("View Example", modifier = Modifier.fillMaxWidth(), onClick = {})
                    }
                }
            }
        }
    }
}

@Composable
private fun ProofSubmissionScreen(snackbarHostState: SnackbarHostState, onBack: () -> Unit, onShared: () -> Unit) {
    var proofType by remember { mutableStateOf("Video") }
    var visibility by remember { mutableStateOf(RepositoryProvider.preferences?.preferredProofVisibility?.value ?: "Private") }
    var reflection by remember { mutableStateOf("") }
    var feedbackRequest by remember { mutableStateOf("") }
    var selectedMedia by remember { mutableStateOf<SelectedMedia?>(null) }
    var selectedMediaRecord by remember { mutableStateOf<ProofMediaRecord?>(null) }
    var mediaError by remember { mutableStateOf<String?>(null) }
    var mediaNote by remember { mutableStateOf("Demo mode keeps media local until storage is connected.") }
    val context = LocalContext.current
    val aiRepository = remember { CollectiveAiCore.repository }
    val mediaRepository = remember { RepositoryProvider.mediaRepository }
    val proofRepository = remember { RepositoryProvider.proofRepository }
    val safetyReviewRepository = remember { RepositoryProvider.aiSafetyReviewRepository }
    val currentUserId = remember {
        when (val result = RepositoryProvider.authRepository.currentSession()) {
            is AppResult.Success -> result.data.userId
            is AppResult.Failure -> "local-demo-user"
        }
    }
    val mediaLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        when (val result = MediaValidator.inspect(context, uri)) {
            is MediaValidationResult.Valid -> {
                selectedMedia = result.media
                selectedMediaRecord = mediaRepository.createDemoMediaRecord(
                    ProofMediaInput(
                        userId = currentUserId,
                        mediaKind = result.media.mediaType.toMediaKind(),
                        fileName = result.media.displayName,
                        fileType = result.media.mimeType,
                        fileSizeBytes = result.media.sizeBytes,
                        localUri = result.media.uri.toString(),
                    ),
                )
                mediaError = null
                mediaNote = "Ready in demo mode. Storage path is prepared for Supabase later."
            }
            is MediaValidationResult.Invalid -> {
                mediaError = result.message
                selectedMedia = null
                selectedMediaRecord = null
            }
        }
    }
    val reflectionAssist = remember(proofType, visibility, reflection, feedbackRequest) {
        aiRepository.reflectionAssist(
            ReflectionAssistRequest(
                context = AiContext(
                    pathTitle = "Communication Confidence",
                    practiceTitle = MockData.practicePrompt.prompt,
                    proofType = proofType,
                    visibility = visibility,
                ),
                reflectionText = reflection,
                feedbackRequest = feedbackRequest,
            ),
        )
    }
    val scope = rememberCoroutineScope()
    AppList {
        item {
            CollectiveTopBar(title = "Proof", showLogo = false, showBack = true, onBack = onBack)
        }
        item {
            PageTitle(
                title = "Show evidence of real progress",
                subtitle = "Share what you practiced. Proof can be small, imperfect, and honest.",
            )
        }
        item {
            PracticeTypeSelector(selected = proofType, onSelected = { proofType = it })
        }
        item {
            ProofMediaPickerCard(
                proofType = proofType,
                selectedMedia = selectedMedia,
                note = mediaNote,
                error = mediaError,
                onChoose = {
                    if (proofType == "Text") {
                        mediaError = "Text proof does not need a media file."
                    } else {
                        mediaLauncher.launch(proofType.acceptedMimeType())
                    }
                },
                onRemove = {
                    selectedMedia = null
                    selectedMediaRecord = null
                    mediaError = null
                    mediaNote = "Demo mode keeps media local until storage is connected."
                },
            )
        }
        item {
            Text("Who can see this?", style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Text)
            VisibilitySelector(
                selected = visibility,
                onSelected = {
                    visibility = it
                    RepositoryProvider.preferences?.setPreferredProofVisibility(it)
                },
            )
        }
        item {
            SoftCard(color = Color.White, radius = 24.dp) {
                OutlinedTextField(
                    value = reflection,
                    onValueChange = { reflection = it.take(280) },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 4,
                    shape = RoundedCornerShape(22.dp),
                    placeholder = { Text("What did you try? What felt different?") },
                )
                OutlinedTextField(
                    value = feedbackRequest,
                    onValueChange = { feedbackRequest = it.take(220) },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    shape = RoundedCornerShape(22.dp),
                    placeholder = { Text("What would you like feedback on?") },
                )
            }
        }
        item { AiAssistCard(title = "Clarify my reflection", response = reflectionAssist) }
        item {
            PrimaryPillButton("Submit Proof", modifier = Modifier.fillMaxWidth()) {
                scope.launch {
                    val reviewText = "$reflection $feedbackRequest"
                    val safety = aiRepository.safetyReview(
                        SafetyReviewRequest(
                            text = reviewText,
                            intendedUse = AiAssistKind.REFLECTION_HELPER,
                        ),
                    )
                    val localMedia = selectedMediaRecord?.let { media ->
                        mediaRepository.uploadProofMedia(media).getOrNull() ?: media
                    }
                    val result = proofRepository.createProof(
                        ProofDraft(
                            pathId = "communication",
                            practiceId = "practice-${MockData.practicePrompt.pathId}-feedback-3-part",
                            title = "Communication practice proof",
                            reflectionText = reflection.ifBlank { "Small proof shared from today's practice." },
                            feedbackRequest = feedbackRequest,
                            media = localMedia,
                            visibility = visibility.toProofVisibility(),
                        ),
                    )
                    val proofId = when (result) {
                        is AppResult.Success -> result.data.id
                        is AppResult.Failure -> null
                    }
                    safetyReviewRepository.recordReview(
                        targetType = "proof",
                        targetId = proofId,
                        text = reviewText,
                        intendedUse = AiAssistKind.REFLECTION_HELPER.name,
                        response = safety,
                    )
                    val message = if (safety.riskLevel == AiRiskLevel.UNSAFE) {
                        "Proof saved locally. Review the helper note before wider sharing."
                    } else {
                        "Proof saved locally. Nice work showing up."
                    }
                    snackbarHostState.showSnackbar(message)
                    onShared()
                }
            }
        }
        item {
            Text("Your proof is safe and supportive.", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
        }
    }
}

@Composable
private fun FeedbackScreen(snackbarHostState: SnackbarHostState) {
    var feedbackText by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val aiRepository = remember { CollectiveAiCore.repository }
    val feedbackRepository = remember { RepositoryProvider.feedbackRepository }
    val safetyReviewRepository = remember { RepositoryProvider.aiSafetyReviewRepository }
    val proof = MockData.proofPosts.first()
    val localProof = RepositoryProvider.proofRepository.listProofs().getOrNull().orEmpty().firstOrNull()
    val targetProofId = localProof?.id ?: proof.id
    val proofSummary = localProof?.reflectionText ?: proof.reflection
    val feedbackAssist = remember(feedbackText) {
        aiRepository.feedbackDraft(
            FeedbackDraftRequest(
                proofSummary = proofSummary,
                feedbackType = "Suggestion",
                currentDraft = feedbackText,
            ),
        )
    }
    AppList {
        item { CollectiveTopBar(title = "Feedback") }
        item {
            PageTitle(
                title = "Quality matters more than volume",
                subtitle = "Feedback should help someone take their next step.",
            )
        }
        item {
            if (localProof == null) {
                ProofSummaryCard(proof)
            } else {
                SoftCard(color = Color.White, radius = 24.dp) {
                    SectionTitle("Latest local proof")
                    Text(localProof.title, style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Text)
                    Text(localProof.reflectionText, style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Muted)
                    localProof.media?.fileName?.let {
                        StatusChip("Local media: $it", color = CollectiveTokens.GoldSoft, contentColor = CollectiveTokens.Gold)
                    }
                }
            }
        }
        item {
            SoftCard(color = CollectiveTokens.GoldSoft, radius = 24.dp) {
                SectionTitle("Feedback framework")
                listOf("What worked", "One useful suggestion", "Encouragement").forEachIndexed { index, text ->
                    Text("${index + 1}. $text", style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Text)
                }
            }
        }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp), contentPadding = PaddingValues(end = 20.dp)) {
                items(MockData.feedbackExamples) { FeedbackCard(it, modifier = Modifier.width(250.dp)) }
            }
        }
        item {
            OutlinedTextField(
                value = feedbackText,
                onValueChange = { feedbackText = it.take(300) },
                modifier = Modifier.fillMaxWidth(),
                minLines = 5,
                shape = RoundedCornerShape(22.dp),
                placeholder = { Text("Write supportive feedback...") },
            )
        }
        item { AiAssistCard(title = "Make this feedback more useful", response = feedbackAssist) }
        item { TrustPrinciplesRow(listOf("Kind", "Specific", "Actionable", "Beginner-safe")) }
        item {
            PrimaryPillButton("Send Feedback", modifier = Modifier.fillMaxWidth()) {
                scope.launch {
                    val textToSave = feedbackText.ifBlank {
                        "What worked was clear effort. One next step could be naming the moment that felt easiest."
                    }
                    val safety = aiRepository.safetyReview(
                        SafetyReviewRequest(
                            text = textToSave,
                            intendedUse = AiAssistKind.FEEDBACK_DRAFT,
                        ),
                    )
                    val result = feedbackRepository.addFeedback(
                        FeedbackDraft(
                            proofId = targetProofId,
                            feedbackText = textToSave,
                            feedbackKind = FeedbackKind.SUGGESTION,
                        ),
                    )
                    val feedbackId = when (result) {
                        is AppResult.Success -> result.data.id
                        is AppResult.Failure -> null
                    }
                    safetyReviewRepository.recordReview(
                        targetType = "feedback",
                        targetId = feedbackId,
                        text = textToSave,
                        intendedUse = AiAssistKind.FEEDBACK_DRAFT.name,
                        response = safety,
                    )
                    val message = if (safety.riskLevel == AiRiskLevel.UNSAFE) {
                        "Feedback saved locally. Review the helper note before sharing further."
                    } else {
                        "Feedback sent. Thanks for helping someone grow."
                    }
                    snackbarHostState.showSnackbar(message)
                }
            }
        }
    }
}

@Composable
private fun ProgressScreen() {
    val aiRepository = remember { CollectiveAiCore.repository }
    val proofCount = RepositoryProvider.proofRepository.listProofs().getOrNull().orEmpty().size
    val sessionCount = RepositoryProvider.practiceRepository.sessionCount()
    val completionCount = RepositoryProvider.practiceRepository.completionCount()
    val progressAssist = remember(proofCount, completionCount) {
        aiRepository.progressSummary(
            ProgressSummaryRequest(
                streakDays = 7 + completionCount,
                weeklyMomentumPercent = (82 + proofCount * 2).coerceAtMost(100),
                activePathCount = 3,
                recentWins = MockData.wins.map { it.title },
                feedbackReceived = MockData.feedback.map { it.text },
            ),
        )
    }
    AppList {
        item { CollectiveTopBar() }
        item {
            PageTitle(title = "Your Progress", subtitle = "Visible growth without vanity metrics.")
        }
        if (proofCount > 0 || completionCount > 0 || sessionCount > 0) {
            item {
                SoftCard(color = CollectiveTokens.GoldSoft, radius = 24.dp) {
                    SectionTitle("Local loop")
                    Text("$sessionCount practice sessions started locally", style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Text)
                    Text("$completionCount practices completed locally", style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Text)
                    Text("$proofCount proofs saved on this device", style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Text)
                }
            }
        }
        item { AiAssistCard(title = "Summarize my progress", response = progressAssist) }
        item { ProgressOverviewCard(MockData.progressMetrics) }
        item {
            SoftCard(color = Color.White, radius = 26.dp) {
                SectionTitle("Your Paths")
                MockData.progressPaths.forEachIndexed { index, path ->
                    PathProgressRow(path)
                    if (index != MockData.progressPaths.lastIndex) HorizontalDivider(color = CollectiveTokens.Line.copy(alpha = 0.55f))
                }
            }
        }
        item {
            SoftCard(color = Color.White, radius = 24.dp) {
                SectionTitle("Recent Wins")
                MockData.wins.forEach { WinRow(it) }
                SecondaryPillButton("View All Wins >", modifier = Modifier.fillMaxWidth(), onClick = {})
            }
        }
        item {
            SoftCard(color = Color.White, radius = 24.dp) {
                SectionTitle("Feedback Received", "See All")
                MockData.feedback.forEach { FeedbackRow(it) }
            }
        }
        item {
            PracticeCard(
                title = "Next Recommended Action",
                body = "Share a small win. Celebrate progress without chasing attention.",
                action = "Try This",
                onClick = {},
            )
        }
        item { TrustSignalsRow() }
    }
}

@Composable
private fun ProfileScreen(
    onPrototypeMap: () -> Unit,
    onActivity: () -> Unit,
    onContribution: () -> Unit,
    onAiQualityLab: () -> Unit,
) {
    val aiRepository = remember { CollectiveAiCore.repository }
    val localProofs = RepositoryProvider.proofRepository.listProofs().getOrNull().orEmpty()
    val localProofCount = localProofs.size
    val localPracticeCount = RepositoryProvider.practiceRepository.completionCount()
    val localActivity = RepositoryProvider.activityRepository.recentActivity().getOrNull().orEmpty().map { it.toActivityItem() }
    val profileAssist = remember(localProofCount, localPracticeCount) {
        aiRepository.profileReview(
            ProfileReviewRequest(
                displayName = MockData.currentUser.name,
                bio = MockData.currentUser.bio,
                evidenceStats = MockData.profileStats.associate { it.label to it.value } +
                    mapOf("Local proofs" to localProofCount.toString(), "Local practices" to localPracticeCount.toString()),
                trustSignals = listOf("Helpful contributor", "Communication path", "Supportive feedback"),
            ),
        )
    }
    AppList {
        item { CollectiveTopBar(title = "Profile") }
        item {
            SoftCard(color = CollectiveTokens.GoldSoft, radius = 28.dp) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    Avatar("AC", color = CollectiveTokens.GoldSoft, modifier = Modifier.size(64.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(MockData.currentUser.name, style = MaterialTheme.typography.headlineSmall, color = CollectiveTokens.Text)
                        Text(MockData.currentUser.bio, style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Muted)
                    }
                }
                TrustPrinciplesRow(listOf("Helpful contributor", "Communication path", "Supportive feedback"))
            }
        }
        item { AiAssistCard(title = "Review evidence profile", response = profileAssist) }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                MockData.profileStats.take(2).forEach { ProfileStatCard(it, modifier = Modifier.weight(1f)) }
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                MockData.profileStats.drop(2).forEach { ProfileStatCard(it, modifier = Modifier.weight(1f)) }
            }
        }
        item {
            if (localProofs.isEmpty()) {
                ProofSummaryCard(MockData.proofPosts.first())
            } else {
                SoftCard(color = Color.White, radius = 24.dp) {
                    SectionTitle("Evidence saved locally")
                    Text(localProofs.first().title, style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Text)
                    Text(localProofs.first().reflectionText, style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Muted)
                    Text("${localProofs.size} local proof${if (localProofs.size == 1) "" else "s"} in your evidence history", style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Gold)
                }
            }
        }
        item {
            SoftCard {
                SectionTitle("Contribution history")
                (localActivity + MockData.activity).take(3).forEach { ActivityRow(it) }
                SecondaryPillButton("Open Activity", modifier = Modifier.fillMaxWidth(), onClick = onActivity)
            }
        }
        item {
            SoftCard {
                SectionTitle("Saved paths")
                MockData.progressPaths.forEach { PathProgressRow(it) }
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                SecondaryPillButton("Contribution Hub", modifier = Modifier.weight(1f), onClick = onContribution)
                SecondaryPillButton("Prototype Map", modifier = Modifier.weight(1f), onClick = onPrototypeMap)
            }
        }
        item { SecondaryPillButton("AI Quality Lab", modifier = Modifier.fillMaxWidth(), onClick = onAiQualityLab) }
        item { PrimaryPillButton("Edit Profile", modifier = Modifier.fillMaxWidth(), onClick = {}) }
    }
}

@Composable
private fun ActivityScreen(onRespond: () -> Unit) {
    var filter by remember { mutableStateOf("All") }
    val localActivity = RepositoryProvider.activityRepository.recentActivity().getOrNull().orEmpty().map { it.toActivityItem() }
    val allActivity = localActivity + MockData.activity
    val filtered = if (filter == "All") allActivity else allActivity.filter { it.category == filter }
    AppList {
        item { CollectiveTopBar(title = "Activity") }
        item { PageTitle(title = "Activity", subtitle = "Small signals that help you keep growing.") }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                items(listOf("All", "Practice", "Feedback", "Proofs", "Milestones")) { chip ->
                    CategoryChip(label = chip, selected = filter == chip, onClick = { filter = chip })
                }
            }
        }
        item { PracticeCard(title = "Reply to one piece of feedback", body = "A thoughtful response keeps the loop human.", action = "Respond", onClick = onRespond) }
        items(filtered) { ActivityRow(it) }
    }
}

@Composable
private fun ContributionHubScreen(onFindHelp: () -> Unit) {
    AppList {
        item { CollectiveTopBar(title = "Contribute") }
        item { PageTitle(title = "Contribution Hub", subtitle = "Move from consuming to becoming useful.") }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp), contentPadding = PaddingValues(end = 20.dp)) {
                items(MockData.contributionActions) { ContributionCard(it, modifier = Modifier.width(240.dp)) }
            }
        }
        item {
            SoftCard(color = CollectiveTokens.GoldSoft) {
                SectionTitle("Trust requirements")
                listOf("Complete 3 practices", "Give 5 helpful feedback notes", "Maintain beginner-safe tone").forEach {
                    StatusChip(it, color = Color.White, contentColor = CollectiveTokens.Gold)
                }
            }
        }
        item { PrimaryPillButton("Find someone to help", modifier = Modifier.fillMaxWidth(), onClick = onFindHelp) }
    }
}

@Composable
private fun MentorshipScreen() {
    AppList {
        item { CollectiveTopBar(title = "Mentorship") }
        item { PageTitle(title = "Mentorship", subtitle = "Pay for structure and support, not status.") }
        items(MockData.planOptions) { PlanOptionCard(it) }
        item { EmptyStateCard(title = "Trust is earned", body = "Trust is earned through contribution, not purchased.", action = "Explore Support Options") }
    }
}

@Composable
private fun CouncilLabsScreen() {
    AppList {
        item { CollectiveTopBar(title = "Council") }
        item { PageTitle(title = "Council Circle", subtitle = "Contribution-led spaces for deeper practice.") }
        items(MockData.labs) { LabSpaceCard(it) }
        item { PrimaryPillButton("View Labs", modifier = Modifier.fillMaxWidth(), onClick = {}) }
    }
}

@Composable
private fun SponsoredAccessScreen() {
    AppList {
        item { CollectiveTopBar(title = "Access") }
        item { PageTitle(title = "Sponsored Access", subtitle = "Mission-aligned access without stigma.") }
        item {
            SoftCard(color = CollectiveTokens.GoldSoft) {
                Text("Some members receive access through community sponsors, schools, nonprofits, or workplaces.", style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Text)
            }
        }
        item { TrustPrinciplesRow(listOf("Community sponsored", "School sponsored", "Nonprofit partner", "Workplace supported")) }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                PrimaryPillButton("Request Access", modifier = Modifier.weight(1f), onClick = {})
                SecondaryPillButton("Sponsor Members", modifier = Modifier.weight(1f), onClick = {})
            }
        }
    }
}

@Composable
private fun BusinessStudioScreen() {
    AppList {
        item { CollectiveTopBar(title = "Studio") }
        item { PageTitle(title = "Studio", subtitle = "Bounded organization participation.") }
        item {
            SoftCard(color = CollectiveTokens.GoldSoft) {
                Text("Organizations can support structured practice without turning Collective into workplace surveillance.", style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Text)
            }
        }
        item { TrustPrinciplesRow(listOf("Team communication practice", "Feedback culture", "Manager confidence", "Internal mentorship")) }
        item {
            SoftCard {
                SectionTitle("Safety principles")
                listOf("Member-owned proof", "No hidden monitoring", "Private by default", "Consent-based sharing").forEach {
                    Text("- $it", style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Muted)
                }
            }
        }
        item { PrimaryPillButton("Create Studio", modifier = Modifier.fillMaxWidth(), onClick = {}) }
    }
}

@Composable
private fun CommunityIdeasScreen(snackbarHostState: SnackbarHostState) {
    var idea by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    AppList {
        item { CollectiveTopBar(title = "Ideas") }
        item { PageTitle(title = "Community Ideas", subtitle = "Structured suggestions, not chaotic governance.") }
        items(MockData.ideas) { item ->
            SoftCard(color = Color.White) {
                StatusChip(item.status, color = CollectiveTokens.GoldSoft, contentColor = CollectiveTokens.GoldDeep)
                Text(item.title, style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Text)
                Text(item.body, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
            }
        }
        item {
            OutlinedTextField(
                value = idea,
                onValueChange = { idea = it.take(240) },
                modifier = Modifier.fillMaxWidth(),
                minLines = 4,
                shape = RoundedCornerShape(22.dp),
                placeholder = { Text("Suggest an improvement...") },
            )
        }
        item {
            PrimaryPillButton("Submit Idea", modifier = Modifier.fillMaxWidth()) {
                scope.launch { snackbarHostState.showSnackbar("Idea submitted. Thanks for helping improve Collective.") }
            }
        }
    }
}

@Composable
private fun ContributorCouncilScreen() {
    AppList {
        item { CollectiveTopBar(title = "Council") }
        item { PageTitle(title = "Contributor Council", subtitle = "Advisory voice for trusted contributors.") }
        item {
            SoftCard(color = CollectiveTokens.GoldSoft) {
                Text("Members who consistently contribute useful, safe, and supportive feedback can help shape Collective.", style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Text)
            }
        }
        item { SectionTitle("Eligibility") }
        item { TrustPrinciplesRow(MockData.councilEligibility) }
        item {
            SoftCard {
                SectionTitle("Council activities")
                MockData.councilActivities.forEach { Text("- $it", style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Muted) }
            }
        }
        item { PrimaryPillButton("View Eligibility", modifier = Modifier.fillMaxWidth(), onClick = {}) }
    }
}

@Composable
private fun AiQualityLabScreen() {
    val runs = RepositoryProvider.aiRunRepository.recentRuns().getOrNull().orEmpty()
    val safetyReviews = RepositoryProvider.aiSafetyReviewRepository.recentReviews().getOrNull().orEmpty()
    val localProofs = RepositoryProvider.proofRepository.listProofs().getOrNull().orEmpty()
    val localMediaCount = localProofs.count { it.media != null }
    val runSignals = runs.firstOrNull()?.traceSummary
        ?.split(";")
        ?.mapNotNull { it.trim().takeIf(String::isNotBlank) }
        ?.mapIndexed { index, value ->
            AiSignal("run signal ${index + 1}", value, 0.55 + index * 0.08)
        }
    val latestTrace = AiReasoningTrace(
        inputSignals = if (runSignals.isNullOrEmpty()) {
            listOf(
                AiSignal("local", "Offline helper active", 0.72),
                AiSignal("safety", "Beginner-safe guardrails", 0.84),
                AiSignal("control", "User can ignore suggestions", 0.78),
            )
        } else {
            runSignals
        },
        activatedPrinciples = listOf("AI support, not authority", "User keeps control", "Beginner safety"),
        confidenceNotes = listOf("Local-only run log", "No API keys required"),
    )
    AppList {
        item { CollectiveTopBar(title = "AI Lab") }
        item {
            PageTitle(
                title = "AI Quality Lab",
                subtitle = "Inspect local helper behavior without turning AI into the product.",
            )
        }
        item {
            SoftCard(color = CollectiveTokens.GoldSoft, radius = 26.dp) {
                SectionTitle("Local run log")
                Text("${runs.size} AI helper runs saved on this device", style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Text)
                Text("${safetyReviews.size} safety reviews and $localMediaCount media attachment records saved locally", style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Text)
                Text("Runs are local and used for quality checks, not public scoring.", style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
            }
        }
        item {
            SoftCard(color = Color.White, radius = 24.dp) {
                SectionTitle("AI Signal Map")
                LocalNeuralTraceView(trace = latestTrace)
            }
        }
        item {
            SoftCard(color = Color.White, radius = 24.dp) {
                SectionTitle("Safety reviews")
                if (safetyReviews.isEmpty()) {
                    Text("Submit proof or feedback to create a local safety review.", style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Muted)
                } else {
                    safetyReviews.take(3).forEach { review ->
                        SoftCard(color = CollectiveTokens.GoldSoft, radius = 18.dp, padding = 12.dp) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(review.targetType, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text)
                                Text(review.decision.lowercase().replace('_', ' '), style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.Gold)
                            }
                            Text(review.textSummary, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
                            Text(review.riskLevel.lowercase().replace('_', ' '), style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.GoldDeep)
                        }
                    }
                }
            }
        }
        item {
            SoftCard(color = Color.White, radius = 24.dp) {
                SectionTitle("Recent AI runs")
                if (runs.isEmpty()) {
                    Text("Open a helper in Practice, Proof, Feedback, Progress, or Profile to create a local run.", style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Muted)
                } else {
                    runs.take(5).forEach { run ->
                        SoftCard(color = CollectiveTokens.GoldSoft, radius = 18.dp, padding = 12.dp) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(run.kind.lowercase().replace('_', ' '), style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text)
                                Text("${(run.confidenceScore * 100).toInt()}%", style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.Gold)
                            }
                            Text(run.outputSummary, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
                            Text(run.riskLevel, style = MaterialTheme.typography.labelSmall, color = CollectiveTokens.GoldDeep)
                        }
                    }
                }
            }
        }
        item {
            SoftCard(color = Color.White, radius = 24.dp) {
                SectionTitle("Eval cases")
                SeedDataset.records.forEach { record ->
                    Text(record.id, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text)
                    Text(record.idealResponse, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
                }
            }
        }
    }
}

@Composable
private fun PrototypeMapScreen(onOpen: (String) -> Unit) {
    AppList {
        item { CollectiveTopBar(title = "Prototype Map") }
        item { PageTitle(title = "All Pages Preview", subtitle = "Open each local prototype screen for QA.") }
        items(prototypePages) { page ->
            SoftCard(modifier = Modifier.clickable { onOpen(page.route) }, color = Color.White, radius = 22.dp) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(page.title, style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Text)
                    Text("Open >", style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Gold)
                }
            }
        }
    }
}

@Composable
private fun TrustPrinciplesRow(items: List<String>) {
    LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp), contentPadding = PaddingValues(end = 20.dp)) {
        items(items) { label ->
            StatusChip(label, color = Color.White, contentColor = CollectiveTokens.Gold)
        }
    }
}

@Composable
private fun ProofMediaPickerCard(
    proofType: String,
    selectedMedia: SelectedMedia?,
    note: String,
    error: String?,
    onChoose: () -> Unit,
    onRemove: () -> Unit,
) {
    SoftCard(color = Color.White, radius = 24.dp) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("Proof media", style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Text)
                Text("Choose a local file now. Real upload is scaffolded for storage later.", style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
            }
            StatusChip(proofType, color = CollectiveTokens.GoldSoft, contentColor = CollectiveTokens.Gold)
        }
        selectedMedia?.let { media ->
            SoftCard(color = CollectiveTokens.GoldSoft, radius = 20.dp, padding = 12.dp) {
                Text(media.displayName, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Text)
                Text("${media.mimeType} - ${MediaValidator.formatFileSize(media.sizeBytes)}", style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
                SecondaryPillButton("Remove", modifier = Modifier.fillMaxWidth(), onClick = onRemove)
            }
        } ?: Text(note, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
        error?.let {
            Text(it, style = MaterialTheme.typography.bodyMedium, color = com.collective.app.ui.theme.CollectiveTokens.Danger)
        }
        SecondaryPillButton(
            label = if (selectedMedia == null) "Choose media" else "Choose different media",
            modifier = Modifier.fillMaxWidth(),
            onClick = onChoose,
        )
    }
}

@Composable
private fun AiAssistCard(title: String, response: AiAssistResponse) {
    var expanded by remember(title) { mutableStateOf(false) }
    var showTrace by remember(title) { mutableStateOf(false) }
    val chipColor = when (response.riskLevel) {
        AiRiskLevel.LOW -> CollectiveTokens.GoldSoft
        AiRiskLevel.NEEDS_REPHRASE -> CollectiveTokens.GoldSoft
        AiRiskLevel.UNSAFE -> CollectiveTokens.GoldSoft
    }
    SoftCard(color = CollectiveTokens.GoldSoft.copy(alpha = 0.72f), radius = 24.dp) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(title, style = MaterialTheme.typography.titleMedium, color = CollectiveTokens.Text)
                Text("AI can help you organize your thoughts. You decide what is true and useful.", style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
            }
            StatusChip("Local", color = chipColor, contentColor = CollectiveTokens.Gold)
        }
        if (!expanded) {
            SecondaryPillButton("Open helper", modifier = Modifier.fillMaxWidth()) { expanded = true }
        } else {
            Text(response.summary, style = MaterialTheme.typography.bodyLarge, color = CollectiveTokens.Text)
            response.suggestions.take(2).forEach {
                Text("- $it", style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
            }
            Text(response.reflectionQuestion, style = MaterialTheme.typography.labelLarge, color = CollectiveTokens.Gold)
            Text("Apply, edit, or ignore this. Your words stay yours.", style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                SecondaryPillButton(
                    label = if (showTrace) "Hide explanation" else "Show how formed",
                    modifier = Modifier.weight(1f),
                ) { showTrace = !showTrace }
                SecondaryPillButton("Close", modifier = Modifier.weight(1f)) { expanded = false }
            }
            if (showTrace) {
                LocalNeuralTraceView(trace = response.trace)
                response.safetyNotes.take(2).forEach {
                    Text(it, style = MaterialTheme.typography.bodyMedium, color = CollectiveTokens.Muted)
                }
            }
        }
    }
}

private fun MediaType.toMediaKind(): MediaKind =
    when (this) {
        MediaType.IMAGE -> MediaKind.IMAGE
        MediaType.VIDEO -> MediaKind.VIDEO
        MediaType.AUDIO -> MediaKind.AUDIO
        MediaType.NONE -> MediaKind.NONE
    }

private fun String.acceptedMimeType(): String =
    when (this) {
        "Photo" -> "image/*"
        "Video" -> "video/*"
        "Audio" -> "audio/*"
        else -> "*/*"
    }

private fun String.toProofVisibility(): ProofVisibility =
    when (this) {
        "Public" -> ProofVisibility.PUBLIC
        "Private" -> ProofVisibility.PRIVATE
        "Path Only" -> ProofVisibility.PATH
        else -> ProofVisibility.FEEDBACK_ONLY
    }

private fun ActivityEntity.toActivityItem(): com.collective.app.data.ActivityItem =
    com.collective.app.data.ActivityItem(
        title = title,
        body = body,
        category = category,
        timestamp = "Local",
    )
