# Configuração do Projeto com Firebase

Este guia aborda a configuração completa do Firebase para o projeto "Os Caloteiros", incluindo Autenticação e o banco de dados Firestore.

## 1. Configuração do Projeto Firebase

1.  Acesse o [Firebase Console](https://console.firebase.google.com/).
2.  Clique em **"Adicionar projeto"** e siga as instruções.
3.  No painel do seu projeto, vá para **Authentication** (no menu à esquerda).
    *   Clique na aba **"Sign-in method"**.
    *   Ative os provedores **"E-mail/senha"** e **"Google"**.
4.  Ainda no painel, vá para **Firestore Database**.
    *   Clique em **"Criar banco de dados"**.
    *   Inicie no **modo de produção** e clique em "Avançar".
    *   Escolha a localização do seu banco de dados (ex: `southamerica-east1 (São Paulo)`) e clique em "Ativar".

## 2. Instalação do SDK

Se ainda não o fez, instale o SDK do Firebase no seu projeto:

```bash
npm install firebase
```

## 3. Arquivo de Configuração

Crie o arquivo `src/lib/firebase.ts` e adicione suas credenciais.

> 📍 **Onde encontrar**: No Firebase Console, vá em ⚙️ **Configurações do projeto** → **Geral**. Role para baixo até "Seus apps", clique no ícone `</>` (Web) e copie o objeto `firebaseConfig`.

```typescript
// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const db = getFirestore(app);
```

## 4. Estrutura de Dados no Firestore

O Firestore é um banco de dados NoSQL baseado em coleções e documentos. A estrutura será a seguinte:

*   `profiles/{userId}`: Armazena informações públicas dos usuários.
    *   `username`: `string`
    *   `created_at`: `timestamp`

*   `groups/{groupId}`: Armazena os dados de um grupo.
    *   `name`: `string`
    *   `location`: `string` (opcional)
    *   `owner_id`: `string` (ID do usuário que criou o grupo)
    *   `created_at`: `timestamp`
    *   `members`: `array` de `string` (contendo os `userId` dos membros)

*   `expenses/{expenseId}`: Uma despesa dentro de um grupo.
    *   `group_id`: `string`
    *   `payer_id`: `string` (ID do usuário que pagou)
    *   `amount`: `number`
    *   `description`: `string`
    *   `created_at`: `timestamp`

*   `debts/{debtId}`: Dívidas geradas a partir de uma despesa.
    *   `group_id`: `string`
    *   `debtor_id`: `string` (quem deve)
    *   `creditor_id`: `string` (para quem deve)
    *   `amount`: `number`
    *   `status`: `string` ('pending', 'paid')
    *   `created_at`: `timestamp`

## 5. Regras de Segurança do Firestore

As regras de segurança são essenciais para proteger seus dados. Vá para **Firestore Database** → **Regras** e cole o seguinte:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Perfis: Usuários podem ver todos, mas só editar o seu.
    match /profiles/{userId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth.uid == userId;
    }

    // Função para verificar se o usuário é membro de um grupo
    function isGroupMember(groupId) {
      return get(/databases/$(database)/documents/groups/$(groupId)).data.members.hasAny([request.auth.uid]);
    }

    // Grupos: Apenas membros podem ler. O criador pode editar/deletar.
    match /groups/{groupId} {
      allow read, create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.owner_id;
      // Para leitura mais restrita, use: allow read: if isGroupMember(groupId);
    }

    // Despesas e Dívidas: Apenas membros do grupo podem interagir.
    match /expenses/{expenseId} {
      allow read, create, delete: if isGroupMember(request.resource.data.group_id);
    }

    match /debts/{debtId} {
      allow read, create, delete: if isGroupMember(request.resource.data.group_id);
      allow update: if request.auth.uid == resource.data.debtor_id || request.auth.uid == resource.data.creditor_id;
    }
  }
}
```