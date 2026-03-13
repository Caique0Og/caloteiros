import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBdEdxRBBbeMGxHLUQYqXE9y7iectmE8fU',
  authDomain: 'caloteiros-login.firebaseapp.com',
  projectId: 'caloteiros-login',
  storageBucket: 'caloteiros-login.firebasestorage.app',
  messagingSenderId: '93529359374',
  appId: '1:93529359374:web:e106cfa879ce4c8d3d285f',
  measurementId: 'G-VNBMGFHHJD'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };