export type PassportTab = "overview" | "proof" | "feedback" | "contribution";

export type PassportBadge = {
  name: string;
  icon: string;
  earned: boolean;
};

export type PassportPinnedProof = {
  title: string;
  type: "Video" | "Audio" | "Text";
  age: string;
  duration?: string;
};

export type PassportProfile = {
  displayName: string;
  username: string;
  headline: string;
  currentDirection: string;
  currentFocusSkill: string;
  trustLevel: number;
  trustLabel: string;
  openToIntroductions: boolean;
  intro: {
    hereToPractice: string;
    currentlyWorkingOn: string;
    wantsFeedbackOn: string;
    canHelpWith: string;
  };
  stats: {
    practices: number;
    proofs: number;
    feedbackLoops: number;
    usefulFeedbackResponses: number;
  };
  badges: PassportBadge[];
  pinnedProofs: PassportPinnedProof[];
};

export const samplePassportProfile: PassportProfile = {
  displayName: "Eric Bergstrom",
  username: "ericbergstrom",
  headline: "Practicing clearer communication through proof.",
  currentDirection: "Confident Communication",
  currentFocusSkill: "Clear introductions",
  trustLevel: 2,
  trustLabel: "Helpful Member",
  openToIntroductions: true,
  intro: {
    hereToPractice: "Clearer communication and confidence.",
    currentlyWorkingOn: "Speaking slowly, asking better questions, and staying calm under feedback.",
    wantsFeedbackOn: "Tone, clarity, and pacing.",
    canHelpWith: "Encouragement, beginner feedback, product ideas, and honest perspective."
  },
  stats: {
    practices: 42,
    proofs: 18,
    feedbackLoops: 9,
    usefulFeedbackResponses: 31
  },
  badges: [
    { name: "First Proof", icon: "1", earned: true },
    { name: "Feedback Loop", icon: "F", earned: true },
    { name: "Calm Delivery", icon: "C", earned: true },
    { name: "Trusted Contributor", icon: "T", earned: false },
    { name: "Helpful Member", icon: "H", earned: true },
    { name: "Consistent Builder", icon: "B", earned: true }
  ],
  pinnedProofs: [
    { title: "My intro to Collective", type: "Video", age: "2d ago", duration: "0:58" },
    { title: "On staying calm", type: "Audio", age: "4d ago", duration: "1:05" }
  ]
};

export const passportMenuItems = [
  { label: "Edit profile", href: "/passport/edit" },
  { label: "Edit introduction", href: "/passport/edit-introduction" },
  { label: "Manage displayed badges", href: "/passport/badges" },
  { label: "Manage pinned proofs", href: "/passport/pinned-proofs" },
  { label: "Introduction settings", href: "/settings/introduction-preferences" },
  { label: "Visibility & privacy", href: "/settings/profile-visibility" },
  { label: "Feedback preferences", href: "/settings/feedback-preferences" },
  { label: "Share profile", href: "/passport/share" },
  { label: "Settings", href: "/settings" }
] as const;

export const settingsSections = [
  {
    label: "Account",
    rows: [
      { title: "Edit Profile", subtitle: "Name, headline, direction, and intro summary.", href: "/passport/edit" },
      { title: "Account Information", subtitle: "Email, username, account status, and sign-in methods.", href: "/settings/account" },
      { title: "Change Password", subtitle: "Update your password with a calm checklist.", href: "/settings/change-password" }
    ]
  },
  {
    label: "Privacy & Visibility",
    rows: [
      { title: "Profile Visibility", subtitle: "Choose who can view your Passport.", href: "/settings/profile-visibility" },
      { title: "Proof Visibility", subtitle: "Set the default visibility for new proof.", href: "/settings/proof-visibility" },
      { title: "Introduction Preferences", subtitle: "Control introduction requests and safety filters.", href: "/settings/introduction-preferences" },
      { title: "Blocked Users", subtitle: "Manage people who cannot interact with you.", href: "/settings/blocked-users" }
    ]
  },
  {
    label: "Notifications",
    rows: [
      { title: "Push Notifications", subtitle: "Practice reminders, feedback, trust, and contribution updates.", href: "/settings/push-notifications" },
      { title: "Email Notifications", subtitle: "Weekly summaries, feedback digests, and account notices.", href: "/settings/email-notifications" },
      { title: "Feedback Notifications", subtitle: "Choose when feedback activity reaches you.", href: "/settings/feedback-notifications" }
    ]
  },
  {
    label: "Preferences",
    rows: [
      { title: "Feedback Preferences", subtitle: "Preferred style, focus areas, and feedback sources.", href: "/settings/feedback-preferences" },
      { title: "Content Preferences", subtitle: "Tune the directions and practice topics you see.", href: "/settings/content-preferences" },
      { title: "Theme", subtitle: "Light, dark, or system theme preparation.", href: "/settings/theme" }
    ]
  },
  {
    label: "Support",
    rows: [
      { title: "Help Center", subtitle: "How Collective, practice, proof, feedback, and trust work.", href: "/settings/help" },
      { title: "Contact Support", subtitle: "Send a message, report a bug, or raise a safety concern.", href: "/settings/contact-support" },
      { title: "Give Feedback", subtitle: "Share product feedback about Collective.", href: "/settings/give-feedback" }
    ]
  },
  {
    label: "Account Action",
    rows: [
      { title: "Sign Out", subtitle: "Confirm before leaving this session.", href: "/settings/sign-out", danger: true }
    ]
  }
] as const;
