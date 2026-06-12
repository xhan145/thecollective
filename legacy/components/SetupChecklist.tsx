import { CheckCircle2, CircleAlert, UploadCloud } from "lucide-react";
import { envStatus } from "@/lib/env";
import { Pill } from "./ui";

export function SetupChecklist() {
  const s = envStatus();
  const rows = [
    ["Supabase URL", s.supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"],
    ["Supabase anon key", s.supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    ["Supabase service key", s.supabaseServiceRole, "SUPABASE_SERVICE_ROLE_KEY"],
    ["OpenAI key", s.openAi, "OPENAI_API_KEY"],
    ["App URL", s.appUrl, "NEXT_PUBLIC_APP_URL"]
  ] as const;

  return (
    <div className="space-y-3">
      {rows.map(([label, ok, key]) => (
        <div key={key} className="soft-card flex items-center justify-between gap-3 p-4">
          <div>
            <p className="font-bold">{label}</p>
            <p className="text-xs text-[#8f887e]">{key}</p>
          </div>
          {ok ? <CheckCircle2 className="text-green" /> : <CircleAlert className="text-orange" />}
        </div>
      ))}
      <div className="soft-card p-4">
        <div className="flex items-center gap-2">
          <UploadCloud size={18} className="text-purple2" />
          <p className="font-black">V9 media engagement support</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-[#c8c2b8]">Text, image, video, audio, document/PDF, screenshot, link, and checklist proof all render in demo mode. The image/video MVP supports preview, removal, draft saving, and mock upload progress.</p>
      </div>
      <div className="soft-card p-4">
        <Pill tone="accent">Engagement model</Pill>
        <p className="mt-3 font-black">Useful intent, not popularity</p>
        <p className="mt-1 text-sm leading-6 text-[#c8c2b8]">V9 uses intent actions for reflection, context, practice, and focused feedback. Popularity reactions are intentionally not part of the demo flow.</p>
      </div>
      <div className="soft-card p-4">
        <p className="font-black">Next recommended action</p>
        <p className="mt-1 text-sm leading-6 text-[#c8c2b8]">Create a private Supabase Storage bucket named <span className="font-mono text-white">proof-media</span>, then add RLS and signed URL policies before real uploads.</p>
      </div>
    </div>
  );
}
