package com.collective.app.beta.data

import com.collective.app.beta.config.BetaConfig
import com.collective.app.beta.model.AppFeedback
import com.collective.app.beta.model.AppFeedbackImportance
import com.collective.app.beta.model.AppFeedbackScreen
import com.collective.app.beta.model.AppFeedbackType
import com.collective.app.beta.model.Cohort
import com.collective.app.beta.model.Direction
import com.collective.app.beta.model.Feedback
import com.collective.app.beta.model.PracticeDifficulty
import com.collective.app.beta.model.PracticePrompt
import com.collective.app.beta.model.Proof
import com.collective.app.beta.model.ProofAttachment
import com.collective.app.beta.model.ProofType
import com.collective.app.beta.model.TrustEvent
import com.collective.app.beta.model.TrustEventType
import com.collective.app.beta.model.UserProfile
import com.collective.app.beta.model.pointsFor

/**
 * Deterministic in-memory seed for the Founding Circle cohort. Uses fixed epoch constants (not the
 * wall clock) so ordering is stable across runs. Mirrors the data shapes Firestore will hold later.
 */
object BetaSeed {

    private const val COHORT = BetaConfig.DEFAULT_COHORT_ID
    private const val T0 = 1_717_000_000_000L // fixed reference epoch (~May 2024)
    private const val DAY = 86_400_000L
    private const val HOUR = 3_600_000L

    val cohort = Cohort(
        id = COHORT,
        name = "Founding Circle",
        inviteCode = "FOUNDING-10",
        isClosed = true,
        createdAt = T0,
    )

    // ----- Users (10) -------------------------------------------------------------------------

    val users: List<UserProfile> = listOf(
        user("user-alex", "Alex", "confidence"),
        user("user-jordan", "Jordan", "communication"),
        user("user-taylor", "Taylor", "communication"),
        user("user-morgan", "Morgan", "momentum"),
        user("user-casey", "Casey", "self-trust"),
        user("user-riley", "Riley", "contribution"),
        user("user-sam", "Sam", "momentum"),
        user("user-jamie", "Jamie", "confidence"),
        user("user-drew", "Drew", "self-trust"),
        user("user-quinn", "Quinn", "contribution"),
    )

    private fun user(id: String, name: String, directionId: String?) = UserProfile(
        id = id,
        displayName = name,
        cohortId = COHORT,
        selectedDirectionId = directionId,
        createdAt = T0,
    )

    // ----- Directions (5) ---------------------------------------------------------------------

    val directions: List<Direction> = listOf(
        Direction("confidence", "Confident Communication", "Express yourself clearly and share ideas with calm confidence.", "confidence"),
        Direction("communication", "Better Feedback", "Ask better questions and give responses that actually help.", "communication"),
        Direction("momentum", "Momentum", "Small consistent steps, no pressure.", "momentum"),
        Direction("self-trust", "Showing Your Work", "Turn small honest efforts into visible proof.", "self-trust"),
        Direction("contribution", "Contribution", "Be useful to someone else.", "contribution"),
    )

    // ----- Practice prompts (>=2 per direction) -----------------------------------------------

    val prompts: List<PracticePrompt> = listOf(
        prompt(
            "prompt-confidence-intro", "confidence", "Record a 30-second introduction",
            "A short, friendly hello — no script needed.", 2,
            listOf(ProofType.VIDEO, ProofType.AUDIO), PracticeDifficulty.STARTER,
            "Hearing yourself builds comfort faster than planning does.",
            listOf("\"Hi, I'm Alex and I'm practicing speaking up.\"", "Keep it under a minute."),
        ),
        prompt(
            "prompt-confidence-win", "confidence", "Share one small win from today",
            "Name something that went okay. It counts.", 2,
            listOf(ProofType.TEXT, ProofType.AUDIO), PracticeDifficulty.STARTER,
            "Noticing wins trains your brain to see progress.",
            listOf("\"I asked a question in the meeting.\""),
        ),
        prompt(
            "prompt-communication-explain", "communication", "Turn vague praise into useful feedback",
            "Rewrite \"looks good\" into what worked plus one suggestion.", 5,
            listOf(ProofType.TEXT), PracticeDifficulty.GROWING,
            "Specific feedback helps far more than kind-but-vague praise.",
            listOf("\"What worked: the opening was clear. One suggestion: shorten the middle.\""),
        ),
        prompt(
            "prompt-communication-question", "communication", "Ask one better question",
            "Turn a vague question into a specific one.", 3,
            listOf(ProofType.TEXT), PracticeDifficulty.STARTER,
            "Better questions get better, kinder answers.",
            listOf("Instead of \"does this look ok?\" try \"is the opening clear?\""),
        ),
        prompt(
            "prompt-momentum-reset", "momentum", "Do one 10-minute reset",
            "Tidy one small space or list for ten minutes.", 10,
            listOf(ProofType.IMAGE, ProofType.TEXT), PracticeDifficulty.STARTER,
            "Momentum comes from finishing something small.",
            listOf("One drawer. One inbox. One short list."),
        ),
        prompt(
            "prompt-momentum-step", "momentum", "Complete the next obvious step",
            "Do the one step you have been avoiding.", 5,
            listOf(ProofType.TEXT, ProofType.IMAGE), PracticeDifficulty.GROWING,
            "The next obvious step is usually enough.",
            emptyList(),
        ),
        prompt(
            "prompt-selftrust-promise", "self-trust", "Capture one small proof of today's effort",
            "Take one photo, note, or short clip of something you actually did.", 3,
            listOf(ProofType.IMAGE, ProofType.TEXT), PracticeDifficulty.STARTER,
            "Making effort visible turns practice into progress you can build on.",
            listOf("A photo of your notes.", "Two honest lines about what you tried."),
        ),
        prompt(
            "prompt-selftrust-reflect", "self-trust", "Reflect on one choice you made",
            "Write a few honest lines about a recent choice.", 5,
            listOf(ProofType.TEXT, ProofType.AUDIO), PracticeDifficulty.GROWING,
            "Reflection turns experience into self-knowledge.",
            emptyList(),
        ),
        prompt(
            "prompt-contribution-feedback", "contribution", "Give useful feedback to one person",
            "Leave kind, specific feedback on someone's proof.", 5,
            listOf(ProofType.TEXT), PracticeDifficulty.GROWING,
            "Helping one person is real contribution.",
            listOf("Name what worked, then one small suggestion."),
        ),
        prompt(
            "prompt-contribution-resource", "contribution", "Share a resource that helped you",
            "Pass along one thing that made something easier.", 3,
            listOf(ProofType.TEXT, ProofType.IMAGE), PracticeDifficulty.STARTER,
            "Sharing what helped you helps the next person.",
            emptyList(),
        ),
    )

    private fun prompt(
        id: String,
        directionId: String,
        title: String,
        shortDescription: String,
        minutes: Int,
        proofTypes: List<ProofType>,
        difficulty: PracticeDifficulty,
        whyItHelps: String,
        examples: List<String>,
    ) = PracticePrompt(
        id = id,
        directionId = directionId,
        title = title,
        shortDescription = shortDescription,
        estimatedMinutes = minutes,
        proofTypes = proofTypes,
        difficulty = difficulty,
        whyItHelps = whyItHelps,
        examples = examples,
    )

    // ----- Proofs (across users; some with 0 feedback so the feed has "needs feedback" items) ---

    val proofs: List<Proof> = listOf(
        proof(
            "proof-alex-win", "user-alex", "Alex", "confidence", "prompt-confidence-win",
            "Share one small win from today",
            "I spoke first in our standup instead of waiting. Small, but it felt good.",
            ProofType.TEXT, null, feedbackCount = 1, offset = 6 * DAY,
        ),
        proof(
            "proof-jordan-intro", "user-jordan", "Jordan", "confidence", "prompt-confidence-intro",
            "Record a 30-second introduction",
            "First time recording myself saying hello. Re-did it twice and kept the third take.",
            ProofType.VIDEO, "video/mp4", feedbackCount = 2, offset = 5 * DAY,
        ),
        proof(
            "proof-taylor-question", "user-taylor", "Taylor", "communication", "prompt-communication-question",
            "Ask one better question",
            "Reworded a fuzzy request into: \"Is the intro paragraph clear, or should I cut it?\"",
            ProofType.TEXT, null, feedbackCount = 0, offset = 4 * DAY,
        ),
        proof(
            "proof-morgan-reset", "user-morgan", "Morgan", "momentum", "prompt-momentum-reset",
            "Do one 10-minute reset",
            "Ten minutes on my desktop files. Recorded a quick voice note about how it felt.",
            ProofType.AUDIO, "audio/mp4", feedbackCount = 0, offset = 3 * DAY,
        ),
        proof(
            "proof-casey-choice", "user-casey", "Casey", "self-trust", "prompt-selftrust-reflect",
            "Reflect on one choice you made",
            "Reflected on saying no to an extra task. It was the right call for my week.",
            ProofType.TEXT, null, feedbackCount = 1, offset = 2 * DAY,
        ),
        proof(
            "proof-riley-resource", "user-riley", "Riley", "contribution", "prompt-contribution-resource",
            "Share a resource that helped you",
            "Shared a one-page checklist that helped me prep for calls. Screenshot attached.",
            ProofType.IMAGE, "image/png", feedbackCount = 0, offset = 1 * DAY,
        ),
        proof(
            "proof-sam-step", "user-sam", "Sam", "momentum", "prompt-momentum-step",
            "Complete the next obvious step",
            "Finally sent the email I'd been avoiding for a week. Done is done.",
            ProofType.TEXT, null, feedbackCount = 0, offset = 6 * HOUR,
        ),
    )

    private fun proof(
        id: String,
        ownerId: String,
        ownerName: String,
        directionId: String,
        promptId: String,
        promptTitle: String,
        reflection: String,
        type: ProofType,
        mimeType: String?,
        feedbackCount: Int,
        offset: Long,
    ): Proof {
        val createdAt = T0 + offset
        val attachments = if (type == ProofType.TEXT) {
            emptyList()
        } else {
            listOf(
                ProofAttachment(
                    id = "att-$id",
                    type = type,
                    localUri = null,
                    remoteUrl = null,
                    mimeType = mimeType,
                    createdAt = createdAt,
                ),
            )
        }
        return Proof(
            id = id,
            ownerUserId = ownerId,
            ownerDisplayName = ownerName,
            cohortId = COHORT,
            directionId = directionId,
            promptId = promptId,
            promptTitle = promptTitle,
            reflectionText = reflection,
            attachments = attachments,
            feedbackCount = feedbackCount,
            createdAt = createdAt,
            updatedAt = createdAt,
        )
    }

    // ----- Peer feedback ----------------------------------------------------------------------

    val feedback: List<Feedback> = listOf(
        feedback(
            "fb-alexwin-jordan", "proof-alex-win", "user-alex", "user-jordan", "Jordan",
            whatWorked = "Going first takes nerve — nice.",
            suggestion = "Maybe note what made it easier this time.",
            encouragement = "This is exactly the kind of small win that adds up.",
            helpful = false, offset = 6 * DAY + 2 * HOUR,
        ),
        feedback(
            "fb-jordanintro-taylor", "proof-jordan-intro", "user-jordan", "user-taylor", "Taylor",
            whatWorked = "Your tone was warm and easy to follow.",
            suggestion = "A tiny pause after your name would land it even better.",
            encouragement = "Three takes shows real commitment. Well done.",
            helpful = true, offset = 5 * DAY + 3 * HOUR,
        ),
        feedback(
            "fb-jordanintro-casey", "proof-jordan-intro", "user-jordan", "user-casey", "Casey",
            whatWorked = "Clear and genuine — felt like you, not a script.",
            suggestion = "Try looking at the lens once at the start.",
            encouragement = "Recording yourself is hard; you made it look natural.",
            helpful = false, offset = 5 * DAY + 5 * HOUR,
        ),
        feedback(
            "fb-caseychoice-morgan", "proof-casey-choice", "user-casey", "user-morgan", "Morgan",
            whatWorked = "Honest reflection — saying no is a real skill.",
            suggestion = "Maybe note one signal that told you it was the right call.",
            encouragement = "Protecting your week is self-trust in action.",
            helpful = false, offset = 2 * DAY + 4 * HOUR,
        ),
    )

    private fun feedback(
        id: String,
        proofId: String,
        ownerId: String,
        giverId: String,
        giverName: String,
        whatWorked: String,
        suggestion: String,
        encouragement: String,
        helpful: Boolean,
        offset: Long,
    ) = Feedback(
        id = id,
        proofId = proofId,
        proofOwnerUserId = ownerId,
        giverUserId = giverId,
        giverDisplayName = giverName,
        cohortId = COHORT,
        whatWorked = whatWorked,
        suggestion = suggestion,
        encouragement = encouragement,
        isMarkedHelpful = helpful,
        createdAt = T0 + offset,
    )

    // ----- Trust events (give members varied calm starting progress) --------------------------

    val trustEvents: List<TrustEvent> = buildList {
        // Alex (founder) — Reliable-ish
        addEvents("user-alex", TrustEventType.PRACTICE_COMPLETED, 5)
        addEvents("user-alex", TrustEventType.PROOF_SUBMITTED, 3)
        addEvents("user-alex", TrustEventType.FEEDBACK_GIVEN, 4)
        addEvents("user-alex", TrustEventType.FEEDBACK_MARKED_HELPFUL, 2)
        // Jordan — Practicing
        addEvents("user-jordan", TrustEventType.PRACTICE_COMPLETED, 2)
        addEvents("user-jordan", TrustEventType.PROOF_SUBMITTED, 2)
        addEvents("user-jordan", TrustEventType.FEEDBACK_GIVEN, 2)
        // Taylor — Practicing
        addEvents("user-taylor", TrustEventType.PRACTICE_COMPLETED, 3)
        addEvents("user-taylor", TrustEventType.FEEDBACK_GIVEN, 2)
        // Casey — Reliable
        addEvents("user-casey", TrustEventType.PRACTICE_COMPLETED, 6)
        addEvents("user-casey", TrustEventType.PROOF_SUBMITTED, 3)
        addEvents("user-casey", TrustEventType.FEEDBACK_GIVEN, 5)
        addEvents("user-casey", TrustEventType.FEEDBACK_MARKED_HELPFUL, 1)
        // Morgan — New/Practicing
        addEvents("user-morgan", TrustEventType.PRACTICE_COMPLETED, 2)
        addEvents("user-morgan", TrustEventType.PROOF_SUBMITTED, 1)
        // Riley, Sam, Jamie, Drew, Quinn — light starts
        addEvents("user-riley", TrustEventType.PRACTICE_COMPLETED, 1)
        addEvents("user-riley", TrustEventType.PROOF_SUBMITTED, 1)
        addEvents("user-sam", TrustEventType.PRACTICE_COMPLETED, 1)
        addEvents("user-jamie", TrustEventType.PRACTICE_COMPLETED, 2)
        addEvents("user-drew", TrustEventType.PRACTICE_COMPLETED, 1)
        addEvents("user-quinn", TrustEventType.PRACTICE_COMPLETED, 3)
        addEvents("user-quinn", TrustEventType.FEEDBACK_GIVEN, 3)
    }

    private fun MutableList<TrustEvent>.addEvents(userId: String, type: TrustEventType, count: Int) {
        repeat(count) { i ->
            add(
                TrustEvent(
                    id = "seed-trust-$userId-${type.name}-$i",
                    userId = userId,
                    cohortId = COHORT,
                    type = type,
                    points = pointsFor(type),
                    sourceId = null,
                    createdAt = T0 + i * HOUR,
                ),
            )
        }
    }

    // ----- App feedback (founder/dev review) --------------------------------------------------

    val appFeedback: List<AppFeedback> = listOf(
        AppFeedback(
            id = "appfb-1", userId = "user-taylor", userDisplayName = "Taylor", cohortId = COHORT,
            type = AppFeedbackType.TOO_MUCH_TEXT, screen = AppFeedbackScreen.HOME,
            message = "The home screen feels useful, but I did not know where to start at first.",
            importance = AppFeedbackImportance.MEDIUM, createdAt = T0 + 4 * DAY,
        ),
        AppFeedback(
            id = "appfb-2", userId = "user-morgan", userDisplayName = "Morgan", cohortId = COHORT,
            type = AppFeedbackType.CONFUSING, screen = AppFeedbackScreen.PROOF_CAPTURE,
            message = "I was not sure if my proof would be public or only shown to the group.",
            importance = AppFeedbackImportance.IMPORTANT, createdAt = T0 + 3 * DAY,
        ),
        AppFeedback(
            id = "appfb-3", userId = "user-casey", userDisplayName = "Casey", cohortId = COHORT,
            type = AppFeedbackType.USEFUL, screen = AppFeedbackScreen.PEER_FEEDBACK,
            message = "The structured feedback fields made it easier to respond.",
            importance = AppFeedbackImportance.SMALL, createdAt = T0 + 2 * DAY,
        ),
        AppFeedback(
            id = "appfb-4", userId = "user-riley", userDisplayName = "Riley", cohortId = COHORT,
            type = AppFeedbackType.MISSING_FEATURE, screen = AppFeedbackScreen.PRACTICE,
            message = "I wanted a way to save a prompt for later.",
            importance = AppFeedbackImportance.MEDIUM, createdAt = T0 + 1 * DAY,
        ),
    )
}
