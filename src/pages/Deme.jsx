import React, { useState, useEffect, useRef } from 'react';
import { Play, ChevronRight, ChevronLeft, ArrowRight, Settings, Check, X, SkipForward, Info, Trophy, RotateCcw, Minus, Plus, Globe, Medal, Film, Cpu, Landmark, Smile, Database, Save, Lock, MessageSquarePlus, CheckCircle2, ListTodo, Trash2, Edit3, Upload, FileJson, AlertTriangle, User, LogOut, LogIn, UserPlus, Gamepad2, Eye, Edit2, ArrowLeft, Users, FolderTree } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import emailjs from '@emailjs/browser';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';

// ==========================================
// 🔴 FIREBASE AYARLARI BURAYA GELECEK 🔴
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyB1gHSr2fpZZvXRLBi8CUEXhRRjXLCyfhw",
  authDomain: "egiticioyuntr.firebaseapp.com",
  projectId: "egiticioyuntr",
  storageBucket: "egiticioyuntr.firebasestorage.app",
  messagingSenderId: "470830059463",
  appId: "1:470830059463:web:4afeae2b894fe4d83953e2"
};

// Firebase'i Başlat
let app, auth, db, appId;
let isUsingUserFirebase = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "SİZİN_API_KEY" && firebaseConfig.projectId === "egiticioyuntr") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    appId = "deme-oyunu-v1";
    isUsingUserFirebase = true;
  } else if (typeof __firebase_config !== 'undefined') {
    const config = JSON.parse(__firebase_config);
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  } else {
    console.warn("Firebase ayarları henüz girilmedi, oyun varsayılan kelimelerle çalışacak.");
  }
} catch (e) {
  console.error("Firebase başlatılamadı. Lütfen config ayarlarını kontrol edin.", e);
}

/* ==========================================
   VERİTABANI (VARSAYILAN SEED VERİSİ)
============================================= */
const DEFAULT_WORD_DATABASE = {
  "Genel": [
    { word: "KİTAP", forbidden: ["Okumak", "Sayfa", "Yazar", "Roman", "Kütüphane"] },
    { word: "BİLGİSAYAR", forbidden: ["Klavye", "Ekran", "Fare", "İnternet", "Oyun"] },
    { word: "DENİZ", forbidden: ["Su", "Dalga", "Yüzmek", "Kum", "Sahil"] },
    { word: "OKUL", forbidden: ["Öğrenci", "Öğretmen", "Ders", "Sınıf", "Sınav"] },
    { word: "TELEFON", forbidden: ["Aramak", "Mesaj", "Ekran", "Uygulama", "İletişim"] }
  ],
  "Spor": [
    { word: "FUTBOL", forbidden: ["Top", "Kale", "Maç", "Gol", "Hakem"] },
    { word: "BASKETBOL", forbidden: ["Pota", "Zıplamak", "Smaç", "Top", "Salon"] },
    { word: "YÜZME", forbidden: ["Havuz", "Deniz", "Kulaç", "Bone", "Su"] },
    { word: "TENİS", forbidden: ["Raket", "Kort", "File", "Top", "Wimbledon"] }
  ],
  "Sinema": [
    { word: "YÖNETMEN", forbidden: ["Film", "Kamera", "Oyuncu", "Sahne", "Motor"] },
    { word: "OSCAR", forbidden: ["Ödül", "Film", "Tören", "Aktör", "Akademi"] },
    { word: "PATLAMAMIŞ MISIR", forbidden: ["Sinema", "Yemek", "Tuzlu", "İzlemek", "Film"] }
  ],
  "Teknoloji": [
    { word: "YAPAY ZEKA", forbidden: ["Robot", "Bilgisayar", "Gelecek", "Öğrenme", "Akıllı"] },
    { word: "YAZILIM", forbidden: ["Kod", "Program", "Bilgisayar", "Geliştirici", "Uygulama"] },
    { word: "İNTERNET", forbidden: ["Web", "Bağlantı", "Wifi", "Tarayıcı", "Dünya"] }
  ],
  "Tarih": [
    { word: "İMPARATORLUK", forbidden: ["Devlet", "Savaş", "Padişah", "Tarih", "Kral"] },
    { word: "MÜZE", forbidden: ["Eser", "Tarihi", "Sergi", "Eski", "Gezmek"] },
    { word: "PİRAMİT", forbidden: ["Mısır", "Firavun", "Mezar", "Çöl", "Üçgen"] }
  ],
  "Çocuk": [
    { word: "KÖPEK", forbidden: ["Havlamak", "Kemik", "Hayvan", "Kedi", "Evcil"] },
    { word: "ELMA", forbidden: ["Meyve", "Kırmızı", "Ağaç", "Yemek", "Tatlı"] },
    { word: "GÜNEŞ", forbidden: ["Sıcak", "Gökyüzü", "Sarı", "Yaz", "Işık"] }
  ]
};

const ADJECTIVES = ["Cesur", "Uçan", "Gizemli", "Hızlı", "Zeki", "Korkusuz", "Muhteşem", "Çılgın", "Efsanevi", "Yenilmez", "Kızgın", "Süper", "Görünmez", "Komik"];
const NOUNS = ["Aslanlar", "Kartallar", "Ejderhalar", "Kaplanlar", "Büyücüler", "Savaşçılar", "Dahiler", "Ninjalar", "Korsanlar", "Şövalyeler", "Robotlar", "Zombiler"];

const CATEGORY_LIST = [
  { name: "Genel", icon: Globe, color: "text-blue-500", gradient: "from-blue-100 to-blue-200" },
  { name: "Spor", icon: Medal, color: "text-orange-500", gradient: "from-orange-100 to-orange-200" },
  { name: "Sinema", icon: Film, color: "text-purple-500", gradient: "from-purple-100 to-purple-200" },
  { name: "Teknoloji", icon: Cpu, color: "text-slate-700", gradient: "from-slate-100 to-slate-200" },
  { name: "Tarih", icon: Landmark, color: "text-amber-700", gradient: "from-amber-100 to-amber-200" },
  { name: "Çocuk", icon: Smile, color: "text-pink-500", gradient: "from-pink-100 to-pink-200" }
];

const getAudioCtx = () => {
  if (!window.audioCtx) {
    window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (window.audioCtx.state === 'suspended') window.audioCtx.resume();
  return window.audioCtx;
};

const playClickSound = () => {
  try {
    const audioCtx = getAudioCtx();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime); 
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); 
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {}
};

const playTickSound = (freq = 1000) => {
  try {
    const audioCtx = getAudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq / 1.5, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } catch (e) {}
};

const playCorrectSound = () => {
  try {
    const audioCtx = getAudioCtx();
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    gain1.gain.setValueAtTime(0, audioCtx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.15);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
    gain2.gain.setValueAtTime(0, audioCtx.currentTime + 0.1);
    gain2.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(audioCtx.currentTime + 0.1);
    osc2.stop(audioCtx.currentTime + 0.4);
  } catch (e) {}
};

const playTabooSound = () => {
  try {
    const audioCtx = getAudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {}
};

const playPassSound = () => {
  try {
    const audioCtx = getAudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {}
};

const playTimeUpSound = () => {
  try {
    const audioCtx = getAudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (e) {}
};

/* ==========================================
   ALT BİLEŞENLER
============================================= */

// --- Oyunlarım Modalı ---
const MyGamesModal = ({ onClose, user, myGames }) => {
  const [view, setView] = useState('list'); 
  const [selectedGame, setSelectedGame] = useState(null);

  const [categoryName, setCategoryName] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [word, setWord] = useState("");
  const [forbidden, setForbidden] = useState(["", "", "", "", ""]);
  const [addedWords, setAddedWords] = useState([]);
  const [status, setStatus] = useState(null);
  
  const [editingWordIndex, setEditingWordIndex] = useState(null);
  const [confirmDeleteGame, setConfirmDeleteGame] = useState(false);

  const resetForm = () => {
    setCategoryName("");
    setVisibility("public");
    setWord("");
    setForbidden(["", "", "", "", ""]);
    setAddedWords([]);
    setEditingWordIndex(null);
    setStatus(null);
    setConfirmDeleteGame(false);
  };

  const openAdd = () => {
    resetForm();
    setView('add');
  };

  const openView = (game) => {
    setSelectedGame(game);
    setView('view');
  };

  const openEdit = (game) => {
    setSelectedGame(game);
    setCategoryName(game.name);
    setVisibility(game.type || 'public');
    setAddedWords(game.words || []);
    setWord("");
    setForbidden(["", "", "", "", ""]);
    setEditingWordIndex(null);
    setStatus(null);
    setConfirmDeleteGame(false);
    setView('edit');
  };

  const handleAddOrUpdateWord = () => {
    if (!word.trim() || forbidden.some(f => !f.trim())) {
      setStatus({ type: 'error', msg: "Lütfen kelimeyi ve 5 yasaklı kelimeyi eksiksiz doldurun!" });
      return;
    }
    
    const newWordObj = {
      word: word.trim().toLocaleUpperCase('tr-TR'),
      forbidden: forbidden.map(f => f.trim().toLocaleUpperCase('tr-TR'))
    };

    if (editingWordIndex !== null) {
      const updatedList = [...addedWords];
      updatedList[editingWordIndex] = newWordObj;
      setAddedWords(updatedList);
      setEditingWordIndex(null);
      setStatus({ type: 'success', msg: "Kelime güncellendi!" });
    } else {
      setAddedWords([newWordObj, ...addedWords]);
      setStatus({ type: 'success', msg: "Kelime eklendi!" });
    }
    
    setWord("");
    setForbidden(["", "", "", "", ""]);
    setTimeout(() => setStatus(null), 2000);
  };

  const handleEditWordClick = (index) => {
    const w = addedWords[index];
    setWord(w.word);
    setForbidden([...w.forbidden]);
    setEditingWordIndex(index);
    setStatus({ type: 'info', msg: "Kelimeyi düzenliyorsunuz..." });
  };

  const handleDeleteWordClick = (index) => {
    setAddedWords(addedWords.filter((_, i) => i !== index));
    if (editingWordIndex === index) {
      setWord("");
      setForbidden(["", "", "", "", ""]);
      setEditingWordIndex(null);
    }
  };

  const handleFinish = async () => {
    if (!categoryName.trim()) {
      setStatus({ type: 'error', msg: "Lütfen bir kategori (oyun) ismi girin!" });
      return;
    }
    if (addedWords.length === 0) {
      setStatus({ type: 'error', msg: "Oyununuza henüz hiç kelime eklemediniz!" });
      return;
    }

    try {
      setStatus({ type: 'info', msg: "Kaydediliyor..." });
      
      const gameData = {
        name: categoryName.trim(),
        words: addedWords,
        ownerId: user.uid,
        ownerEmail: user.email || "Üye",
        visibility: visibility,
        status: visibility === 'public' ? (view === 'edit' ? (selectedGame?.status || 'pending') : 'pending') : 'private',
        updatedAt: Date.now(),
        createdAt: view === 'edit' ? (selectedGame?.createdAt || Date.now()) : Date.now()
      };

      if (view === 'edit') {
        const oldColl = selectedGame.type === 'public' ? `public/data/customGames` : `users/${user.uid}/customGames`;
        const newColl = visibility === 'public' ? `public/data/customGames` : `users/${user.uid}/customGames`;

        if (oldColl !== newColl) {
          await deleteDoc(doc(db, 'artifacts', appId, ...oldColl.split('/'), selectedGame.id));
          await setDoc(doc(db, 'artifacts', appId, ...newColl.split('/'), selectedGame.id), gameData);
        } else {
          await setDoc(doc(db, 'artifacts', appId, ...oldColl.split('/'), selectedGame.id), gameData);
        }
        setStatus({ type: 'success', msg: "Değişiklikler başarıyla kaydedildi!" });
      } else {
        const coll = visibility === 'public' ? `public/data/customGames` : `users/${user.uid}/customGames`;
        await addDoc(collection(db, 'artifacts', appId, ...coll.split('/')), gameData);
        setStatus({ type: 'success', msg: "Oyun başarıyla oluşturuldu!" });
      }
      
      setTimeout(() => {
        setStatus(null);
        setView('list');
      }, 1500);
    } catch (e) {
      setStatus({ type: 'error', msg: "Hata: " + e.message });
    }
  };

  const handleDeleteGame = async () => {
    try {
      setStatus({ type: 'info', msg: "Oyun siliniyor..." });
      const coll = selectedGame.type === 'public' ? `public/data/customGames` : `users/${user.uid}/customGames`;
      await deleteDoc(doc(db, 'artifacts', appId, ...coll.split('/'), selectedGame.id));
      setStatus({ type: 'success', msg: "Oyun silindi!" });
      setTimeout(() => {
        setStatus(null);
        setConfirmDeleteGame(false);
        setView('list');
      }, 1500);
    } catch (e) {
      setStatus({ type: 'error', msg: "Silinirken hata oluştu: " + e.message });
    }
  };

  return (
    <div className="fixed inset-0 w-full h-screen bg-gray-900/95 flex items-center justify-center p-4 z-50 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-2xl shadow-2xl relative border-4 border-blue-300 my-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors z-10">
          <X size={32} />
        </button>
        
        {/* --- LİSTE GÖRÜNÜMÜ --- */}
        {view === 'list' && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-black text-blue-600 mb-6 flex items-center gap-3">
              <Gamepad2 size={36} /> Oyunlarım
            </h2>
            
            <button 
              onClick={openAdd} 
              className="w-full mb-6 bg-blue-50 border-2 border-dashed border-blue-300 hover:bg-blue-100 text-blue-600 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Plus size={24} /> Yeni Oyun Ekle
            </button>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {myGames.length === 0 ? (
                <div className="text-center py-8 text-gray-400 font-medium">
                  Henüz bir oyun eklemediniz.
                </div>
              ) : (
                myGames.map(game => (
                  <div key={game.id} className="bg-white border-2 border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-blue-200 transition-all">
                    <div>
                      <h3 className="font-black text-xl text-gray-800">{game.name}</h3>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{game.words?.length || 0} Kelime</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${game.type === 'public' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {game.type === 'public' ? (game.status === 'pending' ? 'Onay Bekliyor' : 'Herkese Açık') : 'Bana Özel'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openView(game)} 
                        className="flex-1 md:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye size={18} /> Görüntüle
                      </button>
                      <button 
                        onClick={() => openEdit(game)} 
                        className="flex-1 md:flex-none px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 size={18} /> Düzenle
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- GÖRÜNTÜLEME GÖRÜNÜMÜ --- */}
        {view === 'view' && selectedGame && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setView('list')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-3xl font-black text-gray-800">{selectedGame.name}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {selectedGame.words?.map((w, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="font-black text-lg text-blue-700 mb-2 border-b border-blue-100 pb-2">{w.word}</h4>
                  <ul className="text-sm font-semibold text-red-500 space-y-1">
                    {w.forbidden.map((f, i) => <li key={i}>- {f}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- EKLE / DÜZENLE GÖRÜNÜMÜ --- */}
        {(view === 'add' || view === 'edit') && (
          <div className="animate-fade-in flex flex-col max-h-[80vh]">
            <div className="flex items-center gap-4 mb-4 flex-shrink-0">
              <button onClick={() => setView('list')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-black text-blue-600">
                {view === 'edit' ? 'Oyunu Düzenle' : 'Yeni Oyun Oluştur'}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">Oyun Adı</label>
                <input 
                  value={categoryName} 
                  onChange={(e) => setCategoryName(e.target.value)} 
                  placeholder="Örn: 90'lar Pop" 
                  className="w-full border-2 border-blue-200 bg-blue-50 rounded-xl p-3 font-bold text-gray-800 focus:border-blue-500 outline-none" 
                />
              </div>

              <div className="bg-gray-50 p-4 md:p-5 rounded-2xl border border-gray-200 shadow-sm">
                <label className="block text-gray-700 font-bold mb-2">Anlatılacak Kelime:</label>
                <input 
                  value={word} 
                  onChange={(e) => setWord(e.target.value)} 
                  placeholder="Anlatılacak Kelime" 
                  className="w-full border-2 border-gray-200 rounded-xl p-3 font-black text-xl text-gray-800 focus:border-blue-500 outline-none uppercase shadow-inner" 
                />

                <label className="block text-red-500 font-bold mb-2 mt-4 flex items-center gap-2">
                  <X size={18} /> Deme Kelimeleri (5 Adet)
                </label>
                <div className="space-y-2">
                  {forbidden.map((fw, i) => (
                    <input 
                      key={i} 
                      value={fw} 
                      onChange={(e) => {
                        const newF = [...forbidden];
                        newF[i] = e.target.value;
                        setForbidden(newF);
                      }} 
                      placeholder={`${i + 1}. Yasaklı Kelime`} 
                      className="w-full border-2 border-red-100 bg-white rounded-xl p-2 font-bold text-gray-700 focus:border-red-400 outline-none capitalize shadow-sm" 
                    />
                  ))}
                </div>

                <button 
                  onClick={handleAddOrUpdateWord} 
                  className={`w-full mt-4 text-white font-black text-lg py-3 rounded-xl hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 ${editingWordIndex !== null ? 'bg-amber-500 hover:bg-amber-600 shadow-[0_4px_0_rgb(217,119,6)]' : 'bg-blue-500 hover:bg-blue-600 shadow-[0_4px_0_rgb(37,99,235)]'}`}
                >
                  {editingWordIndex !== null ? <><Check size={22} /> KELİMEYİ GÜNCELLE</> : <><Plus size={22} /> KELİME EKLE</>}
                </button>
              </div>

              {addedWords.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <h4 className="font-bold text-gray-600 mb-3 text-sm">Eklenen Kelimeler ({addedWords.length})</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {addedWords.map((aw, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-2 md:p-3 rounded-lg border ${editingWordIndex === idx ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100 hover:bg-blue-50 hover:border-blue-100'} transition-colors`}>
                        <span className="font-black text-gray-800">{aw.word}</span>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditWordClick(idx)} className="p-2 bg-white rounded-md text-blue-600 hover:bg-blue-100 shadow-sm border border-gray-200">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteWordClick(idx)} className="p-2 bg-white rounded-md text-red-600 hover:bg-red-100 shadow-sm border border-gray-200">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
                <Info size={24} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 font-medium">
                  Oyun oluşturmayı tamamladığınızda, oyununuz "Oyna" seçeneği altındaki kategorilere eklenecek ve hemen oynamaya hazır olacaktır. Ancak herkese açılması için yönetici onayı gerekmektedir. Kullanılan kelimelerdeki sorumluluk ekleyen kullanıcıya aittir. Nefret söylemi, cinsellik, şiddet içeren kelimeler kullanmaktan kaçının.
                </p>
              </div>

              <div className="flex gap-4">
                <label className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer transition-all ${visibility === 'public' ? 'border-blue-500 bg-blue-50 shadow-inner' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <input type="radio" checked={visibility === 'public'} onChange={() => setVisibility('public')} className="hidden" />
                  <Globe size={20} className={visibility === 'public' ? 'text-blue-500' : 'text-gray-400'} />
                  <span className={`font-bold text-sm md:text-base ${visibility === 'public' ? 'text-blue-700' : 'text-gray-500'}`}>Herkese Açık</span>
                </label>
                <label className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer transition-all ${visibility === 'private' ? 'border-purple-500 bg-purple-50 shadow-inner' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <input type="radio" checked={visibility === 'private'} onChange={() => setVisibility('private')} className="hidden" />
                  <Lock size={20} className={visibility === 'private' ? 'text-purple-500' : 'text-gray-400'} />
                  <span className={`font-bold text-sm md:text-base ${visibility === 'private' ? 'text-purple-700' : 'text-gray-500'}`}>Bana Özel</span>
                </label>
              </div>

              {status && (
                <div className={`p-3 rounded-xl font-bold flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-700 border-green-200' : status.type === 'info' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-red-100 text-red-700 border-red-200'} border`}>
                  {status.type === 'success' ? <Check size={20} /> : <Info size={20} />}
                  {status.msg}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row gap-3 flex-shrink-0">
              {view === 'edit' && (
                confirmDeleteGame ? (
                  <div className="flex-1 flex gap-2">
                    <button onClick={handleDeleteGame} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl">Eminim, Sil</button>
                    <button onClick={() => setConfirmDeleteGame(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl">İptal</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteGame(true)} className="md:w-1/3 bg-red-100 hover:bg-red-200 text-red-600 font-black text-lg py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                    <Trash2 size={20} /> SİL
                  </button>
                )
              )}
              
              <button onClick={handleFinish} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black text-xl py-3 rounded-xl shadow-[0_5px_0_rgb(21,128,61)] hover:translate-y-1 hover:shadow-none transition-all">
                {view === 'edit' ? 'KAYDET' : 'BİTTİ'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Kullanıcı Kelime Öneri Modalı ---
const SuggestionModal = ({ onClose, wordDatabase, user }) => {
  const [category, setCategory] = useState("Genel");
  const [customCategory, setCustomCategory] = useState("");
  const [word, setWord] = useState("");
  const [forbidden, setForbidden] = useState(["", "", "", "", ""]);
  const [status, setStatus] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!word.trim() || forbidden.some(f => !f.trim())) {
      setStatus({ type: 'error', msg: "Lütfen kelimeyi ve 5 yasaklı kelimeyi eksiksiz doldurun!" });
      return;
    }
    
    if (category === "NEW" && !customCategory.trim()) {
      setStatus({ type: 'error', msg: "Lütfen önermek istediğiniz kategorinin adını yazın!" });
      return;
    }

    try {
      if (!db || !appId) throw new Error("Veritabanı bağlantısı kurulamadı. Firebase ayarlarınızı kontrol edin.");
      
      const suggRef = collection(db, 'artifacts', appId, 'public', 'data', 'suggestions');
      await addDoc(suggRef, {
        category: category === "NEW" ? customCategory.trim() : category,
        word: word.trim().toLocaleUpperCase('tr-TR'),
        forbidden: forbidden.map(f => f.trim()),
        timestamp: Date.now(),
        suggestedBy: user && !user.isAnonymous ? user.email : "Anonim" 
      });

      setIsSuccess(true);
      setStatus(null);
    } catch (e) {
      setStatus({ type: 'error', msg: "Öneri gönderilemedi: " + e.message });
    }
  };

  const resetForm = () => {
    setWord("");
    setForbidden(["", "", "", "", ""]);
    setCustomCategory("");
    setCategory("Genel");
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 w-full h-screen bg-gray-900/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative border-4 border-green-200 flex flex-col items-center text-center">
          <CheckCircle2 size={80} className="text-green-500 mb-6 animate-bounce" />
          <h2 className="text-3xl font-black text-gray-800 mb-2">Harika!</h2>
          <p className="text-gray-600 mb-8 font-medium">Kelime önerin başarıyla alındı. Yönetici onayından sonra oyuna eklenecektir.</p>
          
          <button onClick={resetForm} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-[0_5px_0_rgb(21,128,61)] hover:translate-y-1 hover:shadow-none transition-all mb-4">
            YENİ KELİME ÖNER
          </button>
          
          <button onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-4 rounded-xl shadow-[0_5px_0_rgb(156,163,175)] hover:translate-y-1 hover:shadow-none transition-all">
            ANASAYFAYA DÖN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-screen bg-gray-900/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-lg shadow-2xl relative border-4 border-yellow-300 my-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors">
          <X size={32} />
        </button>
        
        <h2 className="text-3xl font-black text-yellow-600 mb-6 flex items-center gap-3">
          <MessageSquarePlus size={36} />
          Kelime Öner
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Kategori Seçimi</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border-2 border-yellow-200 bg-yellow-50 rounded-xl p-3 font-bold text-gray-800 focus:border-yellow-500 outline-none cursor-pointer">
              {Object.keys(wordDatabase).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="NEW" className="font-black text-yellow-700">➕ Yeni Kategori Öner...</option>
            </select>
          </div>

          {category === "NEW" && (
            <div className="animate-fade-in">
              <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Örn: Müzik" className="w-full border-2 border-yellow-400 bg-yellow-100 rounded-xl p-3 font-bold text-gray-800 focus:border-yellow-600 outline-none" />
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-bold mb-2">Kelime:</label>
            <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="Anlatılacak Kelime" className="w-full border-2 border-gray-200 rounded-xl p-3 font-black text-2xl text-gray-800 focus:border-yellow-500 outline-none uppercase placeholder:text-gray-300 shadow-inner" />
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <label className="text-gray-700 font-bold mb-3 flex items-center gap-2">
              <X size={18} className="text-red-500"/> Deme Kelimeleri:
            </label>
            <div className="space-y-2">
              {forbidden.map((fw, i) => (
                <input 
                  key={i} 
                  value={fw} 
                  onChange={(e) => {
                    const newF = [...forbidden];
                    newF[i] = e.target.value;
                    setForbidden(newF);
                  }} 
                  placeholder={`${i + 1}. Yasaklı Kelime`} 
                  className="w-full border-2 border-red-100 bg-white rounded-xl p-2 md:p-3 font-bold text-gray-700 focus:border-red-400 outline-none capitalize shadow-sm" 
                />
              ))}
            </div>
          </div>

          {status && (
            <div className="p-3 rounded-xl font-bold flex items-center gap-2 bg-red-100 text-red-700 border border-red-200">
              <Info size={20} />
              {status.msg}
            </div>
          )}

          <button onClick={handleSubmit} className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black text-xl py-4 rounded-xl shadow-[0_5px_0_rgb(202,138,4)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3 mt-4">
            KELİMEYİ ÖNER
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Yönetici İçin Kelime Düzenleme Satırı ---
const AdminWordRow = ({ wordObj, onSave, onDelete, isSelected, onToggleSelect }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [word, setWord] = useState(wordObj.word);
  const [forbidden, setForbidden] = useState([...wordObj.forbidden]);

  const handleSave = () => {
    onSave({ word, forbidden });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-4 rounded-xl border-2 border-blue-200 shadow-sm mb-3 animate-fade-in ml-8">
        <input value={word} onChange={e=>setWord(e.target.value.toLocaleUpperCase('tr-TR'))} className="font-black text-lg w-full mb-2 p-2 border border-gray-200 rounded focus:outline-none focus:border-blue-400" placeholder="Kelime" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
          {forbidden.map((fw, i) => (
            <input key={i} value={fw} onChange={e => { const nf = [...forbidden]; nf[i] = e.target.value; setForbidden(nf); }} className="p-2 border border-gray-200 rounded text-sm capitalize focus:outline-none focus:border-blue-400" placeholder={`${i+1}. Yasaklı`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600 transition-colors">Kaydet</button>
          <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors">İptal</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 p-3 rounded-xl border flex flex-col md:flex-row justify-between items-center gap-4 mb-3 transition-colors ${isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-blue-200'}`}>
      <div className="flex items-center gap-3 flex-1 w-full">
        <input 
          type="checkbox" 
          checked={isSelected} 
          onChange={onToggleSelect} 
          className="w-5 h-5 cursor-pointer accent-purple-600 flex-shrink-0" 
        />
        <div className="flex-1">
          <span className="font-black text-lg text-gray-800">{wordObj.word}</span>
          <div className="text-sm text-red-500 font-medium">{wordObj.forbidden.join(', ')}</div>
        </div>
      </div>
      <div className="flex gap-2 w-full md:w-auto ml-8 md:ml-0">
        <button onClick={() => setIsEditing(true)} className="flex-1 md:flex-none p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 flex justify-center"><Edit2 size={18} /></button>
        <button onClick={onDelete} className="flex-1 md:flex-none p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex justify-center"><Trash2 size={18} /></button>
      </div>
    </div>
  );
};


// --- Yönetici Paneli Öneri Satırı Bileşeni ---
const SuggestionItemRow = ({ suggestion, wordDatabase, onApprove, onReject }) => {
  const [word, setWord] = useState(suggestion.word || "");
  const [forbidden, setForbidden] = useState(suggestion.forbidden || []);
  const [cat, setCat] = useState(suggestion.category || "Genel");

  return (
    <div className="bg-purple-50 rounded-2xl p-4 border-2 border-purple-100 mb-4 shadow-sm">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-purple-600 uppercase block">Kategori</label>
            {suggestion.suggestedBy && (
              <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                Öneren: {suggestion.suggestedBy}
              </span>
            )}
          </div>
          <input value={cat} onChange={(e) => setCat(e.target.value)} className="w-full p-2 rounded-lg border border-purple-200 font-bold focus:outline-none focus:border-purple-500"/>
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold text-purple-600 uppercase mb-1 block">Kelime</label>
          <input value={word} onChange={(e) => setWord(e.target.value.toLocaleUpperCase('tr-TR'))} className="w-full p-2 rounded-lg border border-purple-200 font-black text-lg focus:outline-none focus:border-purple-500 uppercase"/>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="text-xs font-bold text-red-500 uppercase mb-1 block">Yasaklı Kelimeler</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {forbidden.map((fw, i) => (
            <input 
              key={i} 
              value={fw} 
              onChange={(e) => {
                const newF = [...forbidden];
                newF[i] = e.target.value;
                setForbidden(newF);
              }}
              className="w-full p-2 rounded-lg border border-red-200 text-sm font-semibold focus:outline-none focus:border-red-500 capitalize"
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-purple-200">
        <button onClick={() => onReject(suggestion.id)} className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-lg transition-colors flex items-center gap-2">
          <Trash2 size={18} /> Sil
        </button>
        <button onClick={() => onApprove(suggestion.id, cat, word, forbidden)} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-md">
          <Check size={18} /> Onayla ve Ekle
        </button>
      </div>
    </div>
  );
}

// Admin (Kelime Ekleme, Öneriler ve Kategoriler) Modal Bileşeni
const AdminModal = ({ onClose, wordDatabase, suggestions, customPublicGames }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('categories'); 

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const [category, setCategory] = useState("Genel");
  const [word, setWord] = useState("");
  const [forbidden, setForbidden] = useState(["", "", "", "", ""]);

  const [selectedCat, setSelectedCat] = useState(null);
  const [editCatName, setEditCatName] = useState("");
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(false);
  const [selectedWords, setSelectedWords] = useState([]); // Yeni: Kelime Çoklu Seçim State'i

  const handleLogin = () => {
    if (password === "admin123") {
      setIsAuthenticated(true);
      setStatus(null);
    } else {
      setStatus({ type: 'error', msg: "Hatalı şifre girdiniz!" });
    }
  };

  const handleResetPassword = async () => {
    if (resetEmail.trim() === "boteonur@gmail.com") {
      setStatus({ type: 'info', msg: "E-posta gönderiliyor, lütfen bekleyin..." });

      const templateParams = {
        to_email: 'boteonur@gmail.com',
        message: 'admin123',
      };

      try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service_id: 'service_cw4u7yi',
            template_id: 'template_578qx5p',
            user_id: 'BF8KlO7uXh462AIYf',
            template_params: templateParams
          })
        });

        if (response.ok) {
          setStatus({ type: 'success', msg: "Şifreniz boteonur@gmail.com adresine başarıyla gönderildi!" });
          setTimeout(() => {
            setIsForgotPassword(false);
            setStatus(null);
            setResetEmail("");
          }, 4000);
        } else {
          const errText = await response.text();
          setStatus({ type: 'error', msg: "E-posta gönderilemedi. Hata: " + errText });
        }
      } catch (err) {
        setStatus({ type: 'error', msg: "E-posta gönderilemedi. Lütfen bağlantınızı kontrol edin." });
      }
    } else {
      setStatus({ type: 'error', msg: "Böyle bir yönetici e-posta adresi bulunamadı!" });
    }
  };

  const handleDirectSave = async () => {
    if (!word.trim() || forbidden.some(f => !f.trim())) {
      setStatus({ type: 'error', msg: "Lütfen kelimeyi ve 5 yasaklı kelimeyi eksiksiz doldurun!" });
      return;
    }

    try {
      if (!db || !appId) throw new Error("Veritabanı bağlantısı kurulamadı.");
      
      const newWordObj = {
        word: word.trim().toLocaleUpperCase('tr-TR'),
        forbidden: forbidden.map(f => f.trim())
      };

      const currentWords = wordDatabase[category] || [];
      const updatedWords = [...currentWords, newWordObj];

      const catRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), category);
      await setDoc(catRef, { words: updatedWords });

      setStatus({ type: 'success', msg: "Kelime başarıyla eklendi!" });
      setWord("");
      setForbidden(["", "", "", "", ""]);
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus({ type: 'error', msg: "Kaydedilirken hata oluştu: " + e.message });
    }
  };

  const handleApproveSuggestion = async (id, catName, wordVal, forbiddenArr) => {
    if (!wordVal.trim() || forbiddenArr.some(f => !f.trim()) || !catName.trim()) {
      setStatus({ type: 'error', msg: "Eksik alan var, onaylanamadı." });
      return;
    }
    try {
      const currentWords = wordDatabase[catName.trim()] || [];
      const newWordObj = {
        word: wordVal.trim().toLocaleUpperCase('tr-TR'),
        forbidden: forbiddenArr.map(f => f.trim())
      };
      
      const catRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), catName.trim());
      await setDoc(catRef, { words: [...currentWords, newWordObj] });
      
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'suggestions', id));
      
      setStatus({ type: 'success', msg: "Öneri onaylandı ve veritabanına eklendi!" });
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus({ type: 'error', msg: "Hata: " + e.message });
    }
  };

  const handleRejectSuggestion = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'suggestions', id));
      setStatus({ type: 'success', msg: "Öneri reddedildi ve silindi." });
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus({ type: 'error', msg: "Hata: " + e.message });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data)) throw new Error("Geçersiz format.");

        setStatus({ type: 'info', msg: "Yükleniyor..." });

        const groupedWords = {};
        let validWordCount = 0;

        data.forEach(item => {
          if (item.category && item.word && Array.isArray(item.forbidden) && item.forbidden.length > 0) {
            const cat = item.category.trim();
            if (!groupedWords[cat]) groupedWords[cat] = [];
            groupedWords[cat].push({
              word: item.word.trim().toLocaleUpperCase('tr-TR'),
              forbidden: item.forbidden.map(f => f.trim())
            });
            validWordCount++;
          }
        });

        if (validWordCount === 0) throw new Error("Geçerli kelime bulunamadı.");

        for (const [catName, newWords] of Object.entries(groupedWords)) {
          const currentWords = wordDatabase[catName] || [];
          const updatedWords = [...currentWords, ...newWords];
          const catRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), catName);
          await setDoc(catRef, { words: updatedWords });
        }

        setStatus({ type: 'success', msg: `Tebrikler! ${validWordCount} adet kelime başarıyla eklendi.` });
        e.target.value = null; 
        setTimeout(() => setStatus(null), 5000);

      } catch (error) {
        setStatus({ type: 'error', msg: "Hata: " + error.message });
        e.target.value = null;
      }
    };
    reader.readAsText(file);
  };

  // --- KATEGORİ YÖNETİMİ FONKSİYONLARI ---
  const handleOpenCat = (type, data) => {
    setSelectedCat({ type, data });
    setEditCatName(type === 'official' ? data : data.name);
    setConfirmDeleteCat(false);
    setSelectedWords([]); // Her kategori açılışında seçimi temizle
  };

  const handleRenameCat = async () => {
    if (!editCatName.trim()) return;
    try {
      if (selectedCat.type === 'official') {
        const oldName = selectedCat.data;
        if (oldName !== editCatName) {
          const data = wordDatabase[oldName];
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', editCatName), { words: data });
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', oldName));
          setSelectedCat({ type: 'official', data: editCatName });
          setStatus({ type: 'success', msg: "Kategori adı güncellendi!" });
        }
      } else {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customGames', selectedCat.data.id), { name: editCatName });
        setSelectedCat({ type: 'custom', data: { ...selectedCat.data, name: editCatName } });
        setStatus({ type: 'success', msg: "Oyun adı güncellendi!" });
      }
      setTimeout(() => setStatus(null), 2000);
    } catch (e) {
      setStatus({ type: 'error', msg: e.message });
    }
  };

  const handleSaveWord = async (index, newWordObj) => {
    try {
      if (selectedCat.type === 'official') {
        const catName = selectedCat.data;
        const newWords = [...wordDatabase[catName]];
        newWords[index] = newWordObj;
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', catName), { words: newWords });
      } else {
        const gameId = selectedCat.data.id;
        const newWords = [...selectedCat.data.words];
        newWords[index] = newWordObj;
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customGames', gameId), { words: newWords });
        setSelectedCat({ type: 'custom', data: { ...selectedCat.data, words: newWords } });
      }
      setStatus({ type: 'success', msg: "Kelime güncellendi!" });
      setTimeout(() => setStatus(null), 2000);
    } catch(e) { setStatus({ type: 'error', msg: e.message }); }
  };

  const handleDeleteWord = async (index) => {
    try {
      if (selectedCat.type === 'official') {
        const catName = selectedCat.data;
        const newWords = [...wordDatabase[catName]];
        newWords.splice(index, 1);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', catName), { words: newWords });
      } else {
        const gameId = selectedCat.data.id;
        const newWords = [...selectedCat.data.words];
        newWords.splice(index, 1);
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customGames', gameId), { words: newWords });
        setSelectedCat({ type: 'custom', data: { ...selectedCat.data, words: newWords } });
      }
      // Silinen kelime seçim listesinde varsa oradan da çıkar
      setSelectedWords(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
      setStatus({ type: 'success', msg: "Kelime silindi!" });
      setTimeout(() => setStatus(null), 2000);
    } catch(e) { setStatus({ type: 'error', msg: e.message }); }
  };

  // --- YENİ: Toplu Seçim ve Silme Fonksiyonları ---
  const handleSelectAll = (e) => {
    const currentList = selectedCat.type === 'official' ? wordDatabase[selectedCat.data] : (selectedCat.data.words || []);
    if (e.target.checked) {
      setSelectedWords(currentList.map((_, i) => i));
    } else {
      setSelectedWords([]);
    }
  };

  const handleSelectWord = (index) => {
    if (selectedWords.includes(index)) {
      setSelectedWords(selectedWords.filter(i => i !== index));
    } else {
      setSelectedWords([...selectedWords, index]);
    }
  };

  const handleDeleteSelectedWords = async () => {
    if (selectedWords.length === 0) return;
    
    // Diziyi bozulmadan silebilmek için indeksleri büyükten küçüğe sıralıyoruz
    const sortedIndices = [...selectedWords].sort((a, b) => b - a);

    try {
      if (selectedCat.type === 'official') {
        const catName = selectedCat.data;
        const newWords = [...wordDatabase[catName]];
        sortedIndices.forEach(idx => newWords.splice(idx, 1));
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', catName), { words: newWords });
      } else {
        const gameId = selectedCat.data.id;
        const newWords = [...selectedCat.data.words];
        sortedIndices.forEach(idx => newWords.splice(idx, 1));
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customGames', gameId), { words: newWords });
        setSelectedCat({ type: 'custom', data: { ...selectedCat.data, words: newWords } });
      }
      setStatus({ type: 'success', msg: `${selectedWords.length} kelime başarıyla silindi!` });
      setSelectedWords([]);
      setTimeout(() => setStatus(null), 2000);
    } catch(e) {
      setStatus({ type: 'error', msg: e.message });
    }
  };

  const handleApproveCustomGame = async (gameId) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customGames', gameId), { status: 'approved' });
      setStatus({ type: 'success', msg: "Oyun başarıyla onaylandı ve herkese açıldı!" });
      setTimeout(() => { setStatus(null); setSelectedCat(null); }, 2000);
    } catch (e) { setStatus({ type: 'error', msg: e.message }); }
  };

  const handleRejectCustomGame = async (game) => {
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', game.ownerId, 'customGames', game.id), { ...game, visibility: 'private', status: 'rejected' });
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customGames', game.id));
      setStatus({ type: 'success', msg: "Oyun reddedildi ve sadece kullanıcısına özel yapıldı." });
      setTimeout(() => { setStatus(null); setSelectedCat(null); }, 2000);
    } catch (e) { setStatus({ type: 'error', msg: e.message }); }
  };

  const handleDeleteCategory = async () => {
    try {
      if (selectedCat.type === 'official') {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', selectedCat.data));
      } else {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customGames', selectedCat.data.id));
      }
      setStatus({ type: 'success', msg: "Kategori başarıyla silindi!" });
      setTimeout(() => {
        setStatus(null);
        setSelectedCat(null);
        setConfirmDeleteCat(false);
      }, 2000);
    } catch (e) {
      setStatus({ type: 'error', msg: e.message });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 w-full h-screen bg-gray-900/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative border-4 border-purple-200">
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors">
            <X size={32} />
          </button>
          
          <h2 className="text-3xl font-black text-purple-900 mb-6 flex items-center gap-3">
            <Lock className="text-purple-500" size={36} />
            Yönetici Girişi
          </h2>

          <div className="space-y-4">
            {isForgotPassword ? (
              <div className="animate-fade-in">
                <div className="text-sm text-gray-500 mb-4">Şifrenizi yenilemek için yönetici e-posta adresinizi girin.</div>
                <input 
                  type="email" 
                  value={resetEmail} 
                  onChange={(e) => setResetEmail(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                  placeholder="bo................@gmail.com" 
                  className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold text-gray-800 focus:border-purple-500 outline-none shadow-inner" 
                />
                
                {status && (
                  <div className={`mt-4 p-3 rounded-xl font-bold flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-700 border-green-200' : status.type === 'info' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-red-100 text-red-700 border-red-200'} border`}>
                    {status.type === 'success' ? <Check size={20} /> : <Info size={20} />}
                    {status.msg}
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button onClick={handleResetPassword} className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-black py-4 rounded-xl shadow-[0_5px_0_rgb(2,132,199)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2">
                    GÖNDER
                  </button>
                  <button onClick={() => { setIsForgotPassword(false); setStatus(null); setResetEmail(""); }} className="px-5 bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold rounded-xl shadow-[0_5px_0_rgb(209,213,219)] hover:translate-y-1 hover:shadow-none transition-all">
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="text-sm text-gray-500 mb-4">Panele erişmek için yönetici şifresini girin.</div>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Şifre" 
                  className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold text-gray-800 focus:border-purple-500 outline-none shadow-inner" 
                />
                
                {status && (
                  <div className={`mt-4 p-3 rounded-xl font-bold flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'} border`}>
                    {status.type === 'success' ? <Check size={20} /> : <Info size={20} />}
                    {status.msg}
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button onClick={handleLogin} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xl py-4 rounded-xl shadow-[0_5px_0_rgb(67,56,202)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3">
                    GİRİŞ YAP
                  </button>
                  <button 
                    onClick={() => { setIsForgotPassword(true); setStatus(null); }}
                    className="w-16 bg-gray-100 hover:bg-gray-200 flex items-center justify-center rounded-xl shadow-[0_5px_0_rgb(209,213,219)] hover:translate-y-1 hover:shadow-none transition-all text-3xl"
                    title="Şifremi Unuttum"
                  >
                    😔
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Güvenli filtreleme için fallback listesi
  const safePublicGames = customPublicGames || [];
  const pendingGames = safePublicGames.filter(g => g.status === 'pending');
  const approvedGames = safePublicGames.filter(g => g.status === 'approved');

  // Şu an bakılan kategorinin kelime listesi
  const currentWordList = selectedCat ? (selectedCat.type === 'official' ? wordDatabase[selectedCat.data] : (selectedCat.data.words || [])) : [];
  const isAllSelected = currentWordList.length > 0 && selectedWords.length === currentWordList.length;

  return (
    <div className="fixed inset-0 w-full h-screen bg-gray-900/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-4xl shadow-2xl relative border-4 border-purple-200 my-auto min-h-[60vh]">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors z-10">
          <X size={32} />
        </button>
        
        <h2 className="text-3xl font-black text-purple-900 mb-6 flex items-center gap-3">
          <Database className="text-purple-500" size={36} />
          Yönetici Paneli
        </h2>

        <div className="flex flex-wrap gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => {setActiveTab('categories'); setSelectedCat(null); setStatus(null);}}
            className={`flex-1 min-w-[100px] py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'categories' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <FolderTree size={18} /> Kategoriler
          </button>
          <button 
            onClick={() => setActiveTab('review')}
            className={`flex-1 min-w-[120px] py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'review' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <ListTodo size={18} /> Öneriler
            {suggestions.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{suggestions.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('add')}
            className={`flex-1 min-w-[100px] py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'add' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <Edit3 size={18} /> Tek Ekle
          </button>
          <button 
            onClick={() => setActiveTab('import')}
            className={`flex-1 min-w-[100px] py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'import' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <Upload size={18} /> Toplu Yükle
          </button>
        </div>

        {status && (
          <div className={`p-4 rounded-xl font-bold flex items-center gap-2 mb-4 ${status.type === 'success' ? 'bg-green-100 text-green-700 border-green-200' : status.type === 'info' ? 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse' : 'bg-red-100 text-red-700 border-red-200'}`}>
            {status.type === 'success' ? <Check size={20} /> : status.type === 'info' ? <Upload size={20} /> : <Info size={20} />}
            {status.msg}
          </div>
        )}

        {/* --- KATEGORİLER SEKMESİ --- */}
        {activeTab === 'categories' && (
          <div className="animate-fade-in flex flex-col h-full max-h-[60vh]">
            {!selectedCat ? (
              <div className="overflow-y-auto pr-2 custom-scrollbar">
                <h3 className="font-bold text-gray-500 uppercase tracking-widest text-sm mb-3">Mevcut Kategoriler (Resmi)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  {Object.keys(wordDatabase).map(catName => (
                    <div key={catName} className="bg-white border-2 border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-purple-200 transition-colors">
                      <div>
                        <div className="font-black text-lg text-gray-800">{catName}</div>
                        <div className="text-xs font-bold text-gray-500">{wordDatabase[catName].length} Kelime</div>
                      </div>
                      <button onClick={() => handleOpenCat('official', catName)} className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 font-bold flex items-center gap-2">
                        <Edit2 size={16} /> Düzenle
                      </button>
                    </div>
                  ))}
                </div>

                {/* YENİ: Onaylı Üye Oyunları */}
                <h3 className="font-bold text-blue-500 uppercase tracking-widest text-sm mb-3 mt-6">Üyelerden (Onaylı)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  {approvedGames.length === 0 ? (
                    <div className="col-span-2 text-center py-6 text-gray-400 font-medium">Onaylı üye oyunu yok.</div>
                  ) : (
                    approvedGames.map(game => (
                      <div key={game.id} className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-blue-300 transition-colors">
                        <div>
                          <div className="font-black text-lg text-blue-800">{game.name}</div>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-200 px-2 py-0.5 rounded">{game.words?.length || 0} Kelime</span>
                            <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">@{game.ownerEmail?.split('@')[0]}</span>
                          </div>
                        </div>
                        <button onClick={() => handleOpenCat('custom', game)} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold flex items-center gap-2 shadow-sm">
                          <Edit2 size={16} /> Düzenle
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <h3 className="font-bold text-orange-500 uppercase tracking-widest text-sm mb-3">Onay Bekleyen Oyunlar (Üyelerden)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendingGames.length === 0 ? (
                    <div className="col-span-2 text-center py-6 text-gray-400 font-medium">Onay bekleyen oyun yok.</div>
                  ) : (
                    pendingGames.map(game => (
                      <div key={game.id} className="bg-orange-50 border-2 border-orange-100 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-orange-300 transition-colors">
                        <div>
                          <div className="font-black text-lg text-orange-800">{game.name}</div>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-200 px-2 py-0.5 rounded">{game.words?.length || 0} Kelime</span>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">@{game.ownerEmail?.split('@')[0]}</span>
                          </div>
                        </div>
                        <button onClick={() => handleOpenCat('custom', game)} className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-bold flex items-center gap-2 shadow-sm">
                          <Eye size={16} /> İncele
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3 bg-gray-50 p-4 rounded-xl border border-gray-200 flex-shrink-0">
                  <div className="flex items-center gap-3 w-full">
                    <button onClick={() => {setSelectedCat(null); setStatus(null); setConfirmDeleteCat(false); setSelectedWords([]);}} className="p-2 bg-white hover:bg-gray-100 rounded-full text-gray-600 shadow-sm transition-colors border border-gray-200 flex-shrink-0">
                      <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3">
                      <input 
                        value={editCatName} 
                        onChange={e => setEditCatName(e.target.value)} 
                        className="font-black text-2xl text-gray-800 bg-white border border-gray-300 px-3 py-1 rounded-lg focus:outline-none focus:border-purple-500 w-full md:w-auto"
                      />
                      <button onClick={handleRenameCat} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-1.5 rounded-lg font-bold text-sm transition-colors flex-shrink-0 whitespace-nowrap">İsmi Kaydet</button>
                    </div>
                  </div>
                  
                  {confirmDeleteCat ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap">Eminim, Sil</button>
                      <button onClick={() => setConfirmDeleteCat(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors">İptal</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteCat(true)} className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-1 flex-shrink-0 whitespace-nowrap border border-red-200">
                      <Trash2 size={16} /> Kategoriyi Sil
                    </button>
                  )}
                </div>

                {/* ÇOKLU SEÇİM ÜST BARI */}
                <div className="flex justify-between items-center bg-purple-50 border border-purple-100 p-3 rounded-xl mb-3 flex-shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-900 select-none">
                    <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="w-5 h-5 accent-purple-600 cursor-pointer" />
                    Tümünü Seç ({currentWordList.length})
                  </label>
                  {selectedWords.length > 0 && (
                    <button onClick={handleDeleteSelectedWords} className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                      <Trash2 size={16} /> Seçilenleri Sil ({selectedWords.length})
                    </button>
                  )}
                </div>

                <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar">
                  {currentWordList.map((w, idx) => (
                    <AdminWordRow 
                      key={idx} 
                      wordObj={w} 
                      isSelected={selectedWords.includes(idx)}
                      onToggleSelect={() => handleSelectWord(idx)}
                      onSave={(newObj) => handleSaveWord(idx, newObj)} 
                      onDelete={() => handleDeleteWord(idx)} 
                    />
                  ))}
                </div>

                {selectedCat.type === 'custom' && selectedCat.data.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3 flex-shrink-0">
                    <button onClick={() => handleApproveCustomGame(selectedCat.data.id)} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl shadow-[0_4px_0_rgb(21,128,61)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2">
                      <Check size={24} /> ONAYLA (HERKESE AÇ)
                    </button>
                    <button onClick={() => handleRejectCustomGame(selectedCat.data)} className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                      <Lock size={20} /> ÖZEL YAP (REDDET)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sekme 2: Direkt Kelime Ekle */}
        {activeTab === 'add' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Kategori Seçimi</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border-2 border-purple-100 bg-purple-50 rounded-xl p-3 font-bold text-purple-900 focus:border-purple-500 outline-none cursor-pointer">
                {Object.keys(wordDatabase).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">Anlatılacak Kelime</label>
              <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="Örn: BİSİKLET" className="w-full border-2 border-gray-200 rounded-xl p-3 font-black text-2xl text-gray-800 focus:border-purple-500 outline-none uppercase placeholder:text-gray-300 shadow-inner" />
            </div>

            <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
              <label className="block text-red-600 font-bold mb-3 flex items-center gap-2">
                <X size={18} /> Yasaklı Kelimeler (5 Adet)
              </label>
              <div className="space-y-2">
                {forbidden.map((fw, i) => (
                  <input 
                    key={i} 
                    value={fw} 
                    onChange={(e) => {
                      const newF = [...forbidden];
                      newF[i] = e.target.value;
                      setForbidden(newF);
                    }} 
                    placeholder={`${i + 1}. Yasaklı Kelime`} 
                    className="w-full border-2 border-red-200 bg-white rounded-xl p-3 font-bold text-gray-700 focus:border-red-500 outline-none capitalize shadow-sm" 
                  />
                ))}
              </div>
            </div>

            <button onClick={handleDirectSave} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xl py-4 rounded-xl shadow-[0_5px_0_rgb(67,56,202)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3 mt-4">
              <Save size={24} /> KAYDET
            </button>
          </div>
        )}

        {/* Sekme 3: Toplu Yükle */}
        {activeTab === 'import' && (
          <div className="space-y-6 animate-fade-in max-h-[60vh] overflow-y-auto pr-2">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <h3 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                <FileJson size={20} /> Nasıl Yüklenir?
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Yüzlerce kelimeyi tek seferde yüklemek için kelimelerinizi bir <strong>.json</strong> dosyası olarak hazırlayın. Dosyanızın içeriği aşağıdaki örnekteki gibi görünmelidir:
              </p>
              <pre className="bg-white p-4 rounded-xl text-xs font-mono text-gray-700 border border-blue-100 overflow-x-auto shadow-inner">
{`[
  {
    "category": "Genel",
    "word": "ASTRONOT",
    "forbidden": ["Uzay", "Gemi", "Yıldız", "Gezegen", "Roket"]
  },
  {
    "category": "Spor",
    "word": "HALTER",
    "forbidden": ["Ağırlık", "Kaldırmak", "Demir", "Kas", "Sporcu"]
  }
]`}
              </pre>
            </div>

            <div className="bg-purple-50 p-6 rounded-2xl border-2 border-dashed border-purple-300 flex flex-col items-center justify-center text-center">
              <Upload size={48} className="text-purple-400 mb-4" />
              <p className="font-bold text-purple-900 mb-2">JSON Dosyanızı Seçin</p>
              <p className="text-sm text-purple-600 mb-6 max-w-sm">
                Hazırladığınız .json uzantılı dosyayı seçin. Kelimeler otomatik olarak ayrıştırılıp ait oldukları kategorilere eklenecektir.
              </p>
              <label className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl cursor-pointer transition-colors shadow-md">
                <span>Dosya Seç ve Yükle</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl text-amber-700 text-sm border border-amber-200">
              <AlertTriangle size={24} className="flex-shrink-0" />
              <p>Mevcut kategorilere ait (Örn: "Genel", "Spor") kelimeler direkt içine eklenir. Eğer json dosyasında yeni bir kategori ismi yazarsanız, sistem o kategoriyi otomatik olarak oluşturur.</p>
            </div>
          </div>
        )}

        {/* Sekme 4: Öneriler */}
        {activeTab === 'review' && (
          <div className="animate-fade-in max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {suggestions.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-medium flex flex-col items-center">
                <CheckCircle2 size={48} className="mb-4 text-gray-300" />
                Şu an bekleyen hiçbir kelime önerisi yok.
              </div>
            ) : (
              suggestions.map(sugg => (
                <SuggestionItemRow 
                  key={sugg.id} 
                  suggestion={sugg} 
                  wordDatabase={wordDatabase}
                  onApprove={handleApproveSuggestion}
                  onReject={handleRejectSuggestion}
                />
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};

// Takım Kartı Bileşeni
const TeamSetupCard = ({ title, teamName, setTeamName, playerCount, setPlayerCount, theme = "orange", otherTeamName }) => {
  const [history, setHistory] = useState([teamName || "Takım"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [animClassRight, setAnimClassRight] = useState('scale-100');
  const [animClassLeft, setAnimClassLeft] = useState('scale-100');

  const themeColors = {
    orange: {
      text: 'text-orange-600',
      badgeBg: 'bg-gradient-to-r from-orange-400 to-orange-500',
      buttonGradient: 'bg-[radial-gradient(circle,white_30%,#fdba74_130%)]',
      buttonHover: 'hover:bg-[radial-gradient(circle,white_10%,#fb923c_120%)]',
      border: 'border-orange-200',
      focusBorder: 'focus:border-orange-400',
      divider: 'bg-orange-200',
      iconHover: 'hover:bg-orange-100 text-orange-500 hover:text-orange-600',
      glow: 'shadow-[0_0_20px_rgba(249,115,22,0.5)]'
    },
    turquoise: {
      text: 'text-teal-600',
      badgeBg: 'bg-gradient-to-r from-teal-400 to-teal-500',
      buttonGradient: 'bg-[radial-gradient(circle,white_30%,#5eead4_130%)]',
      buttonHover: 'hover:bg-[radial-gradient(circle,white_10%,#2dd4bf_120%)]',
      border: 'border-teal-200',
      focusBorder: 'focus:border-teal-400',
      divider: 'bg-teal-200',
      iconHover: 'hover:bg-teal-100 text-teal-500 hover:text-teal-600',
      glow: 'shadow-[0_0_20px_rgba(20,184,166,0.5)]'
    }
  };

  const colors = themeColors[theme];

  const generateName = () => {
    let newName = "";
    do {
      const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
      const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
      newName = `${adj} ${noun}`;
    } while (
      newName.toLowerCase() === (otherTeamName || "").toLowerCase() || 
      newName.toLowerCase() === (teamName || "").toLowerCase()
    );
    return newName;
  };

  const triggerAnim = (dir) => {
    playClickSound();
    if (dir === 'right') {
      setAnimClassRight(`scale-75 ${colors.glow}`);
      setTimeout(() => setAnimClassRight('scale-100'), 150);
    } else {
      setAnimClassLeft(`scale-75 ${colors.glow}`);
      setTimeout(() => setAnimClassLeft('scale-100'), 150);
    }
  };

  const handleRight = () => {
    triggerAnim('right');
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setTeamName(history[nextIndex]);
    } else {
      const newName = generateName();
      const newHistory = [...history, newName];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setTeamName(newName);
    }
  };

  const handleLeft = () => {
    if (historyIndex > 0) {
      triggerAnim('left');
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setTeamName(history[prevIndex]);
    }
  };

  const handlePlayerChange = (increment) => {
    playClickSound();
    const newValue = playerCount + increment;
    if (newValue >= 2 && newValue <= 10) {
      setPlayerCount(newValue);
    }
  };

  const isDuplicate = teamName.trim().toLowerCase() === (otherTeamName || "").trim().toLowerCase();

  return (
    <div className={`relative bg-white/95 backdrop-blur-md rounded-[2rem] p-6 pt-10 border-4 ${isDuplicate ? 'border-red-500' : colors.border} flex flex-col gap-5 shadow-2xl w-full max-w-md transition-all hover:-translate-y-1 hover:shadow-3xl`}>
      <div className={`absolute -top-5 left-1/2 -translate-x-1/2 px-8 py-2 rounded-full font-black text-white text-lg tracking-widest shadow-lg border-2 border-white/50 ${isDuplicate ? 'bg-red-500' : colors.badgeBg}`}>
        {title}
      </div>

      <div className="flex items-center justify-between space-x-3 w-full">
        <button 
          onClick={handleLeft}
          disabled={historyIndex === 0}
          className={`p-3 rounded-full transition-all duration-200 shadow-md flex-shrink-0 ${animClassLeft} 
            ${historyIndex === 0 
              ? 'bg-[radial-gradient(circle,white_40%,#e5e7eb_140%)] text-gray-400 cursor-not-allowed opacity-70' 
              : `${colors.text} ${colors.buttonGradient} ${colors.buttonHover}`}`}
        >
          <ChevronLeft size={28} />
        </button>
        
        <input 
          type="text" 
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className={`flex-1 min-w-0 text-center text-sm sm:text-base md:text-xl lg:text-2xl font-black py-3 px-1 rounded-2xl bg-transparent border-2 ${isDuplicate ? 'border-red-500 text-red-600 focus:border-red-600 focus:bg-red-50' : `border-transparent ${colors.focusBorder} ${colors.text}`} focus:bg-white focus:outline-none transition-colors truncate`}
          placeholder="Takım Adı"
        />
        
        <button 
          onClick={handleRight}
          className={`p-3 rounded-full flex-shrink-0 ${colors.text} ${colors.buttonGradient} ${colors.buttonHover} shadow-md transition-all duration-200 ${animClassRight}`}
        >
          <ChevronRight size={28} />
        </button>
      </div>

      <div className={`w-full h-px ${colors.divider} opacity-60 rounded-full`}></div>

      <div className="flex items-center justify-between px-2">
        <span className="text-gray-500 font-extrabold text-lg tracking-wide">
          Kişi Sayısı
        </span>
        
        <div className={`flex items-center gap-2 bg-gray-50/80 rounded-2xl p-1 border-2 ${colors.border}`}>
          <button 
            onClick={() => handlePlayerChange(-1)}
            disabled={playerCount <= 2}
            className={`p-2 rounded-xl transition-all ${playerCount <= 2 ? 'text-gray-300 cursor-not-allowed' : colors.iconHover}`}
          >
            <Minus size={22} strokeWidth={3} />
          </button>
          
          <span className={`font-black text-2xl w-8 text-center ${colors.text}`}>
            {playerCount}
          </span>
          
          <button 
            onClick={() => handlePlayerChange(1)}
            disabled={playerCount >= 10}
            className={`p-2 rounded-xl transition-all ${playerCount >= 10 ? 'text-gray-300 cursor-not-allowed' : colors.iconHover}`}
          >
            <Plus size={22} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ==========================================
   ANA UYGULAMA BİLEŞENİ (Deme.jsx)
============================================= */
export default function Deme() {
  const [user, setUser] = useState(null);
  const [wordDatabase, setWordDatabase] = useState(DEFAULT_WORD_DATABASE);
  const [suggestions, setSuggestions] = useState([]);
  
  // -- KULLANICILARIN OLUŞTURDUĞU OYUN LİSTELERİ --
  const [customPublicGames, setCustomPublicGames] = useState([]);
  const [customPrivateGames, setCustomPrivateGames] = useState([]);

  const [dbError, setDbError] = useState(""); 
  
  // Modals
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showMyGamesModal, setShowMyGamesModal] = useState(false);

  const [setupStep, setSetupStep] = useState(0); 

  // --- KAYDIRMA STATE'LERİ ---
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // --- OYUN STATE'LERİ ---
  const [team1Name, setTeam1Name] = useState("Kırmızı Ejderler");
  const [team2Name, setTeam2Name] = useState("Mavi Aslanlar");
  const [team1Players, setTeam1Players] = useState(2);
  const [team2Players, setTeam2Players] = useState(2);
  
  const [settings, setSettings] = useState({
    timeLimit: 60,
    penalty: 1,
    passLimit: 3,
    endType: 'rounds',
    endRoundsValue: 5,
    endScoreValue: 50,
  });

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [gameState, setGameState] = useState('setup'); 
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0); 
  const [scores, setScores] = useState([0, 0]);
  const [roundsPlayed, setRoundsPlayed] = useState([0, 0]); 
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [currentWord, setCurrentWord] = useState(null);
  const [usedWords, setUsedWords] = useState([]);
  const [turnStats, setTurnStats] = useState({ correct: 0, taboo: 0, pass: 0 });
  const [passesLeft, setPassesLeft] = useState(0);

  // --- KULLANICI GİRİŞİ (AUTH) STATE VE FONKSİYONLARI ---
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStatus, setAuthStatus] = useState(null);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthStatus({ type: 'info', msg: "İşlem yapılıyor..." });
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        setAuthStatus({ type: 'success', msg: "Başarıyla giriş yapıldı!" });
      } else {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        setAuthStatus({ type: 'success', msg: "Kayıt başarılı, giriş yapıldı!" });
      }
      setTimeout(() => {
        setShowAuthModal(false);
        setAuthStatus(null);
        setAuthEmail("");
        setAuthPassword("");
      }, 1500);
    } catch (error) {
      let errorMsg = "Bir hata oluştu.";
      if (error.code === 'auth/email-already-in-use') errorMsg = "Bu e-posta zaten kullanımda.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') errorMsg = "E-posta veya şifre hatalı.";
      if (error.code === 'auth/weak-password') errorMsg = "Şifre en az 6 karakter olmalıdır.";
      setAuthStatus({ type: 'error', msg: errorMsg });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // Auth Effect
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (isUsingUserFirebase) {
          await signInAnonymously(auth);
        } else {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            try {
              await signInWithCustomToken(auth, __initial_auth_token);
            } catch (tokenError) {
              console.warn("Özel token doğrulanamadı, anonim girişe geçiliyor...", tokenError);
              await signInAnonymously(auth);
            }
          } else {
            await signInAnonymously(auth);
          }
        }
      } catch (e) {
        console.error("Kimlik doğrulama hatası:", e);
        if (e.code === 'auth/operation-not-allowed' || e.code === 'auth/configuration-not-found') {
          setDbError("Firebase Auth Hatası: Lütfen Firebase Console'da 'Authentication' kısmından 'Anonymous' (Anonim) girişi aktif edin.");
        }
      }
    };
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Eğer kullanıcı yoksa (ilk açılışta veya çıkış yapıldığında), anonim giriş yap
      if (!currentUser) {
        initAuth();
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Firestore Sync Effect
  useEffect(() => {
    if (!user || !db) return;
    
    // Categories Fetch
    const wordsRef = collection(db, 'artifacts', appId, 'public', 'data', 'categories');
    const unsubWords = onSnapshot(wordsRef, (snapshot) => {
      setDbError(""); 
      if (snapshot.empty) {
        Object.keys(DEFAULT_WORD_DATABASE).forEach(cat => {
          setDoc(doc(wordsRef, cat), { words: DEFAULT_WORD_DATABASE[cat] })
            .catch(err => console.error("Tohumlama hatası:", err));
        });
      } else {
        const newDB = {};
        snapshot.forEach(document => {
          newDB[document.id] = document.data().words;
        });
        setWordDatabase(newDB);
      }
    }, (error) => {
      console.error("Firestore okuma hatası:", error);
      if (error.code === 'permission-denied' || error.message.includes('permission')) {
        setDbError("Veritabanı İzin Hatası: Lütfen Firebase Console'da veritabanınızı Test Moduna alın.");
      }
    });

    // Suggestions Fetch
    const suggsRef = collection(db, 'artifacts', appId, 'public', 'data', 'suggestions');
    const unsubSuggs = onSnapshot(suggsRef, (snapshot) => {
      const s = [];
      snapshot.forEach(d => s.push({ id: d.id, ...d.data() }));
      setSuggestions(s);
    }, (error) => console.error("Öneriler okuma hatası:", error));

    // Herkese Açık Kullanıcı Oyunları (Public Custom Games)
    const pubCustomRef = collection(db, 'artifacts', appId, 'public', 'data', 'customGames');
    const unsubPubCustom = onSnapshot(pubCustomRef, (snapshot) => {
      const arr = [];
      snapshot.forEach(d => arr.push({ id: d.id, ...d.data(), type: 'public' }));
      setCustomPublicGames(arr);
    }, (err) => {
      console.error("Oyunlar yüklenirken hata oluştu:", err);
    });

    // Sadece Bana Özel Kullanıcı Oyunları (Private Custom Games)
    let unsubPrivCustom = () => {};
    if (user && !user.isAnonymous) {
      const privCustomRef = collection(db, 'artifacts', appId, 'users', user.uid, 'customGames');
      unsubPrivCustom = onSnapshot(privCustomRef, (snapshot) => {
        const arr = [];
        snapshot.forEach(d => arr.push({ id: d.id, ...d.data(), type: 'private' }));
        setCustomPrivateGames(arr);
      });
    } else {
      setCustomPrivateGames([]); // Anonimken özel oyunları temizle
    }
    
    return () => { unsubWords(); unsubSuggs(); unsubPubCustom(); unsubPrivCustom(); };
  }, [user]);

  const nextStep = () => setSetupStep(prev => prev + 1);
  const prevStep = () => setSetupStep(prev => Math.max(0, prev - 1));

  // --- Kaydırma (Swipe) İşleyicileri ---
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && setupStep < 3) {
      if (setupStep === 1 && team1Name.trim().toLowerCase() === team2Name.trim().toLowerCase()) return;
      nextStep();
    }
    if (isRightSwipe && setupStep > 0) {
      prevStep();
    }
  };

  // Kategori ismini ve kelimelerini parametre olarak alıyoruz
  const startGameFlow = (catId, catName, catWords) => {
    setSelectedCategory({ id: catId, name: catName, words: catWords });
    setGameState('preGame');
    setCurrentTeamIndex(0);
    setScores([0, 0]);
    setRoundsPlayed([0, 0]);
    setUsedWords([]);
  };

  const startTurn = () => {
    setGameState('countdown');
    setCountdown(3);
  };

  useEffect(() => {
    let timer;
    if (gameState === 'countdown' && countdown > 0) {
      playTickSound(1500); 
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (gameState === 'countdown' && countdown === 0) {
      playCorrectSound(); 
      setGameState('playing');
      setTimeLeft(settings.timeLimit);
      setPassesLeft(settings.passLimit);
      setTurnStats({ correct: 0, taboo: 0, pass: 0 });
      pickNextWord();
    }
    return () => clearTimeout(timer);
  }, [gameState, countdown]);

  useEffect(() => {
    let mainTimer;
    let soundTimers = [];

    if (gameState === 'playing' && timeLeft > 0) {
      mainTimer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);

      if (timeLeft > 10) {
        playTickSound(1000); 
      } else if (timeLeft > 3 && timeLeft <= 10) {
        playTickSound(1200); 
        soundTimers.push(setTimeout(() => playTickSound(1200), 500));
      } else if (timeLeft <= 3) {
        playTickSound(1400); 
        soundTimers.push(setTimeout(() => playTickSound(1400), 333));
        soundTimers.push(setTimeout(() => playTickSound(1400), 666));
      }

    } else if (gameState === 'playing' && timeLeft === 0) {
      playTimeUpSound(); 
      endTurn();
    }

    return () => {
      clearTimeout(mainTimer);
      soundTimers.forEach(clearTimeout);
    };
  }, [gameState, timeLeft]);

  const pickNextWord = () => {
    // Hem resmi hem custom oyunlar bu mantıkla çalışır
    const categoryWords = selectedCategory?.words && selectedCategory.words.length > 0 
                            ? selectedCategory.words 
                            : wordDatabase["Genel"];
                            
    const availableWords = categoryWords.filter(w => !usedWords.includes(w.word));
    
    if (availableWords.length === 0) {
      setUsedWords([]);
      setCurrentWord(categoryWords[Math.floor(Math.random() * categoryWords.length)]);
    } else {
      const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
      setCurrentWord(randomWord);
      setUsedWords(prev => [...prev, randomWord.word]);
    }
  };

  const handleAction = (type) => {
    if (gameState !== 'playing') return;

    let pointsChange = 0;
    const newStats = { ...turnStats };

    if (type === 'correct') {
      playCorrectSound();
      pointsChange = 1;
      newStats.correct++;
      pickNextWord();
    } else if (type === 'taboo') {
      playTabooSound();
      pointsChange = -settings.penalty;
      newStats.taboo++;
      pickNextWord();
    } else if (type === 'pass') {
      if (passesLeft > 0 || settings.passLimit === 999) {
        playPassSound();
        newStats.pass++;
        if (settings.passLimit !== 999) setPassesLeft(prev => prev - 1);
        pickNextWord();
      } else {
        return; 
      }
    }

    setTurnStats(newStats);
    
    const newScores = [...scores];
    newScores[currentTeamIndex] += pointsChange;
    setScores(newScores);
  };

  const endTurn = () => {
    setGameState('turnSummary');
    const newRounds = [...roundsPlayed];
    newRounds[currentTeamIndex] += 1;
    setRoundsPlayed(newRounds);
  };

  const handleNextTurn = () => {
    let isGameOver = false;
    
    if (roundsPlayed[0] === roundsPlayed[1]) {
      if (settings.endType === 'rounds') {
        if (roundsPlayed[0] >= settings.endRoundsValue) isGameOver = true;
      } else if (settings.endType === 'score') {
        if (scores[0] >= settings.endScoreValue || scores[1] >= settings.endScoreValue) isGameOver = true;
      }
    }

    if (isGameOver) {
      setGameState('gameOver');
    } else {
      setCurrentTeamIndex(prev => (prev === 0 ? 1 : 0));
      setGameState('preGame');
    }
  };

  const returnToMainMenu = () => {
    setGameState('setup');
    setSetupStep(0);
  };

  // Render Modals
  if (showAdmin) {
    return <AdminModal onClose={() => setShowAdmin(false)} wordDatabase={wordDatabase} suggestions={suggestions} customPublicGames={customPublicGames} />;
  }
  
  if (showSuggestionModal) {
    return <SuggestionModal onClose={() => setShowSuggestionModal(false)} wordDatabase={wordDatabase} user={user} />;
  }

  // --- OYUNLARIM BÖLÜMÜNÜN FİLTRELENMESİ ---
  const myGames = [...customPublicGames, ...customPrivateGames].filter(g => g.ownerId === user?.uid);

  if (showMyGamesModal) {
    return <MyGamesModal onClose={() => setShowMyGamesModal(false)} user={user} myGames={myGames} />;
  }

  if (showAuthModal) {
    return (
      <div className="fixed inset-0 w-full h-screen bg-gray-900/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative border-4 border-purple-200">
          <button onClick={() => {setShowAuthModal(false); setAuthStatus(null);}} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors">
            <X size={32} />
          </button>
          
          <h2 className="text-3xl font-black text-purple-900 mb-6 flex items-center gap-3">
            {isLoginMode ? <LogIn className="text-purple-500" size={36} /> : <UserPlus className="text-purple-500" size={36} />}
            {isLoginMode ? "Giriş Yap" : "Kayıt Ol"}
          </h2>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1 font-bold">E-posta</label>
              <input 
                type="email" 
                required
                value={authEmail} 
                onChange={(e) => setAuthEmail(e.target.value)} 
                className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold text-gray-800 focus:border-purple-500 outline-none shadow-inner" 
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1 font-bold">Şifre</label>
              <input 
                type="password" 
                required
                minLength="6"
                value={authPassword} 
                onChange={(e) => setAuthPassword(e.target.value)} 
                className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold text-gray-800 focus:border-purple-500 outline-none shadow-inner" 
              />
            </div>
            
            {authStatus && (
              <div className={`p-3 rounded-xl font-bold flex items-center gap-2 ${authStatus.type === 'success' ? 'bg-green-100 text-green-700 border-green-200' : authStatus.type === 'info' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-red-100 text-red-700 border-red-200'} border`}>
                {authStatus.type === 'success' ? <Check size={20} /> : <Info size={20} />}
                {authStatus.msg}
              </div>
            )}

            <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xl py-4 rounded-xl shadow-[0_5px_0_rgb(67,56,202)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3 mt-2">
              {isLoginMode ? "GİRİŞ YAP" : "KAYIT OL"}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-gray-100 pt-4">
            <p className="text-gray-500 text-sm font-bold">
              {isLoginMode ? "Hesabınız yok mu?" : "Zaten bir hesabınız var mı?"}
            </p>
            <button 
              type="button"
              onClick={() => { setIsLoginMode(!isLoginMode); setAuthStatus(null); }}
              className="text-purple-600 hover:text-purple-800 font-black mt-1 transition-colors"
            >
              {isLoginMode ? "Yeni Hesap Oluştur" : "Mevcut Hesaba Giriş Yap"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================
     RENDER BÖLÜMÜ - KURULUM AKIŞI (SLIDER)
  ============================================= */
  
  // Sadece onaylanmış public oyunlar (ya da kendi eklediği pending/approved public oyunlar) ve kendi private oyunları listelenir
  const visiblePublicGames = customPublicGames.filter(g => g.status === 'approved' || g.ownerId === user?.uid);
  const customCategoriesList = [...visiblePublicGames, ...customPrivateGames];

  if (gameState === 'setup') {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden font-sans flex flex-col">
        <div 
          className="flex-1 flex transition-transform duration-700 ease-in-out w-full h-full"
          style={{ transform: `translateX(-${setupStep * 100}%)` }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* STEP 0: ANA EKRAN */}
          <div className="min-w-full h-full flex flex-col items-center justify-center p-6 relative">
            <div className="bg-white/20 p-8 rounded-[3rem] backdrop-blur-sm border border-white/30 shadow-2xl flex flex-col items-center">
              
              <img 
                src="/logo.png" 
                alt="Oyun Logosu" 
                className="w-full max-w-[280px] md:max-w-[400px] h-auto mb-4 drop-shadow-2xl hover:scale-105 transition-transform duration-300"
              />
              
              <div className="w-32 h-[2px] bg-white/30 mb-3 rounded-full"></div>
              
              <p className="text-white/90 text-lg md:text-xl mb-3 text-center max-w-md font-medium">
                Yasaklı kelimeleri kullanmadan takım arkadaşlarına kelimeyi anlat!
              </p>

              <div className="w-32 h-[2px] bg-white/30 mb-8 rounded-full"></div>
              
              <div className="flex flex-col items-center gap-4 w-full">
                {dbError && (
                  <div className="bg-red-500/90 text-white p-4 rounded-xl shadow-lg border-2 border-red-300 text-sm max-w-md text-center mb-2 animate-pulse flex flex-col items-center gap-2">
                    <Info size={24} />
                    <p className="font-bold">{dbError}</p>
                  </div>
                )}

                <button 
                  onClick={nextStep}
                  className="group relative px-12 py-6 bg-yellow-400 hover:bg-yellow-300 text-purple-900 text-3xl font-bold rounded-full shadow-[0_10px_0_rgb(202,138,4)] hover:shadow-[0_5px_0_rgb(202,138,4)] hover:translate-y-1 transition-all flex items-center gap-4 mb-2"
                >
                  <Play fill="currentColor" size={32} />
                  OYNA
                </button>

                <div className="flex flex-col items-center gap-4 mt-2 w-full max-w-[320px]">
                  {(!user || user.isAnonymous) ? (
                    <div className="flex items-center justify-center gap-2 w-full">
                      <button
                        onClick={() => { setShowAuthModal(true); setIsLoginMode(true); }}
                        className="flex-1 px-4 py-3.5 bg-white text-purple-700 font-bold rounded-xl shadow-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 hover:scale-105 whitespace-nowrap text-sm sm:text-base"
                      >
                        <User size={20} /> Giriş Yap / Kayıt Ol
                      </button>
                      
                      <button
                        onClick={() => setShowAdmin(true)}
                        className="p-3.5 bg-transparent hover:bg-white/10 text-white/80 hover:text-white rounded-xl transition-colors flex items-center justify-center border border-white/30 shadow-sm hover:scale-105 flex-shrink-0"
                        title="Yönetici Girişi"
                      >
                        <Lock size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-center items-center gap-3">
                      <button
                        onClick={() => setShowSuggestionModal(true)}
                        className="px-5 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 hover:scale-105 border border-white/30"
                      >
                        <MessageSquarePlus size={18} />
                        Kelime Öner
                      </button>

                      <button
                        onClick={() => setShowMyGamesModal(true)}
                        className="px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:translate-y-[-2px] transition-all flex items-center gap-2"
                      >
                        <Gamepad2 size={18} />
                        Oyunlarım
                      </button>

                      <button
                        onClick={handleLogout}
                        className="p-3 bg-red-500/80 hover:bg-red-500 text-white rounded-xl transition-all shadow-md hover:scale-105 border border-red-400/50"
                        title="Çıkış Yap"
                      >
                        <LogOut size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 1: TAKIM ADLARI */}
          <div className="min-w-full h-full flex flex-col items-center justify-start p-4 pt-16 md:p-6 md:pt-24 pb-20 relative overflow-y-auto">
            <div className="absolute top-4 left-4 md:top-8 md:left-8 z-10">
              <button onClick={prevStep} className="text-white/80 hover:text-white flex items-center text-lg font-bold">
                <ChevronLeft size={24} /> Geri
              </button>
            </div>
            
            {/* ORTAK BAŞLIK */}
            <div className="bg-white/20 backdrop-blur-md px-6 md:px-10 py-2 md:py-4 rounded-2xl border border-white/30 shadow-lg mb-6 md:mb-10 flex-shrink-0">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-wide text-center">Takımları Belirle</h2>
            </div>
            
            <div className="w-full max-w-md flex flex-col gap-6 md:gap-12 mt-2 flex-shrink-0">
              <TeamSetupCard 
                title="1. TAKIM" teamName={team1Name} setTeamName={setTeam1Name}
                playerCount={team1Players} setPlayerCount={setTeam1Players}
                theme="orange" otherTeamName={team2Name}
              />
              
              <TeamSetupCard 
                title="2. TAKIM" teamName={team2Name} setTeamName={setTeam2Name}
                playerCount={team2Players} setPlayerCount={setTeam2Players}
                theme="turquoise" otherTeamName={team1Name}
              />
            </div>
            
            {/* Hata Mesajı veya İleri Butonu */}
            {team1Name.trim().toLowerCase() === team2Name.trim().toLowerCase() ? (
              <div className="mt-8 bg-red-500/90 text-white px-6 py-3 rounded-full font-bold shadow-lg backdrop-blur-sm animate-bounce flex items-center gap-2 border-2 border-white/50 flex-shrink-0">
                <Info size={20} /> Takım isimleri birbirinden farklı olmalıdır!
              </div>
            ) : (
              <button 
                onClick={nextStep}
                className="mt-6 px-6 py-2 bg-white text-purple-700 hover:bg-gray-100 rounded-full font-bold text-base flex items-center gap-2 transition-all shadow-md hover:scale-105 hover:shadow-lg flex-shrink-0"
              >
                İLERİ <ArrowRight size={18} strokeWidth={3} />
              </button>
            )}
          </div>

          {/* STEP 2: AYARLAR */}
          <div className="min-w-full h-full flex flex-col items-center justify-start p-4 pt-24 pb-24 md:p-6 md:pt-24 md:pb-24 relative overflow-y-auto">
            <div className="absolute top-8 left-8 z-10">
              <button onClick={prevStep} className="text-white/80 hover:text-white flex items-center text-lg font-bold">
                <ChevronLeft size={24} /> Geri
              </button>
            </div>
            
            {/* ORTAK BAŞLIK */}
            <div className="bg-white/20 backdrop-blur-md px-6 md:px-10 py-3 md:py-4 rounded-2xl border border-white/30 shadow-lg mb-8 flex-shrink-0 flex items-center justify-center gap-3">
              <Settings className="text-white" size={32} />
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-wide text-center">Oyun Ayarları</h2>
            </div>
            
            <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-3xl shadow-2xl flex-shrink-0">

              <div className="space-y-8">
                <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 shadow-sm">
                  <label className="block text-lg font-bold text-purple-900 mb-3">Anlatma Süresi (Saniye)</label>
                  <div className="flex flex-wrap gap-2">
                    {[15, 30, 45, 60, 75, 90, 105, 120].map(val => (
                      <button
                        key={val} onClick={() => setSettings({...settings, timeLimit: val})}
                        className={`px-4 py-2 rounded-xl font-bold transition-all ${settings.timeLimit === val ? 'bg-purple-600 text-white shadow-lg scale-105' : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-100 shadow-sm'}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm">
                    <label className="block text-lg font-bold text-red-900 mb-3">Dedim Cezası</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map(val => (
                        <button
                          key={val} onClick={() => setSettings({...settings, penalty: val})}
                          className={`flex-1 py-3 rounded-xl font-bold transition-all ${settings.penalty === val ? 'bg-red-500 text-white shadow-lg scale-105' : 'bg-white text-red-600 border border-red-200 hover:bg-red-100 shadow-sm'}`}
                        >
                          -{val}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 shadow-sm">
                    <label className="block text-lg font-bold text-amber-900 mb-3">Pas Hakkı</label>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 999].map(val => (
                        <button
                          key={val} onClick={() => setSettings({...settings, passLimit: val})}
                          className={`px-3 py-3 flex-1 rounded-xl font-bold transition-all ${settings.passLimit === val ? 'bg-yellow-400 text-gray-900 shadow-lg scale-105' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-100 shadow-sm'}`}
                        >
                          {val === 999 ? 'Limitsiz' : val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <label className="block text-xl font-bold text-gray-800 mb-4">Oyun Nasıl Biter?</label>
                  
                  <div className="space-y-4">
                    <label className={`flex items-start md:items-center gap-3 md:gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all ${settings.endType === 'rounds' ? 'border-purple-500 bg-purple-50' : 'border-transparent bg-white shadow-sm'}`}>
                      <input 
                        type="radio" name="endType" checked={settings.endType === 'rounds'}
                        onChange={() => setSettings({...settings, endType: 'rounds'})}
                        className="w-5 h-5 text-purple-600 mt-1 md:mt-0 flex-shrink-0"
                      />
                      <div className="flex-1 flex flex-wrap items-center gap-x-2 gap-y-2 text-base md:text-lg">
                        <span className="font-semibold text-gray-700 whitespace-nowrap">Her oyuncu</span>
                        <select 
                          disabled={settings.endType !== 'rounds'}
                          value={settings.endRoundsValue}
                          onChange={(e) => setSettings({...settings, endRoundsValue: parseInt(e.target.value)})}
                          className="bg-white border rounded-lg px-2 py-1 font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                        >
                          {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span className="font-semibold text-gray-700 whitespace-nowrap">kez anlattığında.</span>
                      </div>
                    </label>

                    <label className={`flex items-start md:items-center gap-3 md:gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all ${settings.endType === 'score' ? 'border-purple-500 bg-purple-50' : 'border-transparent bg-white shadow-sm'}`}>
                      <input 
                        type="radio" name="endType" checked={settings.endType === 'score'}
                        onChange={() => setSettings({...settings, endType: 'score'})}
                        className="w-5 h-5 text-purple-600 mt-1 md:mt-0 flex-shrink-0"
                      />
                      <div className="flex-1 flex flex-wrap items-center gap-x-2 gap-y-2 text-base md:text-lg">
                        <span className="font-semibold text-gray-700 whitespace-nowrap">Toplam skor</span>
                        <select 
                          disabled={settings.endType !== 'score'}
                          value={settings.endScoreValue}
                          onChange={(e) => setSettings({...settings, endScoreValue: parseInt(e.target.value)})}
                          className="bg-white border rounded-lg px-2 py-1 font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                        >
                          {Array.from({length: 20}, (_, i) => (i+1)*5).map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span className="font-semibold text-gray-700 whitespace-nowrap">olduğunda.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={nextStep}
              className="mt-6 mb-8 px-6 py-2 bg-white text-purple-700 hover:bg-gray-100 rounded-full font-bold text-base flex items-center gap-2 transition-all shadow-md hover:scale-105 hover:shadow-lg flex-shrink-0"
            >
              İLERİ <ArrowRight size={18} strokeWidth={3} />
            </button>
          </div>
          {/* STEP 4: KATEGORİ SEÇİMİ */}
          <div className="min-w-full h-full flex flex-col items-center justify-start p-4 pt-16 md:p-6 md:pt-24 pb-20 relative overflow-y-auto">
            <div className="absolute top-4 left-4 md:top-8 md:left-8 z-10">
              <button onClick={prevStep} className="text-white/80 hover:text-white flex items-center text-lg font-bold">
                <ChevronLeft size={24} /> Geri
              </button>
            </div>
            
            {/* ORTAK BAŞLIK */}
            <div className="bg-white/20 backdrop-blur-md px-6 md:px-10 py-2 md:py-4 rounded-2xl border border-white/30 shadow-lg mb-6 md:mb-10 flex-shrink-0">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-wide text-center">Kategori Seç</h2>
            </div>
            
            <div className="w-full max-w-5xl px-4 flex flex-col items-center">
              
              {/* RESMİ OYUNLAR */}
              <div className="w-full mb-12">
                <div className="flex items-center gap-3 mb-6 border-b border-white/20 pb-3">
                  <Database className="text-yellow-400" size={28} />
                  <h3 className="text-2xl md:text-3xl font-bold text-white/90 text-left">Resmi Kategoriler</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                  {Object.keys(wordDatabase).map((catName) => {
                    const defaultCat = CATEGORY_LIST.find(c => c.name === catName);
                    const Icon = defaultCat ? defaultCat.icon : Database;
                    const color = defaultCat ? defaultCat.color : "text-blue-500";
                    const gradient = defaultCat ? defaultCat.gradient : "from-blue-100 to-blue-200";

                    return (
                      <button
                        key={catName} onClick={() => startGameFlow(catName, catName, wordDatabase[catName] || [])}
                        className="relative overflow-hidden bg-white/95 backdrop-blur-sm text-gray-800 rounded-[2.5rem] p-8 md:p-10 flex flex-col items-center justify-center gap-6 shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:-translate-y-3 transition-all duration-300 group border-4 border-white/40"
                      >
                        <Icon className={`absolute -bottom-8 -right-8 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-500 ${color}`} size={180} />
                        <div className={`w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br ${gradient} rounded-[2rem] flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-inner relative z-10 border-4 border-white`}>
                          <Icon className={`${color} drop-shadow-md`} size={48} strokeWidth={2.5} />
                        </div>
                        <span className="text-2xl md:text-3xl font-black tracking-wide relative z-10">{catName}</span>
                        
                        <span className="absolute top-4 right-4 bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full shadow-inner border border-gray-200">
                          {wordDatabase[catName] ? wordDatabase[catName].length : 0} Kelime
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ÜYELERDEN VE OYUNLARIM */}
              {customCategoriesList.length > 0 && (
                <div className="w-full">
                  <div className="flex items-center gap-3 mb-6 border-b border-white/20 pb-3">
                    <Users className="text-blue-300" size={28} />
                    <h3 className="text-2xl md:text-3xl font-bold text-white/90 text-left">Üyelerden & Oyunlarım</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                    {customCategoriesList.map((custom) => (
                      <button
                        key={custom.id} onClick={() => startGameFlow(custom.id, custom.name, custom.words)}
                        className="relative overflow-hidden bg-white/95 backdrop-blur-sm text-gray-800 rounded-[2.5rem] p-6 md:p-8 flex flex-col items-center justify-center gap-4 shadow-[0_10px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] hover:-translate-y-2 transition-all duration-300 group border-4 border-white/40"
                      >
                        <div className={`w-20 h-20 bg-gradient-to-br ${custom.type === 'private' ? 'from-purple-100 to-purple-200' : 'from-blue-100 to-blue-200'} rounded-3xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-inner border-2 border-white`}>
                          {custom.type === 'private' ? <Lock className="text-purple-500 drop-shadow-md" size={36} /> : <Gamepad2 className="text-blue-500 drop-shadow-md" size={36} />}
                        </div>
                        <span className="text-xl md:text-2xl font-black tracking-wide text-center leading-tight mt-2">{custom.name}</span>
                        
                        <div className="flex flex-col items-center gap-1 mt-1">
                          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                            {custom.words?.length || 0} Kelime
                          </span>
                          {custom.type === 'public' && custom.ownerEmail && (
                            <span className="text-[11px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              @{custom.ownerEmail.split('@')[0]}
                            </span>
                          )}
                          {custom.type === 'private' && (
                            <span className="text-[11px] font-bold text-purple-500 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                              Bana Özel
                            </span>
                          )}
                          {custom.type === 'public' && custom.status === 'pending' && (
                            <span className="text-[11px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 mt-1">
                              Onay Bekliyor
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================
     RENDER BÖLÜMÜ - OYUN EKRANLARI
  ============================================= */
  
  const currentTeamName = currentTeamIndex === 0 ? team1Name : team2Name;

  if (gameState === 'preGame') {
    return (
      <div className="w-full h-screen bg-blue-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8">
          <p className="text-2xl text-blue-300 font-bold mb-2">Sıra şu takımda:</p>
          <h1 className="text-6xl font-black text-yellow-400 drop-shadow-lg">{currentTeamName}</h1>
        </div>
        
        <div className="flex gap-12 mb-16 opacity-80">
          <div>
            <p className="text-sm uppercase tracking-wider">{team1Name}</p>
            <p className="text-3xl font-bold">{scores[0]} Puan</p>
          </div>
          <div className="w-px bg-white/20"></div>
          <div>
            <p className="text-sm uppercase tracking-wider">{team2Name}</p>
            <p className="text-3xl font-bold">{scores[1]} Puan</p>
          </div>
        </div>

        <button 
          onClick={startTurn}
          className="px-16 py-6 bg-green-500 hover:bg-green-400 text-white text-4xl font-bold rounded-full shadow-[0_10px_0_rgb(22,163,74)] hover:shadow-[0_5px_0_rgb(22,163,74)] hover:translate-y-1 transition-all"
        >
          HAZIRIZ, BAŞLA!
        </button>
      </div>
    );
  }

  if (gameState === 'countdown') {
    return (
      <div className="w-full h-screen bg-purple-600 text-white flex items-center justify-center">
        <h1 className="text-[15rem] font-black animate-ping">{countdown}</h1>
      </div>
    );
  }

  if (gameState === 'playing' && currentWord) {
    return (
      <div className="w-full h-screen bg-gray-50 flex flex-col font-sans">
        <div className="bg-white shadow-sm p-4 flex justify-between items-center px-4 md:px-6 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-lg md:text-xl">
              {timeLeft}
            </div>
            <span className="font-bold text-gray-500 hidden md:block">Saniye Kaldı</span>
          </div>
          <div className="text-lg md:text-xl font-black text-purple-900 truncate px-2">
            {currentTeamName} Oynuyor
          </div>
          <div className="flex gap-2 md:gap-4 font-bold text-gray-500 text-sm md:text-base items-center">
            <div className="flex flex-col md:flex-row items-center md:gap-1"><span>Doğru:</span> <span className="text-green-600">{turnStats.correct}</span></div>
            <div className="flex flex-col md:flex-row items-center md:gap-1"><span>Dedim:</span> <span className="text-red-500">{turnStats.taboo}</span></div>
            <button onClick={() => setGameState('gameOver')} className="ml-1 md:ml-3 p-1.5 md:p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors" title="Oyunu Sonlandır">
              <LogOut size={20} className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-3 md:p-8 overflow-hidden">
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border-4 md:border-8 border-yellow-400 flex flex-col flex-1 max-h-[65vh] md:h-[60vh] md:min-h-[400px]">
            <div className="bg-yellow-400 text-center py-4 md:py-8 px-4 flex-shrink-0">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-wide">
                {currentWord.word}
              </h2>
            </div>
            
            <div className="flex-1 bg-white p-4 md:p-10 flex flex-col justify-center gap-3 md:gap-6 items-center overflow-y-auto">
              {currentWord.forbidden.map((word, index) => (
                <div key={index} className="w-full flex items-center justify-center relative">
                  <div className="absolute left-0 right-0 h-px bg-gray-200"></div>
                  <span className="relative bg-white px-4 md:px-6 text-xl md:text-3xl font-bold text-gray-700 capitalize">
                    {word}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-3 md:p-6 border-t shadow-[0_-10px_20px_rgba(0,0,0,0.05)] flex justify-center gap-2 md:gap-8 flex-shrink-0">
          <button 
            onClick={() => handleAction('taboo')}
            className="flex-1 max-w-xs py-3 md:py-6 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-2xl md:rounded-3xl font-black text-lg md:text-3xl shadow-[0_6px_0_rgb(185,28,28)] md:shadow-[0_8px_0_rgb(185,28,28)] active:shadow-none active:translate-y-2 transition-all flex flex-col items-center gap-1 md:gap-2"
          >
            <X size={28} className="md:w-9 md:h-9" /> <span className="md:hidden">DEDİM (-{settings.penalty})</span><span className="hidden md:inline">DEDİM (-{settings.penalty})</span>
          </button>
          
          <button 
            onClick={() => handleAction('pass')}
            className={`flex-1 max-w-[90px] md:max-w-[120px] py-3 md:py-6 rounded-2xl md:rounded-3xl font-black text-base md:text-xl flex flex-col items-center justify-center gap-1 md:gap-2 transition-all ${passesLeft > 0 || settings.passLimit === 999 ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-[0_6px_0_rgb(202,138,4)] md:shadow-[0_8px_0_rgb(202,138,4)] active:shadow-none active:translate-y-2' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            <SkipForward size={24} className="md:w-8 md:h-8" /> <span className="text-xs md:text-base">PAS ({settings.passLimit === 999 ? '∞' : passesLeft})</span>
          </button>

          <button 
            onClick={() => handleAction('correct')}
            className="flex-1 max-w-xs py-3 md:py-6 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-2xl md:rounded-3xl font-black text-lg md:text-3xl shadow-[0_6px_0_rgb(21,128,61)] md:shadow-[0_8px_0_rgb(21,128,61)] active:shadow-none active:translate-y-2 transition-all flex flex-col items-center gap-1 md:gap-2"
          >
            <Check size={28} className="md:w-9 md:h-9" /> <span className="md:hidden">DOĞRU (+1)</span><span className="hidden md:inline">DOĞRU (+1)</span>
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'turnSummary') {
    return (
      <div className="w-full h-screen bg-indigo-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-5xl font-black mb-2 text-yellow-400">Süre Doldu!</h1>
        <p className="text-2xl mb-12 opacity-90">{currentTeamName} takımının tur özeti</p>

        <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-md mb-12 w-full max-w-md">
          <div className="flex justify-between items-center mb-6 text-2xl">
            <span className="font-bold flex items-center gap-2"><Check className="text-green-400"/> Doğru:</span>
            <span className="font-black text-green-400">+{turnStats.correct} Puan</span>
          </div>
          <div className="flex justify-between items-center mb-6 text-2xl">
            <span className="font-bold flex items-center gap-2"><X className="text-red-400"/> Dedim:</span>
            <span className="font-black text-red-400">-{turnStats.taboo * settings.penalty} Puan</span>
          </div>
          <div className="w-full h-px bg-white/20 mb-6"></div>
          <div className="flex justify-between items-center text-3xl">
            <span className="font-black">Bu Tur Kazanılan:</span>
            <span className="font-black text-yellow-400">{turnStats.correct - (turnStats.taboo * settings.penalty)} Puan</span>
          </div>
        </div>

        <button 
          onClick={handleNextTurn}
          className="px-12 py-5 bg-white text-indigo-900 text-2xl font-bold rounded-full shadow-xl hover:scale-105 transition-transform flex items-center gap-3"
        >
          Devam Et <ArrowRight />
        </button>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    const isTie = scores[0] === scores[1];
    const winnerName = scores[0] > scores[1] ? team1Name : team2Name;

    return (
      <div className="w-full h-screen bg-gradient-to-t from-yellow-600 via-yellow-500 to-orange-500 flex flex-col items-center justify-center p-6 text-center text-white">
        <Trophy size={100} className="mb-6 drop-shadow-2xl text-yellow-100 animate-bounce" />
        
        <h1 className="text-6xl md:text-8xl font-black mb-4 drop-shadow-lg">
          {isTie ? "BERABERE!" : "KAZANAN"}
        </h1>
        
        {!isTie && (
          <h2 className="text-5xl md:text-6xl font-bold text-yellow-100 mb-12 drop-shadow-md">
            {winnerName}
          </h2>
        )}

        <div className="bg-white/20 p-8 rounded-3xl backdrop-blur-md mb-12 flex gap-12 text-3xl">
          <div className={`flex flex-col items-center ${scores[0] > scores[1] ? 'font-black scale-110' : 'opacity-80'}`}>
            <span className="text-sm uppercase tracking-widest mb-2">{team1Name}</span>
            <span>{scores[0]}</span>
          </div>
          <div className="w-1 bg-white/30 rounded-full"></div>
          <div className={`flex flex-col items-center ${scores[1] > scores[0] ? 'font-black scale-110' : 'opacity-80'}`}>
            <span className="text-sm uppercase tracking-widest mb-2">{team2Name}</span>
            <span>{scores[1]}</span>
          </div>
        </div>

        <button 
          onClick={returnToMainMenu}
          className="px-10 py-5 bg-white text-orange-600 hover:bg-orange-50 text-2xl font-bold rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center gap-3"
        >
          <RotateCcw /> Ana Menüye Dön
        </button>
      </div>
    );
  }

  return null;
}