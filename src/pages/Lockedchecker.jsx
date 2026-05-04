import React, { useState, useEffect, useRef } from 'react';
/* global __initial_auth_token */
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { collection, doc, setDoc, updateDoc, onSnapshot, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db, appId } from '../config/firebase.js';
import { ADMIN_EMAILS, generateRoomId, createInitialBoard, getCellColor, getGenitiveSuffix } from '../utils/gameUtils.js';
import AuthModal from '../components/AuthModal.jsx';
import UserProfileModal from '../components/UserProfileModal.jsx';
import { AudioEngine } from '../audio/AudioEngine.js';
import { translations } from '../locales/translations.js';
import { Link } from 'react-router-dom';
export default function Lockedchecker({ onNavigateHome }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('locked_checker_lang') || 'tr');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('locked_checker_sound');
    return saved !== null ? saved === 'true' : true;
  });
  
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [bgColor, setBgColor] = useState(() => localStorage.getItem('locked_checker_bg') || 'bg-neutral-100');
  const [isBgDropdownOpen, setIsBgDropdownOpen] = useState(false);

  const langDropdownRef = useRef(null);
  const bgDropdownRef = useRef(null);

  // --- SOHBET VE İFADE (EMOTE) SİSTEMİ ---
  const FREE_EMOJIS = ['😀', '😢', '😡', '😮', '👍', '👎', '👋', '🙏'];
  const PREMIUM_EMOJIS = [
    '😂', '😎', '😍', '🥶', '🤡', '👽', '👻', '💩', '💀', '💯', '🔥', '🎉',
    '🤑', '🤯', '😈', '🤖', '👾', '🚀', '⭐', '🏆', '👑', '💎', '💡', '💣',
    '💤', '💪', '🧠', '👀', '💃', '🕺', '🥳', '🤫', '🤔', '🤨', '🙄', '😤',
    '🤬', '🤮', '🤒', '🤕', '🤠', '🥸', '🥺', '🥱', '🤐', '🥵', '🥴', '😵'
  ];
  
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chattingPlayerRole, setChattingPlayerRole] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [hasSentChatThisTurn, setHasSentChatThisTurn] = useState(false);
  const [activeChat, setActiveChat] = useState({ 0: null, 1: null });
  const [blockedChat, setBlockedChat] = useState({ 0: false, 1: false });
  const lastProcessedActionTime = useRef(0);
  const loginCheckedRef = useRef(false);

  // --- YÖNETİCİ PANELİ STATE'LERİ ---
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [editingAdminUser, setEditingAdminUser] = useState(null);
  const [adminEditCoins, setAdminEditCoins] = useState({ gold: 0, silver: 0, bronze: 0 });
  const [adminPanelMessage, setAdminPanelMessage] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isLangDropdownOpen && langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
      if (isBgDropdownOpen && bgDropdownRef.current && !bgDropdownRef.current.contains(event.target)) {
        setIsBgDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLangDropdownOpen, isBgDropdownOpen]);

  useEffect(() => { localStorage.setItem('locked_checker_lang', language); }, [language]);
  useEffect(() => { localStorage.setItem('locked_checker_sound', soundEnabled); }, [soundEnabled]);
  useEffect(() => { localStorage.setItem('locked_checker_bg', bgColor); }, [bgColor]);

  const t = (key, params = {}) => {
    let text = translations[language]?.[key] || translations['en'][key] || key;
    if (params) {
      Object.keys(params).forEach(k => { text = text.replace(`{${k}}`, params[k]); });
    }
    return text;
  };

  const playSound = (type) => {
    if (!soundEnabled) return;
    if (AudioEngine[type]) AudioEngine[type]();
  };

  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [myRole, setMyRole] = useState(null); 

  const [board, setBoard] = useState(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState(0); 
  const [dice, setDice] = useState(null); 
  const [gameState, setGameState] = useState('playing'); 
  const [winner, setWinner] = useState(null);
  const [winReason, setWinReason] = useState(null); 
  const [scores, setScores] = useState({ 0: 0, 1: 0 });
  const [isRolling, setIsRolling] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); 
  const [rollingAnim, setRollingAnim] = useState({ color: 'blue', value: 1 }); 
  const [isTurnSkipped, setIsTurnSkipped] = useState(false);
  const [collectedPieces, setCollectedPieces] = useState({ topBlue: 0, topRed: 0, botBlue: 0, botRed: 0 });
  
  const [appView, setAppView] = useState('home'); 
  const [lobbyMode, setLobbyMode] = useState('main'); 
  const [showNameModal, setShowNameModal] = useState(true);
  const [showResultsModal, setShowResultsModal] = useState(false); 
  const [isRulesOpen, setIsRulesOpen] = useState(true); 
  const [isLobbyRulesExpanded, setIsLobbyRulesExpanded] = useState(false);
  
  const [tempNames, setTempNames] = useState({ 0: '', 1: '' }); 
  const [isBotActive, setIsBotActive] = useState(false); 
  const [onlineName, setOnlineName] = useState(''); 
  const [joinRoomIdInput, setJoinRoomIdInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [createRoomType, setCreateRoomType] = useState('public'); 
  const [lobbyMessage, setLobbyMessage] = useState(''); 

  const [roomData, setRoomData] = useState(null);
  const [playerNames, setPlayerNames] = useState({ 0: t('greenPlayer'), 1: t('yellowPlayer') });

  const isAITurn = !isOnline && currentPlayer === 1 && playerNames[1] === t('aiName');

  const [timeLeft, setTimeLeft] = useState(10);
  const [autoRollProgress, setAutoRollProgress] = useState(0);
  const rollDiceRef = useRef();

  const [userData, setUserData] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const statsUpdatedRef = useRef(false);
  const [isEditingName, setIsEditingName] = useState(false); 
  const [editNameInput, setEditNameInput] = useState(''); 

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarError, setAvatarError] = useState(''); 
  const AVATAR_OPTIONS = ['🧑‍🚀', '🦁', '🦊', '🐼', '🐯', '🦋', '🌺', '🌻', '🌹', '🎸', '🎺', '🎻', '⚽', '🏀', '🎾', '🦸‍♂️', '🦹‍♀️', '🧙‍♂️', '🧛‍♀️', '🥷', '🕵️‍♂️', '💻', '🚀', '🛸', '🤖', '👾', '🎮'];

  const [leaderboardList, setLeaderboardList] = useState([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  const [hasPromptedAI, setHasPromptedAI] = useState(false);
  const [showPlayAIWhileWaitingModal, setShowPlayAIWhileWaitingModal] = useState(false);
  const [isPlayingAIWhileWaiting, setIsPlayingAIWhileWaiting] = useState(false);
  const [showOpponentFoundModal, setShowOpponentFoundModal] = useState(false);

  useEffect(() => { if (window.innerWidth < 640) setIsRulesOpen(false); }, []);

  useEffect(() => {
    document.title = "Locked Checker"; 
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = 'lc_favicon.png'; 
    
    let metaTag = document.querySelector('meta[name="robots"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = "robots";
      document.head.appendChild(metaTag);
    }
    // DÜZELTME: Arama motorlarının indekslemesine izin ver (SEO)
    metaTag.content = "index, follow"; 
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinRoomIdInput(roomParam.toUpperCase());
      setLobbyMode('join');
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    const unsub = onSnapshot(
      userRef, 
      (docSnap) => {
        if (docSnap.exists()) setUserData(docSnap.data());
      },
      (error) => {
        console.error("Profile snapshot listener error:", error);
      }
    );
    return () => unsub();
  }, [user]);

  // YÖNETİCİ PANELİ İÇİN KULLANICILARI ÇEKME.
  useEffect(() => {
      if (appView === 'admin') {
          const fetchAdminUsers = async () => {
              if (!user) return;
              try {
                  const lbRef = collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard');
                  const snap = await getDocs(lbRef);
                  let data = [];
                  snap.forEach(docSnap => {
                      data.push({ id: docSnap.id, ...docSnap.data() });
                  });
                  setAdminUsers(data);
              } catch(e) { console.error(e); }
          };
          fetchAdminUsers();
      }
  }, [appView, user]);

  useEffect(() => {
    if (userData && user && !user.isAnonymous && !loginCheckedRef.current) {
        loginCheckedRef.current = true;
        const today = new Date().toISOString().split('T')[0];
        const lastLogin = userData.lastLoginDate;
        let newStreak = userData.loginStreak || 0;

        if (lastLogin !== today) {
            if (lastLogin) {
                const lastDate = new Date(lastLogin);
                const currentDate = new Date(today);
                const diffTime = Math.abs(currentDate - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    newStreak += 1;
                } else {
                    newStreak = 1;
                }
            } else {
                newStreak = 1;
            }
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
            updateDoc(userRef, { lastLoginDate: today, loginStreak: newStreak }).catch(e => console.error(e));
        }
    }
  }, [userData, user]);

  useEffect(() => {
    if (gameState === 'playing') statsUpdatedRef.current = false;
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'finished' && showResultsModal) {
      if (!isOnline || winner === myRole || winner === 0) playSound('win'); 
      else if (isOnline && winner !== 'tie' && winner !== myRole) playSound('lose');
    }
  }, [showResultsModal, gameState, winner, isOnline, myRole]);

  useEffect(() => {
    if (appView === 'leaderboard') {
      setIsLeaderboardLoading(true);
      const fetchLeaderboard = async () => {
        if (!user) {
          setIsLeaderboardLoading(false);
          return;
        }
        try {
          const lbRef = collection(db, 'artifacts', appId, 'public', 'data', 'leaderboard');
          const snap = await getDocs(lbRef);
          let data = [];
          snap.forEach(docSnap => {
            const d = docSnap.data();
            const w = d.wins || 0;
            const l = d.losses || 0;
            const total = w + l;
            if (total >= 10) { 
              const winRate = total > 0 ? (w / total) * 100 : 0;
              data.push({ ...d, total, winRate, id: docSnap.id });
            }
          });
          data.sort((a, b) => {
            if (b.winRate !== a.winRate) return b.winRate - a.winRate;
            return b.total - a.total; 
          });
          
          if (userData && !userData.hasBeenTop10) {
              const myRank = data.findIndex(p => p.id === user.uid);
              if (myRank !== -1 && myRank < 10) {
                  const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
                  updateDoc(userRef, { hasBeenTop10: true }).catch(e => console.error(e));
              }
          }

          setLeaderboardList(data);
        } catch(e) { console.error("Sıralama çekilirken hata:", e); } 
        finally { setIsLeaderboardLoading(false); }
      };
      fetchLeaderboard();
    }
  }, [appView, user]);

  useEffect(() => {
    if (gameState === 'finished' && !statsUpdatedRef.current && user && !user.isAnonymous && !isPlayingAIWhileWaiting) {
      statsUpdatedRef.current = true;
      let didWin = false;
      let isTie = winner === 'tie';
      if (isOnline) didWin = winner === myRole;
      else didWin = winner === 0; 
      
      if (!isTie) updateUserStats(didWin);
    }
  }, [gameState, winner, isOnline, myRole, user, isPlayingAIWhileWaiting]);

  const updateUserStats = async (didWin) => {
    if (!userData || !user) return;
    let newWins = userData.wins || 0;
    let newLosses = userData.losses || 0;
    let newBronze = userData.bronze || 0;
    let newLevel = userData.level || 1;
    let newWinStreak = userData.winStreak || 0;
    let newPrivateGames = userData.privateGamesPlayed || 0;

    if (roomData && roomData.type === 'private') {
        newPrivateGames += 1;
    }

    if (didWin) {
      newWins += 1;
      newBronze += 1;
      newWinStreak += 1;
      if (newWins % 10 === 0) {
        newLevel += 1;
        newBronze += 1;
      }
    } else {
      newLosses += 1;
      newWinStreak = 0;
      newBronze = Math.max(0, newBronze - 1);
    }

    const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    await updateDoc(userRef, { 
      wins: newWins, losses: newLosses, bronze: newBronze, level: newLevel,
      winStreak: newWinStreak, privateGamesPlayed: newPrivateGames
    });

    const publicRef = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', user.uid);
    await setDoc(publicRef, {
      wins: newWins, losses: newLosses, bronze: newBronze, level: newLevel,
      displayName: userData.displayName || user.email?.split('@')[0] || t('greenPlayer')
    }, { merge: true });
  };

  const getDisplayName = () => {
    if (userData?.displayName) return userData.displayName;
    if (user && !user.isAnonymous && user.email) return user.email.split('@')[0];
    return ''; 
  };

  const handleSaveName = async () => {
    if (!user) return;
    const newName = editNameInput.trim();
    if (newName) {
      try {
        const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
        await setDoc(userRef, { displayName: newName }, { merge: true });
        const publicRef = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', user.uid);
        await setDoc(publicRef, { displayName: newName }, { merge: true });
        setIsEditingName(false);
      } catch (error) { console.error("İsim güncellenirken hata:", error); }
    }
  };

  const handleSaveAvatar = async (newAvatar) => {
    if (!user) return;
    try {
        const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
        await setDoc(userRef, { avatar: newAvatar }, { merge: true });
        const publicRef = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', user.uid);
        await setDoc(publicRef, { avatar: newAvatar }, { merge: true });
        setShowAvatarModal(false);
    } catch (error) { console.error("Avatar güncellenirken hata:", error); }
  };

  const handleBuyAvatar = async (emoji) => {
    if (!user || user.isAnonymous || !userData) return;
    if ((userData.bronze || 0) < 1) {
        setAvatarError(t('insufficientBronze'));
        setTimeout(() => setAvatarError(''), 3000);
        return;
    }
    try {
        const newBronze = userData.bronze - 1;
        const newUnlocked = [...(userData.unlockedAvatars || []), emoji];
        const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
        await setDoc(userRef, { bronze: newBronze, unlockedAvatars: newUnlocked, avatar: emoji }, { merge: true });
        const publicRef = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', user.uid);
        await setDoc(publicRef, { avatar: emoji, bronze: newBronze }, { merge: true });
        playSound('lock'); 
        setShowAvatarModal(false);
        setAvatarError('');
    } catch (error) { console.error("Satın alma hatası:", error); }
  };

  const handleConvertCoins = async (from, to) => {
    if (!user || user.isAnonymous || !userData) return;

    let { gold = 0, silver = 0, bronze = 0 } = userData;
    let changed = false;

    if (from === 'bronze' && to === 'silver' && bronze >= 10) {
        bronze -= 10;
        silver += 1;
        changed = true;
    } else if (from === 'silver' && to === 'gold' && silver >= 10) {
        silver -= 10;
        gold += 1;
        changed = true;
    } else if (from === 'silver' && to === 'bronze' && silver >= 1) {
        silver -= 1;
        bronze += 10;
        changed = true;
    } else if (from === 'gold' && to === 'silver' && gold >= 1) {
        gold -= 1;
        silver += 10;
        changed = true;
    }

    if (changed) {
        playSound('step'); 
        try {
            const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
            await setDoc(userRef, { gold, silver, bronze }, { merge: true });
            const publicRef = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', user.uid);
            await setDoc(publicRef, { gold, silver, bronze }, { merge: true });
        } catch (error) { console.error("Dönüşüm hatası:", error); }
    }
  };


  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) { console.error("Çıkış hatası:", error); }
  };

  const handleAdminResetPwd = async (userEmail) => {
      if (!userEmail) return;
      try {
          await sendPasswordResetEmail(auth, userEmail);
          setAdminPanelMessage(`${userEmail} adresine şifre sıfırlama bağlantısı gönderildi.`);
          setTimeout(() => setAdminPanelMessage(''), 4000);
      } catch (e) {
          setAdminPanelMessage('Hata: ' + e.message);
          setTimeout(() => setAdminPanelMessage(''), 4000);
      }
  };

  const handleAdminSaveCoins = async (uid) => {
      try {
          const publicRef = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', uid);
          await setDoc(publicRef, adminEditCoins, { merge: true });
          
          try {
              const userRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'data');
              await setDoc(userRef, adminEditCoins, { merge: true });
          } catch (privateErr) {
              console.warn("Private profile update skipped due to sandbox rules:", privateErr);
          }
          
          setAdminUsers(prev => prev.map(u => u.id === uid ? { ...u, ...adminEditCoins } : u));
          setEditingAdminUser(null);
          setAdminPanelMessage('Kullanıcı bakiyesi başarıyla güncellendi.');
          setTimeout(() => setAdminPanelMessage(''), 4000);
      } catch (e) {
          setAdminPanelMessage('Hata: ' + e.message);
          setTimeout(() => setAdminPanelMessage(''), 4000);
      }
  };

  // --- SOHBET / EMOTE FONKSİYONLARI ---

  // Zarlar her değiştiğinde Sohbet/Emote limitini sıfırla
  useEffect(() => {
      if (dice !== null) {
          setHasSentChatThisTurn(false);
      }
  }, [dice]);

  const handleBuyEmoji = async (emoji) => {
      if (!user || user.isAnonymous || !userData) return;
      if ((userData.silver || 0) < 1) return; // Yetersiz bakiye
      try {
          const newSilver = userData.silver - 1;
          const newUnlocked = [...(userData.unlockedEmojis || []), emoji];
          const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
          await setDoc(userRef, { silver: newSilver, unlockedEmojis: newUnlocked }, { merge: true });
          const publicRef = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', user.uid);
          await setDoc(publicRef, { silver: newSilver }, { merge: true });
          playSound('lock');
      } catch (error) { console.error("Emoji satın alma hatası:", error); }
  };

  const handleBuyTextChat = async () => {
      if (!user || user.isAnonymous || !userData) return;
      if ((userData.gold || 0) < 1) return; // Yetersiz bakiye
      try {
          const newGold = userData.gold - 1;
          const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
          await setDoc(userRef, { gold: newGold, isTextChatUnlocked: true }, { merge: true });
          const publicRef = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', user.uid);
          await setDoc(publicRef, { gold: newGold }, { merge: true });
          playSound('win');
      } catch (error) { console.error("Mesajlaşma satın alma hatası:", error); }
  };

  const handleSendChat = async (type, content) => {
      if (hasSentChatThisTurn) return;
      
      setHasSentChatThisTurn(true);
      setIsChatModalOpen(false);
      if (type === 'message') setChatInput('');

      // Kendimizde hemen gösteriyoruz
      setActiveChat(prev => ({ ...prev, [chattingPlayerRole]: { type, content } }));
      if (type === 'emote') playSound('step'); else playSound('lock');

      setTimeout(() => {
          setActiveChat(prev => ({ ...prev, [chattingPlayerRole]: null }));
      }, 4000);

      // Çevrimiçiyse Firebase'e iletiyoruz
      if (isOnline && currentRoomId) {
          try {
              const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', currentRoomId);
              await updateDoc(roomRef, {
                  lastAction: { type, player: chattingPlayerRole, content, timestamp: Date.now() }
              });
          } catch(e) { console.error(e); }
      }

      // --- BAŞARIM TAKİBİ İÇİN SOHBET VE İFADE KAYDI ---
      if (user && !user.isAnonymous && userData) {
          try {
              const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
              if (type === 'emote') {
                  await updateDoc(userRef, { emotesSent: (userData.emotesSent || 0) + 1 });
              } else {
                  await updateDoc(userRef, { messagesSent: (userData.messagesSent || 0) + 1 });
              }
          } catch (e) { console.error("Başarım güncellenirken hata:", e); }
      }
  };

  useEffect(() => {
    let timer;
    if (lobbyMode === 'room' && myRole === 0 && roomData && !roomData.players['1'] && roomData.type === 'public' && !hasPromptedAI && !isPlayingAIWhileWaiting && showNameModal) {
        timer = setTimeout(() => {
            setShowPlayAIWhileWaitingModal(true);
            setHasPromptedAI(true);
        }, 10000);
    }
    return () => clearTimeout(timer);
  }, [lobbyMode, myRole, roomData, hasPromptedAI, isPlayingAIWhileWaiting, showNameModal]);

  useEffect(() => {
    if (!user || !currentRoomId) return;

    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', currentRoomId);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        if (myRole === 1) {
            if (!data.players['1'] || data.players['1'].id !== user.uid) {
                if (data.players['0'] && data.players['0'].id === user.uid) {
                    setMyRole(0);
                    setLobbyMessage(t('promotedToHost'));
                } else {
                    resetToLobby();
                    setLobbyMessage(t('kickedMsg'));
                    return;
                }
            }
        }

        setRoomData(data);
        
        if (!isPlayingAIWhileWaiting) {
          setPlayerNames({
            0: data.players['0']?.name || t('greenPlayer'),
            1: data.players['1']?.name || t('yellowPlayer')
          });
        }

        if (myRole === 0 && isPlayingAIWhileWaiting && data.players['1']) {
            setShowOpponentFoundModal(true);
        }

        if (!isPlayingAIWhileWaiting && (data.status === 'playing' || data.status === 'finished')) {
          setBoard(JSON.parse(data.board));
          setCurrentPlayer(data.currentPlayer);
          setDice(data.dice);
          setGameState(data.gameState);
          setWinner(data.winner);
          setWinReason(data.winReason);
          setScores(data.scores);
          setCollectedPieces(data.collectedPieces);
          setIsRolling(data.isRolling);
          setIsTurnSkipped(data.isTurnSkipped);
          setIsAnimating(data.isAnimating || false);

          if (data.status === 'finished' && gameState !== 'finished') {
             setShowResultsModal(true);
          }

          // Sohbet Yakalayıcısı
          if (data.lastAction && data.lastAction.timestamp !== lastProcessedActionTime.current) {
              lastProcessedActionTime.current = data.lastAction.timestamp;
              const actionPlayer = data.lastAction.player;
              
              if (actionPlayer !== myRole) {
                  const isBlocked = blockedChat[actionPlayer];
                  // Eğer mesaj tipiyse ve engelliyse YASSAK, emote ise veya engelli değilse GÖSTER
                  if (data.lastAction.type === 'emote' || (data.lastAction.type === 'message' && !isBlocked)) {
                      setActiveChat(prev => ({ ...prev, [actionPlayer]: { type: data.lastAction.type, content: data.lastAction.content } }));
                      if (data.lastAction.type === 'emote') playSound('step');
                      else playSound('lock');

                      setTimeout(() => {
                          setActiveChat(prev => ({ ...prev, [actionPlayer]: null }));
                      }, 4000);
                  }
              }
          }

          if (showNameModal) setShowNameModal(false);
        }
      } else {
        console.warn("Oda bulunamadı veya kapatıldı.");
        resetToLobby();
      }
    }, (error) => console.error("Oda dinleme hatası:", error));

    return () => unsubscribe();
  }, [user, currentRoomId, showNameModal, gameState, myRole, isPlayingAIWhileWaiting, blockedChat]); 

  const syncGameState = async (updates) => {
    if (!isOnline || !currentRoomId || isPlayingAIWhileWaiting) return;
    try {
      const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', currentRoomId);
      await updateDoc(roomRef, updates);
    } catch (error) { console.error("Senkronizasyon hatası:", error); }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentRoomId) {
        const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', currentRoomId);
        if (myRole === 0) deleteDoc(roomRef);
        else if (myRole === 1) updateDoc(roomRef, { "players.1": null, status: 'waiting' });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentRoomId, myRole]);

  const resetToLobby = () => {
    setIsOnline(false);
    setCurrentRoomId(null);
    setMyRole(null);
    setRoomData(null);
    setLobbyMode('main');
    setShowNameModal(true);
    setTempNames({ 0: '', 1: '' }); 
    setIsBotActive(false); 
    setHasPromptedAI(false);
    setShowPlayAIWhileWaitingModal(false);
    setIsPlayingAIWhileWaiting(false);
    setShowOpponentFoundModal(false);
    resetGameLocal();
  };

  const handleLeaveRoom = async () => {
    const roomIdToLeave = currentRoomId;
    const roleToLeave = myRole;
    
    resetToLobby();
    
    if (roomIdToLeave) {
      try {
        const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomIdToLeave);
        if (roleToLeave === 0) {
          await deleteDoc(roomRef); 
        } else if (roleToLeave === 1) {
          await updateDoc(roomRef, { "players.1": null, status: 'waiting' }); 
        }
      } catch (error) { console.error("Odadan çıkarken hata:", error); }
    }
  };

  const handleStartAIWhileWaiting = () => {
    setShowPlayAIWhileWaitingModal(false);
    setIsPlayingAIWhileWaiting(true);
    
    setIsOnline(false); 
    setIsBotActive(true);
    setPlayerNames({ 0: onlineName || t('greenPlayer'), 1: t('aiName') });
    setBoard(createInitialBoard());
    setCurrentPlayer(0);
    setDice(null);
    setGameState('playing');
    setShowNameModal(false);
    setAppView('play');
  };

  const handleDeclineOpponent = async () => {
    setShowOpponentFoundModal(false);
    setIsPlayingAIWhileWaiting(false); 
    
    if (currentRoomId && roomData && roomData.players['1']) {
        try {
            const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', currentRoomId);
            const p1 = roomData.players['1'];
            await updateDoc(roomRef, {
                "players.0": p1,
                "players.1": null,
                status: 'waiting'
            });
        } catch(e) { console.error(e); }
    }
    
    setCurrentRoomId(null);
    setMyRole(null);
    setRoomData(null);
  };

  const handleAcceptOpponent = async () => {
    setShowOpponentFoundModal(false);
    setIsPlayingAIWhileWaiting(false);
    setIsOnline(true);
    setIsBotActive(false); 
    
    setLobbyMode('room');
    resetGameLocal(); 
    setShowNameModal(true); 
  };

  const handleCreateRoom = async (overrideType) => {
    if (!user) return;
    setLobbyMessage(''); 
    const name = onlineName.trim(); 
    const newRoomId = generateRoomId();
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', newRoomId);
    
    const finalRoomType = typeof overrideType === 'string' ? overrideType : createRoomType;

    await setDoc(roomRef, {
      id: newRoomId,
      type: finalRoomType, 
      status: 'waiting',
      players: {
        '0': { id: user.uid, name: name, ready: false },
        '1': null
      },
      board: JSON.stringify(createInitialBoard()),
      currentPlayer: 0, dice: null, gameState: 'playing',
      winner: null, winReason: null, scores: { 0: 0, 1: 0 },
      collectedPieces: { topBlue: 0, topRed: 0, botBlue: 0, botRed: 0 },
      isRolling: false, isAnimating: false, isTurnSkipped: false,
      createdAt: new Date().getTime()
    });

    setIsOnline(true);
    setCurrentRoomId(newRoomId);
    setMyRole(0);
    setLobbyMode('room');
  };

  const handleRefreshRoomId = async () => {
    if (!user || !isOnline || myRole !== 0 || !currentRoomId) return;
    setLobbyMessage('');
    const oldRoomId = currentRoomId;
    const newRoomId = generateRoomId();
    const name = onlineName.trim(); 

    try {
      const newRoomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', newRoomId);
      await setDoc(newRoomRef, {
        id: newRoomId,
        type: roomData ? roomData.type : createRoomType, 
        status: 'waiting',
        players: { '0': { id: user.uid, name: name, ready: false }, '1': null },
        board: JSON.stringify(createInitialBoard()),
        currentPlayer: 0, dice: null, gameState: 'playing',
        winner: null, winReason: null, scores: { 0: 0, 1: 0 },
        collectedPieces: { topBlue: 0, topRed: 0, botBlue: 0, botRed: 0 },
        isRolling: false, isAnimating: false, isTurnSkipped: false,
        createdAt: new Date().getTime()
      });
      setCurrentRoomId(newRoomId);
      const oldRoomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', oldRoomId);
      await deleteDoc(oldRoomRef);
    } catch (error) { console.error("Oda yenileme hatası:", error); }
  };

  const handleJoinRoom = async (overrideId) => {
    const targetRoomId = typeof overrideId === 'string' ? overrideId : joinRoomIdInput;
    if (!user || !targetRoomId) return;
    setJoinError(''); setLobbyMessage('');
    const name = onlineName.trim(); 
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', targetRoomId);
    
    try {
      await updateDoc(roomRef, { "players.1": { id: user.uid, name: name, ready: false } });
      setIsOnline(true); setCurrentRoomId(targetRoomId);
      setMyRole(1); setLobbyMode('room');
    } catch (error) { setJoinError("Oda bulunamadı."); }
  };

  const handleQuickMatch = async () => {
    if (!user) return;
    setLobbyMode('quick-searching'); setLobbyMessage('');
    const name = onlineName.trim(); 

    try {
      const roomsRef = collection(db, 'artifacts', appId, 'public', 'data', 'rooms');
      const snapshot = await getDocs(roomsRef);
      
      let foundRoom = null;
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.status === 'waiting' && !data.players['1'] && data.type === 'public') {
          foundRoom = data.id; break;
        }
      }

      if (foundRoom) {
        setJoinRoomIdInput(foundRoom);
        const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', foundRoom);
        await updateDoc(roomRef, { "players.1": { id: user.uid, name: name, ready: false } });
        setIsOnline(true); setCurrentRoomId(foundRoom);
        setMyRole(1); setLobbyMode('room');
      } else {
        setCreateRoomType('public'); 
        await handleCreateRoom('public'); 
      }
    } catch (error) {
      console.error(error); setLobbyMode('main');
    }
  };

  const handleKickPlayer = async () => {
      if (!isOnline || !currentRoomId || myRole !== 0) return;
      try {
          const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', currentRoomId);
          await updateDoc(roomRef, { "players.1": null });
      } catch (error) { console.error("Oyuncu atılırken hata:", error); }
  };

  const toggleReady = async () => {
    if (!isOnline || !currentRoomId || myRole === null || !roomData) return;
    
    const isReadyNow = !roomData.players[myRole].ready;
    const updates = {
      [`players.${myRole}.ready`]: isReadyNow,
      [`players.${myRole}.name`]: onlineName.trim() 
    };

    const otherRole = myRole === 0 ? 1 : 0;
    const isOtherReady = roomData.players[otherRole]?.ready;
    
    if (isReadyNow && isOtherReady) {
      updates.status = 'playing';
      updates.board = JSON.stringify(createInitialBoard());
    }

    await syncGameState(updates);
  };

  const copyInviteLink = () => {
    const el = document.createElement('textarea');
    el.value = currentRoomId;
    document.body.appendChild(el);
    el.select(); document.execCommand('copy'); document.body.removeChild(el);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => { setTimeLeft(10); }, [currentPlayer, gameState]);

  useEffect(() => {
    if (gameState !== 'playing' || dice === null || isRolling || isTurnSkipped || showNameModal || isAnimating) return;
    const timer = setInterval(() => setTimeLeft(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [gameState, dice, isRolling, isTurnSkipped, showNameModal, isAnimating]);

  useEffect(() => {
    if (timeLeft === 0 && gameState === 'playing' && dice !== null && !isRolling && !isTurnSkipped && !isAnimating) {
      if (!isOnline || currentPlayer === myRole) {
        const nextPlayer = currentPlayer === 0 ? 1 : 0;
        if (isOnline && !isPlayingAIWhileWaiting) syncGameState({ dice: null, currentPlayer: nextPlayer });
        else { setDice(null); setCurrentPlayer(nextPlayer); }
      }
    }
  }, [timeLeft, gameState, dice, isRolling, isTurnSkipped, isOnline, currentPlayer, myRole, isAnimating, isPlayingAIWhileWaiting]);

  useEffect(() => {
    let interval;
    if (gameState === 'playing' && dice === null && !isRolling && !isTurnSkipped && !showNameModal && !isAnimating && !isAITurn) {
      setAutoRollProgress(0);
      const totalDuration = 5000;
      const intervalTime = 50;
      const step = (intervalTime / totalDuration) * 100;

      interval = setInterval(() => {
        setAutoRollProgress(prev => {
          const next = prev + step;
          if (next >= 100) {
            clearInterval(interval);
            if (!isOnline || currentPlayer === myRole) if (rollDiceRef.current) rollDiceRef.current(); 
            return 100;
          }
          return next;
        });
      }, intervalTime);
    } else { setAutoRollProgress(0); }
    return () => clearInterval(interval);
  }, [gameState, dice, isRolling, isTurnSkipped, showNameModal, currentPlayer, isOnline, myRole, isAnimating, isAITurn]);

  useEffect(() => {
    let animInterval;
    if (isRolling) {
      animInterval = setInterval(() => {
        setRollingAnim({
          color: Math.random() > 0.5 ? 'blue' : 'red',
          value: Math.floor(Math.random() * 6) + 1
        });
      }, 80);
    }
    return () => clearInterval(animInterval);
  }, [isRolling]);

  useEffect(() => {
    if (isAITurn && gameState === 'playing' && !showNameModal) {
      if (dice === null && !isRolling && !isAnimating && !isTurnSkipped) {
        const rollTimer = setTimeout(() => { if (rollDiceRef.current) rollDiceRef.current(); }, 1200);
        return () => clearTimeout(rollTimer);
      }
      if (dice !== null && !isRolling && !isAnimating && !isTurnSkipped) {
        const moveTimer = setTimeout(() => {
          let validMoves = [];
          for (let side = 0; side < 2; side++) {
            for (let r = 0; r < 3; r++) {
              for (let c = 0; c < 14; c++) {
                if (board[side][r][c] > 0 && getCellColor(side, c) === dice.color) {
                  const pathInfo = validatePath(side, r, c, dice.value, board);
                  if (pathInfo.valid) validMoves.push({ side, r, c, dropped: pathInfo.dropped });
                }
              }
            }
          }
          if (validMoves.length > 0) {
            const scoringMoves = validMoves.filter(m => m.dropped);
            let selectedMove = scoringMoves.length > 0 ? scoringMoves[Math.floor(Math.random() * scoringMoves.length)] : validMoves[Math.floor(Math.random() * validMoves.length)]; 
            handleCellClick(selectedMove.side, selectedMove.r, selectedMove.c);
          }
        }, 1500); 
        return () => clearTimeout(moveTimer);
      }
    }
  }, [isAITurn, gameState, showNameModal, dice, isRolling, isAnimating, isTurnSkipped, board]);

  const validatePath = (side, row, col, diceValue, currentBoard) => {
    let cSide = side; let cRow = row; let cCol = col;
    let dropped = false; let valid = true; let isOvershooting = false;
    let path = []; let dir = cCol <= 6 ? -1 : 1; 

    for (let i = 0; i < diceValue; i++) {
        cCol += dir;
        if (cCol < 0 || cCol > 13) {
            if (i === diceValue - 1) {
                dropped = true; 
                path.push({ side: cSide, row: cRow, col: cCol, dropped: true }); break;
            } else {
                isOvershooting = true; cSide = 1 - cSide; cRow = 2 - cRow; 
                if (cCol < 0) { cCol = 0; dir = 1; } else { cCol = 13; dir = -1; }
                path.push({ side: cSide, row: cRow, col: cCol, dropped: false });
            }
        } else {
            path.push({ side: cSide, row: cRow, col: cCol, dropped: false });
            if (!isOvershooting && currentBoard[cSide][cRow][cCol] > 0) { valid = false; break; }
        }
    }
    return { valid, cSide, cRow, cCol, dropped, path };
  };

  const rollDice = () => {
    if (gameState !== 'playing' || dice !== null || isRolling || isAnimating) return;
    if (isOnline && currentPlayer !== myRole && !isPlayingAIWhileWaiting) return; 
    
    playSound('roll');
    if (isOnline && !isPlayingAIWhileWaiting) syncGameState({ isRolling: true });
    else setIsRolling(true);

    setTimeout(() => {
      let hasBlue = false; let hasRed = false;
      for (let side = 0; side < 2; side++) {
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 14; c++) {
            if (board[side][r][c] > 0) {
              if (getCellColor(side, c) === 'blue') hasBlue = true;
              else hasRed = true;
            }
          }
        }
      }
      let possibleColors = [];
      if (hasBlue) possibleColors.push('blue');
      if (hasRed) possibleColors.push('red');
      if (possibleColors.length === 0) possibleColors = ['blue', 'red'];

      const randomColor = possibleColors[Math.floor(Math.random() * possibleColors.length)];
      const randomValue = Math.floor(Math.random() * 6) + 1;
      const newDice = { color: randomColor, value: randomValue };
      const hasMoves = hasValidMoves(board, newDice);

      if (isOnline && !isPlayingAIWhileWaiting) {
         syncGameState({ dice: newDice, isRolling: false, isTurnSkipped: !hasMoves });
         if (!hasMoves) setTimeout(() => syncGameState({ dice: null, isTurnSkipped: false, currentPlayer: currentPlayer === 0 ? 1 : 0 }), 2000);
      } else {
         setDice(newDice); setIsRolling(false);
         if (!hasMoves) {
           setIsTurnSkipped(true);
           setTimeout(() => {
             setDice(null); setIsTurnSkipped(false); setCurrentPlayer(prev => prev === 0 ? 1 : 0);
           }, 2000);
         }
      }
    }, 800); 
  };

  useEffect(() => { rollDiceRef.current = rollDice; }, [rollDice, isAnimating]);

  const hasValidMoves = (currentBoard, currentDice) => {
    for (let side = 0; side < 2; side++) {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 14; c++) {
          if (currentBoard[side][r][c] > 0) {
            const cellColor = getCellColor(side, c);
            if (cellColor === currentDice.color) {
              if (validatePath(side, r, c, currentDice.value, currentBoard).valid) return true;
            }
          }
        }
      }
    }
    return false;
  };

  const handleCellClick = async (side, row, col) => {
    if (gameState !== 'playing' || !dice || isAnimating) return;
    if (isOnline && currentPlayer !== myRole && !isAITurn && !isPlayingAIWhileWaiting) return; 
    if (board[side][row][col] === 0) return;
    
    const cellColor = getCellColor(side, col);
    if (cellColor !== dice.color) return;

    const { valid, cSide, cRow, cCol, dropped, path } = validatePath(side, row, col, dice.value, board);
    if (!valid) return;

    setIsAnimating(true);
    if (isOnline && !isPlayingAIWhileWaiting) syncGameState({ isAnimating: true });

    let currentB = board.map(s => s.map(r => [...r]));
    let currentPieces = { ...collectedPieces };

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    currentB[side][row][col] -= 1;
    setBoard(currentB.map(s => s.map(r => [...r])));
    let prevPos = null;

    for (let i = 0; i < path.length; i++) {
        await delay(250); 
        const step = path[i];

        if (prevPos) currentB[prevPos.side][prevPos.row][prevPos.col] -= 1;

        if (step.dropped) {
            playSound('lock');
            if (cSide === 0 && step.col === -1) currentPieces.topBlue += 1;
            else if (cSide === 0 && step.col === 14) currentPieces.topRed += 1;
            else if (cSide === 1 && step.col === -1) currentPieces.botRed += 1;
            else if (cSide === 1 && step.col === 14) currentPieces.botBlue += 1;
            prevPos = null;
        } else {
            playSound('step');
            currentB[step.side][step.row][step.col] += 1;
            prevPos = step;
        }
        setBoard(currentB.map(s => s.map(r => [...r])));
        setCollectedPieces({ ...currentPieces });
    }

    setIsAnimating(false);

    if (isOnline && !isPlayingAIWhileWaiting) checkGameEndOnline(currentB, currentPieces);
    else {
        setDice(null); checkGameEndLocal(currentB, currentPieces);
    }
  };

  const calculateGameEnd = (currentBoard, currentCollectedPieces) => {
    let topTotalCount = 0; let botTotalCount = 0; 
    let topBlueBoardCount = 0; let topRedBoardCount = 0; 
    let botRedBoardCount = 0; let botBlueBoardCount = 0; 

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 14; c++) {
        const topPieces = currentBoard[0][r][c];
        const botPieces = currentBoard[1][r][c];
        topTotalCount += topPieces; botTotalCount += botPieces;
        if (c <= 6) { topBlueBoardCount += topPieces; botRedBoardCount += botPieces; } 
        else { topRedBoardCount += topPieces; botBlueBoardCount += botPieces; }
      }
    }

    const topMaxPossibleBlue = currentCollectedPieces.topBlue + topBlueBoardCount + botRedBoardCount; 
    const botMaxPossibleBlue = currentCollectedPieces.botBlue + botBlueBoardCount + topRedBoardCount; 

    let isGameFinished = false; let calculatedWinner = null; let reason = null;

    if (topMaxPossibleBlue < currentCollectedPieces.botBlue) {
        isGameFinished = true; calculatedWinner = 1;
        reason = { type: 'checkmate', loser: 0, winner: 1 };
    } else if (botMaxPossibleBlue < currentCollectedPieces.topBlue) {
        isGameFinished = true; calculatedWinner = 0;
        reason = { type: 'checkmate', loser: 1, winner: 0 };
    } 
    else if (topTotalCount === 0 || botTotalCount === 0) {
      isGameFinished = true;
      if (currentCollectedPieces.topBlue > currentCollectedPieces.botBlue) calculatedWinner = 0;
      else if (currentCollectedPieces.botBlue > currentCollectedPieces.topBlue) calculatedWinner = 1;
      else {
        if (currentCollectedPieces.topRed > currentCollectedPieces.botRed) calculatedWinner = 0;
        else if (currentCollectedPieces.botRed > currentCollectedPieces.topRed) calculatedWinner = 1;
        else {
          if (topRedBoardCount < botRedBoardCount) calculatedWinner = 0;
          else if (botRedBoardCount < topRedBoardCount) calculatedWinner = 1;
          else calculatedWinner = 'tie';
        }
      }
      if (calculatedWinner !== 'tie') {
          reason = { type: 'emptyBoard', winner: calculatedWinner };
      }
    }
    return { isGameFinished, calculatedWinner, reason };
  };

  const checkGameEndLocal = (currentBoard, currentCollectedPieces) => {
    const { isGameFinished, calculatedWinner, reason } = calculateGameEnd(currentBoard, currentCollectedPieces);
    if (isGameFinished) {
      setGameState('finished'); setShowResultsModal(true); 
      setScores({ 0: currentCollectedPieces.topBlue, 1: currentCollectedPieces.botBlue });
      setWinner(calculatedWinner); setWinReason(reason);
    } else setCurrentPlayer(prev => prev === 0 ? 1 : 0);
  };

  const checkGameEndOnline = async (currentBoard, currentCollectedPieces) => {
    const { isGameFinished, calculatedWinner, reason } = calculateGameEnd(currentBoard, currentCollectedPieces);
    let updates = { board: JSON.stringify(currentBoard), collectedPieces: currentCollectedPieces, dice: null, isAnimating: false };
    if (isGameFinished) {
      updates.gameState = 'finished'; updates.scores = { 0: currentCollectedPieces.topBlue, 1: currentCollectedPieces.botBlue };
      updates.winner = calculatedWinner; updates.winReason = reason; updates.status = 'finished';
    } else updates.currentPlayer = currentPlayer === 0 ? 1 : 0;
    await syncGameState(updates);
  };

  const resetGameLocal = () => {
    setBoard(createInitialBoard()); setCurrentPlayer(0); setDice(null); setGameState('playing');
    setWinner(null); setWinReason(null); setShowResultsModal(false); setScores({ 0: 0, 1: 0 });
    setCollectedPieces({ topBlue: 0, topRed: 0, botBlue: 0, botRed: 0 }); setTimeLeft(10); setIsAnimating(false);
  };

  const resetGameOnline = async () => {
    if (!isOnline || !currentRoomId || !roomData) return;
    await syncGameState({
      status: 'waiting', 
      players: { '0': { ...roomData.players['0'], ready: false }, '1': roomData.players['1'] ? { ...roomData.players['1'], ready: false } : null },
      gameState: 'playing', winner: null, winReason: null, scores: { 0: 0, 1: 0 },
      collectedPieces: { topBlue: 0, topRed: 0, botBlue: 0, botRed: 0 }, currentPlayer: 0, dice: null, isAnimating: false
    });
    setLobbyMode('room'); setShowNameModal(true); setShowResultsModal(false);
  };

  const handleResetGameClick = () => { (isOnline && !isPlayingAIWhileWaiting) ? resetGameOnline() : resetGameLocal(); };

  const renderCellPieces = (count) => {
    if (count === 0) return null;
    return (
        <div className="flex items-center justify-center pointer-events-none w-full h-full p-[1px] sm:p-0.5 z-0">
            <div className="rounded-full flex items-center justify-center text-white font-bold shadow-[0_2px_4px_rgba(0,0,0,0.5)] border-[1.5px] sm:border-2 md:border-[3px] border-neutral-900 bg-neutral-800 w-full h-full text-[10px] sm:text-xs md:text-base lg:text-lg leading-none">
                {count}
            </div>
        </div>
    );
  };

  const renderCollected = (count, colorType) => {
    if (count === 0) return null;
    const slots = [];
    for (let i = 0; i < count; i++) {
        const slotIdx = i % 3;
        slots[slotIdx] = (slots[slotIdx] || 0) + 1;
    }
    const bgClass = colorType === 'blue' ? 'bg-blue-500' : 'bg-red-500';
    return (
        <div className="absolute bottom-1 sm:bottom-2 lg:bottom-3 flex flex-col gap-0.5 sm:gap-1 items-center px-0.5">
            {slots.map((sCount, idx) => (
                <div key={idx} className={`relative flex items-center justify-center w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full border sm:border-2 lg:border-[3px] border-white shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${bgClass}`}>
                    <span className="text-[6px] sm:text-[10px] md:text-sm lg:text-lg leading-none text-white/90">🔒</span>
                    {sCount > 1 && (
                        <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 bg-neutral-800 text-white text-[8px] sm:text-[10px] lg:text-[12px] font-bold w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 flex items-center justify-center rounded-full border border-white shadow-sm">
                            {sCount}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
  };

  const renderDiceArea = () => {
    if (isRolling) {
      return (
        <div className="flex gap-1.5 sm:gap-2 items-center">
          <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-md sm:rounded-lg flex items-center justify-center text-white font-black text-base sm:text-2xl border-[2px] sm:border-[3px] transition-colors animate-simple-roll-1 shadow-[0_2px_4px_rgba(0,0,0,0.3)] ${rollingAnim.color === 'blue' ? 'bg-blue-500 border-blue-300' : 'bg-red-500 border-red-300'}`}>
            {rollingAnim.color === 'blue' ? 'M' : 'K'}
          </div>
          <div className="w-8 h-8 sm:w-11 sm:h-11 bg-white border-[2px] sm:border-[3px] border-neutral-300 rounded-md sm:rounded-lg flex items-center justify-center text-neutral-800 font-black text-base sm:text-2xl animate-simple-roll-2 shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            {rollingAnim.value}
          </div>
        </div>
      );
    } else if (dice && !isTurnSkipped && gameState === 'playing') {
      return (
        <div className="flex gap-1.5 sm:gap-2 items-center animate-bounce-short">
          <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-md sm:rounded-lg flex items-center justify-center text-white font-black text-base sm:text-2xl border-[2px] sm:border-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.3)] ${dice.color === 'blue' ? 'bg-blue-500 border-blue-300 shadow-blue-500/40' : 'bg-red-500 border-red-300 shadow-red-500/40'}`}>
            {dice.color === 'blue' ? 'M' : 'K'}
          </div>
          <div className="w-8 h-8 sm:w-11 sm:h-11 bg-white border-[2px] sm:border-[3px] border-neutral-300 rounded-md sm:rounded-lg flex items-center justify-center text-neutral-800 font-black text-base sm:text-2xl shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            {dice.value}
          </div>
        </div>
      );
    }
    return null;
  };

  // --- SOHBET MODAL RENDER ---
  const renderChatModal = () => (
    <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsChatModalOpen(false)}>
        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border-2 border-neutral-200 flex flex-col transform animate-bounce-short" onClick={e => e.stopPropagation()}>
            {/* BAŞLIK */}
            <div className="bg-neutral-100 px-4 py-3 border-b border-neutral-200 flex justify-center items-center relative">
                <h3 className="font-black text-neutral-800 text-sm">SOHBET & İFADE</h3>
            </div>

            {/* İFADELER (EMOJİLER) */}
            <div className="p-4 sm:p-5 bg-white border-b border-neutral-200">
                <div className="grid grid-cols-4 gap-4 max-h-64 overflow-y-auto custom-scrollbar p-1">
                    {/* Ücretsiz Emojiler */}
                    {FREE_EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => handleSendChat('emote', emoji)} disabled={hasSentChatThisTurn} className="text-3xl sm:text-4xl p-2 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-50 active:scale-95 border-2 border-transparent hover:border-blue-200 flex justify-center items-center">
                            {emoji}
                        </button>
                    ))}
                    {/* Premium Emojiler */}
                    {PREMIUM_EMOJIS.map(emoji => {
                        const isUnlocked = (userData?.unlockedEmojis || []).includes(emoji);
                        if (isUnlocked) {
                            return (
                                <button key={emoji} onClick={() => handleSendChat('emote', emoji)} disabled={hasSentChatThisTurn} className="text-3xl sm:text-4xl p-2 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-50 active:scale-95 border-2 border-transparent hover:border-blue-200 flex justify-center items-center">
                                    {emoji}
                                </button>
                            );
                        } else {
                            return (
                                <button key={emoji} onClick={() => handleBuyEmoji(emoji)} className="relative group text-3xl sm:text-4xl p-2 rounded-xl border-2 border-neutral-100 bg-neutral-50 transition-all flex items-center justify-center overflow-hidden hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm">
                                    <span className="grayscale opacity-30 group-hover:opacity-10 transition-opacity duration-300">{emoji}</span>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="flex flex-col items-center bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-blue-100 transform scale-90 group-hover:scale-100 transition-transform">
                                            <span className="text-blue-600 font-black text-[10px] uppercase mb-0.5">Al</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-neutral-800 font-black text-[10px] leading-none">1</span>
                                                <span className="w-3 h-3 rounded-full bg-gradient-to-b from-[#f3f4f6] to-[#9ca3af] shadow-sm border border-neutral-400 block"></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute top-1 right-1 group-hover:opacity-0 transition-opacity duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                    </div>
                                </button>
                            );
                        }
                    })}
                </div>
            </div>

            {/* YAZILI MESAJ GİRİŞİ */}
            <div className="p-4 bg-neutral-50 flex items-center gap-2">
                <input
                    type="text"
                    maxLength={30}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder={userData?.isTextChatUnlocked ? "Mesaj yaz (Max 30)" : "Mesaj göndermek için tıklayın"}
                    disabled={hasSentChatThisTurn}
                    className="flex-1 border-2 border-neutral-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-400 disabled:bg-neutral-200 disabled:text-neutral-500 transition-colors"
                />
                {userData?.isTextChatUnlocked ? (
                    <button onClick={() => handleSendChat('message', chatInput.trim())} disabled={!chatInput.trim() || hasSentChatThisTurn} className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-all disabled:opacity-50 active:scale-95 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                ) : (
                    <button onClick={handleBuyTextChat} className="relative group bg-neutral-200 border-2 border-neutral-300 text-neutral-400 p-3 rounded-xl hover:border-amber-300 transition-all overflow-hidden flex items-center justify-center min-w-[52px]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:opacity-0 transition-opacity duration-300"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        <div className="absolute top-1 right-1 group-hover:opacity-0 transition-opacity duration-300">
                             <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-amber-100">
                            <span className="text-amber-900 font-black text-[9px] leading-none mb-0.5 bg-white/50 px-1 rounded uppercase">Al</span>
                            <div className="flex items-center gap-0.5">
                                <span className="text-amber-900 font-black text-[10px]">1</span>
                                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-[#fcd34d] to-[#d97706] shadow-sm border border-amber-600"></span>
                            </div>
                        </div>
                    </button>
                )}
            </div>
        </div>
    </div>
  );

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-[85vh] w-full max-w-md mx-auto gap-4 sm:gap-5 px-4 py-8 relative">
        {lobbyMessage && (
            <div className="w-full bg-amber-50 text-amber-700 border border-amber-200 p-3 rounded-xl mb-2 text-sm font-bold text-center flex justify-between items-center shadow-sm">
                <span>{lobbyMessage}</span>
                <button onClick={() => setLobbyMessage('')} className="text-amber-500 hover:text-amber-800 px-2 py-0.5 rounded-lg bg-amber-100">✖</button>
            </div>
        )}
        <img src="lc_logo.png" alt="Locked Checker" className="h-36 sm:h-48 md:h-56 object-contain drop-shadow-2xl hover:scale-105 transition-transform" onError={(e) => { e.target.style.display = 'none'; }} />
        
        <div className="w-full flex flex-col gap-4 sm:gap-5">
            <button onClick={() => {
                setAppView('play'); setShowNameModal(true); setLobbyMode('main');
                const defaultName = getDisplayName();
                setTempNames({ 0: defaultName, 1: '' }); setIsBotActive(false); 
                setLobbyMessage(''); setOnlineName(defaultName); 
                setIsLobbyRulesExpanded(false);
            }} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black py-4 sm:py-5 px-6 rounded-2xl shadow-lg transition-all transform hover:scale-[1.03] text-xl sm:text-2xl flex items-center justify-center gap-3 border-b-4 border-emerald-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                {t('play')}
            </button>
            <button onClick={() => setAppView('profile')} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black py-4 sm:py-5 px-6 rounded-2xl shadow-lg transition-all transform hover:scale-[1.03] text-xl sm:text-2xl flex items-center justify-center gap-3 border-b-4 border-indigo-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                {t('profile')}
            </button>
            <button onClick={() => setAppView('leaderboard')} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-4 sm:py-5 px-6 rounded-2xl shadow-lg transition-all transform hover:scale-[1.03] text-xl sm:text-2xl flex items-center justify-center gap-3 border-b-4 border-orange-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-8"></path><path d="M18 20V4"></path><path d="M6 20v-4"></path><path d="M2 20h20"></path></svg>
                {t('leaderboard')}
            </button>
            <button onClick={() => setAppView('settings')} className="w-full bg-gradient-to-r from-neutral-600 to-neutral-800 hover:from-neutral-700 hover:to-neutral-900 text-white font-black py-4 sm:py-5 px-6 rounded-2xl shadow-lg transition-all transform hover:scale-[1.03] text-xl sm:text-2xl flex items-center justify-center gap-3 border-b-4 border-neutral-900">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                 <circle cx="12" cy="12" r="3"></circle>
                 <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              {t('settings')}
          </button>
      </div>

      <div className="mt-8 mb-4 text-center flex flex-col items-center gap-1.5">
          <button onClick={() => setAppView('about')} className="text-neutral-500 hover:text-neutral-700 text-xs sm:text-sm font-bold transition-colors underline decoration-neutral-300 underline-offset-4">
              {t('aboutLegal')}
          </button>
          <span className="text-[10px] sm:text-xs text-neutral-400 font-bold mt-1">{t('copyrightFooter')}</span>
      </div>
  </div>
);

const renderAbout = () => (
    <div className="flex flex-col items-center min-h-[80vh] w-full max-w-lg mx-auto pt-6 sm:pt-10 px-4 relative">
        <div className="w-full flex items-center justify-between mb-6 sm:mb-10 border-b-2 border-neutral-200 pb-4">
            <button onClick={() => setAppView('home')} className="text-neutral-500 hover:text-neutral-800 font-bold flex items-center gap-2 transition-colors bg-white px-3 py-1.5 rounded-xl border border-neutral-200 shadow-sm shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                <span className="hidden sm:inline">{t('back')}</span>
            </button>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-neutral-800 tracking-tight whitespace-nowrap text-center px-2">{t('aboutLegal')}</h2>
            <div className="w-10 sm:w-16 shrink-0"></div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-neutral-200 text-center flex flex-col items-center w-full">
            <img src="lc_logo.png" alt="Locked Checker Logo" className="h-20 sm:h-24 object-contain drop-shadow-md mb-4" onError={(e) => { e.target.style.display = 'none'; }} />
            <h3 className="text-2xl sm:text-3xl font-black text-neutral-800 mb-1">Locked Checker</h3>
            <p className="text-sm font-bold text-neutral-500 mb-8">Version 1.0.0</p>

            <div className="w-full bg-red-50 border-2 border-red-200 rounded-2xl p-5 sm:p-6 flex flex-col items-center shadow-inner relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-red-100 mb-4 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <h4 className="text-lg sm:text-xl font-black text-red-700 mb-3">{t('copyrightTitle')}</h4>
                <p className="text-xs sm:text-sm text-neutral-700 font-medium leading-relaxed text-justify mb-4">
                    {t('copyrightText')}
                    <span className="block mt-4 text-center sm:text-left text-neutral-800 font-bold">
                        {t('contactFor')} <a href="mailto:onursahinbt@gmail.com" className="transition-opacity hover:opacity-70">onursahinbt@gmail.com</a>
                    </span>
                </p>
                <div className="w-full bg-white/60 p-3 rounded-xl border border-red-100 font-bold text-[10px] sm:text-xs text-red-800/80">
                    {t('copyrightFooter')}
                </div>
            </div>
        </div>
    </div>
);

const renderProfile = () => {
      const isAdmin = user && !user.isAnonymous && user.email && ADMIN_EMAILS.includes(user.email.trim().toLowerCase());

      return (
      <div className="flex flex-col items-center min-h-[80vh] w-full max-w-lg mx-auto pt-6 sm:pt-10 px-4 relative">
          <div className="w-full flex items-center justify-between mb-8 sm:mb-12 border-b-2 border-neutral-200 pb-4">
              <button onClick={() => setAppView('home')} className="text-neutral-500 hover:text-neutral-800 font-bold flex items-center gap-2 transition-colors bg-white px-3 py-1.5 rounded-xl border border-neutral-200 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                  <span className="hidden sm:inline">{t('back')}</span>
              </button>
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-800 tracking-tight">{t('profile')}</h2>
              <div className="w-16"></div>
          </div>

          {(!user || user.isAnonymous) ? (
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-neutral-200 text-center flex flex-col items-center gap-4 w-full">
                  <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2 shadow-inner border-2 border-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-neutral-800">{t('notRegistered')}</h3>
                  <p className="text-neutral-500 text-sm sm:text-base mb-4 leading-relaxed">{t('registerDesc')} <br/><strong className="text-blue-600">{t('firstGift')}</strong></p>
                  <button onClick={() => setAuthModalOpen(true)} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 px-6 rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] text-lg border-b-4 border-indigo-800">
                      {t('loginBtn')}
                  </button>
              </div>
          ) : (
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-neutral-200 text-center flex flex-col items-center w-full">
                  
                  <div className="relative mb-4 mt-2">
                      <div 
                        className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-inner border-4 border-white relative group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
                        onClick={() => setShowAvatarModal(true)}
                      >
                          <span className="text-5xl sm:text-6xl drop-shadow-md transition-transform group-hover:scale-110">{userData?.avatar || '🧑‍🚀'}</span>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <span className="text-white font-bold text-sm sm:text-base drop-shadow-md">{t('changeAvatar')}</span>
                          </div>
                      </div>
                      <div className="absolute -bottom-3 sm:-bottom-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 border-2 border-white font-black px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm shadow-md flex items-center gap-1.5 z-20 whitespace-nowrap pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                          {t('level')} {userData?.level || 1}
                      </div>
                  </div>
                  
                  <div className="flex flex-col items-center mt-2 mb-6">
                      <span className="text-sm sm:text-base font-bold text-neutral-500 mb-1">{t('hello')}</span>
                      {isEditingName ? (
                          <div className="flex items-center gap-2">
                              <input 
                                  type="text" 
                                  maxLength={15}
                                  value={editNameInput} 
                                  onChange={(e) => setEditNameInput(e.target.value)} 
                                  className="px-3 py-1.5 rounded-xl border-2 border-blue-400 focus:outline-none focus:border-blue-600 font-black text-xl sm:text-2xl text-center w-40 sm:w-48 transition-colors"
                                  autoFocus
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                              />
                              <button onClick={handleSaveName} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-xl shadow-sm transition-transform active:scale-95" title={t('save')}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </button>
                              <button onClick={() => setIsEditingName(false)} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl shadow-sm transition-transform active:scale-95" title={t('cancel')}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                          </div>
                      ) : (
                          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setEditNameInput(getDisplayName() || 'Oyuncu'); setIsEditingName(true); }}>
                              <h3 className="text-2xl sm:text-3xl font-black text-neutral-800 tracking-tight">{getDisplayName() || 'Oyuncu'}</h3>
                              <button className="text-neutral-400 hover:text-blue-600 transition-colors opacity-60 group-hover:opacity-100 p-1" title={t('editName')}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                              </button>
                          </div>
                      )}
                  </div>

                  <div className="w-full grid grid-cols-3 gap-2 sm:gap-4 mb-8 mt-4">
                      <div className="bg-gradient-to-b from-[#fcd34d] to-[#d97706] p-3 sm:p-5 rounded-2xl flex flex-col items-center justify-center shadow-[0_4px_10px_rgba(217,119,6,0.3)] border border-amber-300">
                          <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                              <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">{userData?.gold || 0}</span>
                              <button 
                                  onClick={() => handleConvertCoins('gold', 'silver')} 
                                  disabled={(userData?.gold || 0) < 1}
                                  className="text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all transform hover:scale-125 active:scale-95 disabled:hover:scale-100"
                                  title="1 Altın = 10 Gümüş"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                              </button>
                          </div>
                          <span className="text-[9px] sm:text-xs font-black text-amber-900/80 uppercase tracking-widest mt-1 text-center">{t('gold')}</span>
                      </div>
                      <div className="bg-gradient-to-b from-[#f3f4f6] to-[#9ca3af] p-3 sm:p-5 rounded-2xl flex flex-col items-center justify-center shadow-[0_4px_10px_rgba(156,163,175,0.3)] border border-gray-300">
                          <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                              <button 
                                  onClick={() => handleConvertCoins('silver', 'gold')} 
                                  disabled={(userData?.silver || 0) < 10}
                                  className="text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all transform hover:scale-125 active:scale-95 disabled:hover:scale-100"
                                  title="10 Gümüş = 1 Altın"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                              </button>
                              <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">{userData?.silver || 0}</span>
                              <button 
                                  onClick={() => handleConvertCoins('silver', 'bronze')} 
                                  disabled={(userData?.silver || 0) < 1}
                                  className="text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all transform hover:scale-125 active:scale-95 disabled:hover:scale-100"
                                  title="1 Gümüş = 10 Bronz"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                              </button>
                          </div>
                          <span className="text-[9px] sm:text-xs font-black text-gray-700/80 uppercase tracking-widest mt-1 text-center">{t('silver')}</span>
                      </div>
                      <div className="bg-gradient-to-b from-[#fca5a5] to-[#b45309] p-3 sm:p-5 rounded-2xl flex flex-col items-center justify-center shadow-[0_4px_10px_rgba(180,83,9,0.3)] border border-orange-300">
                          <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                              <button 
                                  onClick={() => handleConvertCoins('bronze', 'silver')} 
                                  disabled={(userData?.bronze || 0) < 10}
                                  className="text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all transform hover:scale-125 active:scale-95 disabled:hover:scale-100"
                                  title="10 Bronz = 1 Gümüş"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                              </button>
                              <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">{userData?.bronze || 0}</span>
                          </div>
                          <span className="text-[9px] sm:text-xs font-black text-orange-900/80 uppercase tracking-widest mt-1 text-center">{t('bronze')}</span>
                      </div>
                  </div>

                  <div className="w-full bg-neutral-50 rounded-2xl p-4 mb-8 border border-neutral-200">
                      <div className="flex justify-between items-center text-sm font-bold text-neutral-600 mb-2">
                          <span>{t('nextLevel')}</span>
                          <span className="text-blue-600">{t('winLeft', {count: 10 - ((userData?.wins || 0) % 10)})}</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-3 sm:h-4 overflow-hidden border border-neutral-300">
                          <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-full transition-all duration-500" style={{ width: `${((userData?.wins || 0) % 10) * 10}%` }}></div>
                      </div>
                  </div>

                  {/* BAŞARIMLAR BUTONU */}
                  <button onClick={() => setShowAchievementsModal(true)} className="bg-white border-2 border-neutral-200 hover:border-amber-400 hover:bg-amber-50 text-neutral-700 font-black py-4 px-5 rounded-2xl mb-4 w-full flex items-center justify-between transition-all shadow-sm group">
                      <div className="flex items-center gap-3">
                          <span className="text-2xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">🏅</span>
                          <span className="group-hover:text-amber-600 transition-colors">{t('achievements')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-400 group-hover:text-amber-500">
                          <span className="text-xs font-bold bg-neutral-100 px-2 py-1 rounded-md border border-neutral-200 group-hover:bg-amber-100 group-hover:border-amber-200 transition-colors">Aç</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </div>
                  </button>

                  {/* YÖNETİCİ MODÜLÜ BUTONU */}
                  {isAdmin && (
                      <button onClick={() => setAppView('admin')} className="bg-neutral-800 border-2 border-neutral-700 hover:border-amber-400 hover:bg-neutral-900 text-white font-black py-4 px-5 rounded-2xl mb-4 w-full flex items-center justify-between transition-all shadow-sm group">
                          <div className="flex items-center gap-3">
                              <span className="text-2xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">⚙️</span>
                              <span className="group-hover:text-amber-400 transition-colors">{t('adminModule')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-400 group-hover:text-amber-400">
                              <span className="text-xs font-bold bg-neutral-700 px-2 py-1 rounded-md border border-neutral-600 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-400 transition-colors">Aç</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                          </div>
                      </button>
                  )}

                  <button onClick={handleLogout} className="text-red-500 hover:text-white border-2 border-red-100 hover:bg-red-500 font-bold flex items-center justify-center gap-2 w-full py-3 sm:py-4 rounded-xl transition-all shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                      {t('logoutBtn')}
                  </button>
              </div>
          )}
      </div>
      );
    };

    const renderSettings = () => {
      const langs = [
        { code: 'tr', name: 'Türkçe', flagUrl: 'https://flagcdn.com/w40/tr.png' },
        { code: 'en', name: 'English', flagUrl: 'https://flagcdn.com/w40/gb.png' },
        { code: 'de', name: 'Deutsch', flagUrl: 'https://flagcdn.com/w40/de.png' },
        { code: 'es', name: 'Español', flagUrl: 'https://flagcdn.com/w40/es.png' },
        { code: 'fr', name: 'Français', flagUrl: 'https://flagcdn.com/w40/fr.png' },
        { code: 'zh', name: '中文', flagUrl: 'https://flagcdn.com/w40/cn.png' },
        { code: 'ar', name: 'العربية', flagUrl: 'https://flagcdn.com/w40/sa.png' },
      ];
      
      const currentLangObj = langs.find(l => l.code === language) || langs[0];

      const bgOptions = [
        { code: 'bg-neutral-100', nameKey: 'bgDefault', hex: '#f5f5f5' },
        { code: 'bg-blue-50', nameKey: 'bgBlue', hex: '#eff6ff' },
        { code: 'bg-green-50', nameKey: 'bgGreen', hex: '#f0fdf4' },
        { code: 'bg-amber-50', nameKey: 'bgYellow', hex: '#fffbeb' },
        { code: 'bg-pink-50', nameKey: 'bgPink', hex: '#fdf2f8' },
        { code: 'bg-purple-50', nameKey: 'bgPurple', hex: '#faf5ff' },
      ];
      const currentBgObj = bgOptions.find(b => b.code === bgColor) || bgOptions[0];

      return (
        <div className="flex flex-col items-center min-h-[80vh] w-full max-w-lg mx-auto pt-6 sm:pt-10 px-4 relative">
            <div className="w-full flex items-center justify-between mb-8 sm:mb-16 border-b-2 border-neutral-200 pb-4">
                <button onClick={() => setAppView('home')} className="text-neutral-500 hover:text-neutral-800 font-bold flex items-center gap-2 transition-colors bg-white px-3 py-1.5 rounded-xl border border-neutral-200 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    <span className="hidden sm:inline">{t('back')}</span>
                </button>
                <h2 className="text-2xl sm:text-3xl font-black text-neutral-800">{t('settings')}</h2>
                <div className="w-16"></div>
            </div>
            
            <div className="w-full flex flex-col gap-6">
                
                {/* Ses Ayarı */}
                <div className="bg-white border-2 border-neutral-200 p-6 rounded-3xl flex items-center justify-between shadow-sm">
                    <div className="flex flex-col">
                        <h3 className="text-xl font-bold text-neutral-800">{t('sound')}</h3>
                    </div>
                    <button 
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${soundEnabled ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                    >
                        {soundEnabled ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                        )}
                    </button>
                </div>

                {/* Dil Ayarı */}
                <div ref={langDropdownRef} className="bg-white border-2 border-neutral-200 p-6 rounded-3xl flex flex-col shadow-sm relative">
                    <h3 className="text-xl font-bold text-neutral-800 mb-4">{t('language')}</h3>
                    <button 
                        onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                        className="w-full flex items-center justify-between bg-neutral-50 border-2 border-neutral-200 p-4 rounded-xl font-bold text-lg hover:bg-neutral-100 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <img src={currentLangObj.flagUrl} alt={currentLangObj.code} className="w-6 h-4 sm:w-8 sm:h-5 object-cover rounded-sm shadow-sm" />
                            <span>{currentLangObj.name}</span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>

                    {isLangDropdownOpen && (
                        <div className="absolute top-[100%] left-0 right-0 mt-2 bg-white border-2 border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
                            {langs.map((l) => (
                                <button 
                                    key={l.code}
                                    onClick={() => { setLanguage(l.code); setIsLangDropdownOpen(false); }}
                                    className={`flex items-center gap-3 p-4 font-bold text-lg transition-colors ${language === l.code ? 'bg-blue-50 text-blue-700' : 'hover:bg-neutral-50 text-neutral-700'}`}
                                >
                                    <img src={l.flagUrl} alt={l.code} className="w-6 h-4 sm:w-8 sm:h-5 object-cover rounded-sm shadow-sm" />
                                    <span>{l.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Arka Plan Ayarı */}
                <div ref={bgDropdownRef} className="bg-white border-2 border-neutral-200 p-6 rounded-3xl flex flex-col shadow-sm relative">
                    <h3 className="text-xl font-bold text-neutral-800 mb-4">{t('background')}</h3>
                    <button 
                        onClick={() => setIsBgDropdownOpen(!isBgDropdownOpen)}
                        className="w-full flex items-center justify-between bg-neutral-50 border-2 border-neutral-200 p-4 rounded-xl font-bold text-lg hover:bg-neutral-100 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full shadow-sm border border-neutral-300" style={{ backgroundColor: currentBgObj.hex }}></div>
                            <span>{t(currentBgObj.nameKey)}</span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isBgDropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>

                    {isBgDropdownOpen && (
                        <div className="absolute top-[100%] left-0 right-0 mt-2 bg-white border-2 border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
                            {bgOptions.map((opt) => (
                                <button 
                                    key={opt.code}
                                    onClick={() => { setBgColor(opt.code); setIsBgDropdownOpen(false); }}
                                    className={`flex items-center gap-3 p-4 font-bold text-lg transition-colors ${bgColor === opt.code ? 'bg-blue-50 text-blue-700' : 'hover:bg-neutral-50 text-neutral-700'}`}
                                >
                                    <div className="w-6 h-6 rounded-full shadow-sm border border-neutral-300" style={{ backgroundColor: opt.hex }}></div>
                                    <span>{t(opt.nameKey)}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
      );
    };

    const renderAvatarModal = () => (
      <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden border-2 border-neutral-200 transform scale-100 animate-bounce-short">
              <button onClick={() => {setShowAvatarModal(false); setAvatarError('');}} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-800 transition-colors bg-neutral-100 hover:bg-neutral-200 rounded-full p-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              
              <h2 className="text-2xl font-black text-neutral-800 mb-2 text-center">Profil Resmi Seç</h2>
              
              <div className="h-8 mb-2 flex items-center justify-center">
                  {avatarError && (
                      <div className="bg-red-50 text-red-600 text-xs font-bold py-1.5 px-4 rounded-xl border border-red-200 animate-pulse shadow-sm">
                          {avatarError}
                      </div>
                  )}
              </div>
              
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar p-2">
                  {AVATAR_OPTIONS.map((emoji, idx) => {
                      const isUnlocked = idx < 10 || (userData?.unlockedAvatars || []).includes(emoji);
                      const isSelected = userData?.avatar === emoji;
                      
                      if (isUnlocked) {
                          return (
                              <button 
                                  key={idx} 
                                  onClick={() => handleSaveAvatar(emoji)}
                                  className={`text-3xl sm:text-4xl p-2 rounded-xl transition-all transform hover:scale-110 flex items-center justify-center border-2 ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-transparent hover:bg-neutral-100'}`}
                              >
                                  {emoji}
                              </button>
                          );
                      } else {
                          return (
                              <button 
                                  key={idx} 
                                  onClick={() => handleBuyAvatar(emoji)}
                                  className="relative group text-3xl sm:text-4xl p-2 rounded-xl transition-all flex items-center justify-center border-2 border-neutral-200 bg-neutral-50 grayscale hover:grayscale-0 hover:border-orange-300 hover:shadow-md overflow-hidden"
                              >
                                  <span className="transition-opacity group-hover:opacity-20">{emoji}</span>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <span className="text-orange-600 font-black text-sm drop-shadow-sm leading-none bg-white/90 px-2 py-0.5 rounded-md mb-1">{t('buy')}</span>
                                      <div className="flex items-center gap-1 bg-white/90 px-1.5 py-0.5 rounded-md shadow-sm border border-orange-200">
                                          <span className="text-orange-800 font-black text-[10px] leading-none">1</span>
                                          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-[#fca5a5] to-[#b45309] shadow-sm inline-block"></span>
                                      </div>
                                  </div>
                                  <div className="absolute top-1 right-1 opacity-100 group-hover:opacity-0 transition-opacity">
                                      <span className="text-[10px] drop-shadow-md">🔒</span>
                                  </div>
                              </button>
                          );
                      }
                  })}
              </div>
          </div>
      </div>
    );

    const renderAchievementsModal = () => {
        const achList = [
            { id: 'tot100', icon: '⚔️', title: 'achTotal100Title', desc: 'achTotal100Desc', max: 100, val: (userData?.wins || 0) + (userData?.losses || 0) },
            { id: 'lvl50', icon: '🌟', title: 'achLevel50Title', desc: 'achLevel50Desc', max: 50, val: userData?.level || 1 },
            { id: 'silv100', icon: '🪙', title: 'achSilver100Title', desc: 'achSilver100Desc', max: 100, val: userData?.silver || 0 },
            { id: 'brnz500', icon: '🥉', title: 'achBronze500Title', desc: 'achBronze500Desc', max: 500, val: userData?.bronze || 0 },
            { id: 'w1', icon: '🎯', title: 'achWin1Title', desc: 'achWin1Desc', max: 1, val: userData?.wins || 0 },
            { id: 'streak5', icon: '🔥', title: 'achStreak5Title', desc: 'achStreak5Desc', max: 5, val: userData?.winStreak || 0 },
            { id: 'top10', icon: '🌟', title: 'achTop10Title', desc: 'achTop10Desc', max: 1, val: userData?.hasBeenTop10 ? 1 : 0 },
            { id: 'friend', icon: '🤝', title: 'achFriendTitle', desc: 'achFriendDesc', max: 1, val: userData?.privateGamesPlayed || 0 },
            { id: 'login3', icon: '📅', title: 'achLogin3Title', desc: 'achLogin3Desc', max: 3, val: userData?.loginStreak || 0 },
            { id: 'login7', icon: '🗓️', title: 'achLogin7Title', desc: 'achLogin7Desc', max: 7, val: userData?.loginStreak || 0 },
            { id: 'login30', icon: '🏆', title: 'achLogin30Title', desc: 'achLogin30Desc', max: 30, val: userData?.loginStreak || 0 },
            { id: 'e10', icon: '👋', title: 'achEmoteTitle', desc: 'achEmoteDesc', max: 10, val: userData?.emotesSent || 0 },
            { id: 'm10', icon: '💬', title: 'achMsgTitle', desc: 'achMsgDesc', max: 10, val: userData?.messagesSent || 0 },
            { id: 'w10', icon: '⚔️', title: 'achWin10Title', desc: 'achWin10Desc', max: 10, val: userData?.wins || 0 },
            { id: 'w100', icon: '👑', title: 'achWin100Title', desc: 'achWin100Desc', max: 100, val: userData?.wins || 0 },
            { id: 'a5', icon: '🖼️', title: 'achAvatarTitle', desc: 'achAvatarDesc', max: 5, val: userData?.unlockedAvatars?.length || 0 },
            { id: 'g10', icon: '💰', title: 'achGoldTitle', desc: 'achGoldDesc', max: 10, val: userData?.gold || 0 }
        ];

        return (
            <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4 backdrop-blur-md">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative flex flex-col max-h-[85vh] border-2 border-amber-200 transform animate-bounce-short">
                    <button onClick={() => setShowAchievementsModal(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-800 transition-colors bg-neutral-100 hover:bg-neutral-200 rounded-full p-1.5 z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    
                    <div className="text-center mb-6">
                        <span className="text-4xl drop-shadow-md block mb-2">🏆</span>
                        <h2 className="text-2xl font-black text-neutral-800">{t('achievementsTitle')}</h2>
                        <div className="w-12 h-1.5 bg-amber-400 mx-auto mt-2 rounded-full"></div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3 pb-2">
                        {achList.map(ach => {
                            const isUnlocked = ach.val >= ach.max;
                            const current = Math.min(ach.val, ach.max);
                            const percent = (current / ach.max) * 100;
                            
                            return (
                                <div key={ach.id} className={`p-4 rounded-2xl border-2 flex gap-4 transition-all ${isUnlocked ? 'bg-amber-50/50 border-amber-200 shadow-sm' : 'bg-neutral-50 border-neutral-200 opacity-80 grayscale-[30%]'}`}>
                                    <div className="flex items-center justify-center text-4xl w-12 shrink-0 drop-shadow-sm">
                                        {ach.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-end mb-1">
                                            <h4 className={`font-black ${isUnlocked ? 'text-amber-700' : 'text-neutral-700'}`}>{t(ach.title)}</h4>
                                            <span className="text-[10px] font-black text-neutral-400">{current} / {ach.max}</span>
                                        </div>
                                        <p className="text-[11px] sm:text-xs font-bold text-neutral-500 mb-2 leading-tight">{t(ach.desc)}</p>
                                        <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden border border-neutral-300/50">
                                            <div className={`h-full transition-all duration-500 ${isUnlocked ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderLeaderboard = () => (
      <div className="flex flex-col items-center min-h-[80vh] w-full max-w-xl mx-auto pt-6 sm:pt-10 px-2 sm:px-4 relative">
          <div className="w-full flex items-center justify-between mb-6 sm:mb-8 border-b-2 border-neutral-200 pb-4">
              <button onClick={() => setAppView('home')} className="text-neutral-500 hover:text-neutral-800 font-bold flex items-center gap-2 transition-colors bg-white px-3 py-1.5 rounded-xl border border-neutral-200 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                  <span className="hidden sm:inline">{t('back')}</span>
              </button>
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-800 tracking-tight flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M12 20v-8"></path><path d="M18 20V4"></path><path d="M6 20v-4"></path><path d="M2 20h20"></path></svg>
                 {t('leaderboard')}
              </h2>
              <div className="w-16"></div>
          </div>

          <div className="w-full bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm font-bold p-3 rounded-xl mb-6 text-center shadow-sm">
              {t('rankNote')}
          </div>

          {isLeaderboardLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-4 w-full">
                  <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
                  <span className="text-neutral-500 font-bold">Liste Yükleniyor...</span>
              </div>
          ) : leaderboardList.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl shadow-md border border-neutral-200 text-center w-full">
                  <span className="text-4xl mb-4 block">🏆</span>
                  <h3 className="text-lg font-black text-neutral-700 mb-2">{t('emptyRank')}</h3>
                  <p className="text-sm text-neutral-500">{t('emptyRankDesc')}</p>
              </div>
          ) : (
              <div className="flex flex-col gap-3 w-full pb-10">
                  {leaderboardList.map((player, index) => {
                      const rank = index + 1;
                      const isTop3 = rank <= 3;
                      const nameColor = rank === 1 ? 'text-green-600' : rank === 2 ? 'text-yellow-600' : rank === 3 ? 'text-red-500' : 'text-neutral-700';
                      const medalColor = rank === 1 ? 'bg-green-500' : rank === 2 ? 'bg-yellow-500' : rank === 3 ? 'bg-red-500' : 'bg-neutral-300';
                      
                      return (
                          <div key={player.id} onClick={() => setSelectedProfile(player)} className="bg-white p-3 sm:p-4 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-3 sm:gap-4 transition-all hover:shadow-md cursor-pointer hover:border-blue-400 focus:outline-none">
                              
                              <div className="flex-shrink-0 w-8 sm:w-10 flex justify-center">
                                  {isTop3 ? (
                                      <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white font-black text-[12px] sm:text-sm shadow-md border-2 border-white ${medalColor}`}>
                                          {rank}
                                      </div>
                                  ) : (
                                      <span className="font-black text-neutral-400 text-sm sm:text-base">{rank}.</span>
                                  )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                  <div className={`font-black truncate ${nameColor} text-base sm:text-lg tracking-tight mb-1`}>
                                      {player.displayName || 'Oyuncu'}
                                  </div>
                                  <div className="text-[10px] sm:text-xs font-bold text-neutral-500 flex flex-wrap gap-2 sm:gap-3 bg-neutral-50 rounded-lg py-1.5 px-2.5 border border-neutral-100 inline-flex shadow-inner">
                                      <span>{t('totalGames')}: {player.total}</span>
                                      <span className="text-green-600">{t('wins')}: {player.wins || 0}</span>
                                      <span className="text-red-500">{t('losses')}: {player.losses || 0}</span>
                                  </div>
                              </div>

                              <div className="flex-shrink-0 text-right bg-neutral-800 text-white rounded-xl px-3 py-2 shadow-inner border border-neutral-700">
                                  <div className="text-xs sm:text-sm font-bold text-neutral-400 mb-0.5">{t('winRate')}</div>
                                  <div className="text-sm sm:text-xl font-black tracking-widest">
                                      %{player.winRate.toFixed(1)}
                                  </div>
                              </div>

                          </div>
                      )
                  })}
              </div>
          )}
      </div>
    );

    const renderAdminPanel = () => {
        const filteredUsers = adminUsers.filter(u => 
            (u.email && u.email.toLowerCase().includes(adminSearch.toLowerCase())) || 
            (u.displayName && u.displayName.toLowerCase().includes(adminSearch.toLowerCase()))
        );

        return (
            <div className="flex flex-col min-h-[80vh] w-full max-w-4xl mx-auto pt-6 sm:pt-10 px-4 relative">
                <div className="w-full flex items-center justify-between mb-6 border-b-2 border-neutral-200 pb-4">
                    <button onClick={() => setAppView('home')} className="text-neutral-500 hover:text-neutral-800 font-bold flex items-center gap-2 transition-colors bg-white px-3 py-1.5 rounded-xl border border-neutral-200 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        <span className="hidden sm:inline">Geri Dön</span>
                    </button>
                    <h2 className="text-2xl font-black text-neutral-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-800"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        {t('adminPanel')}
                    </h2>
                    <div className="w-16"></div>
                </div>

                {adminPanelMessage && (
                    <div className="w-full bg-green-50 text-green-700 border border-green-200 p-3 rounded-xl mb-4 text-sm font-bold text-center shadow-sm">
                        {adminPanelMessage}
                    </div>
                )}

                <div className="w-full bg-white p-4 sm:p-6 rounded-3xl shadow-xl border border-neutral-200 mb-8">
                    <div className="mb-6 relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input 
                            type="text" 
                            placeholder="Kullanıcı adı veya e-posta ara..." 
                            value={adminSearch} 
                            onChange={(e) => setAdminSearch(e.target.value)} 
                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-neutral-800 focus:outline-none bg-neutral-50 font-medium transition-all"
                        />
                    </div>

                    <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        {filteredUsers.length === 0 ? (
                            <div className="text-center text-neutral-500 font-bold py-8">Kullanıcı bulunamadı.</div>
                        ) : (
                            filteredUsers.map(u => (
                                <div key={u.id} className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 flex flex-col md:flex-row items-center gap-4 justify-between transition-all hover:shadow-md">
                                    
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm border border-neutral-200 shrink-0">
                                            {u.avatar || '🧑‍🚀'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-neutral-800 text-lg leading-tight">{u.displayName || 'Bilinmiyor'}</span>
                                            <span className="text-xs font-bold text-neutral-500">{u.email || 'E-posta yok'}</span>
                                            <div className="text-[10px] font-bold text-neutral-400 mt-0.5 flex gap-2">
                                                <span>Svy: {u.level || 1}</span>
                                                <span className="text-green-600">G: {u.wins || 0}</span>
                                                <span className="text-red-500">M: {u.losses || 0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {editingAdminUser === u.id ? (
                                        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-neutral-200 shadow-inner w-full md:w-auto">
                                            <div className="flex items-center gap-1">
                                                <span className="text-lg">🥇</span>
                                                <input type="number" min="0" value={adminEditCoins.gold} onChange={e => setAdminEditCoins({...adminEditCoins, gold: parseInt(e.target.value)||0})} className="w-12 p-1 text-sm border rounded font-bold text-center" />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-lg">🥈</span>
                                                <input type="number" min="0" value={adminEditCoins.silver} onChange={e => setAdminEditCoins({...adminEditCoins, silver: parseInt(e.target.value)||0})} className="w-12 p-1 text-sm border rounded font-bold text-center" />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-lg">🥉</span>
                                                <input type="number" min="0" value={adminEditCoins.bronze} onChange={e => setAdminEditCoins({...adminEditCoins, bronze: parseInt(e.target.value)||0})} className="w-12 p-1 text-sm border rounded font-bold text-center" />
                                            </div>
                                            <button onClick={() => handleAdminSaveCoins(u.id)} className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded-lg transition-all shadow-sm ml-1" title="Kaydet">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            </button>
                                            <button onClick={() => setEditingAdminUser(null)} className="bg-neutral-300 hover:bg-neutral-400 text-neutral-700 p-1.5 rounded-lg transition-all shadow-sm" title="İptal">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                            <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-neutral-200 shadow-sm">
                                                <div className="flex items-center gap-1"><span className="text-sm">🥇</span><span className="font-black text-xs">{u.gold || 0}</span></div>
                                                <div className="flex items-center gap-1"><span className="text-sm">🥈</span><span className="font-black text-xs">{u.silver || 0}</span></div>
                                                <div className="flex items-center gap-1"><span className="text-sm">🥉</span><span className="font-black text-xs">{u.bronze || 0}</span></div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => { setEditingAdminUser(u.id); setAdminEditCoins({ gold: u.gold||0, silver: u.silver||0, bronze: u.bronze||0 }); }} className="bg-amber-100 text-amber-700 hover:bg-amber-200 p-2 rounded-xl transition-all font-bold text-xs shadow-sm border border-amber-200" title="Bakiyeyi Düzenle">
                                                    Düzenle
                                                </button>
                                                <button onClick={() => handleAdminResetPwd(u.email)} disabled={!u.email} className="bg-neutral-800 text-white hover:bg-neutral-900 p-2 rounded-xl transition-all font-bold text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" title="Şifre Sıfırlama E-postası Gönder">
                                                    Şifre Sıfırla
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderConfetti = () => {
       const confettiCount = 50;
       return (
           <div className="absolute inset-0 pointer-events-none overflow-hidden z-[90]">
               {Array.from({ length: confettiCount }).map((_, i) => {
                   const left = Math.random() * 100;
                   const animDuration = Math.random() * 3 + 2;
                   const delay = Math.random() * 2;
                   const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
                   const color = colors[Math.floor(Math.random() * colors.length)];
                   return (
                       <div 
                          key={i} 
                          className={`absolute top-[-10%] w-2 h-4 sm:w-3 sm:h-6 ${color} rounded-sm opacity-80`}
                          style={{
                              left: `${left}%`,
                              animation: `confetti-fall ${animDuration}s linear ${delay}s infinite, confetti-spin 1s linear infinite`
                          }}
                       />
                   )
               })}
           </div>
       );
    };
  return (
    <div className={`min-h-screen ${bgColor} flex flex-col items-center py-2 sm:py-6 px-1 sm:px-4 font-sans relative overflow-x-hidden transition-colors duration-500`}>
      
      <style>{`
        @keyframes simple-roll {
          0% { transform: translateY(0) rotate(0deg); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          50% { transform: translateY(-10px) rotate(180deg); box-shadow: 0 10px 15px rgba(0,0,0,0.15); }
          100% { transform: translateY(0) rotate(360deg); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        }
        @keyframes confetti-fall {
            0% { transform: translateY(-10vh); }
            100% { transform: translateY(110vh); }
        }
        @keyframes confetti-spin {
            0% { transform: rotateX(0) rotateY(0); }
            100% { transform: rotateX(360deg) rotateY(360deg); }
        }
        .animate-simple-roll-1 { animation: simple-roll 0.4s ease-in-out infinite; }
        .animate-simple-roll-2 { animation: simple-roll 0.5s ease-in-out infinite reverse; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        
        .name-stroke-green {
           -webkit-text-stroke: 1px #064e3b;
           text-stroke: 1px #064e3b;
        }
        .name-stroke-yellow {
           -webkit-text-stroke: 1px #713f12;
           text-stroke: 1px #713f12;
        }
        @media (min-width: 640px) {
           .name-stroke-green { -webkit-text-stroke: 1.5px #064e3b; text-stroke: 1.5px #064e3b; }
           .name-stroke-yellow { -webkit-text-stroke: 1.5px #713f12; text-stroke: 1.5px #713f12; }
        }
        @keyframes fly-emote-0 {
          0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
          15% { transform: translate(20px, 30px) scale(1.5); opacity: 1; }
          100% { transform: translate(120px, 180px) scale(2.5); opacity: 0; }
        }
        @keyframes fly-emote-1 {
          0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
          15% { transform: translate(-20px, -30px) scale(1.5); opacity: 1; }
          100% { transform: translate(-120px, -180px) scale(2.5); opacity: 0; }
        }
        .animate-fly-0 { animation: fly-emote-0 3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; pointer-events: none; }
        .animate-fly-1 { animation: fly-emote-1 3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; pointer-events: none; }
      `}</style>

      {/* YENİ MENÜ GÖRÜNÜMLERİ */}
      {appView === 'home' && renderHome()}
      {appView === 'about' && renderAbout()}
      {appView === 'profile' && renderProfile()}
      {appView === 'settings' && renderSettings()}
      {appView === 'leaderboard' && renderLeaderboard()}
      {appView === 'admin' && renderAdminPanel()}
      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} onSuccess={(view) => setAppView(view)} t={t} />}
      {selectedProfile && <UserProfileModal player={selectedProfile} onClose={() => setSelectedProfile(null)} t={t} />}
      {showAvatarModal && renderAvatarModal()}
      {showAchievementsModal && renderAchievementsModal()}
      {isChatModalOpen && renderChatModal()}

      {/* OYUN EKRANI WRAPPER'I */}
      <div className={appView === 'play' ? "w-full flex flex-col items-center relative" : "hidden"}>

      {/* Beklerken YZ ile Oyna Modalı */}
      {showPlayAIWhileWaitingModal && (
        <div className="fixed inset-0 bg-black/70 z-[90] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden border-2 border-neutral-200 text-center animate-bounce-short">
                <h2 className="text-xl font-black text-neutral-800 mb-4">🚀 {t('aiWaitTitle')}</h2>
                <p className="text-sm font-bold text-neutral-600 mb-6">{t('aiWaitPrompt')}</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowPlayAIWhileWaitingModal(false)} className="flex-1 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-black rounded-xl transition-all">{t('btnWait')}</button>
                    <button onClick={handleStartAIWhileWaiting} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md transition-all transform hover:scale-105">{t('btnPlayAI')}</button>
                </div>
            </div>
        </div>
      )}

      {/* Rakip Bulundu Modalı */}
      {showOpponentFoundModal && (
        <div className="fixed inset-0 bg-black/70 z-[90] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden border-4 border-green-500 text-center animate-bounce-short">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <h2 className="text-xl font-black text-neutral-800 mb-4">{t('opponentFoundPrompt')}</h2>
                <div className="flex gap-3">
                    <button onClick={handleDeclineOpponent} className="flex-1 py-3 bg-red-100 hover:bg-red-200 text-red-600 font-black rounded-xl transition-all">{t('btnDecline')}</button>
                    <button onClick={handleAcceptOpponent} className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl shadow-md transition-all transform hover:scale-105">{t('btnAccept')}</button>
                </div>
            </div>
        </div>
      )}

      {/* Başlangıç ve Lobi Modalları */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-2 sm:p-4 backdrop-blur-md">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-5xl w-full shadow-2xl border-2 sm:border-4 border-neutral-200 transform transition-all flex flex-col md:flex-row max-h-[95vh] sm:max-h-[90vh] overflow-hidden relative">

                {/* Sol Sütun - Nasıl Oynanır? */}
                <div className="w-full md:w-[55%] p-4 sm:p-8 overflow-y-auto border-b-2 md:border-b-0 md:border-r-2 border-neutral-200 bg-neutral-50/50 custom-scrollbar">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4 sm:mb-6 border-b-2 border-neutral-200 pb-4">
                        <img src="lc_logo.png" alt="Locked Checker Logo" className="h-12 sm:h-16 object-contain drop-shadow-md" onError={(e) => { e.target.style.display = 'none'; }} />
                        <h2 className="text-2xl sm:text-3xl font-black text-neutral-800 text-center sm:text-left">{t('howToPlay')}</h2>
                    </div>
                    <ul className="list-disc pl-4 sm:pl-5 space-y-2 sm:space-y-3 text-neutral-700 text-xs sm:text-sm leading-relaxed">
                      <li><strong>1:</strong> {t('rule0')}</li>
                      <li className={!isLobbyRulesExpanded ? "hidden md:list-item" : ""}><strong>2:</strong> {t('rule1')}</li>
                      <li className={!isLobbyRulesExpanded ? "hidden md:list-item" : ""}><strong>3:</strong> {t('rule2')}</li>
                      <li className={!isLobbyRulesExpanded ? "hidden md:list-item" : ""}><strong>4:</strong> {t('rule3')}</li>
                      <li className={!isLobbyRulesExpanded ? "hidden md:list-item" : ""}><strong>5:</strong> {t('rule4')}</li>
                      {isLobbyRulesExpanded && (
                        <>
                          <li><strong>6:</strong> {t('rule5')}</li>
                          <li><strong>7:</strong> {t('rule6')}</li>
                          <li><strong>8:</strong> {t('rule7')}</li>
                          <li><strong>9:</strong> {t('rule8')}</li>
                          <li><strong>10:</strong> {t('rule9')}</li>
                          <li><strong>11:</strong> {t('rule10')}</li>
                        </>
                      )}
                    </ul>
                    <button 
                        onClick={() => setIsLobbyRulesExpanded(!isLobbyRulesExpanded)} 
                        className="mt-4 sm:mt-5 text-blue-600 font-bold text-xs sm:text-sm flex items-center gap-1 hover:text-blue-800 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
                    >
                        {isLobbyRulesExpanded ? t('showLess') : t('readMore')}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isLobbyRulesExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                </div>

                {/* Sağ Sütun - Lobi Navigasyonu */}
                <div className="w-full md:w-[45%] p-4 sm:p-8 flex flex-col justify-start bg-white overflow-y-auto custom-scrollbar">
                    
                    {lobbyMode === 'main' && (
                      <div className="flex flex-col h-full justify-center">
                        <div className="flex items-center justify-between mb-4 sm:mb-6 border-b-2 border-neutral-100 pb-2">
                            <h2 className="text-2xl sm:text-3xl font-black text-neutral-800">{t('localPlay')}</h2>
                            <button onClick={() => { handleLeaveRoom(); setAppView('home'); }} className="p-2 sm:p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl transition-all shadow-sm border border-neutral-200 flex items-center justify-center hover:scale-105" title={t('mainMenu')}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                            </button>
                        </div>
                        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                            <div>
                                <label className="block text-green-700 font-bold mb-1 text-xs sm:text-sm">{t('greenPlayer')}</label>
                                <input type="text" maxLength={15} placeholder={t('enterName')} value={tempNames[0]} onChange={(e) => setTempNames(prev => ({ ...prev, 0: e.target.value }))} className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl border-2 border-green-200 focus:border-green-500 focus:outline-none bg-green-50/50 font-semibold text-sm sm:text-base" />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-yellow-600 font-bold text-xs sm:text-sm">{t('yellowPlayer')}</label>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setIsBotActive(!isBotActive);
                                            if (!isBotActive) setTempNames(prev => ({ ...prev, 1: t('aiName') }));
                                            else setTempNames(prev => ({ ...prev, 1: '' }));
                                        }}
                                        className={`transition-all flex items-center gap-1.5 group px-2 py-1 rounded-lg border-2 ${isBotActive ? 'bg-blue-100 text-blue-700 border-blue-400 shadow-inner' : 'bg-white text-neutral-400 hover:text-blue-600 hover:bg-neutral-50 border-neutral-200 hover:border-blue-300'}`}
                                    >
                                        {isBotActive && <span className="text-[10px] font-black transition-all opacity-100">{t('botActive')}</span>}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isBotActive ? 'animate-pulse' : ''}>
                                            <rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8.01" y2="16"></line><line x1="16" y1="16" x2="16.01" y2="16"></line>
                                        </svg>
                                    </button>
                                </div>
                                <input 
                                    type="text" maxLength={15} placeholder={t('enterName')} 
                                    value={isBotActive ? t('aiName') : tempNames[1]} 
                                    onChange={(e) => setTempNames(prev => ({ ...prev, 1: e.target.value }))} 
                                    disabled={isBotActive}
                                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl border-2 focus:outline-none font-semibold text-sm sm:text-base transition-colors ${isBotActive ? 'bg-neutral-200 border-neutral-300 text-neutral-500 cursor-not-allowed' : 'bg-yellow-50/50 border-yellow-200 focus:border-yellow-500 text-neutral-800'}`} 
                                />
                            </div>
                            <button onClick={() => {
                                setPlayerNames({ 0: tempNames[0].trim() || t('greenPlayer'), 1: isBotActive ? t('aiName') : (tempNames[1].trim() || t('yellowPlayer')) });
                                setIsOnline(false); setShowNameModal(false);
                            }} className="w-full bg-neutral-800 hover:bg-neutral-900 text-white font-black py-2 sm:py-3 px-6 rounded-xl shadow-md transition-all transform hover:scale-[1.02] mt-2 text-sm sm:text-base">
                                {t('startLocal')}
                            </button>
                        </div>
                        
                        <hr className="border-neutral-200 border-2 rounded-full my-2 sm:my-4" />
                        
                        <h2 className="text-xl sm:text-2xl font-black text-blue-600 mb-3 sm:mb-4 text-center mt-2">{t('onlinePlay')}</h2>
                        <div className="flex flex-col gap-2 sm:gap-3">
                            <button onClick={() => setLobbyMode('create')} className="w-full bg-blue-100 text-blue-800 border-2 border-blue-500 hover:bg-blue-200 font-bold py-2 sm:py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base">
                                {t('createRoom')}
                            </button>
                            <button onClick={() => setLobbyMode('join')} className="w-full bg-indigo-100 text-indigo-800 border-2 border-indigo-500 hover:bg-indigo-200 font-bold py-2 sm:py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base">
                                {t('joinRoom')}
                            </button>
                            <button onClick={handleQuickMatch} className="w-full bg-purple-100 text-purple-800 border-2 border-purple-500 hover:bg-purple-200 font-bold py-2 sm:py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base">
                                {t('quickMatch')}
                            </button>
                        </div>
                      </div>
                    )}

                    {(lobbyMode === 'create' || lobbyMode === 'join') && (
                      <div className="flex flex-col h-full justify-center">
                        <button onClick={() => setLobbyMode('main')} className="self-start text-neutral-400 hover:text-neutral-700 font-bold mb-4 flex items-center gap-1 text-sm sm:text-base">
                          {t('goBack')}
                        </button>
                        <h2 className="text-2xl sm:text-3xl font-black text-neutral-800 mb-4 sm:mb-6 text-center">
                          {lobbyMode === 'create' ? t('roomCreateTitle') : t('roomJoinTitle')}
                        </h2>
                        
                        <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
                            <div>
                                <label className="block text-neutral-700 font-bold mb-1 sm:mb-2 text-sm sm:text-base">{t('nameLabel')}</label>
                                <input type="text" maxLength={15} placeholder={t('enterName')} value={onlineName} onChange={(e) => setOnlineName(e.target.value)} className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl border-2 border-neutral-300 focus:border-blue-500 focus:outline-none bg-neutral-50 font-semibold text-sm sm:text-base" />
                            </div>

                            {lobbyMode === 'create' && (
                                <div>
                                    <label className="block text-neutral-700 font-bold mb-1 sm:mb-2 text-sm sm:text-base">{t('roomTypeLabel')}</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => setCreateRoomType('public')} className={`flex-1 py-2 rounded-xl border-2 font-bold text-sm transition-all ${createRoomType === 'public' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-neutral-50 border-neutral-200 text-neutral-500'}`}>
                                            {t('public')}
                                        </button>
                                        <button onClick={() => setCreateRoomType('private')} className={`flex-1 py-2 rounded-xl border-2 font-bold text-sm transition-all ${createRoomType === 'private' ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-neutral-50 border-neutral-200 text-neutral-500'}`}>
                                            {t('private')}
                                        </button>
                                    </div>
                                    <p className="text-[10px] sm:text-xs text-neutral-500 mt-1.5 px-1 font-medium">
                                        {createRoomType === 'public' ? t('publicDesc') : t('privateDesc')}
                                    </p>
                                </div>
                            )}

                            {lobbyMode === 'join' && !window.location.search.includes('room=') && (
                                <div>
                                    <label className="block text-neutral-700 font-bold mb-1 sm:mb-2 text-sm sm:text-base">{t('roomIDLabel')}</label>
                                    <input type="text" maxLength={6} placeholder={t('roomIDPlaceholder')} value={joinRoomIdInput} onChange={(e) => setJoinRoomIdInput(e.target.value.toUpperCase())} className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl border-2 border-indigo-300 focus:border-indigo-500 focus:outline-none bg-indigo-50 font-black tracking-widest uppercase text-sm sm:text-base" />
                                </div>
                            )}
                        </div>
                        
                        {joinError && <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl mb-4 text-center border border-red-200">{joinError}</div>}
                        <button onClick={lobbyMode === 'create' ? handleCreateRoom : handleJoinRoom} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 sm:py-4 px-6 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] text-sm sm:text-base">
                            {lobbyMode === 'create' ? t('btnCreate') : t('btnJoin')}
                        </button>
                      </div>
                    )}

                    {lobbyMode === 'quick-searching' && (
                       <div className="flex flex-col h-full justify-center items-center gap-4 sm:gap-6">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                          <h2 className="text-xl sm:text-2xl font-black text-neutral-800">{t('searching')}</h2>
                          <p className="text-neutral-500 text-center text-sm sm:text-base">{t('searchingDesc')}</p>
                          <button onClick={() => setLobbyMode('main')} className="mt-2 text-neutral-500 hover:text-neutral-700 font-bold underline text-sm">{t('cancel')}</button>
                       </div>
                    )}

                    {lobbyMode === 'room' && roomData && (
                      <div className="flex flex-col h-full">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 mb-4 sm:mb-6 border-b-2 border-neutral-100 pb-4">
                           <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
                             <span className="text-[10px] sm:text-xs text-neutral-400 font-bold uppercase tracking-wider block">{t('roomID')} ({roomData.type === 'public' ? t('public') : t('private')})</span>
                             <div className="flex items-center gap-2">
                                 <span className="text-xl sm:text-2xl font-black text-neutral-800 tracking-widest">{currentRoomId}</span>
                                 {myRole === 0 && !roomData.players['1'] && (
                                     <button onClick={handleRefreshRoomId} className="text-neutral-400 hover:text-blue-500 transition-colors p-1.5 rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transform hover:rotate-180 transition-transform duration-300"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg></button>
                                 )}
                             </div>
                           </div>
                           <button onClick={copyInviteLink} className="bg-neutral-100 hover:bg-neutral-200 text-neutral-600 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1 transition-colors">
                             📋 {copied ? t('copied') : t('copyID')}
                           </button>
                        </div>

                        <div className="flex flex-col gap-3 sm:gap-4 mb-auto">
                            <div className={`p-3 sm:p-4 rounded-xl border-2 flex justify-between items-center ${roomData.players['0'] ? 'bg-green-50 border-green-200' : 'bg-neutral-50 border-dashed border-neutral-300'}`}>
                                <div className="flex flex-col">
                                  <span className="text-[10px] sm:text-xs font-bold text-green-700 uppercase">{t('greenPlayer')}</span>
                                  {myRole === 0 ? (
                                     <input type="text" maxLength={15} placeholder={t('enterName')} value={onlineName} onChange={(e) => setOnlineName(e.target.value)} onBlur={(e) => syncGameState({ "players.0.name": e.target.value.trim() })} className="font-black text-base sm:text-lg bg-transparent border-b-2 border-transparent focus:border-green-400 focus:outline-none placeholder-neutral-400 text-neutral-800 transition-colors w-full sm:w-40 -ml-1 px-1" />
                                  ) : (
                                     <span className={`font-black text-base sm:text-lg px-1 ${roomData.players['0']?.name ? 'text-neutral-800' : 'text-neutral-400 italic'}`}>{roomData.players['0'] ? (roomData.players['0'].name || t('enterName')) : t('waiting')}</span>
                                  )}
                                </div>
                                <div>
                                  {roomData.players['0']?.ready ? <span className="bg-green-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded">{t('ready')}</span> : <span className="bg-neutral-300 text-neutral-600 text-[10px] sm:text-xs font-bold px-2 py-1 rounded">{t('notReady')}</span>}
                                </div>
                            </div>
                            
                            <div className={`p-3 sm:p-4 rounded-xl border-2 flex justify-between items-center ${roomData.players['1'] ? 'bg-yellow-50 border-yellow-200' : 'bg-neutral-50 border-dashed border-neutral-300'}`}>
                                <div className="flex flex-col items-start">
                                  <span className="text-[10px] sm:text-xs font-bold text-yellow-600 uppercase">{t('yellowPlayer')}</span>
                                  {myRole === 1 ? (
                                     <input type="text" maxLength={15} placeholder={t('enterName')} value={onlineName} onChange={(e) => setOnlineName(e.target.value)} onBlur={(e) => syncGameState({ "players.1.name": e.target.value.trim() })} className="font-black text-base sm:text-lg bg-transparent border-b-2 border-transparent focus:border-yellow-400 focus:outline-none placeholder-neutral-400 text-neutral-800 transition-colors w-full sm:w-40 -ml-1 px-1" />
                                  ) : (
                                     <span className={`font-black text-base sm:text-lg px-1 ${roomData.players['1']?.name ? 'text-neutral-800' : 'text-neutral-400 italic'}`}>{roomData.players['1'] ? (roomData.players['1'].name || t('enterName')) : t('waiting')}</span>
                                  )}
                                  {myRole === 0 && roomData.players['1'] && (
                                      <button onClick={handleKickPlayer} className="mt-1 text-[10px] font-bold text-red-500 hover:text-red-700 text-left underline px-1">{t('kick')}</button>
                                  )}
                                </div>
                                <div>
                                  {roomData.players['1']?.ready ? <span className="bg-green-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded">{t('ready')}</span> : <span className="bg-neutral-300 text-neutral-600 text-[10px] sm:text-xs font-bold px-2 py-1 rounded">{t('notReady')}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 sm:mt-8">
                           {roomData.players['0'] && roomData.players['1'] ? (
                             <button onClick={toggleReady} className={`w-full font-black py-3 sm:py-4 px-6 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] text-white text-sm sm:text-base ${roomData.players[myRole]?.ready ? 'bg-neutral-400 hover:bg-neutral-500' : 'bg-green-600 hover:bg-green-700'}`}>
                                 {roomData.players[myRole]?.ready ? t('cancelReady') : t('btnReady')}
                             </button>
                           ) : (
                             <div className="text-center text-neutral-500 font-bold animate-pulse p-3 sm:p-4 bg-neutral-100 rounded-xl text-sm sm:text-base">{t('waitingOpponent')}</div>
                           )}
                           <button onClick={handleLeaveRoom} className="w-full mt-2 sm:mt-3 text-red-500 hover:text-red-700 font-bold text-xs sm:text-sm py-2">{t('leaveRoom')}</button>
                        </div>
                      </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Oyun Sonu Pop-up (Modal) Penceresi */}
      {gameState === 'finished' && showResultsModal && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
            {/* Konfeti - Eğer Kazandıysak veya Berabereyse */}
            {(winner === myRole || (!isOnline && winner !== 'tie') || winner === 'tie') && renderConfetti()}
            
            <div className="relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 max-w-lg w-full text-center shadow-2xl transform animate-bounce-short border-2 sm:border-4 border-neutral-200 z-10">
                <button onClick={() => setShowResultsModal(false)} className="absolute top-3 right-3 sm:top-5 sm:right-5 text-neutral-400 hover:text-neutral-700 transition-colors" title={t('inspectBoard')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <h2 className="text-3xl sm:text-5xl font-black text-red-600 mb-4 sm:mb-6 drop-shadow-md">{t('gameOver')}</h2>
                <div className="text-lg sm:text-2xl font-bold mb-6 sm:mb-8 text-neutral-800 bg-neutral-100 py-3 sm:py-4 rounded-xl border border-neutral-200 relative">
                    {winner === 'tie' ? t('tie') : t('winnerIs', {name: winner === 0 ? playerNames[0] : playerNames[1]})}
                </div>
                <div className="flex justify-center gap-8 sm:gap-12 mb-6 sm:mb-10 text-base sm:text-lg font-medium text-neutral-600">
                    <div className="flex flex-col items-center">
                        <span className="text-green-600 font-bold text-lg sm:text-xl mb-1">{playerNames[0]}</span>
                        <span className="text-4xl sm:text-5xl font-black text-neutral-800">{scores[0]}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-yellow-600 font-bold text-lg sm:text-xl mb-1">{playerNames[1]}</span>
                        <span className="text-4xl sm:text-5xl font-black text-neutral-800">{scores[1]}</span>
                    </div>
                </div>
                
                {winReason && (
                    <div className="mb-6 sm:mb-8 text-xs sm:text-sm italic text-neutral-600 font-medium bg-neutral-100 p-3 sm:p-4 rounded-xl border border-neutral-300 shadow-inner">
                        * {
                            typeof winReason === 'string' 
                            ? winReason 
                            : (winReason.type === 'checkmate' 
                                ? t('winReasonCheckmate', { loserName: playerNames[winReason.loser], suffix: getGenitiveSuffix(playerNames[winReason.loser]), winnerName: playerNames[winReason.winner] })
                                : t('winReasonEmptyBoard', { winnerName: playerNames[winReason.winner] })
                              )
                        }
                    </div>
                )}

                <div className="flex flex-col gap-2 sm:gap-3 relative z-20">
                    <button onClick={handleResetGameClick} className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3 sm:py-4 px-8 sm:px-12 rounded-full shadow-lg transition-all transform hover:scale-105 text-base sm:text-xl tracking-wide">
                        {isOnline ? t('returnLobby') : t('newGame')}
                    </button>
                    <button onClick={() => setShowResultsModal(false)} className="text-neutral-500 font-bold hover:text-neutral-700 transition-colors py-2 text-sm sm:text-base">
                        {t('inspectBoard')}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Üst Kısım: Başlık/Logo */}
      <div className="flex flex-col items-center mb-1 sm:mb-2 relative w-full max-w-4xl">
          <div className="absolute left-2 sm:left-4 top-1 sm:top-2 flex items-center gap-2 z-50">
              <button onClick={() => { handleLeaveRoom(); setAppView('home'); }} className="text-neutral-500 hover:text-neutral-800 font-bold px-3 py-1.5 rounded-xl shadow-sm bg-white border border-neutral-200 flex items-center gap-1.5 transition-all text-xs sm:text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                  <span className="hidden sm:inline">{t('mainMenu')}</span>
              </button>
              <button 
                  onClick={() => setSoundEnabled(!soundEnabled)} 
                  className="text-neutral-500 hover:text-neutral-800 font-bold px-2.5 py-1.5 rounded-xl shadow-sm bg-white border border-neutral-200 flex items-center transition-all"
                  title={soundEnabled ? "Sesi Kapat" : "Sesi Aç"}
              >
                  {soundEnabled ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                  )}
              </button>
          </div>

          <img src="lc_logo.png" alt="Locked Checker Logo" className="h-12 sm:h-20 md:h-28 object-contain drop-shadow-2xl mb-1 hover:scale-105 transition-transform cursor-pointer" onError={(e) => { e.target.style.display = 'none'; document.getElementById('fallback-game-title').style.display = 'block'; }} />
          <h1 id="fallback-game-title" className="text-2xl sm:text-4xl font-extrabold text-neutral-800 tracking-tight" style={{ display: 'none' }}>Locked Checker</h1>
          
          {isOnline && (
              <div className="mt-1 text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full flex items-center gap-1.5 border border-blue-200 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  Oda: {currentRoomId}
              </div>
          )}
      </div>

      <div className="w-full max-w-full overflow-x-auto custom-scrollbar pb-4 flex justify-center mt-1">
        <div className="flex flex-col gap-[1px] bg-white/40 p-2 sm:p-4 rounded-xl shadow-none select-none relative min-w-max border-0">
          
          {isOnline && currentPlayer !== myRole && gameState === 'playing' && <div className="absolute inset-0 bg-white/40 z-40 rounded-xl pointer-events-none"></div>}

          {/* --- ÜST TAHTA (Yeşil Kutu) --- */}
          <div className="border-[4px] sm:border-[6px] md:border-[8px] lg:border-[10px] border-green-500 rounded-md sm:rounded-lg p-0.5 sm:p-1 flex bg-white relative shadow-md z-10 mt-6 sm:mt-8 md:mt-10">
            <div className="absolute bottom-full left-3 sm:left-6 z-50 flex items-center gap-1.5 sm:gap-2 pointer-events-auto mb-[8px] sm:mb-[10px] md:mb-[12px]">
                 <div className={`shrink-0 w-[22px] h-[22px] sm:w-[28px] sm:h-[28px] md:w-[34px] md:h-[34px] rounded-full flex items-center justify-center font-black text-[10px] sm:text-xs md:text-sm border-[2px] transition-all duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.3)]
                   ${currentPlayer === 0 && gameState === 'playing' ? (timeLeft <= 3 && dice !== null && !isRolling && !isAnimating ? 'border-red-500 text-red-600 bg-red-50 animate-pulse scale-110' : 'border-green-500 text-green-700 bg-white') : 'border-neutral-300 text-neutral-400 bg-neutral-100'}`}>
                   {currentPlayer === 0 && gameState === 'playing' ? timeLeft : 10}
                 </div>
                 
                 <div className="relative flex items-center gap-2">
                     <span className="leading-none text-green-400 font-serif italic font-black text-[22px] sm:text-[28px] md:text-[34px] tracking-wide name-stroke-green">
                       {playerNames[0]} {isOnline && myRole === 0 ? '(Sen)' : ''}
                     </span>
                     
                     {/* SOHBET İKONU (ÜST OYUNCU) */}
                     {isOnline && (
                         <button 
                             onClick={() => {
                                 if (myRole === 0) { setChattingPlayerRole(0); setIsChatModalOpen(true); }
                                 else setBlockedChat(prev => ({...prev, 0: !prev[0]}));
                             }}
                             className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${myRole === 0 ? 'bg-white border-green-300 hover:bg-green-50' : (blockedChat[0] ? 'bg-red-100 border-red-400 grayscale' : 'bg-white border-neutral-300 hover:bg-neutral-100')}`}
                             title={myRole === 0 ? 'Sohbet / İfade' : (blockedChat[0] ? 'Engeli Kaldır' : 'Sohbeti Engelle')}
                         >
                             {myRole !== 0 && blockedChat[0] ? '🚫' : '💬'}
                         </button>
                     )}
                     {!isOnline && (
                         <button onClick={() => { setChattingPlayerRole(0); setIsChatModalOpen(true); }} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 bg-white border-green-300 hover:bg-green-50 transition-all shadow-sm" title="Sohbet / İfade">
                             💬
                         </button>
                     )}

                     {/* SOHBET BALONCUĞU (ÜST) */}
                     {activeChat[0] && activeChat[0].type === 'message' && (
                         <div className="absolute left-full ml-2 sm:ml-3 top-1/2 -translate-y-1/2 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl shadow-md border-2 border-green-200 whitespace-nowrap z-[100] animate-bounce-short">
                             <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-l-2 border-b-2 border-green-200 transform rotate-45"></div>
                             <div className="relative z-10 flex items-center justify-center">
                                 <span className="text-xs sm:text-sm font-black text-neutral-800">{activeChat[0].content}</span>
                             </div>
                         </div>
                     )}

                     {/* UÇAN İFADE (ÜST) */}
                     {activeChat[0] && activeChat[0].type === 'emote' && (
                         <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-[100] animate-fly-0">
                             <span className="text-4xl drop-shadow-xl">{activeChat[0].content}</span>
                         </div>
                     )}
                 </div>
            </div>

            <div className="w-5 sm:w-7 md:w-10 lg:w-14 bg-blue-900 border border-black flex flex-col items-center justify-center relative overflow-hidden">
              <span className="font-black tracking-[0.1em] sm:tracking-[0.2em] text-[5px] sm:text-[7px] md:text-xs lg:text-base select-none absolute whitespace-nowrap" style={{ transform: 'rotate(-90deg)', WebkitTextStroke: '0.5px rgba(255,255,255,0.6)', color: 'rgba(255,255,255,0.15)' }}>
                {t('collectedArea')}
              </span>
              {renderCollected(collectedPieces.topBlue, 'blue')}
            </div>
            
            <div className="flex flex-col relative overflow-hidden bg-neutral-50">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <span className="text-[30px] sm:text-[50px] md:text-[80px] lg:text-[100px] font-serif italic font-black text-black/[0.06] select-none -rotate-12 whitespace-nowrap tracking-wide">{playerNames[0]}</span>
              </div>
              {board[0].map((row, rIndex) => (
                <div key={`t-r-${rIndex}`} className="flex">
                  {row.map((count, cIndex) => {
                    const cellColor = getCellColor(0, cIndex);
                    const canSelect = (!isOnline || currentPlayer === myRole) && !isAnimating && !isAITurn;
                    const hasSelectable = canSelect && count > 0 && dice && cellColor === dice.color && validatePath(0, rIndex, cIndex, dice.value, board).valid;

                    return (
                      <div key={`t-${rIndex}-${cIndex}`} onClick={() => handleCellClick(0, rIndex, cIndex)} className={`w-5 h-5 sm:w-7 sm:h-7 md:w-10 md:h-10 lg:w-14 lg:h-14 border border-black/30 flex items-center justify-center relative transition-all ${cellColor === 'blue' ? 'bg-sky-300' : 'bg-red-300'} ${hasSelectable ? 'cursor-pointer z-30 shadow-[0_0_8px_2px_rgba(255,255,255,0.9)] sm:shadow-[0_0_15px_4px_rgba(255,255,255,0.9)] brightness-110' : ''}`}>
                        {renderCellPieces(count)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="w-5 sm:w-7 md:w-10 lg:w-14 bg-red-900 border border-black flex flex-col items-center justify-center relative overflow-hidden">
               <span className="font-black tracking-[0.1em] sm:tracking-[0.2em] text-[5px] sm:text-[7px] md:text-xs lg:text-base select-none absolute whitespace-nowrap" style={{ transform: 'rotate(90deg)', WebkitTextStroke: '0.5px rgba(255,255,255,0.6)', color: 'rgba(255,255,255,0.15)' }}>
                 {t('collectedArea')}
               </span>
               {renderCollected(collectedPieces.topRed, 'red')}
            </div>
          </div>

          {/* --- ORTA ALAN (ZAR AT / ZARLAR) --- */}
          <div className="flex justify-center items-center w-full z-50 my-0">
             <div className="pointer-events-auto flex items-center justify-center gap-6 sm:gap-12 md:gap-20 w-full">
                
                <div className="w-[80px] sm:w-[110px] flex justify-end h-[35px] sm:h-[50px] items-center">
                    {currentPlayer === 0 && renderDiceArea()}
                </div>

                <div className="flex flex-col items-center relative shrink-0">
                    <button 
                      onClick={rollDice}
                      disabled={dice !== null || isRolling || isAnimating || gameState !== 'playing' || (isOnline && currentPlayer !== myRole) || isAITurn}
                      className={`relative overflow-hidden font-black py-1.5 sm:py-2.5 rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.2)] disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95 text-[10px] sm:text-xs border-[2px] whitespace-nowrap w-[130px] sm:w-[170px] flex items-center justify-center ${(isOnline && currentPlayer !== myRole) ? 'bg-neutral-300 text-neutral-500 border-neutral-400 cursor-not-allowed' : (currentPlayer === 0 ? 'bg-green-600 hover:bg-green-700 text-white border-green-700' : 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-yellow-500')}`}
                    >
                      {dice === null && !isRolling && !isAnimating && gameState === 'playing' && !showNameModal && (!isOnline || currentPlayer === myRole) && !isAITurn && (
                        <div className={`absolute left-0 top-0 bottom-0 transition-all duration-75 ease-linear ${currentPlayer === 0 ? 'bg-green-400/50' : 'bg-white/40'}`} style={{ width: `${autoRollProgress}%` }}></div>
                      )}
                      <span className="relative z-10 drop-shadow-md tracking-wider w-full text-center">
                         {(isOnline && currentPlayer !== myRole) 
                             ? t('opponentTurn') 
                             : (isRolling ? t('rollDice') + '...' : (isAnimating ? t('moving') : (dice ? (isAITurn ? t('aiThinking') : t('waitingMove')) : (isAITurn ? t('aiWaiting') : t('rollDice')))))
                         }
                      </span>
                    </button>

                    {isTurnSkipped && gameState === 'playing' && (
                        <div className="absolute top-full mt-0.5 sm:mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <span className="text-[8px] sm:text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-black animate-pulse text-center shadow-sm border border-red-200">
                                {t('turnSkipped')}
                            </span>
                        </div>
                    )}
                </div>

                <div className="w-[80px] sm:w-[110px] flex justify-start h-[35px] sm:h-[50px] items-center">
                    {currentPlayer === 1 && renderDiceArea()}
                </div>
             </div>
          </div>

          {/* --- ALT TAHTA (Sarı Kutu) --- */}
          <div className="border-[4px] sm:border-[6px] md:border-[8px] lg:border-[10px] border-yellow-400 rounded-md sm:rounded-lg p-0.5 sm:p-1 flex bg-white relative shadow-md z-10 mb-6 sm:mb-8 md:mb-10">
            <div className="absolute top-full right-3 sm:right-6 z-50 flex items-center gap-1.5 sm:gap-2 pointer-events-auto mt-[8px] sm:mt-[10px] md:mt-[12px]">
                 <div className="relative flex items-center gap-2">
                     {/* SOHBET BALONCUĞU (ALT) */}
                     {activeChat[1] && activeChat[1].type === 'message' && (
                         <div className="absolute right-full mr-2 sm:mr-3 top-1/2 -translate-y-1/2 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl shadow-md border-2 border-yellow-200 whitespace-nowrap z-[100] animate-bounce-short">
                             <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-r-2 border-t-2 border-yellow-200 transform rotate-45"></div>
                             <div className="relative z-10 flex items-center justify-center">
                                 <span className="text-xs sm:text-sm font-black text-neutral-800">{activeChat[1].content}</span>
                             </div>
                         </div>
                     )}

                     {/* UÇAN İFADE (ALT) */}
                     {activeChat[1] && activeChat[1].type === 'emote' && (
                         <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 z-[100] animate-fly-1">
                             <span className="text-4xl drop-shadow-xl">{activeChat[1].content}</span>
                         </div>
                     )}
                     
                     {/* SOHBET İKONU (ALT OYUNCU) */}
                     {isOnline && (
                         <button 
                             onClick={() => {
                                 if (myRole === 1) { setChattingPlayerRole(1); setIsChatModalOpen(true); }
                                 else setBlockedChat(prev => ({...prev, 1: !prev[1]}));
                             }}
                             className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${myRole === 1 ? 'bg-white border-yellow-300 hover:bg-yellow-50' : (blockedChat[1] ? 'bg-red-100 border-red-400 grayscale' : 'bg-white border-neutral-300 hover:bg-neutral-100')}`}
                             title={myRole === 1 ? 'Sohbet / İfade' : (blockedChat[1] ? 'Engeli Kaldır' : 'Sohbeti Engelle')}
                         >
                             {myRole !== 1 && blockedChat[1] ? '🚫' : '💬'}
                         </button>
                     )}
                     {!isOnline && (
                         <button onClick={() => { setChattingPlayerRole(1); setIsChatModalOpen(true); }} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 bg-white border-yellow-300 hover:bg-yellow-50 transition-all shadow-sm" title="Sohbet / İfade">
                             💬
                         </button>
                     )}

                     <span className="leading-none text-yellow-400 font-serif italic font-black text-[22px] sm:text-[28px] md:text-[34px] tracking-wide name-stroke-yellow">
                       {playerNames[1]} {isOnline && myRole === 1 ? '(Sen)' : ''}
                     </span>
                 </div>

                 <div className={`shrink-0 w-[22px] h-[22px] sm:w-[28px] sm:h-[28px] md:w-[34px] md:h-[34px] rounded-full flex items-center justify-center font-black text-[10px] sm:text-xs md:text-sm border-[2px] transition-all duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.3)]
                   ${currentPlayer === 1 && gameState === 'playing' ? (timeLeft <= 3 && dice !== null && !isRolling && !isAnimating ? 'border-red-500 text-red-600 bg-red-50 animate-pulse scale-110' : 'border-yellow-500 text-yellow-700 bg-white') : 'border-neutral-300 text-neutral-400 bg-neutral-100'}`}>
                   {currentPlayer === 1 && gameState === 'playing' ? timeLeft : 10}
                 </div>
            </div>

            <div className="w-5 sm:w-7 md:w-10 lg:w-14 bg-red-900 border border-black flex flex-col items-center justify-center relative overflow-hidden">
               <span className="font-black tracking-[0.1em] sm:tracking-[0.2em] text-[5px] sm:text-[7px] md:text-xs lg:text-base select-none absolute whitespace-nowrap" style={{ transform: 'rotate(90deg)', WebkitTextStroke: '0.5px rgba(255,255,255,0.6)', color: 'rgba(255,255,255,0.15)' }}>
                 {t('collectedArea')}
               </span>
               {renderCollected(collectedPieces.botRed, 'red')}
            </div>
            
            <div className="flex flex-col relative overflow-hidden bg-neutral-50">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <span className="text-[30px] sm:text-[50px] md:text-[80px] lg:text-[100px] font-serif italic font-black text-black/[0.06] select-none -rotate-12 whitespace-nowrap tracking-wide">{playerNames[1]}</span>
              </div>
              {board[1].map((row, rIndex) => (
                <div key={`b-r-${rIndex}`} className="flex">
                  {row.map((count, cIndex) => {
                    const cellColor = getCellColor(1, cIndex);
                    const canSelect = (!isOnline || currentPlayer === myRole) && !isAnimating && !isAITurn;
                    const hasSelectable = canSelect && count > 0 && dice && cellColor === dice.color && validatePath(1, rIndex, cIndex, dice.value, board).valid;

                    return (
                      <div key={`b-${rIndex}-${cIndex}`} onClick={() => handleCellClick(1, rIndex, cIndex)} className={`w-5 h-5 sm:w-7 sm:h-7 md:w-10 md:h-10 lg:w-14 lg:h-14 border border-black/30 flex items-center justify-center relative transition-all ${cellColor === 'red' ? 'bg-red-300' : 'bg-sky-300'} ${hasSelectable ? 'cursor-pointer z-30 shadow-[0_0_8px_2px_rgba(255,255,255,0.9)] sm:shadow-[0_0_15px_4px_rgba(255,255,255,0.9)] brightness-110' : ''}`}>
                        {renderCellPieces(count)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="w-5 sm:w-7 md:w-10 lg:w-14 bg-blue-900 border border-black flex flex-col items-center justify-center relative overflow-hidden">
              <span className="font-black tracking-[0.1em] sm:tracking-[0.2em] text-[5px] sm:text-[7px] md:text-xs lg:text-base select-none absolute whitespace-nowrap" style={{ transform: 'rotate(90deg)', WebkitTextStroke: '0.5px rgba(255,255,255,0.6)', color: 'rgba(255,255,255,0.15)' }}>
                {t('collectedArea')}
              </span>
              {renderCollected(collectedPieces.botBlue, 'blue')}
            </div>
          </div>
        </div>
      </div>
      
      {/* Kurallar */}
      <div className="mt-2 sm:mt-6 max-w-4xl bg-white p-4 sm:p-5 rounded-xl border border-neutral-200 shadow-sm mx-2 w-full mb-8">
        <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setIsRulesOpen(!isRulesOpen)}>
          <h3 className="font-bold text-neutral-800 text-sm sm:text-base">{t('howToPlay')}</h3>
          <button className="text-neutral-500 hover:text-neutral-800 transition-colors p-1">
            {isRulesOpen ? (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>)}
          </button>
        </div>
        
        {isRulesOpen && (
          <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 mt-3 text-neutral-600 text-xs sm:text-sm">
            <li><strong>1:</strong> {t('rule0')}</li><li><strong>2:</strong> {t('rule1')}</li><li><strong>3:</strong> {t('rule2')}</li><li><strong>4:</strong> {t('rule3')}</li><li><strong>5:</strong> {t('rule4')}</li><li><strong>6:</strong> {t('rule5')}</li><li><strong>7:</strong> {t('rule6')}</li><li><strong>8:</strong> {t('rule7')}</li><li><strong>9:</strong> {t('rule8')}</li><li><strong>10:</strong> {t('rule9')}</li><li><strong>11:</strong> {t('rule10')}</li>
          </ul>
        )}
      </div>

      </div>
    </div>
  );
}
