import { useEffect, useMemo, useState } from 'react';
import { useFirebaseAuth } from './useFirebaseAuth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type User = {
  id?: string;
  uid?: string;
  email?: string | null;
  displayName?: string | null;
  user_metadata?: Record<string, any>;
  role?: 'user' | 'admin';
};

export type AppUser = User;

export function useAuth() {
  const firebase = useFirebaseAuth();
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');
  const [fetchingRole, setFetchingRole] = useState(false);

  useEffect(() => {
    if (!firebase.user) {
      setUserRole('user');
      setFetchingRole(false);
      return;
    }

    setFetchingRole(true);
    const docRef = doc(db, 'profiles', firebase.user.uid);
    
    // Usar onSnapshot para reagir instantaneamente à criação do perfil no signup
    const unsubscribe = onSnapshot(docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserRole(data.role as 'user' | 'admin' || 'user');
        } else {
          setUserRole('user');
        }
        setFetchingRole(false);
      },
      (error) => {
        console.error("Erro ao escutar mudanças no perfil:", error);
        setUserRole('user');
        setFetchingRole(false);
      }
    );

    return () => unsubscribe();
  }, [firebase.user]);

  const user: AppUser | null = useMemo(() => {
    if (!firebase.user) return null;
    return {
      uid: firebase.user.uid,
      id: firebase.user.uid,
      email: firebase.user.email,
      displayName: firebase.user.displayName,
      user_metadata: {
        username: firebase.user.displayName || firebase.user.email?.split('@')[0],
      },
      role: userRole,
    };
  }, [firebase.user, userRole]);
  const loading = firebase.loading || fetchingRole;

  const signIn = async (email: string, password: string) => {
    const result = await firebase.signIn(email, password);
    return { user: result.user };
  };

  const signUp = async (email: string, password: string) => {
    const result = await firebase.signUp(email, password);
    return { user: result.user };
  };

  const signInWithGoogle = () => firebase.signInWithGoogle();

  const signOut = async () => {
    await firebase.signOut();
  };

  const deleteAccount = async () => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      if (firebase.user) {
        // Primeiro tenta excluir conta Firebase (requer login recente)
        await firebase.deleteAccount();
      }

      // Logout garantido depois da exclusão da conta Firebase.
      await firebase.signOut();
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      throw error;
    }
  };

  return { user, loading, signIn, signUp, signInWithGoogle, signOut, deleteAccount };
}
