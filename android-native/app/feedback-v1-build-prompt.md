You are working in my existing Android project for Collective (Kotlin + Jetpack Compose).
Read CLAUDE.md at the repo root first and treat it as the standing instruction file.

CONTEXT
A "Feedback V1" pass was just added to the codebase. Your job is NOT to redesign it.
Your job is to make it BUILD on this machine, fix any compile errors, verify it against
the quality bar, and report. Preserve all existing working behavior (proof capture,
navigation, brand system, Home visual design).

The running app uses the lightweight `ui/proof` + `ui/feedback` repository pattern
(plain classes exposing StateFlow, instantiated in ui/CollectiveApp.kt). It does NOT use
the older data/repository/* scaffold (FeedbackRepository/TrustRepository there). Do not
rewire the app onto data/repository/* — keep the active ui-layer pattern.

NEW FILES (should already exist — inspect, do not recreate)
- ui/feedback/FeedbackModels.kt        (FeedbackTone, FeedbackStatus, FeedbackItem,
                                        FeedbackDraftState, feedbackToneLabel,
                                        feedbackStatusLabel, relativeFeedbackTime)
- ui/feedback/FeedbackRepository.kt     (interface)
- ui/feedback/MockFeedbackRepository.kt (in-memory StateFlow; seeds attach by stable
                                        proofId: 3 notes on "proof-team-meeting",
                                        1 on "proof-planning-question")
- ui/feedback/FeedbackViewModel.kt      (plain state holder, no DI; trust callback)
- ui/feedback/FeedbackComponents.kt     (FeedbackToneChip, FeedbackToneSelector,
                                        FeedbackSummaryCard, FeedbackList,
                                        AddFeedbackSheetContent, FeedbackSuccessState,
                                        EmptyFeedbackState)

EDITED FILES (inspect for correctness)
- ui/proof/ProofComponents.kt   (ProofDetailSheetContent now takes
                                 (proof, feedback: List<FeedbackItem>, onUseFeedback,
                                 onAddFeedback, onClose); ProofSummaryCard gained a
                                 defaulted feedbackCount param; removed mockFeedbackNotes
                                 and ProofFeedbackList)
- ui/home/HomeUiState.kt        (TrustSnapshotState gained `feedbackUsed: Int`;
                                 HomeSheet gained `AddFeedback`)
- ui/home/HomeViewModel.kt      (onFeedbackUsed, onUnreadFeedbackCountChanged,
                                 onAddFeedbackClicked, trustLabelForFeedbackUsed)
- ui/home/HomeSampleData.kt     (TrustSnapshotState includes feedbackUsed)
- ui/CollectiveApp.kt           (creates MockFeedbackRepository + FeedbackViewModel,
                                 wires unread-feedback count to the bell)
- ui/CollectiveNavGraph.kt      (threads feedbackViewModel to Home + Activity)
- ui/CollectiveHomeScreen.kt    (feedback count on recent-proof card, notifications
                                 sheet from unread feedback, ProofDetail + AddFeedback
                                 sheets)
- ui/activity/ActivityScreen.kt (recent proof with real counts; "Feedback received"
                                 from FeedbackRepository; proof detail + add-feedback)
- ui/profile/ProfileScreen.kt   ("Feedback used" row; trust copy updated)

INVARIANTS TO ENFORCE WHILE FIXING
- FeedbackRepository is the single source of truth. No hardcoded feedback lists remain
  in Activity, Home, or Proof Detail.
- Feedback is linked to proof by proofId.
- Do NOT add: backend, auth, Supabase, networking, database, OpenAI/AI calls, uploads,
  public feed, comments, likes, followers, scoring, grading, leaderboards, monetization.
- Keep brand: CollectiveTokens, CollectiveCard / shared components, cream/gold, rounded
  cards, soft lines. No harsh default Material styling.
- Beginner-safe copy only. Use "feedback note", never "comment".
- Accessibility: content descriptions on feedback item, use feedback, add feedback note,
  select tone, save feedback, feedback status, open proof detail, close sheet; ~48dp tap
  targets.

STEPS
1. Inspect the files above. Report anything missing or inconsistent before building.
2. Run the build:
       .\gradlew.bat assembleDebug
3. If it fails, fix every compile error. Prefer minimal, local fixes that preserve the
   architecture and the invariants above. Re-run until the build passes. Do not silence
   errors by deleting features.
4. After a green build, do a manual QA pass (or report which steps you could not verify):
   - Activity → open the seeded "team meeting" proof → 3 real feedback notes show.
   - Tap "Use feedback" → item flips to "Used for practice"; Profile "Feedback used"
     increments; trust label updates.
   - Open a proof with no feedback → "No feedback yet. Feedback can come next."
   - "Add feedback note" → save empty → validation "Write one useful note before
     submitting feedback."; save a real note → success → it appears on the proof and in
     Activity "Feedback received".
   - Home recent-proof card shows the real count; bell reflects unread feedback and its
     sheet opens the related proof.

FINAL REPORT
Report: files changed (if any fixes were needed), the exact build result, any errors you
fixed and how, QA results (verified vs not), and any remaining limitations. Confirm no
prohibited features were added and that FeedbackRepository remains the single source of
truth.
