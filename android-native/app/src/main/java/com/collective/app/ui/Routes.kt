package com.collective.app.ui

object Routes {
    const val Onboarding = "onboarding"
    const val Home = "home"
    const val PathDetailPattern = "pathDetail/{pathId}"
    const val PracticePattern = "practice/{pathId}"
    const val ProofSubmissionPattern = "proofSubmission/{pathId}"
    const val FeedbackPattern = "feedback/{proofId}"
    const val Progress = "progress"
    const val Profile = "profile"
    const val Activity = "activity"
    const val ContributionHub = "contributionHub"
    const val Mentorship = "mentorship"
    const val CouncilLabs = "councilLabs"
    const val SponsoredAccess = "sponsoredAccess"
    const val BusinessStudio = "businessStudio"
    const val CommunityIdeas = "communityIdeas"
    const val ContributorCouncil = "contributorCouncil"
    const val PrototypeMap = "prototypeMap"

    fun pathDetail(pathId: String) = "pathDetail/$pathId"
    fun practice(pathId: String) = "practice/$pathId"
    fun proofSubmission(pathId: String) = "proofSubmission/$pathId"
    fun feedback(proofId: String) = "feedback/$proofId"
}

data class PrototypePage(
    val title: String,
    val route: String,
)

val prototypePages = listOf(
    PrototypePage("Onboarding", Routes.Onboarding),
    PrototypePage("Home / Discovery Feed", Routes.Home),
    PrototypePage("Path Page", Routes.pathDetail("communication")),
    PrototypePage("Practice Screen", Routes.practice("communication")),
    PrototypePage("Proof Submission", Routes.proofSubmission("communication")),
    PrototypePage("Feedback Screen", Routes.feedback("demo-proof")),
    PrototypePage("Progress Dashboard", Routes.Progress),
    PrototypePage("Profile", Routes.Profile),
    PrototypePage("Notifications / Activity", Routes.Activity),
    PrototypePage("Contribution Hub", Routes.ContributionHub),
    PrototypePage("Mentorship / Plans", Routes.Mentorship),
    PrototypePage("Council Circle / Labs", Routes.CouncilLabs),
    PrototypePage("Sponsored Access", Routes.SponsoredAccess),
    PrototypePage("Business / Studio", Routes.BusinessStudio),
    PrototypePage("Community Ideas", Routes.CommunityIdeas),
    PrototypePage("Contributor Council", Routes.ContributorCouncil),
)
