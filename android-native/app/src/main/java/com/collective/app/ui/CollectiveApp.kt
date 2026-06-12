package com.collective.app.ui

import com.collective.app.ui.theme.CollectiveTokens
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.collective.app.beta.ui.BetaSession
import com.collective.app.data.repository.RepositoryProvider
import com.collective.app.ui.feedback.MockFeedbackRepository
import com.collective.app.ui.feedback.FeedbackStatus
import com.collective.app.ui.feedback.FeedbackViewModel
import com.collective.app.ui.home.HomeSheet
import com.collective.app.ui.home.HomeViewModel
import com.collective.app.ui.practice.MockPracticeRepository
import com.collective.app.ui.practice.PracticeStepKind
import com.collective.app.ui.practice.PracticeViewModel
import com.collective.app.ui.practice.selectedDirectionStateOf
import com.collective.app.ui.proof.MockProofRepository
import com.collective.app.ui.proof.ProofViewModel
import com.collective.app.ui.proof.SubmitProofModalSheet

@Composable
fun CollectiveApp() {
    var currentRoute by remember { mutableStateOf(Routes.BetaHome) }
    val snackbarHostState = remember { SnackbarHostState() }
    val betaSession = remember { BetaSession() }
    val homeViewModel = remember { HomeViewModel() }
    val proofRepository = remember { MockProofRepository() }
    val proofViewModel = remember { ProofViewModel(proofRepository) }
    val practiceRepository = remember { MockPracticeRepository() }
    val practiceViewModel = remember {
        PracticeViewModel(
            repository = practiceRepository,
            onPracticeStepCompletedForTrust = { homeViewModel.onPracticeCompleted() },
        )
    }
    val feedbackRepository = remember { MockFeedbackRepository() }
    val feedbackViewModel = remember {
        FeedbackViewModel(
            repository = feedbackRepository,
            onFeedbackUsedForTrust = {
                homeViewModel.onFeedbackUsed()
                // Auto-complete the UseFeedback step when it is the active step.
                val selId = practiceViewModel.selectedDirectionId.value
                if (selId != null) {
                    val state = selectedDirectionStateOf(
                        practiceViewModel.directions.value,
                        selId,
                        practiceViewModel.progress.value,
                    )
                    val active = state?.activeStep
                    if (active != null && active.kind == PracticeStepKind.UseFeedback) {
                        practiceViewModel.onCompleteStep(selId, active.id)
                    }
                }
            },
        )
    }
    val homeUiState by homeViewModel.uiState.collectAsState()
    val proofDraft by proofViewModel.draft.collectAsState()
    val proofItems by proofViewModel.proofItems.collectAsState()
    val feedbackItems by feedbackViewModel.feedbackItems.collectAsState()
    LaunchedEffect(proofItems.size) {
        homeViewModel.onProofCountChanged(proofItems.size)
    }
    LaunchedEffect(feedbackItems) {
        val unread = feedbackItems.count { it.status == FeedbackStatus.New }
        homeViewModel.onUnreadFeedbackCountChanged(unread)
    }
    val navigate: (String) -> Unit = { route ->
        homeViewModel.onBottomNavClicked(route)
        currentRoute = route
        RepositoryProvider.preferences?.setLastRoute(route)
    }
    CollectiveScaffold(
        currentRoute = currentRoute,
        snackbarHostState = snackbarHostState,
        onNavigate = navigate,
        onCreate = { navigate(Routes.BetaProofCapture) },
    ) { innerPadding ->
        CollectiveNavGraph(
            currentRoute = currentRoute,
            snackbarHostState = snackbarHostState,
            homeViewModel = homeViewModel,
            proofViewModel = proofViewModel,
            feedbackViewModel = feedbackViewModel,
            practiceViewModel = practiceViewModel,
            betaSession = betaSession,
            modifier = Modifier.padding(innerPadding),
            navigate = navigate,
        )
    }

    if (currentRoute != Routes.Home && homeUiState.activeSheet == HomeSheet.SubmitProof) {
        SubmitProofModalSheet(
            draft = proofDraft,
            onTypeSelected = proofViewModel::onProofTypeSelected,
            onBodyChanged = proofViewModel::onBodyChanged,
            onMediaPicked = proofViewModel::onMediaPicked,
            onRemoveAttachment = proofViewModel::onRemoveAttachment,
            onSubmit = { proofViewModel.onSubmitProof() },
            onDone = {
                proofViewModel.onDismissSuccess()
                homeViewModel.onDismissSheet()
            },
            onDismiss = {
                proofViewModel.onResetDraft()
                homeViewModel.onDismissSheet()
            },
        )
    }
}

@Composable
fun CollectiveScaffold(
    currentRoute: String,
    snackbarHostState: SnackbarHostState,
    onNavigate: (String) -> Unit,
    onCreate: () -> Unit,
    content: @Composable (PaddingValues) -> Unit,
) {
    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = CollectiveTokens.Cream,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            CollectiveBottomNav(
                currentRoute = currentRoute,
                onNavigate = onNavigate,
                onCreate = onCreate,
            )
        },
        content = content,
    )
}

// The legacy BottomNavBar / CenterCreateButton (Home / Paths / Progress / Profile, green
// center "+") were dead code from the pre-redesign prototype and have been removed.
// The active navigation is CollectiveBottomNav in CollectiveHomeScreen.kt.
