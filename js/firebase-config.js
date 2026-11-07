import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyCdpht_05RX-zMbM65zlIO9g4hy2_gZ08U",
  authDomain: "rk-portfolio-eb485.firebaseapp.com",
  projectId: "rk-portfolio-eb485",
  storageBucket: "rk-portfolio-eb485.firebasestorage.app",
  messagingSenderId: "750562255965",
  appId: "1:750562255965:web:0a1f9f53a562998b30d9b4",
  measurementId: "G-FW3ZQ83NZ5",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
