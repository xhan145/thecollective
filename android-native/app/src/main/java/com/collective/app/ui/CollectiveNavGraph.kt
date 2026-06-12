package com.collective.app.ui

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
import com.collective.app.ai.model.AiAssistIntent
import com.collective.app.ai.model.AiAssistRequest
import com.collective.app.ai.model.AiAssistSurface
import com.collective.app.ai.repository.AiAssistRepository
import com.collective.app.core.result.AppResult
import com.collective.app.core.result.getOrNull
import com.collective.app.core.result.messageOrNull
import com.collective.app.data.FeedbackType
import com.collective.app.data.MediaType
import com.collective.app.data.MockData
import com.collective.app.data.ProofStatus
import com.collective.app.data.Visibility
import com.collective.app.data.model.FeedbackDraft
import com.collective.app.data.model.ProofDraft
import com.collective.app.data.model.ProofMediaAttachment
import com.collective.app.data.repository.CollectiveRepositories
import com.collective.app.media.MediaValidationResult
import com.collective.app.media.MediaValidator
import com.collective.app.media.SelectedMedia
import com.collective.app.ui.components.ActivityRow
import com.collective.app.ui.components.AiAssistCard
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
import com.collective.app.ui.components.ProofMediaPickerCard
import com.collective.app.ui.components.ProfileStatCard
import com.collective.app.ui.components.ProgressOverviewCard
import com.collective.app.ui.components.ProofCard
import com.collective.app.ui.components.ProofSummaryCard
import com.collective.app.ui.components.SectionTitle
import com.collective.app.ui.components.SecondaryPillButton
import com.collective.app.ui.components.SoftCard
import com.collective.app.ui.components.StatusChip
import com.collective.app.ui.components.SunburstLogo
import com.collective.app.ui.components.TrustSignalCard
import com.collective.app.ui.components.VideoPlaceholder
import com.collective.app.ui.components.VisibilitySelector
import com.collective.app.ui.components.WinRow
import com.collective.app.ui.theme.Border
import com.collective.app.ui.theme.CardBackground
import com.collective.app.ui.theme.CreamBackground
import com.collective.app.ui.theme.DeepText
import com.collective.app.ui.theme.ForestGreen
import com.collective.app.ui.theme.MutedBrown
import com.collective.app.ui.theme.PureWhite
import com.collective.app.ui.theme.Sage
import com.collective.app.ui.theme.SecondaryText
import com.collective.app.ui.theme.SoftGoldPale
import com.collective.app.ui.theme.SoftPeachPale
import com.collective.app.ui.theme.SoftPurple
import com.collective.app.ui.theme.SoftPurplePale
import com.collective.app.ui.theme.TertiaryText
import kotlinx.coroutines.launch

@Composable
fun CollectiveNavGraph(
    currentRoute: String,
    snackbarHostState: SnackbarHostState,
    repositories: CollectiveRepositories,
    aiAssistRepository: AiAssistRepository,
    modifier: Modifier = Modifier,
    navigate: (String) -> Unit,
) {
    Box(modifier = modifier) {
        when {
            currentRoute == Routes.Onboarding -> OnboardingScreen(onContinue = { navigate(Routes.Home) })
            currentRoute == Routes.Home -> HomeScreen(
                onOpenPath = { navigate(Routes.pathDetail("communication")) },
                onStartPractice = { navigate(Routes.practice("communication")) },
            )
            currentRoute.startsWith("pathDetail") -> PathDetailScreen(
                onBack = { navigate(Routes.Home) },
                onStartPractice = { navigate(Routes.practice("communication")) },
            )
            currentRoute.startsWith("practice") -> PracticeScreen(
                snackbarHostState = snackbarHostState,
                aiAssistRepository = aiAssistRepository,
                onBack = { navigate(Routes.pathDetail("communication")) },
                onFinish = { navigate(Routes.proofSubmission("communication")) },
            )
            currentRoute.startsWith("proofSubmission") -> ProofSubmissionScreen(
                snackbarHostState = snackbarHostState,
                repositories = repositories,
                aiAssistRepository = aiAssistRepository,
                onBack = { navigate(Routes.practice("communication")) },
                onShared = { navigate(Routes.feedback("demo-proof")) },
            )
            currentRoute.startsWith("feedback") -> FeedbackScreen(
                snackbarHostState = snackbarHostState,
                repositories = repositories,
                aiAssistRepository = aiAssistRepository,
            )
            currentRoute == Routes.Progress -> ProgressScreen(repositories = repositories)
            currentRoute == Routes.Profile -> ProfileScreen(
                repositories = repositories,
                onPrototypeMap = { navigate(Routes.PrototypeMap) },
                onActivity = { navigate(Routes.Activity) },
                onContribution = { navigate(Routes.ContributionHub) },
            )
            currentRoute == Routes.Activity -> ActivityScreen(onRespond = { navigate(Routes.feedback("demo-proof")) })
            currentRoute == Routes.ContributionHub -> ContributionHubScreen(onFindHelp = { navigate(Routes.feedback("demo-proof")) })
            currentRoute == Routes.Mentorship -> MentorshipScreen()
            currentRoute == Routes.CouncilLabs -> CouncilLabsScreen()
            currentRoute == Routes.SponsoredAccess -> SponsoredAccessScreen()
            currentRoute == Routes.BusinessStudio -> BusinessStudioScreen()
            currentRoute == Routes.CommunityIdeas -> CommunityIdeasScreen(snackbarHostState = snackbarHostState)
            currentRoute == Routes.ContributorCouncil -> ContributorCouncilScreen()
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
            .background(CreamBackground)
            .padding(WindowInsets.safeDrawing.asPaddingValues()),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 6.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
        content = content,
    )
}

@Composable
private fun PageTitle(title: String, subtitle: String, label: String? = null) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        label?.let { StatusChip(it, color = SoftGoldPale, contentColor = MutedBrown) }
        Text(title, style = MaterialTheme.typography.displaySmall, color = DeepText)
        Text(subtitle, style = MaterialTheme.typography.bodyLarge, color = SecondaryText)
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
        color = if (selected) Sage else PureWhite,
        border = androidx.compose.foundation.BorderStroke(1.dp, if (selected) ForestGreen else Border),
    ) {
        Box(modifier = Modifier.padding(14.dp), contentAlignment = Alignment.CenterStart) {
            Text(goal, style = MaterialTheme.typography.labelLarge, color = DeepText)
        }
    }
}

@Composable
private fun HomeScreen(onOpenPath: () -> Unit, onStartPractice: () -> Unit) {
    var selectedCategory by remember { mutableStateOf("For You") }
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
                title = "Today’s action",
                body = "Practice one small communication rep.",
                action = "Start Practice",
                onClick = onStartPractice,
            )
        }
        item { TrustSignalsRow() }
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
                        SunburstLogo(size = 34.dp)
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
                Text("Give useful feedback in 3 parts", style = MaterialTheme.typography.titleMedium, color = DeepText)
                Text("A low-pressure rep for becoming more specific, kind, and clear.", style = MaterialTheme.typography.bodyLarge, color = SecondaryText)
            }
        }
        item { SectionTitle("Trust Signals") }
        item { TrustSignalsRow() }
    }
}

@Composable
private fun PracticeScreen(
    snackbarHostState: SnackbarHostState,
    aiAssistRepository: AiAssistRepository,
    onBack: () -> Unit,
    onFinish: () -> Unit
) {
    val prompt = MockData.practicePrompt
    var practicing by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val practiceAssist = remember(prompt.pathId) {
        aiAssistRepository.assist(
            AiAssistRequest(
                surface = AiAssistSurface.PRACTICE,
                intent = AiAssistIntent.PRACTICE_HELPER,
                practiceArea = prompt.pathId,
                userText = prompt.prompt
            )
        ).getOrNull()
    }
    AppList {
        item { CollectiveTopBar() }
        item {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                CircleIconButton("<", onClick = onBack, size = 38.dp)
                Text("Communication Confidence", modifier = Modifier.weight(1f), style = MaterialTheme.typography.titleMedium, color = DeepText)
                Text("Path Progress", style = MaterialTheme.typography.labelLarge, color = SecondaryText)
                LabelPill("68%", color = Sage)
            }
        }
        item {
            PageTitle(title = prompt.prompt, subtitle = prompt.description, label = prompt.label)
        }
        item {
            SoftCard(color = CardBackground, radius = 26.dp) {
                SectionTitle("Practice instructions")
                prompt.tips.forEachIndexed { index, tip ->
                    Text("${index + 1}. $tip", style = MaterialTheme.typography.bodyLarge, color = DeepText)
                }
            }
        }
        practiceAssist?.let { response ->
            item {
                AiAssistCard(response = response) { suggestion ->
                    scope.launch { snackbarHostState.showSnackbar(suggestion) }
                }
            }
        }
        item {
            SoftCard(color = PureWhite, radius = 26.dp) {
                SectionTitle("Example")
                Text(
                    "What worked: your point was clear. One improvement: pause before the next idea. Encouragement: this is already easier to follow.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = SecondaryText,
                )
                VideoPlaceholder(duration = "0:30", modifier = Modifier.fillMaxWidth().height(150.dp))
            }
        }
        item {
            SoftCard(color = Sage, radius = 28.dp) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(18.dp)) {
                    Surface(shape = CircleShape, color = PureWhite, modifier = Modifier.size(122.dp), border = androidx.compose.foundation.BorderStroke(5.dp, ForestGreen)) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                            Text(if (practicing) "0:12" else "0:00", style = MaterialTheme.typography.headlineSmall, color = DeepText)
                            Text("/ 0:30", style = MaterialTheme.typography.labelLarge, color = TertiaryText)
                        }
                    }
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(if (practicing) "Practicing" else "Ready for one rep", style = MaterialTheme.typography.titleLarge, color = DeepText)
                        Text("Clear and kind is enough for this prototype.", style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
                        PrimaryPillButton(if (practicing) "Finish Practice" else "Start Practice", modifier = Modifier.fillMaxWidth()) {
                            if (practicing) {
                                onFinish()
                            } else {
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
private fun ProofSubmissionScreen(
    snackbarHostState: SnackbarHostState,
    repositories: CollectiveRepositories,
    aiAssistRepository: AiAssistRepository,
    onBack: () -> Unit,
    onShared: () -> Unit
) {
    var proofType by remember { mutableStateOf("Video") }
    var visibility by remember { mutableStateOf("Path Only") }
    var reflection by remember { mutableStateOf("") }
    var feedbackRequest by remember { mutableStateOf("") }
    var selectedMedia by remember { mutableStateOf<SelectedMedia?>(null) }
    var mediaStatus by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val mediaLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        when (val result = MediaValidator.inspect(context, uri)) {
            is MediaValidationResult.Valid -> {
                selectedMedia = result.media
                proofType = when (result.media.mediaType) {
                    MediaType.IMAGE -> "Photo"
                    MediaType.VIDEO -> "Video"
                    MediaType.NONE -> proofType
                }
                mediaStatus = "Media ready for proof."
            }
            is MediaValidationResult.Invalid -> mediaStatus = result.message
        }
    }
    val proofAssist = remember(reflection, feedbackRequest, proofType) {
        aiAssistRepository.assist(
            AiAssistRequest(
                surface = AiAssistSurface.REFLECTION,
                intent = AiAssistIntent.REFLECTION_HELPER,
                userText = reflection,
                practiceArea = "communication",
                proofTitle = proofType
            )
        ).getOrNull()
    }
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
                selectedMedia = selectedMedia,
                statusMessage = mediaStatus,
                onChooseMedia = { mediaLauncher.launch("*/*") }
            )
        }
        item {
            Text("Who can see this?", style = MaterialTheme.typography.titleMedium, color = DeepText)
            VisibilitySelector(selected = visibility, onSelected = { visibility = it })
        }
        item {
            SoftCard(color = PureWhite, radius = 24.dp) {
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
        proofAssist?.let { response ->
            item {
                AiAssistCard(response = response) { suggestion ->
                    reflection = appendSuggestion(reflection, suggestion, limit = 280)
                }
            }
        }
        item {
            PrimaryPillButton("Share Proof", modifier = Modifier.fillMaxWidth()) {
                scope.launch {
                    val media = selectedMedia?.let {
                        ProofMediaAttachment(
                            localUri = it.uri.toString(),
                            displayName = it.displayName,
                            mediaType = it.mediaType,
                            sizeBytes = it.sizeBytes,
                            mimeType = it.mimeType
                        )
                    }
                    val draft = ProofDraft(
                        title = "Communication proof",
                        reflectionText = reflection,
                        feedbackRequest = feedbackRequest,
                        media = media,
                        practiceArea = "communication",
                        visibility = visibilityFromLabel(visibility),
                        status = ProofStatus.SUBMITTED
                    )
                    val blockingSignal = repositories.moderation
                        .checkProofDraft(draft)
                        .getOrNull()
                        .orEmpty()
                        .firstOrNull { it.blocksSubmission }
                    if (blockingSignal != null) {
                        snackbarHostState.showSnackbar(blockingSignal.reason)
                        return@launch
                    }
                    media?.let {
                        mediaStatus = repositories.mediaUploads.prepareProofMedia(it).messageOrNull() ?: mediaStatus
                    }
                    when (val result = repositories.proofs.createProof(draft)) {
                        is AppResult.Success -> {
                            snackbarHostState.showSnackbar("Proof shared. Nice work showing up.")
                            onShared()
                        }
                        is AppResult.Offline -> snackbarHostState.showSnackbar(result.message)
                        is AppResult.Error -> snackbarHostState.showSnackbar(result.message)
                    }
                }
            }
        }
        item {
            Text("Your proof is safe and supportive.", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center, style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
        }
    }
}

@Composable
private fun FeedbackScreen(
    snackbarHostState: SnackbarHostState,
    repositories: CollectiveRepositories,
    aiAssistRepository: AiAssistRepository
) {
    var feedbackText by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val proof = MockData.proofPosts.first()
    val proofId = remember { repositories.proofs.listProofs().getOrNull()?.firstOrNull()?.id ?: proof.id }
    val feedbackAssist = remember(feedbackText) {
        aiAssistRepository.assist(
            AiAssistRequest(
                surface = AiAssistSurface.FEEDBACK,
                intent = AiAssistIntent.FEEDBACK_DRAFT,
                userText = feedbackText,
                desiredFeedbackType = FeedbackType.SUGGESTION.label
            )
        ).getOrNull()
    }
    AppList {
        item { CollectiveTopBar(title = "Feedback") }
        item {
            PageTitle(
                title = "Quality matters more than volume",
                subtitle = "Feedback should help someone take their next step.",
            )
        }
        item { ProofSummaryCard(proof) }
        item {
            SoftCard(color = Sage, radius = 24.dp) {
                SectionTitle("Feedback framework")
                listOf("What worked", "One useful suggestion", "Encouragement").forEachIndexed { index, text ->
                    Text("${index + 1}. $text", style = MaterialTheme.typography.bodyLarge, color = DeepText)
                }
            }
        }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp), contentPadding = PaddingValues(end = 20.dp)) {
                items(MockData.feedbackExamples) { FeedbackCard(it, modifier = Modifier.width(250.dp)) }
            }
        }
        feedbackAssist?.let { response ->
            item {
                AiAssistCard(response = response) { suggestion ->
                    feedbackText = appendSuggestion(feedbackText, suggestion, limit = 300)
                }
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
        item { TrustPrinciplesRow(listOf("Kind", "Specific", "Actionable", "Beginner-safe")) }
        item {
            PrimaryPillButton("Send Feedback", modifier = Modifier.fillMaxWidth()) {
                scope.launch {
                    val draft = FeedbackDraft(
                        proofId = proofId,
                        feedbackText = feedbackText,
                        feedbackType = FeedbackType.SUGGESTION
                    )
                    val blockingSignal = repositories.moderation
                        .checkFeedbackDraft(draft)
                        .getOrNull()
                        .orEmpty()
                        .firstOrNull { it.blocksSubmission }
                    if (blockingSignal != null) {
                        snackbarHostState.showSnackbar(blockingSignal.reason)
                        return@launch
                    }
                    when (val result = repositories.feedback.addFeedback(draft)) {
                        is AppResult.Success -> {
                            feedbackText = ""
                            snackbarHostState.showSnackbar("Feedback sent. Thanks for helping someone grow.")
                        }
                        is AppResult.Offline -> snackbarHostState.showSnackbar(result.message)
                        is AppResult.Error -> snackbarHostState.showSnackbar(result.message)
                    }
                }
            }
        }
    }
}

private fun visibilityFromLabel(label: String): Visibility {
    return when (label) {
        "Private" -> Visibility.PRIVATE
        "Public" -> Visibility.PUBLIC
        else -> Visibility.FEEDBACK_ONLY
    }
}

private fun appendSuggestion(current: String, suggestion: String, limit: Int): String {
    val separator = if (current.isBlank()) "" else "\n"
    return (current.trimEnd() + separator + suggestion).take(limit)
}

@Composable
private fun ProgressScreen(repositories: CollectiveRepositories) {
    val progress = remember { repositories.trust.userProgress().getOrNull() }
    AppList {
        item { CollectiveTopBar() }
        item {
            PageTitle(title = "Your Progress", subtitle = "Visible growth without vanity metrics.")
        }
        item { ProgressOverviewCard(MockData.progressMetrics) }
        progress?.let { userProgress ->
            item {
                SoftCard(color = Sage, radius = 24.dp) {
                    SectionTitle("Trust signal pipeline")
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                        LabelPill("Trust ${userProgress.trustScore}", color = PureWhite)
                        LabelPill(userProgress.trustLevel.label, color = PureWhite)
                    }
                    Text(
                        "Local events are flowing through the repository layer. Remote persistence can be connected without changing this screen.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = SecondaryText
                    )
                }
            }
        }
        item {
            SoftCard(color = PureWhite, radius = 26.dp) {
                SectionTitle("Your Paths")
                MockData.progressPaths.forEachIndexed { index, path ->
                    PathProgressRow(path)
                    if (index != MockData.progressPaths.lastIndex) HorizontalDivider(color = Border.copy(alpha = 0.55f))
                }
            }
        }
        item {
            SoftCard(color = PureWhite, radius = 24.dp) {
                SectionTitle("Recent Wins")
                MockData.wins.forEach { WinRow(it) }
                SecondaryPillButton("View All Wins >", modifier = Modifier.fillMaxWidth(), onClick = {})
            }
        }
        item {
            SoftCard(color = PureWhite, radius = 24.dp) {
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
    repositories: CollectiveRepositories,
    onPrototypeMap: () -> Unit,
    onActivity: () -> Unit,
    onContribution: () -> Unit
) {
    val session = remember { repositories.auth.currentSession().getOrNull() }
    AppList {
        item { CollectiveTopBar(title = "Profile") }
        item {
            SoftCard(color = Sage, radius = 28.dp) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    Avatar("AC", color = SoftPeachPale, modifier = Modifier.size(64.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(MockData.currentUser.name, style = MaterialTheme.typography.headlineSmall, color = DeepText)
                        Text(MockData.currentUser.bio, style = MaterialTheme.typography.bodyLarge, color = SecondaryText)
                    }
                }
                TrustPrinciplesRow(listOf("Top Contributor", "Communication Path", "Supportive Feedback"))
            }
        }
        item {
            SoftCard(color = PureWhite, radius = 24.dp) {
                SectionTitle("Access scaffold")
                Text(
                    if (session?.user?.isLocalOnly == true) {
                        "Running in local mode as ${session.user.displayName}. Remote auth is ready to connect later."
                    } else {
                        "Remote auth can be connected through the repository layer."
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    color = SecondaryText
                )
            }
        }
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
        item { ProofSummaryCard(MockData.proofPosts.first()) }
        item {
            SoftCard {
                SectionTitle("Contribution history")
                MockData.activity.take(3).forEach { ActivityRow(it) }
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
        item { PrimaryPillButton("Edit Profile", modifier = Modifier.fillMaxWidth(), onClick = {}) }
    }
}

@Composable
private fun ActivityScreen(onRespond: () -> Unit) {
    var filter by remember { mutableStateOf("All") }
    val filtered = if (filter == "All") MockData.activity else MockData.activity.filter { it.category == filter }
    AppList {
        item { CollectiveTopBar(title = "Activity") }
        item { PageTitle(title = "Activity", subtitle = "Small signals that help you keep growing.") }
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                items(listOf("All", "Feedback", "Support", "Proofs", "Milestones")) { chip ->
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
            SoftCard(color = Sage) {
                SectionTitle("Trust requirements")
                listOf("Complete 3 practices", "Give 5 helpful feedback notes", "Maintain beginner-safe tone").forEach {
                    StatusChip(it, color = PureWhite, contentColor = ForestGreen)
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
            SoftCard(color = Sage) {
                Text("Some members receive access through community sponsors, schools, nonprofits, or workplaces.", style = MaterialTheme.typography.bodyLarge, color = DeepText)
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
            SoftCard(color = Sage) {
                Text("Organizations can support structured practice without turning Collective into workplace surveillance.", style = MaterialTheme.typography.bodyLarge, color = DeepText)
            }
        }
        item { TrustPrinciplesRow(listOf("Team communication practice", "Feedback culture", "Manager confidence", "Internal mentorship")) }
        item {
            SoftCard {
                SectionTitle("Safety principles")
                listOf("Member-owned proof", "No hidden monitoring", "Private by default", "Consent-based sharing").forEach {
                    Text("- $it", style = MaterialTheme.typography.bodyLarge, color = SecondaryText)
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
            SoftCard(color = PureWhite) {
                StatusChip(item.status, color = SoftPurplePale, contentColor = SoftPurple)
                Text(item.title, style = MaterialTheme.typography.titleMedium, color = DeepText)
                Text(item.body, style = MaterialTheme.typography.bodyMedium, color = SecondaryText)
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
            SoftCard(color = Sage) {
                Text("Members who consistently contribute useful, safe, and supportive feedback can help shape Collective.", style = MaterialTheme.typography.bodyLarge, color = DeepText)
            }
        }
        item { SectionTitle("Eligibility") }
        item { TrustPrinciplesRow(MockData.councilEligibility) }
        item {
            SoftCard {
                SectionTitle("Council activities")
                MockData.councilActivities.forEach { Text("- $it", style = MaterialTheme.typography.bodyLarge, color = SecondaryText) }
            }
        }
        item { PrimaryPillButton("View Eligibility", modifier = Modifier.fillMaxWidth(), onClick = {}) }
    }
}

@Composable
private fun PrototypeMapScreen(onOpen: (String) -> Unit) {
    AppList {
        item { CollectiveTopBar(title = "Prototype Map") }
        item { PageTitle(title = "All Pages Preview", subtitle = "Open each local prototype screen for QA.") }
        items(prototypePages) { page ->
            SoftCard(modifier = Modifier.clickable { onOpen(page.route) }, color = PureWhite, radius = 22.dp) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(page.title, style = MaterialTheme.typography.titleMedium, color = DeepText)
                    Text("Open >", style = MaterialTheme.typography.labelLarge, color = ForestGreen)
                }
            }
        }
    }
}

@Composable
private fun TrustPrinciplesRow(items: List<String>) {
    LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp), contentPadding = PaddingValues(end = 20.dp)) {
        items(items) { label ->
            StatusChip(label, color = PureWhite, contentColor = ForestGreen)
        }
    }
}
