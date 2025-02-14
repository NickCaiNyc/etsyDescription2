import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdFcZhJX05otaqZmYhrLbjKkRJ5a_ZeaE",
  authDomain: "etsydb-fdad2.firebaseapp.app",
  projectId: "etsydb-fdad2",
  storageBucket: "etsydb-fdad2.appspot.com", 
  messagingSenderId: "686661160483",
  appId: "1:686661160483:web:98fc5c4d5f907080f0eb96",
  measurementId: "G-LVMPR30ZK1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
