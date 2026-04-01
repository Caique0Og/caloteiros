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
import { ADMIN_EMAILS } from "@/lib/config";

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const createProfileIfNew = async (firebaseUser: User, isNewUser: boolean) => {
    if (!isNewUser) return;

    try {
      const username = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário';
      const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email || '');
      
      await setDoc(doc(db, 'profiles', firebaseUser.uid), {
        username,
        email: firebaseUser.email,
        role: isAdmin ? 'admin' : 'user',
        created_at: serverTimestamp(),
      });
      console.log("Perfil criado para novo usuário:", firebaseUser.uid);
    } catch (error) {
      console.error("Erro ao criar perfil no Firestore:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = useCallback((email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password), []);

  const signUp = useCallback((email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password), []);

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

  const signOut = useCallback(() => firebaseSignOut(auth), []);

  const deleteAccount = useCallback(async () => {
    if (!auth.currentUser) {
      throw new Error('Usuário Firebase não autenticado');
    }
    await deleteUser(auth.currentUser);
  }, []);

  return { user, loading, signIn, signUp, signInWithGoogle, signOut, deleteAccount };
}