// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDUW1k2u0BjxX_cDtt5yZ0s0J3JwZradWo",
  authDomain: "skillfinder-b5e2a.firebaseapp.com",
  projectId: "skillfinder-b5e2a",
  storageBucket: "skillfinder-b5e2a.firebasestorage.app",
  messagingSenderId: "212741445277",
  appId: "1:212741445277:web:c68d0eba06c8b1eb466674",
  measurementId: "G-QR7P53SDEM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);