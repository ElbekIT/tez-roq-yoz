import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCR8QE6UHlS8qqp7UIqCxyiXto_xlB0xyI",
  authDomain: "tezroqyoz.firebaseapp.com",
  databaseURL: "https://tezroqyoz-default-rtdb.firebaseio.com",
  projectId: "tezroqyoz",
  storageBucket: "tezroqyoz.firebasestorage.app",
  messagingSenderId: "562891786916",
  appId: "1:562891786916:web:8372d94bf2128fcc127431",
  measurementId: "G-C3F6970S7T"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, db, auth, googleProvider };