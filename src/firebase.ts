// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCFXQuWiV6sKVj7XbWQ7WZ-zd9lttL2Jkw",
  authDomain: "ncl-league.firebaseapp.com",
  projectId: "ncl-league",
  storageBucket: "ncl-league.firebasestorage.app",
  messagingSenderId: "943379047142",
  appId: "1:943379047142:web:a34cab796d01d620ae5127",
  measurementId: "G-FJET4TYGD9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);