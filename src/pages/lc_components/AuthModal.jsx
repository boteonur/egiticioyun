import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, appId } from '../config/firebase.js';

export default function AuthModal({ 
  onClose, 
  onSuccess, 
  t 
}) {
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    const cleanEmail = email.trim().toLowerCase();
    
    try {
      const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      
      const userRef = doc(db, 'artifacts', appId, 'users', userCred.user.uid, 'profile', 'data');
      await setDoc(userRef, {
        email: cleanEmail,
        level: 1, 
        bronze: 50, 
        silver: 0, 
        gold: 0, 
        wins: 0, 
        losses: 0,
        avatar: '🧑‍🚀', 
        createdAt: new Date().getTime(), 
        unlockedAvatars: [],
        unlockedEmojis: [], 
        isTextChatUnlocked: false, 
        emotesSent: 0, 
        messagesSent: 0,
        loginStreak: 1, 
        lastLoginDate: new Date().toISOString().split('T')[0],
        winStreak: 0, 
        privateGamesPlayed: 0, 
        hasBeenTop10: false
      });
      
      const publicRef = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', userCred.user.uid);
      await setDoc(publicRef, {
        email: cleanEmail, 
        displayName: cleanEmail.split('@')[0], 
        level: 1, 
        bronze: 50, 
        silver: 0, 
        gold: 0, 
        wins: 0, 
        losses: 0, 
        avatar: '🧑‍🚀'
      }, { merge: true });
      
      onSuccess('profile');
      onClose();
    } catch (error) {
      console.error("Kayıt Hatası:", error);
      setAuthError(t('notRegistered') + " - " + error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const cleanEmail = email.trim().toLowerCase();
    
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
      onClose();
    } catch (error) {
      console.error("Giriş Hatası:", error);
      setAuthError(t('notRegistered') + " - " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white/90 backdrop-blur-md rounded-3xl w-full max-w-md p-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-white/50 relative transform transition-all">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-200 hover:bg-red-100 hover:text-red-600 transition-colors"
        >
          ✕
        </button>

        <h2 className="text-3xl font-black text-center mb-6 text-neutral-800 tracking-tight">
          {authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
        </h2>
        
        <p className="text-center text-neutral-600 font-medium mb-8">
          {authMode === 'login' 
            ? 'Hesabınıza giriş yaparak ilerlemenizi kaydedin.' 
            : t('registerDesc')}
        </p>

        {authError && (
          <div className="bg-red-50 text-red-600 border border-red-200 py-3 px-4 rounded-xl text-center font-medium mb-6 text-sm">
            {authError}
          </div>
        )}

        {authMode === 'register' && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl mb-6 flex items-start shadow-sm">
            <span className="text-xl mr-3">🎁</span>
            <p className="text-sm text-amber-800 font-semibold">{t('firstGift')}</p>
          </div>
        )}

        <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="E-posta Adresi"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-center font-bold text-lg p-4 border-2 border-neutral-200 rounded-2xl focus:border-blue-500 focus:outline-none transition-colors bg-white shadow-inner"
            required
          />
          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-center font-bold text-lg p-4 border-2 border-neutral-200 rounded-2xl focus:border-blue-500 focus:outline-none transition-colors bg-white shadow-inner"
            required
            minLength={6}
          />
          
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg transition-transform transform hover:scale-[1.02] text-xl border-b-4 border-indigo-800 mt-2"
          >
            {authMode === 'login' ? 'GİRİŞ YAP' : 'ÜCRETSİZ KAYIT OL'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-neutral-500 font-medium">
            {authMode === 'login' ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
          </p>
          <button 
            type="button"
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'register' : 'login');
              setAuthError('');
            }}
            className="text-blue-600 font-bold tracking-wide underline decoration-2 decoration-blue-200 hover:decoration-blue-600 transition-colors mt-1"
          >
            {authMode === 'login' ? 'Yeni Hesap Oluştur' : 'Mevcut Hesaba Giriş Yap'}
          </button>
        </div>
      </div>
    </div>
  );
}
