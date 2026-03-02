import { useEffect, useMemo, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useFirebaseAuth } from './useFirebaseAuth';

type AppUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
};

export function useAuth() {
  const firebase = useFirebaseAuth();
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [supabaseLoading, setSupabaseLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSupabaseUser(session?.user ?? null);
      setSupabaseLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
      setSupabaseLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const normalizedFirebaseUser = useMemo<AppUser | null>(() => {
    if (!firebase.user) return null;
    return {
      id: firebase.user.uid,
      email: firebase.user.email,
      user_metadata: {
        username: firebase.user.displayName ?? firebase.user.email?.split('@')[0],
      },
    };
  }, [firebase.user]);

  const user: AppUser | null = (supabaseUser as unknown as AppUser | null) ?? normalizedFirebaseUser;
  const loading = supabaseLoading || firebase.loading;

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email: string, password: string) =>
    supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

  // Keep Google flow unchanged (Firebase).
  const signInWithGoogle = () => firebase.signInWithGoogle();

  const signOut = async () => {
    await Promise.allSettled([supabase.auth.signOut(), firebase.signOut()]);
  };

  return { user, loading, signIn, signUp, signInWithGoogle, signOut };
}
