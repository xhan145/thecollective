package com.collective.app.data

enum class FeedPostType {
    PROOF_VIDEO,
    PROGRESS_STORY,
    MINI_LESSON,
    ENCOURAGEMENT
}

data class UserProfile(
    val id: String,
    val name: String,
    val subtitle: String,
    val initials: String,
    val bio: String = "",
)

data class Path(
    val id: String,
    val title: String,
    val tagline: String,
    val description: String,
    val members: String,
    val journeys: Int,
    val progress: Float,
)

typealias CollectivePath = Path

data class Milestone(
    val title: String,
    val description: String,
    val state: String,
)

data class FeedPost(
    val id: String,
    val type: FeedPostType,
    val label: String?,
    val user: UserProfile,
    val subtitle: String,
    val timestamp: String,
    val text: String,
    val title: String? = null,
    val body: String? = null,
    val supportCount: Int = 0,
    val commentCount: Int = 0,
    val duration: String? = null,
)

data class Contributor(
    val name: String,
    val role: String,
    val description: String,
    val initials: String,
)

data class Proof(
    val user: String,
    val status: String,
    val text: String,
    val supportCount: Int,
    val initials: String,
)

data class ProofPost(
    val id: String,
    val title: String,
    val practiceArea: String,
    val reflection: String,
    val mediaType: String,
    val visibility: String,
    val status: String,
)

data class ProgressMetric(
    val title: String,
    val value: String,
    val helper: String,
)

data class ProgressPath(
    val name: String,
    val subtitle: String,
    val progress: Float,
    val colorName: String,
)

data class FeedbackNote(
    val author: String,
    val text: String,
    val timestamp: String,
    val initials: String,
)

data class FeedbackItem(
    val title: String,
    val body: String,
    val tone: String,
)

data class Win(
    val title: String,
    val helper: String,
    val timestamp: String,
)

data class PracticePrompt(
    val pathId: String,
    val label: String,
    val prompt: String,
    val description: String,
    val tips: List<String>,
)

data class ActivityItem(
    val title: String,
    val body: String,
    val category: String,
    val timestamp: String,
)

data class ContributionAction(
    val title: String,
    val body: String,
    val requirement: String,
)

data class PlanOption(
    val title: String,
    val priceLabel: String,
    val body: String,
)

data class LabSpace(
    val title: String,
    val purpose: String,
    val requirement: String,
    val activity: String,
)

data class CommunityIdea(
    val title: String,
    val body: String,
    val status: String,
)

data class TrustSignal(
    val label: String,
    val value: String,
    val helper: String,
)

data class ProfileStat(
    val label: String,
    val value: String,
)

object MockData {
    val currentUser = UserProfile(
        id = "alyssa",
        name = "Alyssa Chen",
        subtitle = "90 Day Confidence Journey",
        initials = "AC",
        bio = "Building confidence through small consistent practice.",
    )

    val categories = listOf("For You", "Communication", "Confidence", "Habits", "Cooking")

    val onboardingGoals = listOf(
        "Communicate with confidence",
        "Build better habits",
        "Share my ideas clearly",
        "Become more consistent",
        "Give better feedback",
        "Help others grow",
    )

    val communicationPath = Path(
        id = "communication",
        title = "Communication: Speak Clearly in Hard Conversations",
        tagline = "Speak clearly. Connect deeply. Lead confidently.",
        description = "Build confidence through small real-world reps, proof, and feedback.",
        members = "12.4K members",
        journeys = 8,
        progress = 0.35f,
    )

    val milestones = listOf(
        Milestone("Find Your Voice", "Explore what you want to say and why.", "Completed"),
        Milestone("Speak Up Once", "Share a thought in a low-stakes setting.", "Active"),
        Milestone("Short Storytelling", "Structure and share a 60-second story.", "Locked"),
        Milestone("Record Yourself", "Practice on camera and reflect.", "Locked"),
        Milestone("Lead a Conversation", "Guide a real conversation with confidence.", "Locked"),
    )

    val contributors = listOf(
        Contributor("Alyssa Chen", "Helpful Contributor", "Helps members find their voice and speak with clarity.", "AC"),
        Contributor("Noah Patel", "Communication Coach", "Guides practical steps to build real confidence.", "NP"),
        Contributor("Taylor Morgan", "Community Mentor", "Encourages growth through supportive feedback.", "TM"),
    )

    val proofs = listOf(
        Proof("Maya R.", "Completed step 2", "I spoke up in my team meeting today. Small step, big win.", 24, "MR"),
        Proof("Jordan L.", "Completed step 3", "My 60-second story went so much better than I expected.", 18, "JL"),
        Proof("Priya S.", "Complete", "Recording myself felt awkward at first but totally helped.", 16, "PS"),
    )

    val proofPosts = listOf(
        ProofPost(
            id = "demo-proof",
            title = "30-second feedback practice",
            practiceArea = "Communication Confidence",
            reflection = "I practiced naming what worked, sharing one useful suggestion, and ending with encouragement.",
            mediaType = "Video",
            visibility = "Path Only",
            status = "Submitted",
        )
    )

    val feedPosts = listOf(
        FeedPost(
            id = "jordan-proof",
            type = FeedPostType.PROOF_VIDEO,
            label = null,
            user = UserProfile("jordan", "Jordan Lee", "Building Communication Confidence", "JL"),
            subtitle = "Building Communication Confidence",
            timestamp = "2h",
            text = "Gave a presentation to my team today and felt actually confident for the first time.",
            supportCount = 24,
            commentCount = 6,
            duration = "0:28",
        ),
        FeedPost(
            id = "alyssa-story",
            type = FeedPostType.PROGRESS_STORY,
            label = "Progress Story",
            user = currentUser,
            subtitle = "90 Day Confidence Journey",
            timestamp = "5h",
            text = "3 months of showing up for myself. Still a work in progress, but proud of how far I have come.",
            supportCount = 37,
            commentCount = 12,
        ),
        FeedPost(
            id = "noah-lesson",
            type = FeedPostType.MINI_LESSON,
            label = "Mini Lesson",
            user = UserProfile("noah", "Noah Patel", "Communication Coach", "NP"),
            subtitle = "Communication Coach",
            timestamp = "1d",
            text = "",
            title = "One simple way to sound more confident",
            body = "Start your sentences with clarity. Replace 'I think...' with 'Here is what I believe...'",
            supportCount = 18,
            commentCount = 4,
        ),
        FeedPost(
            id = "taylor-encouragement",
            type = FeedPostType.ENCOURAGEMENT,
            label = "Encouragement",
            user = UserProfile("taylor", "Taylor Morgan", "Community Mentor", "TM"),
            subtitle = "supported your proof",
            timestamp = "3h",
            text = "Love this. Your growth is inspiring others to speak up too. Keep leading by example.",
        ),
    )

    val practicePrompt = PracticePrompt(
        pathId = "communication",
        label = "Today's Practice",
        prompt = "Give useful feedback in 3 parts",
        description = "Practice giving feedback that is clear, kind, and useful.",
        tips = listOf(
            "Name what worked",
            "Share one improvement",
            "End with encouragement",
        ),
    )

    val progressMetrics = listOf(
        ProgressMetric("7 Day Streak", "7", "Keep it going."),
        ProgressMetric("Weekly Momentum", "82%", "Up 12% from last week."),
        ProgressMetric("Active Paths", "3", "Keep growing."),
    )

    val progressPaths = listOf(
        ProgressPath("Communication", "Building Communication Confidence", 0.72f, "green"),
        ProgressPath("Habits", "Build Consistent Daily Habits", 0.58f, "gold"),
        ProgressPath("Cooking", "Cook With Confidence", 0.45f, "purple"),
    )

    val wins = listOf(
        Win("7 day streak", "Amazing consistency.", "2h ago"),
        Win("First proof posted", "You shared your progress", "1d ago"),
        Win("Continued momentum", "5 days in a row", "2d ago"),
    )

    val feedback = listOf(
        FeedbackNote("Jordan Lee", "Loved your update. Your confidence is showing.", "2h ago", "JL"),
        FeedbackNote("Taylor Morgan", "Great insight here - this really resonated.", "1d ago", "TM"),
        FeedbackNote("Noah Patel", "Super helpful tip. Keep going strong.", "2d ago", "NP"),
    )

    val feedbackExamples = listOf(
        FeedbackItem("Useful feedback", "Your opening was clear. One next step: slow down between ideas so people can follow.", "Specific"),
        FeedbackItem("Vague feedback", "Good job, keep it up.", "Too broad"),
    )

    val trustSignals = listOf(
        TrustSignal("Proof shared", "12", "Evidence over performance"),
        TrustSignal("Feedback given", "18", "Useful support for others"),
        TrustSignal("Practice streak", "7", "Small reps, repeated"),
    )

    val profileStats = listOf(
        ProfileStat("Proofs shared", "12"),
        ProfileStat("Practices completed", "24"),
        ProfileStat("Feedback given", "18"),
        ProfileStat("Paths active", "3"),
    )

    val activity = listOf(
        ActivityItem("Taylor supported your proof", "Your communication rep helped others feel less alone.", "Support", "2h"),
        ActivityItem("Noah gave feedback", "One useful suggestion was added to your practice.", "Feedback", "5h"),
        ActivityItem("Jordan tried your tip", "Your mini lesson helped someone start a rep.", "Proofs", "1d"),
        ActivityItem("You completed a 7-day streak", "Consistency is turning into evidence.", "Milestones", "1d"),
        ActivityItem("Maya thanked you", "Your feedback helped her take the next step.", "Feedback", "2d"),
    )

    val contributionActions = listOf(
        ContributionAction("Give feedback", "Help someone turn proof into a next step.", "Beginner-safe tone"),
        ContributionAction("Share a lesson", "Offer a tiny practice insight from your own reps.", "Complete 3 practices"),
        ContributionAction("Encourage a beginner", "Support a member who just shared their first proof.", "Kind and specific"),
        ContributionAction("Create a practice prompt", "Shape a small action others can try.", "5 helpful feedback notes"),
        ContributionAction("Review proof", "Notice what someone practiced and what could help.", "Consistent contribution"),
    )

    val planOptions = listOf(
        PlanOption("Free Practice", "$0", "Core paths, proof journal, and supportive feedback prompts."),
        PlanOption("Guided Path", "Support", "More structure, reminders, and deeper practice templates."),
        PlanOption("Small Group Support", "Group", "Practice alongside a small circle with shared norms."),
        PlanOption("Mentor Session", "1:1", "Pay for support and structure, never trust or status."),
    )

    val labs = listOf(
        LabSpace("Communication Lab", "Practice hard conversations with clear feedback.", "Evidence-ready trust", "Feedback sprint this week"),
        LabSpace("Confidence Lab", "Turn hesitation into small public reps.", "3 proofs shared", "Intro challenge active"),
        LabSpace("Habits Lab", "Build systems that keep momentum visible.", "7-day streak", "Morning reset practice"),
        LabSpace("Creator Practice Lab", "Share ideas with clarity and care.", "Helpful feedback history", "Prompt workshop"),
    )

    val ideas = listOf(
        CommunityIdea("New path suggestion", "A path for asking better questions in meetings.", "Under Review"),
        CommunityIdea("Practice prompt idea", "A 2-minute proof for introducing yourself.", "Planned"),
        CommunityIdea("Safety improvement", "More examples of kind correction.", "Shipped"),
        CommunityIdea("Community feature", "Save feedback examples that helped.", "Under Review"),
    )

    val councilEligibility = listOf(
        "Helpful feedback history",
        "Beginner-safe behavior",
        "Consistent contribution",
        "Community trust",
    )

    val councilActivities = listOf(
        "Review community ideas",
        "Suggest path improvements",
        "Help improve safety norms",
        "Mentor new contributors",
    )
}
