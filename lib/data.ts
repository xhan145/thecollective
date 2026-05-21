import type { FeedItem, GrowthPath, MediaKind, MediaProofSpotlight, PracticePrompt, ProofSubmission, ProofType, ProofVisibility } from "./types";

export const paths: GrowthPath[] = [
  { slug: "speak-up", title: "Speak Up", description: "Build confidence and communicate clearly.", promise: "Practice direct, respectful expression in small steps.", color: "from-orange-400 to-orange-600", estimatedDays: 14 },
  { slug: "social-momentum", title: "Social Momentum", description: "Build connection through small social actions.", promise: "Stop waiting to feel ready and practice reaching out.", color: "from-green-400 to-emerald-600", estimatedDays: 14 },
  { slug: "daily-momentum", title: "Daily Momentum", description: "Build consistency through tiny useful actions.", promise: "Turn stuck energy into visible progress.", color: "from-blue-400 to-indigo-600", estimatedDays: 14 },
  { slug: "give-better-feedback", title: "Give Better Feedback", description: "Learn to help others with specific feedback.", promise: "Become useful without pretending to be an expert.", color: "from-purple-400 to-fuchsia-600", estimatedDays: 7 }
];

export const prompts: PracticePrompt[] = [
  { id: "speak-up-1", pathSlug: "speak-up", title: "One Honest Sentence", instruction: "Write one sentence you would say if you were being honest but respectful. You can prove it with text, audio, a screenshot, or a private draft.", proofType: "text", reflectionQuestion: "What made this hard to say?", feedbackQuestion: "Do you want feedback on clarity, tone, or courage?", estimatedMinutes: 5, order: 1 },
  { id: "speak-up-2", pathSlug: "speak-up", title: "One Clear Preference", instruction: "Name one preference today without apologizing for having it. Upload text, audio, video practice, or a screenshot if that helps.", proofType: "text", reflectionQuestion: "Where did you soften the statement?", feedbackQuestion: "Was the preference clear and respectful?", estimatedMinutes: 5, order: 2 },
  { id: "speak-up-3", pathSlug: "speak-up", title: "Ask Directly", instruction: "Write one clear ask with a specific action and timeline. Use the proof format that best captures the attempt.", proofType: "text", reflectionQuestion: "What part of being direct feels risky?", feedbackQuestion: "Is the ask specific enough?", estimatedMinutes: 7, order: 3 },
  { id: "social-1", pathSlug: "social-momentum", title: "Thoughtful Message", instruction: "Send or draft one thoughtful message to someone you have been meaning to reach out to.", proofType: "screenshot", reflectionQuestion: "What made you choose this person?", feedbackQuestion: "Does the message feel warm and low-pressure?", estimatedMinutes: 8, order: 1 },
  { id: "momentum-1", pathSlug: "daily-momentum", title: "Five-Minute Useful Step", instruction: "Choose one five-minute action that would make today slightly better and do it.", proofType: "checklist", reflectionQuestion: "What made this action small enough to start?", feedbackQuestion: "What should your next smallest step be?", estimatedMinutes: 5, order: 1 },
  { id: "feedback-1", pathSlug: "give-better-feedback", title: "Specific, Not Vague", instruction: "Turn vague praise into specific feedback using what worked, why it worked, and one next step.", proofType: "text", reflectionQuestion: "What changed when the feedback became specific?", feedbackQuestion: "Is this feedback useful without being harsh?", estimatedMinutes: 8, order: 1 }
];

export const demoFeedItems: FeedItem[] = [
  { id: "f1", type: "proof", mode: "passive", actor: "Maya", title: "Maya uploaded a short audio practice before sending the real message.", body: "Audio proof captured tone and hesitation better than text. The next step was one clearer sentence.", pathSlug: "speak-up", proofType: "audio", mediaKind: "audio", mediaLabel: "Audio proof", trustSignal: "Participant - 4 proofs", actionLabel: "Try this practice", actionHref: "/practice/speak-up-1", engagementPrompt: "What would you ask Maya before giving feedback?", contributionPotential: 76, usefulness: 87, actionability: 78, proofStrength: 88, trustWeight: 62, recency: 92, friction: 28 },
  { id: "f2", type: "prompt", mode: "active", title: "Your next 5-minute practice", body: "Write one honest sentence, record it, or upload a screenshot of your private draft. Keep it private if you want.", pathSlug: "speak-up", proofType: "text", mediaKind: "text", mediaLabel: "Text, audio, screenshot", actionLabel: "Start now", actionHref: "/practice/speak-up-1", engagementPrompt: "Turn the scroll into one private draft.", contributionPotential: 66, usefulness: 96, actionability: 100, proofStrength: 65, trustWeight: 70, recency: 88, friction: 10 },
  { id: "f3", type: "feedback", mode: "bridge", actor: "Ava", title: "Video proof can show effort, but the feedback request still matters.", body: "Ava asked reviewers to focus only on clarity, not appearance. That kept feedback useful and safe.", pathSlug: "give-better-feedback", proofType: "video", mediaKind: "video", mediaLabel: "Video proof", trustSignal: "Trusted Contributor", actionLabel: "Practice feedback", actionHref: "/contribute", engagementPrompt: "Could you give feedback that stays inside the request?", contributionPotential: 92, usefulness: 92, actionability: 82, proofStrength: 94, trustWeight: 90, recency: 75, friction: 48 },
  { id: "f4", type: "milestone", mode: "passive", actor: "Jordan", title: "Jordan hit 7 days of Daily Momentum with checklist proof.", body: "The pattern was not huge effort. It was one small action checked off before distractions.", pathSlug: "daily-momentum", proofType: "checklist", mediaKind: "checklist", mediaLabel: "Checklist proof", trustSignal: "7-day streak", actionLabel: "Try a 5-minute step", actionHref: "/practice/momentum-1", engagementPrompt: "Name the next tiny step you would suggest.", contributionPotential: 58, usefulness: 76, actionability: 70, proofStrength: 72, trustWeight: 58, recency: 80, friction: 8 },
  { id: "f5", type: "question", mode: "bridge", title: "What are you avoiding saying clearly?", body: "You do not have to send it yet. Draft it privately, add a link or screenshot if useful, then ask for focused feedback.", pathSlug: "speak-up", proofType: "screenshot", mediaKind: "image", mediaLabel: "Screenshot proof", actionLabel: "Draft privately", actionHref: "/practice/speak-up-1", engagementPrompt: "Answer privately before you ask anyone to react.", contributionPotential: 72, usefulness: 88, actionability: 92, proofStrength: 75, trustWeight: 64, recency: 86, friction: 12 },
  { id: "f6", type: "contribution", mode: "active", title: "3 media-rich proofs need kind feedback.", body: "Reviewers can see whether a proof is text, image, video, audio, document, link, or checklist before choosing it.", pathSlug: "give-better-feedback", actionLabel: "Open Contribution Hub", actionHref: "/contribute", engagementPrompt: "Choose one proof where you can be specific and useful.", contributionPotential: 98, usefulness: 83, actionability: 95, proofStrength: 70, trustWeight: 76, recency: 95, friction: 35 },
  { id: "f7", type: "proof", mode: "passive", actor: "Sam", title: "Image proof made progress visible without a long explanation.", body: "A before/after screenshot helped Sam notice the task was actually finished.", pathSlug: "daily-momentum", proofType: "image", mediaKind: "image", mediaLabel: "Image proof", trustSignal: "Private proof shared with reviewers", actionLabel: "Submit your proof", actionHref: "/proof/new", engagementPrompt: "Would a quick photo make your next step easier to prove?", contributionPotential: 70, usefulness: 80, actionability: 74, proofStrength: 82, trustWeight: 60, recency: 84, friction: 14 }
];

export const demoPhotoProofSpotlights: MediaProofSpotlight[] = [
  {
    id: "photo-lane-1",
    lane: "photo",
    actor: "Sam",
    pathTitle: "Daily Momentum",
    promptTitle: "Five-Minute Useful Step",
    title: "A cleared desk became proof of momentum.",
    body: "The photo is quick to understand, low-friction to submit, and easy for a reviewer to connect to the next step.",
    proofType: "image",
    mediaKind: "image",
    feedbackRequest: "What is the next useful five-minute step?",
    strengthLabel: "concrete proof",
    frictionLabel: "quick upload",
    trustSignal: "Shared with reviewers",
    actionHref: "/proof/new",
    thumbnailTone: "green"
  },
  {
    id: "photo-lane-2",
    lane: "photo",
    actor: "Rin",
    pathTitle: "Social Momentum",
    promptTitle: "Thoughtful Message",
    title: "A screenshot kept the feedback specific.",
    body: "The reviewer can respond to wording and warmth without guessing what happened.",
    proofType: "screenshot",
    mediaKind: "image",
    feedbackRequest: "Does this message feel warm and low-pressure?",
    strengthLabel: "fast context",
    frictionLabel: "low friction",
    trustSignal: "Path-visible proof",
    actionHref: "/practice/social-1",
    thumbnailTone: "purple"
  }
];

export const demoVideoProofSpotlights: MediaProofSpotlight[] = [
  {
    id: "video-lane-1",
    lane: "video",
    actor: "Ava",
    pathTitle: "Speak Up",
    promptTitle: "Ask Directly",
    title: "A 22-second rehearsal made tone visible.",
    body: "Video adds effort and context, so the app keeps the feedback request tight and safety-first.",
    proofType: "video",
    mediaKind: "video",
    feedbackRequest: "Focus only on clarity and pacing.",
    strengthLabel: "high proof strength",
    frictionLabel: "higher effort",
    trustSignal: "Trusted contributor reviewing",
    actionHref: "/contribute",
    thumbnailTone: "orange"
  },
  {
    id: "video-lane-2",
    lane: "video",
    actor: "Noor",
    pathTitle: "Give Better Feedback",
    promptTitle: "Specific, Not Vague",
    title: "A video walkthrough showed the before and after.",
    body: "Reviewers can see the work, then respond to the requested part instead of reacting broadly.",
    proofType: "video",
    mediaKind: "video",
    feedbackRequest: "Is the next step actionable?",
    strengthLabel: "rich context",
    frictionLabel: "review carefully",
    trustSignal: "Reviewer-only proof",
    actionHref: "/contribute",
    thumbnailTone: "purple"
  }
];

export const demoProofSubmissions: ProofSubmission[] = [
  {
    id: "demo-proof-1",
    pathSlug: "speak-up",
    pathTitle: "Speak Up",
    promptId: "speak-up-1",
    promptTitle: "One Honest Sentence",
    promptInstruction: "Write one sentence you would say if you were being honest but respectful.",
    proofType: "audio",
    mediaKind: "audio",
    media: { id: "demo-media-1", bucket: "proof-media", proofType: "audio", mediaKind: "audio", fileName: "honest-sentence-practice.m4a", fileSize: 4200000, fileType: "audio/mp4", storagePath: "demo-user/2026-05-14/honest-sentence-practice.m4a", uploadStatus: "demo-uploaded", createdAt: "2026-05-14T00:00:00.000Z" },
    uploadStatus: "demo-uploaded",
    visibility: "reviewers",
    feedbackRequest: "Please focus on clarity and tone.",
    reflection: "I noticed I wanted to apologize before making the request.",
    status: "feedback-ready",
    feedbackStatus: "ready",
    createdAt: "2026-05-14T00:00:00.000Z"
  },
  {
    id: "demo-proof-2",
    pathSlug: "daily-momentum",
    pathTitle: "Daily Momentum",
    promptId: "momentum-1",
    promptTitle: "Five-Minute Useful Step",
    proofType: "checklist",
    mediaKind: "checklist",
    checklistItems: ["Cleared the desk", "Sent one overdue reply", "Picked tomorrow's first step"],
    uploadStatus: "demo-uploaded",
    visibility: "private",
    feedbackRequest: "Help me choose a next smallest step.",
    reflection: "The checklist made the action feel small enough to begin.",
    status: "needs-feedback",
    feedbackStatus: "requested",
    createdAt: "2026-05-13T18:30:00.000Z",
    promptInstruction: "Choose one five-minute action that would make today slightly better and do it."
  },
  {
    id: "demo-proof-3",
    pathSlug: "social-momentum",
    pathTitle: "Social Momentum",
    promptId: "social-1",
    promptTitle: "Thoughtful Message",
    promptInstruction: "Send or draft one thoughtful message to someone you have been meaning to reach out to.",
    proofType: "screenshot",
    mediaKind: "image",
    media: { id: "demo-media-3", bucket: "proof-media", proofType: "screenshot", mediaKind: "image", fileName: "message-draft.png", fileSize: 980000, fileType: "image/png", storagePath: "demo-user/2026-05-13/message-draft.png", uploadStatus: "demo-uploaded", createdAt: "2026-05-13T14:15:00.000Z" },
    uploadStatus: "demo-uploaded",
    visibility: "path",
    feedbackRequest: "Does this feel warm and low-pressure?",
    reflection: "I wrote it more directly than I expected.",
    status: "submitted",
    feedbackStatus: "requested",
    createdAt: "2026-05-13T14:15:00.000Z"
  }
];

export const proofNeedsFeedback: Array<{ id: string; proofType: ProofType; mediaKind: MediaKind; path: string; prompt: string; feedbackRequest: string; visibility: ProofVisibility; safetyNote: string }> = [
  { id: "review-1", proofType: "video", mediaKind: "video", path: "Speak Up", prompt: "Ask Directly", feedbackRequest: "Is my ask specific enough?", visibility: "reviewers", safetyNote: "Review the request and tone only; do not comment on appearance." },
  { id: "review-2", proofType: "document", mediaKind: "document", path: "Give Better Feedback", prompt: "Specific, Not Vague", feedbackRequest: "Is this feedback useful without being harsh?", visibility: "path", safetyNote: "Avoid diagnosing motives. Keep feedback specific and actionable." },
  { id: "review-3", proofType: "audio", mediaKind: "audio", path: "Speak Up", prompt: "One Honest Sentence", feedbackRequest: "Does the sentence sound clear?", visibility: "reviewers", safetyNote: "Focus on clarity, pacing, and the user's stated request." }
];

export function getPath(slug: string) {
  return paths.find((p) => p.slug === slug);
}

export function getPrompt(id: string) {
  return prompts.find((p) => p.id === id);
}

export function getFirstPromptForPath(pathSlug: string) {
  return prompts.find((p) => p.pathSlug === pathSlug && p.order === 1) || prompts[0];
}
