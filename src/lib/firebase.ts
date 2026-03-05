import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAAwdXT30l4uFfYXT0774xP8JUD7cMIKsI",
  authDomain: "homologcaloteiros-5170f.firebaseapp.com",
  projectId: "homologcaloteiros-5170f",
  storageBucket: "homologcaloteiros-5170f.firebasestorage.app",
  messagingSenderId: "153012378956",
  appId: "1:153012378956:web:59d52571e83a16494583e9",
  measurementId: "G-F59XXCYP0N"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };