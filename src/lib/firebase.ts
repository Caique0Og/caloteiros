<<<<<<< HEAD
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
=======
// integrations/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
>>>>>>> 17dfa75 (Minhas credenciais)

// ✅ Suas credenciais do Firebase
const firebaseConfig = {
<<<<<<< HEAD
  apiKey: 'AIzaSyBdEdxRBBbeMGxHLUQYqXE9y7iectmE8fU',
  authDomain: 'caloteiros-login.firebaseapp.com',
  projectId: 'caloteiros-login',
  storageBucket: 'caloteiros-login.firebasestorage.app',
  messagingSenderId: '93529359374',
  appId: '1:93529359374:web:e106cfa879ce4c8d3d285f',
  measurementId: 'G-VNBMGFHHJD'
=======
  apiKey: "AIzaSyBdEdxRBBbeMGxHLUQYqXE9y7iectmE8fU",
  authDomain: "caloteiros-login.firebaseapp.com",
  projectId: "caloteiros-login",
  storageBucket: "caloteiros-login.firebasestorage.app",
  messagingSenderId: "93529359374",
  appId: "1:93529359374:web:e106cfa879ce4c8d3d285f",
  measurementId: "G-VNBMGFHHJD"
>>>>>>> 17dfa75 (Minhas credenciais)
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
<<<<<<< HEAD
=======
const analytics = getAnalytics(app);

// Exporta Auth e Firestore
>>>>>>> 17dfa75 (Minhas credenciais)
export const auth = getAuth(app);
export const db = getFirestore(app);
export { app, analytics };

// Teste rápido para confirmar conexão
console.log("Firebase conectado ao projeto:", firebaseConfig.projectId);