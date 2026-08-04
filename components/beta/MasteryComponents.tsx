"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { PracticePrompt, Skill } from "@/lib/betaTypes";
import { levelStatus, previousLevelName, skillProgress, type LevelStatus } from "@/lib/mastery";

/** ●●○○○ — the five-level dots for a skill. */
function LadderDots({ levels }: { levels: { status: LevelStatus }[] }) {
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {levels.map((l, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${
            l.status === "complete" ? "bg-accent" : l.status === "available" ? "border border-accent bg-bg" : "border border-line bg-surface-soft"
          }`}
        />
      ))}
    </span>
  );
}

function StatusIcon({ status }: { status: LevelStatus }) {
  if (status === "complete") return <CheckCircle2 size={18} className="shrink-0 text-success" aria-label="Complete" />;
  if (status === "available")
    return <span aria-label="Available" className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2 border-accent" />;
  return (
    <span aria-label="Locked" className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border border-line bg-surface-soft text-overline text-muted">
      ●
    </span>
  );
}

function LevelRow({ prompt, status, lockHint }: { prompt: PracticePrompt; status: LevelStatus; lockHint: string | null }) {
  const inner = (
    <div className={`flex items-start gap-3 rounded-2xl border p-3.5 ${
      status === "locked" ? "border-dashed border-line bg-bg opacity-80" : "elev-1 border-line bg-surface"
    } ${status === "available" ? "elev-hover" : ""}`}>
      <StatusIcon status={status} />
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold text-content">
          {prompt.levelNumber ? `Level ${prompt.levelNumber} · ` : ""}
          {prompt.levelName ?? prompt.title}
        </p>
        {prompt.masteryGoal && <p className="mt-0.5 text-caption leading-5 text-muted">{prompt.masteryGoal}</p>}
        <p className="mt-1 text-overline text-muted">
          {prompt.estimatedMinutes} min{prompt.difficulty ? ` · ${prompt.difficulty}` : ""}
        </p>
        {status === "locked" && lockHint && (
          <p className="mt-1.5 text-caption font-medium text-accent-text">Finish “{lockHint}” first — one step at a time.</p>
        )}
      </div>
      {status === "available" && (
        <span className="shrink-0 self-center rounded-full bg-surface-soft px-3.5 py-1.5 text-caption font-semibold text-accent-text">Start</span>
      )}
      {status === "complete" && <span className="shrink-0 self-center text-caption font-semibold text-success-text">Done</span>}
    </div>
  );
  if (status === "available" || status === "complete") {
    return (
      <Link href={`/proof/new/${prompt.id}`} aria-label={`${prompt.levelName ?? prompt.title} — ${status === "complete" ? "view or redo" : "start this level"}`} className="block">
        {inner}
      </Link>
    );
  }
  return inner; // locked: visible, not clickable
}

export function SkillLadderRow({ skill, prompts, completedIds }: { skill: Skill; prompts: PracticePrompt[]; completedIds: string[] }) {
  const [open, setOpen] = useState(false);
  const progress = skillProgress(skill, prompts, completedIds);
  const mastered = progress.total > 0 && progress.done === progress.total;
  return (
    <div className="elev-1 overflow-hidden rounded-3xl border border-line bg-surface pixel-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-surface-soft/30 focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-content">{skill.name}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <LadderDots levels={progress.levels} />
            <span className="text-overline text-muted">
              {mastered ? "Mastered" : `${progress.done}/${progress.total}`}
            </span>
          </div>
        </div>
        <span aria-hidden className={`text-subtle transition-transform ${open ? "rotate-90" : ""}`}>›</span>
      </button>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-2 px-3 pb-3">
          {progress.levels.map((l) => {
            const prompt = prompts.find((p) => p.id === l.id);
            if (!prompt) return null;
            return (
              <LevelRow
                key={l.id}
                prompt={prompt}
                status={levelStatus(prompt, completedIds, prompts)}
                lockHint={previousLevelName(prompt, prompts)}
              />
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
