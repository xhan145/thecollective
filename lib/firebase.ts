const env = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || ""
};

export const firebaseConfig = {
  apiKey: env.apiKey,
  authDomain: env.authDomain,
  projectId: env.projectId,
  storageBucket: env.storageBucket,
  messagingSenderId: env.messagingSenderId,
  appId: env.appId
};

export const firebaseCollections = {
  users: "users",
  cohorts: "cohorts",
  directions: "directions",
  practicePrompts: "practicePrompts",
  proofs: "proofs",
  feedback: "feedback",
  trustEvents: "trustEvents",
  trustSummaries: "trustSummaries",
  appFeedback: "appFeedback",
  aiInteractions: "aiInteractions",
  aiUserFeedback: "aiUserFeedback"
} as const;

export function isFirebaseConfigured() {
  return Object.values(env).every(Boolean);
}

export function firebaseModeLabel() {
  return isFirebaseConfigured() ? "Firebase-ready" : "Demo mode";
}

export function proofStoragePath(userId: string, proofId: string, fileName: string) {
  const safeFile = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `proof-media/${userId}/${proofId}/${safeFile}`;
}
