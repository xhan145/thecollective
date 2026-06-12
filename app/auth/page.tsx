import { BareShell } from "@/components/AppShell";
import { AuthForm } from "@/components/AuthForm";
import { SignalFlowLogo } from "@/components/SignalFlowLogo";
import type { UserRole } from "@/lib/types";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; role?: string }>;
}) {
  const { mode, role } = await searchParams;
  const initialMode = mode === "signin" ? "signin" : "signup";
  const initialRole: UserRole = role === "artist" ? "artist" : "scout";
  return (
    <BareShell>
      <div className="mx-auto flex min-h-[82dvh] max-w-[360px] flex-col justify-center gap-7">
        <div className="flex flex-col items-center gap-4 text-center">
          <SignalFlowLogo size={220} showWordmark />
          <div>
            <h1 className="text-2xl font-black text-ink">
              {initialMode === "signup" ? "Enter the Flow" : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-muted">No clout. Just flow.</p>
          </div>
        </div>
        <AuthForm initialMode={initialMode} initialRole={initialRole} />
      </div>
    </BareShell>
  );
}
