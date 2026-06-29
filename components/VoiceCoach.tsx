"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { MessageCircle, Play, ShieldCheck, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseVoiceClient";
import type { VoiceCoachSessionResponse, VoiceCoachToolName, VoiceCoachToolResponse } from "@/lib/voiceCoach/types";

type CoachUiState = "idle" | "connecting" | "listening" | "speaking";

type VoiceCoachProps = {
  className?: string;
  title?: string;
  subtitle?: string;
};

type ClientToolParams = Record<string, unknown> | undefined;

function safeMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "The voice coach could not start right now.";
}

async function requestMicPermission() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone access is not available in this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
}

async function getAccessToken() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Sign in to use the voice coach.");
  }

  return data.session.access_token;
}

async function postJson<T>(path: string, accessToken: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "The voice coach request failed.");
  }
  return data;
}

async function callTool(accessToken: string, tool: VoiceCoachToolName, params?: ClientToolParams) {
  try {
    const result = await postJson<VoiceCoachToolResponse>("/api/voice-coach/tools", accessToken, { tool, params: params || {} });
    return JSON.stringify(result);
  } catch {
    return JSON.stringify({ ok: false, error: "The coach could not reach progress right now." });
  }
}

function makeClientTools(accessToken: string) {
  return {
    get_current_challenge: () => callTool(accessToken, "get_current_challenge"),
    get_learner_progress: (params: ClientToolParams) => callTool(accessToken, "get_learner_progress", params),
    log_practice_attempt: (params: ClientToolParams) => callTool(accessToken, "log_practice_attempt", params),
    mark_concept_understood: (params: ClientToolParams) => callTool(accessToken, "mark_concept_understood", params),
    request_hint: (params: ClientToolParams) => callTool(accessToken, "request_hint", params)
  };
}

function VoiceCoachInner({ className = "", title = "Voice knowledge coach", subtitle = "Ask for a calm hint, a progress check, or the next small step." }: VoiceCoachProps) {
  const [uiState, setUiState] = useState<CoachUiState>("idle");
  const [error, setError] = useState("");
  const conversation = useConversation({
    onConnect: () => setUiState("listening"),
    onDisconnect: () => setUiState("idle"),
    onError: () => setError("The voice coach had trouble staying connected.")
  });

  const connected = conversation.status === "connected";
  const disabled = uiState === "connecting";
  const displayState: CoachUiState = connected ? (conversation.isSpeaking ? "speaking" : "listening") : uiState;

  async function start() {
    setError("");
    setUiState("connecting");

    try {
      await requestMicPermission();
      const token = await getAccessToken();

      const session = await postJson<VoiceCoachSessionResponse>("/api/voice-coach", token);
      await conversation.startSession({
        signedUrl: session.signedUrl,
        dynamicVariables: session.dynamicVariables,
        clientTools: makeClientTools(token)
      });
    } catch (startError) {
      setUiState("idle");
      setError(safeMessage(startError));
    }
  }

  async function stop() {
    setError("");
    await conversation.endSession();
    setUiState("idle");
  }

  return (
    <section className={`rounded-[24px] border border-[#EFE7D8] bg-[#FFFDF8] p-5 shadow-[0_16px_42px_rgba(71,52,18,0.08)] ${className}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#FFF1C7] text-[#F2A900]" aria-hidden="true">
          <MessageCircle size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-[#111111]">{title}</h2>
            <Sparkles size={15} className="text-[#F2A900]" aria-hidden="true" />
          </div>
          <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">{subtitle}</p>
        </div>
      </div>

      <div className="mt-4 rounded-[18px] bg-[#FFF8EE] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E6E6E]">Coach state</p>
            <p className="mt-1 text-base font-extrabold capitalize text-[#111111]">{displayState}</p>
          </div>
          <div className={`h-3 w-3 rounded-full ${displayState === "idle" ? "bg-[#9B958B]" : "bg-[#22C55E]"}`} aria-hidden="true" />
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs leading-5 text-[#6E6E6E]">
          <ShieldCheck size={14} className="text-[#22C55E]" aria-hidden="true" />
          The coach uses your signed-in progress context. Your ElevenLabs API key never goes to the browser.
        </p>
      </div>

      {error && <p className="mt-4 rounded-[18px] bg-[#FFF1C7] p-3 text-sm font-bold leading-6 text-[#7A5300]">{error}</p>}

      <div className="mt-5 flex gap-3">
        {!connected ? (
          <button
            type="button"
            onClick={start}
            disabled={disabled}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#F2A900] px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(242,169,0,0.24)] transition active:scale-[0.98] disabled:opacity-50"
          >
            <Play size={17} /> {disabled ? "Connecting..." : "Start coach"}
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[#EFE7D8] bg-[#FFF8EE] px-5 text-sm font-extrabold text-[#111111] transition active:scale-[0.98]"
          >
            <X size={17} /> Stop
          </button>
        )}
      </div>
    </section>
  );
}

export function VoiceCoach(props: VoiceCoachProps) {
  return (
    <ConversationProvider>
      <VoiceCoachInner {...props} />
    </ConversationProvider>
  );
}
