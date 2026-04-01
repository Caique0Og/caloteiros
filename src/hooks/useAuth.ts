import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseAuth } from './useFirebaseAuth';
import { ADMIN_EMAILS } from '@/lib/config';

export type UserRole = 'user' | 'admin';

export interface AppUser {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  user_metadata: {
    username: string;
    [key: string]: any;
  };
  role: UserRole;
}

// Alias for backward compatibility
export type User = AppUser;

export function useAuth() {
  const firebase = useFirebaseAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [fetchingRole, setFetchingRole] = useState(false);

  useEffect(() => {
    if (!firebase.user) {
      setUserRole(null);
      setFetchingRole(false);
      return;
    }

    // Autoridade imediata da lista de emails
    const isHardcodedAdmin = ADMIN_EMAILS.includes(firebase.user.email || '');

    setFetchingRole(true);
    const docRef = doc(db, 'profiles', firebase.user.uid);
    
    // Listen to profile changes in real-time
    const unsubscribe = onSnapshot(docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Se estiver na lista ou se o Firestore diz que é admin
          const isAdmin = isHardcodedAdmin || data.role === 'admin';
          setUserRole(isAdmin ? 'admin' : 'user');
        } else {
          // Se não existir perfil ainda, mas está na lista, é admin
          setUserRole(isHardcodedAdmin ? 'admin' : 'user');
        }
        setFetchingRole(false);
      },
      (error) => {
        console.error("Erro ao escutar mudanças no perfil:", error);
        setUserRole(isHardcodedAdmin ? 'admin' : 'user');
        setFetchingRole(false);
      }
    );

    return () => unsubscribe();
  }, [firebase.user]);

  const user = useMemo<AppUser | null>(() => {
    if (!firebase.user) return null;
    
    // Fallback imediato se o useEffect ainda não tiver definido setUserRole
    // mas sabemos que está na lista de admins
    const isHardcodedAdmin = ADMIN_EMAILS.includes(firebase.user.email || '');
    const currentRole = userRole || (isHardcodedAdmin ? 'admin' : null);

    // Se ainda estivermos no escuro sobre o papel
    if (!currentRole) return null;
    
    return {
      uid: firebase.user.uid,
      id: firebase.user.uid,
      email: firebase.user.email,
      displayName: firebase.user.displayName,
      user_metadata: {
        username: firebase.user.displayName || firebase.user.email?.split('@')[0] || 'Usuário',
      },
      role: currentRole as UserRole,
    };
  }, [firebase.user, userRole]);

  // Loading if firebase is loading OR if we have a user but are still fetching their role
  const loading = firebase.loading || (!!firebase.user && userRole === null && !ADMIN_EMAILS.includes(firebase.user.email || '')) || fetchingRole;

  return { 
    user, 
    loading, 
    signIn: firebase.signIn, 
    signUp: firebase.signUp, 
    signInWithGoogle: firebase.signInWithGoogle, 
    signOut: firebase.signOut, 
    deleteAccount: async () => {
      if (!firebase.user) throw new Error('Usuário não autenticado');
      await firebase.deleteAccount();
    }
  };
}
