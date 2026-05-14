import { CheckCircle2, CircleAlert, UploadCloud } from "lucide-react";
import { envStatus } from "@/lib/env";

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
        <div key={key} className="card flex items-center justify-between gap-3 p-4">
          <div>
            <p className="font-bold">{label}</p>
            <p className="text-xs text-slate-500">{key}</p>
          </div>
          {ok ? <CheckCircle2 className="text-green" /> : <CircleAlert className="text-orange" />}
        </div>
      ))}
      <div className="card p-4">
        <div className="flex items-center gap-2">
          <UploadCloud size={18} className="text-purple2" />
          <p className="font-black">Multimodal proof support</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-400">Text, image, video, audio, document/PDF, screenshot, link, and checklist proof all render in demo mode.</p>
      </div>
      <div className="card p-4">
        <p className="font-black">Next recommended action</p>
        <p className="mt-1 text-sm leading-6 text-slate-400">Create a private Supabase Storage bucket named <span className="font-mono text-white">proof-media</span>, then add RLS and signed URL policies before real uploads.</p>
      </div>
    </div>
  );
}
