import { useEffect, useMemo, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useFirebaseAuth } from './useFirebaseAuth';

export type User = {
  id?: string;
  uid?: string;
  email?: string | null;
  displayName?: string | null;
  user_metadata?: Record<string, any>;
};

export type AppUser = User;

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

  const signIn = async (email: string, password: string) => {
    try {
      // Tenta Firebase primeiro, pois Auth.tsx depende do Firestore
      const result = await firebase.signIn(email, password);
      return { user: result.user };
    } catch (error) {
      // Fallback ou erro
      console.error("Firebase signIn error:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const result = await firebase.signUp(email, password);
      return { user: result.user };
    } catch (error) {
      console.error("Firebase signUp error:", error);
      throw error;
    }
  };

  // Keep Google flow unchanged (Firebase).
  const signInWithGoogle = () => firebase.signInWithGoogle();

  const signOut = async () => {
    await Promise.allSettled([supabase.auth.signOut(), firebase.signOut()]);
  };

  return { user, loading, signIn, signUp, signInWithGoogle, signOut };
}