"use client";

import { useCallback, useEffect, useState } from "react";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { getSupabaseClient } from "@/lib/supabase/client";
import { DEFAULT_USER_SETTINGS, mergeSettings, type UserSettings } from "./userSettings";
import { getUserSettings, saveUserSettings } from "@/lib/supabase/settingsRepository";

const LS_KEY = "collective.userSettings.v1";

/**
 * Loads the signed-in user's settings (Supabase) or a localStorage fallback
 * in demo mode, and persists optimistic updates. Privacy/security pages can
 * choose to confirm before calling update — this hook just persists.
 */
export function useUserSettings() {
  const { currentUser, supabaseEnabled } = useBetaApp();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const client = supabaseEnabled ? getSupabaseClient() : null;
      if (client && currentUser?.id) {
        const s = await getUserSettings(client, currentUser.id);
        if (active) {
          setSettings(s);
          setLoading(false);
        }
        return;
      }
      try {
        const raw = typeof window !== "undefined" ? window.localStorage.getItem(LS_KEY) : null;
        if (raw && active) setSettings(mergeSettings(JSON.parse(raw) as Partial<UserSettings>));
      } catch {
        /* ignore */
      }
      if (active) setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseEnabled, currentUser?.id]);

  const update = useCallback(
    (partial: Partial<UserSettings>) => {
      setSettings((prev) => {
        const next = mergeSettings(partial, prev);
        const client = supabaseEnabled ? getSupabaseClient() : null;
        if (client && currentUser?.id) {
          void saveUserSettings(client, currentUser.id, partial).catch(() => {});
        } else {
          try {
            window.localStorage.setItem(LS_KEY, JSON.stringify(next));
          } catch {
            /* ignore */
          }
        }
        return next;
      });
    },
    [supabaseEnabled, currentUser?.id],
  );

  return { settings, update, loading };
}
