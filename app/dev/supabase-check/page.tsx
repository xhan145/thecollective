import { notFound } from "next/navigation";
import { BareShell } from "@/components/AppShell";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { BETA_BUCKET, PROOF_BUCKET } from "@/lib/supabase/storage";
import { DevWriteTests } from "./write-tests";

export const dynamic = "force-dynamic";

type Status = "ok" | "needs_setup" | "sign_in" | "error";

interface Check {
  label: string;
  status: Status;
  detail: string;
  fix?: string;
}

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabase>>;

const statusLabel: Record<Status, string> = {
  ok: "OK",
  needs_setup: "Needs setup",
  sign_in: "Sign in first",
  error: "Error",
};

const statusClass: Record<Status, string> = {
  ok: "bg-success/10 text-success",
  needs_setup: "bg-gold/15 text-goldDeep",
  sign_in: "bg-soft text-goldDeep",
  error: "bg-danger/10 text-danger",
};

function enabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === "true"
  );
}

function getSupabaseHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Unknown error";
}

function errorCode(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return null;
}

function statusForDatabaseError(error: unknown): Status {
  return errorCode(error) === "42P01" ? "needs_setup" : "error";
}

function fixForDatabaseError(tableName: string, error: unknown): string {
  const code = errorCode(error);
  if (code === "42P01") {
    return `Run the schema migration so public.${tableName} exists.`;
  }
  if (code === "42501") {
    return "Run the RLS migration, then sign in again.";
  }
  return "Check the Supabase URL, anon key, auth session, and RLS policies.";
}

function envChecks(): Check[] {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const urlLooksValid = Boolean(
    url && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url),
  );

  return [
    {
      label: "NEXT_PUBLIC_SUPABASE_URL",
      status: urlLooksValid ? "ok" : "needs_setup",
      detail: getSupabaseHost() ?? "missing or invalid",
      fix: urlLooksValid ? undefined : "Use https://<project-ref>.supabase.co.",
    },
    {
      label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "ok" : "needs_setup",
      detail: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "present; value hidden"
        : "missing",
      fix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? undefined
        : "Add the anon/public key from Supabase Project Settings -> API.",
    },
    {
      label: "SUPABASE_SERVICE_ROLE_KEY",
      status: isAdminConfigured() ? "ok" : "needs_setup",
      detail: isAdminConfigured()
        ? "present on the server; value hidden"
        : "missing on the server",
      fix: isAdminConfigured()
        ? undefined
        : "Add the service_role key to .env.local. Keep it server-only.",
    },
    {
      label: "OPENAI_API_KEY",
      status: "ok",
      detail: process.env.OPENAI_API_KEY
        ? "AI support configured; value hidden"
        : "optional / not set; mock reflection stays available",
    },
  ];
}

async function readTableCheck(
  supabase: ServerSupabase,
  tableName: string,
  label: string,
  userId: string | null,
): Promise<Check> {
  if (!userId) {
    return {
      label,
      status: "sign_in",
      detail: "RLS needs a signed-in beta tester.",
      fix: "Sign in, then refresh this page.",
    };
  }

  const { count, error } = await supabase
    .from(tableName)
    .select("id", { count: "exact", head: true });

  if (error) {
    return {
      label,
      status: statusForDatabaseError(error),
      detail: error.message,
      fix: fixForDatabaseError(tableName, error),
    };
  }

  return {
    label,
    status: "ok",
    detail:
      count === null
        ? "read succeeded"
        : `${count} visible row${count === 1 ? "" : "s"}`,
  };
}

async function currentProfileCheck(
  supabase: ServerSupabase,
  userId: string | null,
): Promise<Check> {
  if (!userId) {
    return {
      label: "Current profile row",
      status: "sign_in",
      detail: "No signed-in user yet.",
      fix: "Sign in, then refresh this page.",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, trust_stage")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return {
      label: "Current profile row",
      status: statusForDatabaseError(error),
      detail: error.message,
      fix: fixForDatabaseError("profiles", error),
    };
  }

  if (!data) {
    return {
      label: "Current profile row",
      status: "needs_setup",
      detail: "Signed in, but no profile row was found.",
      fix: "Sign out and back in, or check profile creation in /auth/callback.",
    };
  }

  return {
    label: "Current profile row",
    status: "ok",
    detail: `profile exists; trust stage is ${data.trust_stage ?? "starting"}`,
  };
}

async function storageChecks(): Promise<{
  checks: Check[];
  proofBucketReady: boolean;
  betaBucketReady: boolean;
}> {
  const missingAdmin = {
    status: "needs_setup" as const,
    detail: "Needs the server-only service role key.",
    fix: "Add SUPABASE_SERVICE_ROLE_KEY to .env.local, then restart the app.",
  };

  if (!isAdminConfigured()) {
    return {
      checks: [
        { label: `Storage bucket: ${PROOF_BUCKET}`, ...missingAdmin },
        { label: `Storage bucket: ${BETA_BUCKET}`, ...missingAdmin },
      ],
      proofBucketReady: false,
      betaBucketReady: false,
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      checks: [
        { label: `Storage bucket: ${PROOF_BUCKET}`, ...missingAdmin },
        { label: `Storage bucket: ${BETA_BUCKET}`, ...missingAdmin },
      ],
      proofBucketReady: false,
      betaBucketReady: false,
    };
  }

  const { data, error } = await admin.storage.listBuckets();
  if (error) {
    const detail = errorMessage(error);
    return {
      checks: [
        {
          label: `Storage bucket: ${PROOF_BUCKET}`,
          status: "error",
          detail,
          fix: "Check the Supabase URL and service role key.",
        },
        {
          label: `Storage bucket: ${BETA_BUCKET}`,
          status: "error",
          detail,
          fix: "Check the Supabase URL and service role key.",
        },
      ],
      proofBucketReady: false,
      betaBucketReady: false,
    };
  }

  const bucketNames = new Set(data?.map((bucket) => bucket.name) ?? []);
  const proofBucketReady = bucketNames.has(PROOF_BUCKET);
  const betaBucketReady = bucketNames.has(BETA_BUCKET);

  return {
    checks: [
      {
        label: `Storage bucket: ${PROOF_BUCKET}`,
        status: proofBucketReady ? "ok" : "needs_setup",
        detail: proofBucketReady
          ? "private bucket exists"
          : "private bucket not found",
        fix: proofBucketReady
          ? undefined
          : "Run the storage migration.",
      },
      {
        label: `Storage bucket: ${BETA_BUCKET}`,
        status: betaBucketReady ? "ok" : "needs_setup",
        detail: betaBucketReady
          ? "private bucket exists"
          : "private bucket not found",
        fix: betaBucketReady
          ? undefined
          : "Run the storage migration.",
      },
    ],
    proofBucketReady,
    betaBucketReady,
  };
}

function CheckRow({ check }: { check: Check }) {
  return (
    <div className="rounded-card bg-card p-3 shadow-warm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{check.label}</p>
          <p className="mt-0.5 text-xs text-muted">{check.detail}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass[check.status]}`}
        >
          {statusLabel[check.status]}
        </span>
      </div>
      {check.fix ? (
        <p className="mt-2 rounded-xl bg-soft px-3 py-2 text-xs text-ink">
          Fix: {check.fix}
        </p>
      ) : null}
    </div>
  );
}

export default async function SupabaseCheckPage() {
  if (!enabled()) notFound();

  let supabase: ServerSupabase | null = null;
  let userId: string | null = null;
  let clientCheck: Check = {
    label: "Supabase client initialization",
    status: "needs_setup",
    detail: "Public Supabase URL and anon key are required first.",
    fix: "Run npm run setup:beta or fill .env.local.",
  };
  let authCheck: Check = {
    label: "Current auth session",
    status: "needs_setup",
    detail: "Supabase is not configured yet.",
    fix: "Add Supabase environment variables, then restart the app.",
  };

  if (isSupabaseConfigured()) {
    try {
      supabase = await createServerSupabase();
      clientCheck = {
        label: "Supabase client initialization",
        status: "ok",
        detail: "initialized with anon key and auth cookies",
      };

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        authCheck = {
          label: "Current auth session",
          status: "error",
          detail: error.message,
          fix: "Check the anon key, auth URL settings, and browser session.",
        };
      } else if (user) {
        userId = user.id;
        authCheck = {
          label: "Current auth session",
          status: "ok",
          detail: `signed in as ${user.email ?? user.id}`,
        };
      } else {
        authCheck = {
          label: "Current auth session",
          status: "sign_in",
          detail: "No signed-in tester in this browser.",
          fix: "Sign in, then refresh this page.",
        };
      }
    } catch (error) {
      clientCheck = {
        label: "Supabase client initialization",
        status: "error",
        detail: errorMessage(error),
        fix: "Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      };
      authCheck = {
        label: "Current auth session",
        status: "error",
        detail: "Skipped because the Supabase client could not initialize.",
        fix: "Fix the client settings first.",
      };
    }
  }

  const missingClientCheck = (label: string): Check => ({
    label,
    status: "needs_setup",
    detail: "Supabase client is not ready.",
    fix: "Add Supabase environment variables, then restart the app.",
  });

  const profileCheck = supabase
    ? await currentProfileCheck(supabase, userId)
    : missingClientCheck("Current profile row");

  const tableChecks = supabase
    ? await Promise.all([
        readTableCheck(supabase, "profiles", "Read profiles table", userId),
        readTableCheck(supabase, "directions", "Read directions table", userId),
        readTableCheck(supabase, "practices", "Read practices table", userId),
        readTableCheck(supabase, "proofs", "Read proofs table", userId),
        readTableCheck(supabase, "feedback", "Read feedback table", userId),
        readTableCheck(
          supabase,
          "trust_events",
          "Read trust/reputation events",
          userId,
        ),
        readTableCheck(
          supabase,
          "beta_feedback",
          "Read beta feedback table",
          userId,
        ),
      ])
    : [
        missingClientCheck("Read profiles table"),
        missingClientCheck("Read directions table"),
        missingClientCheck("Read practices table"),
        missingClientCheck("Read proofs table"),
        missingClientCheck("Read feedback table"),
        missingClientCheck("Read trust/reputation events"),
        missingClientCheck("Read beta feedback table"),
      ];

  const bucketState = await storageChecks();
  const betaFeedbackReady = tableChecks.some(
    (check) => check.label === "Read beta feedback table" && check.status === "ok",
  );

  const checks = [
    ...envChecks(),
    clientCheck,
    authCheck,
    profileCheck,
    ...tableChecks,
    ...bucketState.checks,
  ];

  return (
    <BareShell>
      <h1 className="text-2xl font-bold text-ink">Supabase check</h1>
      <p className="mt-1 text-sm text-muted">
        Local beta diagnostics. Secret values are never shown.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {checks.map((check) => (
          <CheckRow key={check.label} check={check} />
        ))}
      </div>

      <div className="mt-4 rounded-card bg-card p-3 shadow-warm">
        <p className="text-sm font-semibold text-ink">AI readiness</p>
        <p className="mt-1 text-xs leading-5 text-muted">
          Collective AI can support reflection, practice suggestions, proof
          summaries, feedback organization, and next-step suggestions. It does
          not decide identity, final skill level, personal worth, or trust score.
        </p>
      </div>

      <DevWriteTests
        betaFeedbackReady={betaFeedbackReady}
        proofMediaReady={bucketState.proofBucketReady}
      />
    </BareShell>
  );
}
