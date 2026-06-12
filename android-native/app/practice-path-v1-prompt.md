You are working in my existing Android project for Collective (Kotlin + Jetpack Compose).
Read CLAUDE.md at the repo root and follow it. Brand: warm cream/gold, rounded cards,
soft elevation, calm beginner-safe copy. Local/mock only.

OBJECTIVE
Implement PRACTICE PATH V1. Make Discover drive Home's focus and practice flow through ONE
shared PracticeRepository. Loop: Discover (choose direction) -> Home (active step) ->
complete steps -> Submit Proof -> Use Feedback -> Trust grows. A direction is a small
practice path, NOT a course or content feed.

DO NOT ADD: backend, auth, Supabase, networking, database, AI calls, uploads, public feed,
comments, likes, followers, scoring, grading, leaderboards, monetization. Do not redesign
the reference-matched Home layout. Do not use the unrelated data/repository/PathRepository
or PracticeRepository (Room scaffold) — stay in the active ui-layer pattern (plain classes
exposing StateFlow, instantiated in ui/CollectiveApp.kt, like ProofViewModel/FeedbackViewModel).

INSPECT FIRST
- ui/CollectiveApp.kt, ui/CollectiveNavGraph.kt, ui/Routes.kt
- ui/home/HomeUiState.kt, HomeViewModel.kt, HomeRepository.kt, MockHomeRepository.kt,
  HomeSampleData.kt
- ui/CollectiveHomeScreen.kt (TodayFocusCard, ContinuePracticeCard, PracticeSheet,
  FocusDetailSheet, HomeSheetHost)
- ui/discover/DiscoverScreen.kt (currently hardcoded practices/otherDirections — replace)
- ui/proof/ProofViewModel.kt, ui/feedback/FeedbackViewModel.kt (pattern to copy)
- ui/components/*, ui/theme/CollectiveTokens.kt

CREATE (new package ui/practice/)
- PracticeModels.kt
    enum PracticeStepKind { Reflection, VoiceNote, ConversationPrompt, VideoPractice,
                            SubmitProof, UseFeedback }
    data class PracticeStep(id, title, prompt, kind: PracticeStepKind, estimatedSeconds: Int)
    data class Direction(id, title, tagline, summary, whatYouPractice: List<String>,
                         steps: List<PracticeStep>, isAvailable: Boolean)
    data class PracticePathProgress(directionId, completedStepIds: Set<String>)
    data class SelectedDirectionState(direction, completedStepIds, activeStep: PracticeStep?,
                                      completedCount, totalCount, progress: Float, isComplete)
    fun selectedDirectionStateOf(directions, selectedId, progress): SelectedDirectionState?
      (pure function: activeStep = first step whose id not in completedStepIds)
- PracticeRepository.kt (interface):
    val directions: StateFlow<List<Direction>>
    val selectedDirectionId: StateFlow<String?>
    val progress: StateFlow<Map<String, PracticePathProgress>>
    fun selectDirection(id); fun completeStep(directionId, stepId); fun getDirection(id)
- MockPracticeRepository.kt:
    Seed ONE available direction "confident-communication" titled "Confident Communication",
    tagline "Speak clearly, ask better questions, and share your ideas with calm confidence.",
    whatYouPractice = ["Clarity","Calm delivery","Useful questions"], steps in order:
      1 "Say one clear thing" (Reflection)
      2 "Record a 60-second voice note" (VoiceNote)
      3 "Ask one useful question" (ConversationPrompt)
      4 "Explain your idea simply" (VideoPractice)
      5 "Submit proof" (SubmitProof)
      6 "Use feedback" (UseFeedback)
    Seed 3 more directions isAvailable=false (Momentum, Better feedback, Showing your work).
    Default selectedDirectionId = "confident-communication" with empty progress.
- PracticeViewModel.kt (plain class, no DI):
    constructor(repository, onPracticeStepCompletedForTrust: () -> Unit = {})
    expose directions, selectedDirectionId, progress StateFlows
    fun onSelectDirection(id); fun onCompleteStep(directionId, stepId) ->
      repository.completeStep + onPracticeStepCompletedForTrust() only if step newly completed.
- PracticeComponents.kt:
    DirectionFeaturedCard, PracticeStepPreviewRow, ComingSoonDirectionRow,
    DirectionDetailSheetContent, PracticePathChecklist (states: done/active/upcoming),
    PracticeStepRow, PathProgressHeader, PathCompleteState. Use CollectiveTokens + shared
    components only. No harsh Material defaults.

WIRE
- ui/CollectiveApp.kt: create MockPracticeRepository + PracticeViewModel(
    onPracticeStepCompletedForTrust = { homeViewModel.onPracticeCompleted() }). Pass
    practiceViewModel into CollectiveNavGraph.
- ui/CollectiveNavGraph.kt: thread practiceViewModel to CollectiveHomeScreen and DiscoverScreen.
- ui/home/HomeUiState.kt: keep FocusState/PracticeState shapes.
- ui/home/HomeViewModel.kt: add onPracticeCompleted() that increments
    trustSnapshot.practicesCompleted (reuse trustLabel pattern). Remove the hardcoded
    focus mutation from MockHomeRepository.completePractice (focus now comes from practice repo).
- ui/CollectiveHomeScreen.kt: collect practice flows, compute SelectedDirectionState via
    selectedDirectionStateOf, map to FocusState (title, completedCount, totalCount, progress,
    steps.map{title}) and PracticeState (from activeStep), copy onto uiState before rendering.
    FocusDetailSheet checklist becomes interactive: completing the active step calls
    practiceViewModel.onCompleteStep; a SubmitProof step opens Submit Proof
    (onAddProofFromPracticeClicked) and completes on successful submit; a UseFeedback step
    completes via the existing onFeedbackUsed hook while active. When isComplete, show
    PathCompleteState. Do NOT alter the Home visual layout.
- ui/discover/DiscoverScreen.kt: delete hardcoded lists; render from practiceViewModel.
    Featured = available direction with real progress; "Practice paths" = its steps
    (read-only preview); "Other directions" = isAvailable=false with quiet "Coming soon"
    badge (not tappable into content). DirectionDetailSheetContent "Start direction" ->
    practiceViewModel.onSelectDirection(id) then navigate Home; label "Continue" if in progress.

SINGLE SOURCE OF TRUTH
PracticeRepository owns directions, steps, selection, progress. No duplicate hardcoded
practice lists in Home or Discover. Home renders a projection and stores no practice state.

COPY (beginner-safe)
"Choose a direction. Practice one small step." / "Small steps. Real progress." /
"Show what you practiced. It does not need to be perfect." / "Path complete. Small steps count."
Avoid: course, lesson, module, score, level-up, streak shame, followers, audience.

ACCESSIBILITY
contentDescription for: direction card, start/continue direction, practice step,
complete step, step status, coming-soon direction, open practice. ~48dp tap targets.

BUILD + QA
Run: .\gradlew.bat assembleDebug  (fix all compile errors; re-run until green)
Then verify (or report unverified):
1 Discover features Confident Communication with real progress.
2 Detail sheet shows 6 steps + what-you-practice.
3 Start direction -> Home Today's Focus = Confident Communication, active step = step 1.
4 Completing a step advances progress and active step.
5 Profile "Practices completed" increments.
6 Submit-proof step opens Submit Proof; submit completes the step; proof shows in Activity.
7 Use-feedback step completes when feedback is used.
8 Completing all steps shows a calm Path complete state, no crash.
9 Other directions show "Coming soon" and are not browsable.
10 Re-opening Discover shows "Continue" with current progress.
11 No duplicate practice lists; build passes.

FINAL REPORT
Report: files created/changed, the data model, confirmation PracticeRepository is the single
source of truth, how Discover drives Home, how step completion connects to proof + trust, how
duplicate state was avoided, build result, QA results, and any limitations.
