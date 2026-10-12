import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

export function useSupabaseSession(
  onSessionChange?: (session: Session | null) => void,
) {
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Cannot get token!", error);
      }

      if (active) {
        setStatus(data.session ? "authenticated" : "unauthenticated");
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setStatus(nextSession ? "authenticated" : "unauthenticated");
      onSessionChange?.(nextSession);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [onSessionChange]);

  return status;
}