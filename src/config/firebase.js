/* global __firebase_config, __app_id */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyALmt8PoygwEVNlCynENz8a-xgpiUBgqVI",
      authDomain: "lockedchecker.firebaseapp.com",
      projectId: "lockedchecker",
      storageBucket: "lockedchecker.firebasestorage.app",
      messagingSenderId: "307635237653",
      appId: "1:307635237653:web:51f212a42b64be6db66f1c"
    };

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = typeof __app_id !== 'undefined' ? __app_id : "locked-checker";
