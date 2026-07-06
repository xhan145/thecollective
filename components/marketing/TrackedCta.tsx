"use client";

import type { ReactNode } from "react";
import { ButtonLink } from "@/components/beta/ui";
import { trackEvent } from "@/lib/analytics";

/** Client leaf: a ButtonLink that fires one analytics event on click, so
 *  server components can carry tracked CTAs without becoming client-side. */
export default function TrackedCta({
  href,
  event,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  event: string;
  variant?: "primary" | "secondary" | "quiet";
  className?: string;
  children: ReactNode;
}) {
  return (
    <ButtonLink href={href} variant={variant} className={className} onClick={() => trackEvent(event)}>
      {children}
    </ButtonLink>
  );
}
