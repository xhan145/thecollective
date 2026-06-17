"use client";

import { useState } from "react";

/** Round avatar that renders avatarUrl with a calm initials fallback. */
export function Avatar({
  name,
  avatarUrl,
  size = 28
}: {
  name?: string | null;
  avatarUrl?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const initial = (name || "M").slice(0, 1).toUpperCase();
  const px = `${size}px`;

  if (avatarUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name || "Member"}
        onError={() => setFailed(true)}
        style={{ width: px, height: px }}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      style={{ width: px, height: px, fontSize: Math.max(10, Math.round(size * 0.4)) }}
      className="grid shrink-0 place-items-center rounded-full bg-[#FFF1C7] font-extrabold text-[#8A5D00]"
    >
      {initial}
    </span>
  );
}
