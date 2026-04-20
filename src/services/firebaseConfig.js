import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDUW1k2u0BjxX_cDtt5yZ0s0J3JwZradWo",
  authDomain: "skillfinder-b5e2a.firebaseapp.com",
  projectId: "skillfinder-b5e2a",
  storageBucket: "skillfinder-b5e2a.firebasestorage.app",
  messagingSenderId: "212741445277",
  appId: "1:212741445277:web:c68d0eba06c8b1eb466674"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;