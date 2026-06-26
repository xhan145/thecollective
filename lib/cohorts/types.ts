export type CohortVisibility = "public" | "request" | "invite";
export type CohortRole = "owner" | "member";

export type Cohort = {
  id: string;
  name: string;
  description: string | null;
  directionId: string | null;
  visibility: CohortVisibility;
  accent: string | null;
  ownerId: string | null;
  isDemo: boolean;
  createdAt: string;
};
export type CohortMember = { id: string; cohortId: string; userId: string; role: CohortRole; joinedAt: string };
export type CohortJoinRequest = { id: string; cohortId: string; userId: string; status: "pending" | "approved" | "declined"; createdAt: string };
export type CohortInvite = { id: string; cohortId: string; code: string; createdBy: string | null; createdAt: string };
