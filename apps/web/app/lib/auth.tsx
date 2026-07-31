import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthContext, type AuthContextValue } from "./authContext";
import { supabase } from "./supabaseClient";
import { clearSnapshot } from "./offlineCache";
import { SignInDrawer } from "./signInDrawer";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isSignedIn: Boolean(session),
      isReady,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!error) {
          setIsSignInOpen(false);
        }
        return { error };
      },
      signOut: async () => {
        await supabase.auth.signOut();
        await clearSnapshot();
      },
      openSignIn: () => setIsSignInOpen(true),
      closeSignIn: () => setIsSignInOpen(false),
      isSignInOpen,
    }),
    [session, isReady, isSignInOpen],
  );

  return (
    <AuthContext value={value}>
      {children}
      <SignInDrawer />
    </AuthContext>
  );
}
