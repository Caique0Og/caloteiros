# Integração Firebase Auth - MateCash

## Pré-requisitos

1. Criar um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ativar **Authentication** → **Sign-in method** → Habilitar **Email/Password** e/ou **Google**

---

## Passo 1: Instalar o SDK

```bash
npm install firebase
```

---

## Passo 2: Criar o arquivo de configuração

Crie o arquivo `src/lib/firebase.ts`:

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Substitua pelos valores do seu projeto Firebase
// Firebase Console → Configurações do projeto → Seus apps → Config
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

> 📍 **Onde encontrar**: Firebase Console → ⚙️ Configurações do projeto → Seus apps → botão `</>` (Web) → Copie o `firebaseConfig`

---

## Passo 3: Criar hook de autenticação

Crie o arquivo `src/hooks/useFirebaseAuth.ts`:

```typescript
import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  const signInWithGoogle = () =>
    signInWithPopup(auth, new GoogleAuthProvider());

  const signOut = () => firebaseSignOut(auth);

  return { user, loading, signIn, signUp, signInWithGoogle, signOut };
}
```

---

## Passo 4: Onde integrar no projeto

### Arquivos que precisam ser alterados:

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useAuth.ts` | Substituir a lógica do Supabase Auth pelo `useFirebaseAuth` |
| `src/pages/Auth.tsx` | Alterar chamadas de `supabase.auth.*` para usar funções do hook Firebase |
| `src/App.tsx` | Substituir imports do `useAuth` se necessário |

### Exemplo de substituição em `src/pages/Auth.tsx`:

```typescript
// ANTES (Supabase)
import { supabase } from "@/integrations/supabase/client";
await supabase.auth.signInWithPassword({ email, password });

// DEPOIS (Firebase)
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
const { signIn } = useFirebaseAuth();
await signIn(email, password);
```

---

## Passo 5: Sincronizar Firebase UID com Supabase

Se você usar Firebase Auth + Supabase Database, precisará sincronizar o `uid` do Firebase com a tabela `profiles` do Supabase.

Opção recomendada: Ao fazer signup no Firebase, crie um registro na tabela `profiles` do Supabase com o `uid` do Firebase como `id`.

```typescript
import { supabase } from "@/integrations/supabase/client";

// Após criar o usuário no Firebase:
const { user } = await createUserWithEmailAndPassword(auth, email, password);

// Inserir no Supabase (sem RLS ou com service_role key via edge function)
await supabase.from("profiles").insert({
  id: user.uid,
  username: user.displayName || email.split("@")[0],
});
```

> ⚠️ **Atenção**: As políticas RLS do Supabase usam `auth.uid()` que vem do Supabase Auth. Se usar Firebase Auth, você precisará usar uma **Edge Function** com `service_role` key para operações no banco, ou implementar JWT customizado.

---

## Resumo da Arquitetura

```
┌─────────────┐     ┌──────────────────┐
│  Firebase    │     │  Supabase        │
│  Auth        │     │  Database        │
│  (login)     │────▶│  (dados)         │
└─────────────┘     └──────────────────┘
     │                      │
     └──── uid sincronizado ┘
```

> 💡 **Recomendação**: Usar Firebase somente para autenticação e manter o Supabase para o banco de dados. Isso exigirá uma camada de sincronização via Edge Functions.
