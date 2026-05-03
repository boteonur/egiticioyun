import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB1gHSr2fpZZvXRLBi8CUEXhRRjXLCyfhw",
  authDomain: "egiticioyuntr.firebaseapp.com",
  projectId: "egiticioyuntr",
  storageBucket: "egiticioyuntr.firebasestorage.app",
  messagingSenderId: "470830059463",
  appId: "1:470830059463:web:4afeae2b894fe4d83953e2"
};

// BURASI ÇOK ÖNEMLİ: Eğer uygulama zaten başlatılmışsa yenisini açmaz, çakışmayı önler
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "deme-oyunu-v1";

export { auth, db, appId, app };