"use client";

import { useRouter } from "next/navigation";
import { CollectiveMark } from "@/components/beta/Brand";
import { Button, Card } from "@/components/beta/ui";
import { useBetaApp } from "@/components/beta/AppStateProvider";

export default function AuthPage() {
  const router = useRouter();
  const { enterDemoBeta, snapshot, firebaseMode } = useBetaApp();

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#FFF8EE] px-5 pb-10 pt-[calc(58px+env(safe-area-inset-top,0px))] text-[#111111]">
      <div className="text-center">
        <CollectiveMark className="mx-auto h-[92px] w-[190px]" />
        <h1 className="mt-5 text-[32px] font-extrabold leading-tight">Welcome to Collective beta.</h1>
        <p className="mt-3 text-sm leading-6 text-[#6E6E6E]">Use the local demo account while Firebase credentials are not configured. No backend is required for the beta prototype to render.</p>
      </div>
      <Card className="mt-8 space-y-4 p-5">
        <p className="rounded-2xl bg-[#FFF8EE] p-3 text-sm leading-6 text-[#6E6E6E]">{firebaseMode}. The default beta member is Alex from the founding circle.</p>
        <Button
          className="w-full"
          onClick={() => {
            enterDemoBeta("user-alex");
            router.push("/home");
          }}
        >
          Enter demo beta
        </Button>
        <div className="grid grid-cols-2 gap-2">
          {snapshot.users.slice(1, 5).map((user) => (
            <button
              key={user.id}
              className="min-h-11 rounded-full border border-[#EFE7D8] bg-white px-3 text-sm font-extrabold text-[#38322A]"
              onClick={() => {
                enterDemoBeta(user.id);
                router.push("/home");
              }}
            >
              {user.displayName}
            </button>
          ))}
        </div>
      </Card>
    </main>
  );
}
