import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthError, Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { clearSnapshot } from "./offlineCache";
import { SignInDrawer } from "./signInDrawer";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isSignedIn: boolean;
  /** False until the initial session lookup resolves — guards against a
      signed-out flash that would wrongly redirect a deep-linked user. */
  isReady: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  openSignIn: () => void;
  closeSignIn: () => void;
  isSignInOpen: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
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
    <AuthContext.Provider value={value}>
      {children}
      <SignInDrawer />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
