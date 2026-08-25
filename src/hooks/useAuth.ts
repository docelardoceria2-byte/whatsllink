import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type PlanTier = "free" | "pro";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: (session?.user ?? null) as User | null, loading };
}

export function usePlan(userId: string | undefined) {
  const [plan, setPlan] = useState<PlanTier | null>(null);

  useEffect(() => {
    if (!userId) {
      setPlan(null);
      return;
    }
    let active = true;
    supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setPlan((data?.plan as PlanTier) ?? "free");
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return plan;
}
