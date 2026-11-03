import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/omcms";

export type Profile = {
  id: string;
  name: string;
  email: string;
  department: string;
};

type AuthState = {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  role: Role | null;
  isManager: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadIdentity(userId: string) {
    const [{ data: prof }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, email, department")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((prof as Profile) ?? null);
    const found = (roles ?? []).map((r) => r.role as Role);
    setRole(
      found.includes("ADMIN")
        ? "ADMIN"
        : found.includes("MANAGER")
          ? "MANAGER"
          : (found[0] ?? "EMPLOYEE"),
    );
  }

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      if (!next) {
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) await loadIdentity(data.session.user.id);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    let active = true;
    setLoading(true);
    loadIdentity(session.user.id).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const value: AuthState = {
    loading,
    session,
    profile,
    role,
    isManager: role === "MANAGER",
    isAdmin: role === "ADMIN",
    signOut: async () => {
      await supabase.auth.signOut();
      setProfile(null);
      setRole(null);
    },
    refresh: async () => {
      if (session?.user?.id) await loadIdentity(session.user.id);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
