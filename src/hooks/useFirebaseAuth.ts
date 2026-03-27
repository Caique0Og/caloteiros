import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  getAdditionalUserInfo,
  deleteUser,
  type User,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const createProfileIfNew = async (user: User, isNewUser: boolean) => {
    if (isNewUser) {
      try {
        const username = user.displayName || user.email?.split('@')[0] || 'Usuário';
        await setDoc(doc(db, 'profiles', user.uid), {
          username,
          created_at: serverTimestamp(),
        });
        console.log("Perfil criado para novo usuário:", user.uid);
      } catch (error) {
        console.error("Erro ao criar perfil no Firestore:", error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  const signUp = (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const additionalInfo = getAdditionalUserInfo(result);
      if (additionalInfo?.isNewUser) {
        await createProfileIfNew(result.user, true);
      }
      return result;
    } catch (error) {
      console.error("Erro no login Google Popup:", error);
      throw error;
    }
  }, []);

  const signOut = () => firebaseSignOut(auth);

  const deleteAccount = async () => {
    if (!auth.currentUser) {
      throw new Error('Usuário Firebase não autenticado');
    }

    try {
      await deleteUser(auth.currentUser);
    } catch (error) {
      console.error('Erro ao deletar conta Firebase:', error);
      throw error;
    }
  };

  return { user, loading, signIn, signUp, signInWithGoogle, signOut, deleteAccount };
}