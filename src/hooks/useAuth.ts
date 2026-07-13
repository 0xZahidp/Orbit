import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface OrbitProfile {
  id: string;
  display_name: string;
  email: string | null;
  avatar_gradient: string;
}

// Ensures a profile row exists for the signed-in user.
export async function ensureProfile(user: User): Promise<OrbitProfile | null> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, display_name, email, avatar_gradient")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return existing as OrbitProfile;

  const displayName =
    (user.user_metadata?.display_name as string) ||
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email?.split("@")[0] ||
    "Orbit Member";

  const { data: created } = await supabase
    .from("profiles")
    .insert({ id: user.id, display_name: displayName, email: user.email })
    .select("id, display_name, email, avatar_gradient")
    .maybeSingle();
  return (created as OrbitProfile) ?? null;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<OrbitProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        // Defer Supabase calls to avoid deadlock inside the callback.
        setTimeout(() => {
          ensureProfile(s.user).then(setProfile);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) ensureProfile(data.session.user).then(setProfile);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, profile, loading };
}
