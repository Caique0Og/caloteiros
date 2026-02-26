// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBdEdxRBBbeMGxHLUQYqXE9y7iectmE8fU",
  authDomain: "caloteiros-login.firebaseapp.com",
  projectId: "caloteiros-login",
  storageBucket: "caloteiros-login.firebasestorage.app",
  messagingSenderId: "93529359374",
  appId: "1:93529359374:web:e106cfa879ce4c8d3d285f",
  measurementId: "G-VNBMGFHHJD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Authentication service (needed for Google login and other providers)
import { getAuth } from "firebase/auth";
export const auth = getAuth(app);

export { app, analytics };
