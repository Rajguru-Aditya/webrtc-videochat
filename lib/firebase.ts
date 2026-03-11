// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDuNZqXk0nYRNts5Fqvlapi1LfcBdsuUDg",
  authDomain: "webrtc-videochat-53146.firebaseapp.com",
  projectId: "webrtc-videochat-53146",
  storageBucket: "webrtc-videochat-53146.firebasestorage.app",
  messagingSenderId: "140237332867",
  appId: "1:140237332867:web:0e242f1e21bec902d496b6",
  measurementId: "G-9R6MW8BFK9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);