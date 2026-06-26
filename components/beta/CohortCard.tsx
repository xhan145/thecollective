"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/beta/ui";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import type { Cohort, CohortVisibility } from "@/lib/cohorts/types";

// Small warm accent palette. Keyed by cohort.accent string.
const ACCENT_GRADIENTS: Record<string, string> = {
  gold: "from-[#FFF1C7] to-[#FFF8EE]",
  rose: "from-[#FFF0F3] to-[#FFF8EE]",
  sage: "from-[#EDF6F0] to-[#F7FEFA]",
  sky: "from-[#EBF4FD] to-[#F5FAFF]",
};

const DEFAULT_GRADIENT = ACCENT_GRADIENTS.gold;

function getGradient(accent: string | null): string {
  if (!accent) return DEFAULT_GRADIENT;
  return ACCENT_GRADIENTS[accent.toLowerCase()] ?? DEFAULT_GRADIENT;
}

const VISIBILITY_LABELS: Record<CohortVisibility, string> = {
  public: "Public",
  request: "Request to join",
  invite: "Invite only",
};

const ELEVATION =
  "shadow-[0_1px_2px_rgba(71,52,18,0.06),0_10px_30px_rgba(71,52,18,0.08)]";
const ELEVATION_HOVER =
  "0 4px 10px rgba(71,52,18,0.10), 0 18px 44px rgba(71,52,18,0.14)";

export function CohortCard({ cohort }: { cohort: Cohort }) {
  const { snapshot } = useBetaApp();

  const direction = cohort.directionId
    ? snapshot.directions.find((d) => d.id === cohort.directionId) ?? null
    : null;

  const gradient = getGradient(cohort.accent);

  return (
    <Link href={`/cohorts/${cohort.id}`} aria-label={`View cohort: ${cohort.name}`}>
      <motion.article
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
        whileHover={{ y: -3, boxShadow: ELEVATION_HOVER }}
        whileTap={{ scale: 0.99 }}
        className={`overflow-hidden rounded-[22px] border border-[#EFE7D8] bg-[#FFFDF8] ${ELEVATION}`}
      >
        {/* Accent banner */}
        <div
          className={`h-10 w-full bg-gradient-to-r ${gradient}`}
          aria-hidden
        />

        <div className="px-5 pb-5 pt-3">
          {/* Name */}
          <h3 className="font-display text-[19px] font-bold leading-tight tracking-tight text-[#111111]">
            {cohort.name}
          </h3>

          {/* Direction "what it's for" line */}
          {direction && (
            <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.12em] text-[#9B958B]">
              {direction.title}
            </p>
          )}

          {/* Description */}
          {cohort.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6E6E6E]">
              {cohort.description}
            </p>
          )}

          {/* Visibility chip */}
          <div className="mt-3">
            <Badge tone={cohort.visibility === "public" ? "green" : cohort.visibility === "request" ? "gold" : "muted"}>
              {VISIBILITY_LABELS[cohort.visibility]}
            </Badge>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
