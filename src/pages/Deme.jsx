import React, { useState, useEffect, useRef } from 'react';
import { Play, ChevronRight, ChevronLeft, ArrowRight, Settings, Check, X, SkipForward, Info, Trophy, RotateCcw, Minus, Plus, Globe, Medal, Film, Cpu, Landmark, Smile, Database, Save, Lock, MessageSquarePlus, CheckCircle2, ListTodo, Trash2, Edit3 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, addDoc, deleteDoc } from 'firebase/firestore';

// ==========================================
// 🔴 FIREBASE AYARLARI BURAYA GELECEK 🔴
// Aşağıdaki firebaseConfig nesnesinin içini kendi Firebase projenizden aldığınız bilgilerle doldurun.
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
  // 1. Durum: Kullanıcı kendi API anahtarını kullanıyorsa
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "SİZİN_API_KEY" && firebaseConfig.projectId === "egiticioyuntr") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    appId = "deme-oyunu-v1"; // Kendi veritabanı klasörünüz
    isUsingUserFirebase = true;
  } 
  // 2. Durum: Canvas ortamındaysa
  else if (typeof __firebase_config !== 'undefined') {
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
  "Çocuk modu": [
    { word: "KÖPEK", forbidden: ["Havlamak", "Kemik", "Hayvan", "Kedi", "Evcil"] },
    { word: "ELMA", forbidden: ["Meyve", "Kırmızı", "Ağaç", "Yemek", "Tatlı"] },
    { word: "GÜNEŞ", forbidden: ["Sıcak", "Gökyüzü", "Sarı", "Yaz", "Işık"] }
  ]
};

// Rastgele isim oluşturucu sözlükler
const ADJECTIVES = ["Cesur", "Uçan", "Gizemli", "Hızlı", "Zeki", "Korkusuz", "Muhteşem", "Çılgın", "Efsanevi", "Yenilmez", "Kızgın", "Süper", "Görünmez", "Komik"];
const NOUNS = ["Aslanlar", "Kartallar", "Ejderhalar", "Kaplanlar", "Büyücüler", "Savaşçılar", "Dahiler", "Ninjalar", "Korsanlar", "Şövalyeler", "Robotlar", "Zombiler"];

// --- KATEGORİ GÖRSELLERİ VE RENKLERİ ---
const CATEGORY_LIST = [
  { name: "Genel", icon: Globe, color: "text-blue-500", gradient: "from-blue-100 to-blue-200" },
  { name: "Spor", icon: Medal, color: "text-orange-500", gradient: "from-orange-100 to-orange-200" },
  { name: "Sinema", icon: Film, color: "text-purple-500", gradient: "from-purple-100 to-purple-200" },
  { name: "Teknoloji", icon: Cpu, color: "text-slate-700", gradient: "from-slate-100 to-slate-200" },
  { name: "Tarih", icon: Landmark, color: "text-amber-700", gradient: "from-amber-100 to-amber-200" },
  { name: "Çocuk modu", icon: Smile, color: "text-pink-500", gradient: "from-pink-100 to-pink-200" }
];

// --- SES EFEKTLERİ SİSTEMİ ---
const getAudioCtx = () => {
  if (!window.audioCtx) {
    window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (window.audioCtx.state === 'suspended') {
    window.audioCtx.resume();
  }
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

// --- Kullanıcı Kelime Öneri Modalı ---
const SuggestionModal = ({ onClose, wordDatabase }) => {
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
        timestamp: Date.now()
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

// --- Yönetici Paneli Öneri Satırı Bileşeni ---
const SuggestionItemRow = ({ suggestion, wordDatabase, onApprove, onReject }) => {
  const [word, setWord] = useState(suggestion.word || "");
  const [forbidden, setForbidden] = useState(suggestion.forbidden || []);
  const [cat, setCat] = useState(suggestion.category || "Genel");

  return (
    <div className="bg-purple-50 rounded-2xl p-4 border-2 border-purple-100 mb-4 shadow-sm">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <label className="text-xs font-bold text-purple-600 uppercase mb-1 block">Kategori</label>
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

// Admin (Kelime Ekleme ve Öneriler) Modal Bileşeni
const AdminModal = ({ onClose, wordDatabase, suggestions }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('add'); // 'add' | 'review'

  // Add Word States
  const [category, setCategory] = useState("Genel");
  const [word, setWord] = useState("");
  const [forbidden, setForbidden] = useState(["", "", "", "", ""]);

  const handleLogin = () => {
    // YÖNETİCİ ŞİFRESİ BURADAN DEĞİŞTİRİLEBİLİR
    if (password === "admin123") {
      setIsAuthenticated(true);
      setStatus(null);
    } else {
      setStatus({ type: 'error', msg: "Hatalı şifre girdiniz!" });
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
      
      // Kategoriye ekle
      const catRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), catName.trim());
      await setDoc(catRef, { words: [...currentWords, newWordObj] });
      
      // Öneriden sil
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
              <div className="p-3 rounded-xl font-bold flex items-center gap-2 bg-red-100 text-red-700 border border-red-200">
                <Info size={20} />
                {status.msg}
              </div>
            )}

            <button onClick={handleLogin} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xl py-4 rounded-xl shadow-[0_5px_0_rgb(67,56,202)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3 mt-4">
              GİRİŞ YAP
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-screen bg-gray-900/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-2xl shadow-2xl relative border-4 border-purple-200 my-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors z-10">
          <X size={32} />
        </button>
        
        <h2 className="text-3xl font-black text-purple-900 mb-6 flex items-center gap-3">
          <Database className="text-purple-500" size={36} />
          Yönetici Paneli
        </h2>

        {/* Sekmeler (Tabs) */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'add' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <Edit3 size={18} /> Kelime Ekle
          </button>
          <button 
            onClick={() => setActiveTab('review')}
            className={`flex-1 py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'review' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <ListTodo size={18} /> Önerileri İncele 
            {suggestions.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{suggestions.length}</span>}
          </button>
        </div>

        {status && (
          <div className={`p-4 rounded-xl font-bold flex items-center gap-2 mb-4 ${status.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
            {status.type === 'success' ? <Check size={20} /> : <Info size={20} />}
            {status.msg}
          </div>
        )}

        {/* Sekme 1: Direkt Kelime Ekle */}
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
              <label className="text-red-600 font-bold mb-3 flex items-center gap-2">
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

        {/* Sekme 2: Önerileri İncele */}
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
          className={`flex-1 min-w-0 text-center text-2xl font-black py-3 px-2 rounded-2xl bg-transparent border-2 ${isDuplicate ? 'border-red-500 text-red-600 focus:border-red-600 focus:bg-red-50' : `border-transparent ${colors.focusBorder} ${colors.text}`} focus:bg-white focus:outline-none transition-colors truncate`}
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
  const [dbError, setDbError] = useState(""); // Firebase izin hatalarını yakalamak için
  
  // Modals
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

  const [setupStep, setSetupStep] = useState(0); 

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

  // Auth Effect
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (isUsingUserFirebase) {
          // Kullanıcının kendi veritabanında "Anonim Giriş" kullanılmalı
          await signInAnonymously(auth);
        } else {
          // Canvas önizleme ortamında özel token kullanılır
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
          setDbError("Firebase Auth Hatası: Lütfen Firebase Console'da 'Authentication' -> 'Sign-in method' kısmından 'Anonymous' (Anonim) girişi aktif edip KAYDET butonuna bastığınızdan emin olun.");
        }
      }
    };
    initAuth();
    
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  // Firestore Sync Effect
  useEffect(() => {
    if (!user || !db) return;
    
    // Categories Fetch
    const wordsRef = collection(db, 'artifacts', appId, 'public', 'data', 'categories');
    const unsubWords = onSnapshot(wordsRef, (snapshot) => {
      setDbError(""); // Hata yoksa mesajı temizle
      if (snapshot.empty) {
        // Eğer veritabanı boşsa varsayılan verileri yükle
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
        setDbError("Veritabanı İzin Hatası: Lütfen Firebase Console'da 'Firestore Database -> Rules' sekmesine gidip veritabanınızı Test Moduna alın (allow read, write: if true).");
      }
    });

    // Suggestions Fetch
    const suggsRef = collection(db, 'artifacts', appId, 'public', 'data', 'suggestions');
    const unsubSuggs = onSnapshot(suggsRef, (snapshot) => {
      const s = [];
      snapshot.forEach(d => s.push({ id: d.id, ...d.data() }));
      setSuggestions(s);
    }, (error) => console.error("Öneriler okuma hatası:", error));
    
    return () => { unsubWords(); unsubSuggs(); };
  }, [user]);

  const nextStep = () => setSetupStep(prev => prev + 1);
  const prevStep = () => setSetupStep(prev => Math.max(0, prev - 1));

  const startGameFlow = (category) => {
    setSelectedCategory(category);
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
    const categoryWords = wordDatabase[selectedCategory] || wordDatabase["Genel"];
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
    return <AdminModal onClose={() => setShowAdmin(false)} wordDatabase={wordDatabase} suggestions={suggestions} />;
  }
  
  if (showSuggestionModal) {
    return <SuggestionModal onClose={() => setShowSuggestionModal(false)} wordDatabase={wordDatabase} />;
  }

  /* ==========================================
     RENDER BÖLÜMÜ - KURULUM AKIŞI (SLIDER)
  ============================================= */
  if (gameState === 'setup') {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden font-sans flex flex-col">
        <div 
          className="flex-1 flex transition-transform duration-700 ease-in-out w-full h-full"
          style={{ transform: `translateX(-${setupStep * 100}%)` }}
        >
          {/* STEP 0: ANA EKRAN */}
          <div className="min-w-full h-full flex flex-col items-center justify-center p-6 relative">
            <div className="bg-white/20 p-8 rounded-[3rem] backdrop-blur-sm border border-white/30 shadow-2xl flex flex-col items-center">
              
              <img 
                src="/logo.png" 
                alt="Oyun Logosu" 
                className="w-full max-w-[200px] md:max-w-[300px] h-auto mb-6 drop-shadow-2xl hover:scale-105 transition-transform duration-300"
              />
              
              <p className="text-white/90 text-xl md:text-2xl mb-12 text-center max-w-md font-medium">
                Yasaklı kelimeleri kullanmadan takım arkadaşlarına kelimeyi anlat!
              </p>
              
              <div className="flex flex-col items-center gap-4">
                {/* HATA MESAJI GÖSTERİMİ */}
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

                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => setShowSuggestionModal(true)}
                    className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full text-sm font-bold transition-all shadow-md flex items-center gap-2 hover:scale-105 border border-white/30"
                  >
                    <MessageSquarePlus size={18} />
                    Kelime Öner
                  </button>
                  
                  <button
                    onClick={() => setShowAdmin(true)}
                    className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full text-sm font-bold transition-all shadow-md flex items-center gap-2 hover:scale-105 border border-white/30"
                  >
                    <Lock size={18} />
                    Yönetici Girişi
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 1: TAKIM ADLARI */}
          <div className="min-w-full h-full flex flex-col items-center justify-center p-6 relative">
            <div className="absolute top-8 left-8">
              <button onClick={prevStep} className="text-white/80 hover:text-white flex items-center text-lg font-bold">
                <ChevronLeft size={24} /> Geri
              </button>
            </div>
            <h2 className="text-5xl font-bold text-white mb-12 drop-shadow-md text-center">Takımları Belirle</h2>
            
            <div className="w-full max-w-md flex flex-col gap-12 mt-4">
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
            
            {team1Name.trim().toLowerCase() === team2Name.trim().toLowerCase() && (
              <div className="mt-8 bg-red-500/90 text-white px-6 py-3 rounded-full font-bold shadow-lg backdrop-blur-sm animate-bounce flex items-center gap-2 border-2 border-white/50">
                <Info size={20} /> Takım isimleri birbirinden farklı olmalıdır!
              </div>
            )}
            
            <button 
              onClick={() => {
                if (team1Name.trim().toLowerCase() !== team2Name.trim().toLowerCase()) nextStep();
              }}
              className={`absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 rounded-full backdrop-blur-sm text-white transition-all shadow-xl ${
                team1Name.trim().toLowerCase() === team2Name.trim().toLowerCase()
                  ? 'bg-white/10 opacity-50 cursor-not-allowed'
                  : 'bg-white/20 hover:bg-white/40 hover:scale-110 animate-pulse'
              }`}
            >
              <ArrowRight size={48} />
            </button>
          </div>

          {/* STEP 2: AYARLAR */}
          <div className="min-w-full h-full flex flex-col items-center justify-center p-4 md:p-6 relative overflow-y-auto">
            <div className="absolute top-8 left-8 z-10">
              <button onClick={prevStep} className="text-white/80 hover:text-white flex items-center text-lg font-bold">
                <ChevronLeft size={24} /> Geri
              </button>
            </div>
            
            <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-3xl shadow-2xl my-auto mt-16">
              <div className="flex items-center gap-3 mb-8 border-b pb-4">
                <Settings className="text-purple-600" size={32} />
                <h2 className="text-4xl font-extrabold text-gray-800">Oyun Ayarları</h2>
              </div>

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
                    <label className="block text-lg font-bold text-red-900 mb-3">Tabu Cezası</label>
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
                    <label className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all ${settings.endType === 'rounds' ? 'border-purple-500 bg-purple-50' : 'border-transparent bg-white shadow-sm'}`}>
                      <input 
                        type="radio" name="endType" checked={settings.endType === 'rounds'}
                        onChange={() => setSettings({...settings, endType: 'rounds'})}
                        className="w-5 h-5 text-purple-600"
                      />
                      <div className="flex-1 flex items-center gap-2 text-lg">
                        <span className="font-semibold text-gray-700">Her oyuncu</span>
                        <select 
                          disabled={settings.endType !== 'rounds'}
                          value={settings.endRoundsValue}
                          onChange={(e) => setSettings({...settings, endRoundsValue: parseInt(e.target.value)})}
                          className="bg-white border rounded-lg px-2 py-1 font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span className="font-semibold text-gray-700">kez anlattığında.</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all ${settings.endType === 'score' ? 'border-purple-500 bg-purple-50' : 'border-transparent bg-white shadow-sm'}`}>
                      <input 
                        type="radio" name="endType" checked={settings.endType === 'score'}
                        onChange={() => setSettings({...settings, endType: 'score'})}
                        className="w-5 h-5 text-purple-600"
                      />
                      <div className="flex-1 flex items-center gap-2 text-lg flex-wrap">
                        <span className="font-semibold text-gray-700">Toplam skor</span>
                        <select 
                          disabled={settings.endType !== 'score'}
                          value={settings.endScoreValue}
                          onChange={(e) => setSettings({...settings, endScoreValue: parseInt(e.target.value)})}
                          className="bg-white border rounded-lg px-2 py-1 font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {Array.from({length: 20}, (_, i) => (i+1)*5).map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span className="font-semibold text-gray-700">olduğunda.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={nextStep}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-4 rounded-full backdrop-blur-sm text-white transition-all shadow-xl hover:scale-110 animate-bounce"
            >
              <ArrowRight size={48} />
            </button>
          </div>

          {/* STEP 4: KATEGORİ SEÇİMİ */}
          <div className="min-w-full h-full flex flex-col items-center justify-center p-6 relative">
            <div className="absolute top-8 left-8">
              <button onClick={prevStep} className="text-white/80 hover:text-white flex items-center text-lg font-bold">
                <ChevronLeft size={24} /> Geri
              </button>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-black text-white mb-12 drop-shadow-xl text-center">Kategori Seç</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-5xl px-4">
              {CATEGORY_LIST.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.name} onClick={() => startGameFlow(cat.name)}
                    className="relative overflow-hidden bg-white/95 backdrop-blur-sm text-gray-800 rounded-[2.5rem] p-8 md:p-10 flex flex-col items-center justify-center gap-6 shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:-translate-y-3 transition-all duration-300 group border-4 border-white/40"
                  >
                    <Icon className={`absolute -bottom-8 -right-8 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-500 ${cat.color}`} size={180} />
                    <div className={`w-28 h-28 md:w-32 md:h-32 bg-gradient-to-br ${cat.gradient} rounded-[2rem] flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-inner relative z-10 border-4 border-white`}>
                      <Icon className={`${cat.color} drop-shadow-md`} size={64} strokeWidth={2.5} />
                    </div>
                    <span className="text-2xl md:text-3xl font-black tracking-wide relative z-10">{cat.name}</span>
                  </button>
                );
              })}
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
        <div className="bg-white shadow-sm p-4 flex justify-between items-center px-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xl">
              {timeLeft}
            </div>
            <span className="font-bold text-gray-500 hidden md:block">Saniye Kaldı</span>
          </div>
          <div className="text-xl font-black text-purple-900">
            {currentTeamName} Oynuyor
          </div>
          <div className="flex gap-4 font-bold text-gray-500">
            <div>Doğru: <span className="text-green-600">{turnStats.correct}</span></div>
            <div>Tabu: <span className="text-red-500">{turnStats.taboo}</span></div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border-8 border-yellow-400 flex flex-col h-[60vh] min-h-[400px]">
            <div className="bg-yellow-400 text-center py-8 px-4 flex-shrink-0">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-wide">
                {currentWord.word}
              </h2>
            </div>
            
            <div className="flex-1 bg-white p-6 md:p-10 flex flex-col justify-center gap-4 md:gap-6 items-center">
              {currentWord.forbidden.map((word, index) => (
                <div key={index} className="w-full flex items-center justify-center relative">
                  <div className="absolute left-0 right-0 h-px bg-gray-200"></div>
                  <span className="relative bg-white px-6 text-2xl md:text-3xl font-bold text-gray-700 capitalize">
                    {word}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 border-t shadow-[0_-10px_20px_rgba(0,0,0,0.05)] flex justify-center gap-4 md:gap-8">
          <button 
            onClick={() => handleAction('taboo')}
            className="flex-1 max-w-xs py-6 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-3xl font-black text-2xl md:text-3xl shadow-[0_8px_0_rgb(185,28,28)] active:shadow-none active:translate-y-2 transition-all flex flex-col items-center gap-2"
          >
            <X size={36} /> TABU (-{settings.penalty})
          </button>
          
          <button 
            onClick={() => handleAction('pass')}
            className={`flex-1 max-w-[120px] py-6 rounded-3xl font-black text-xl flex flex-col items-center justify-center gap-2 transition-all ${passesLeft > 0 || settings.passLimit === 999 ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-[0_8px_0_rgb(202,138,4)] active:shadow-none active:translate-y-2' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            <SkipForward size={32} /> <span className="text-base">PAS ({settings.passLimit === 999 ? '∞' : passesLeft})</span>
          </button>

          <button 
            onClick={() => handleAction('correct')}
            className="flex-1 max-w-xs py-6 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-3xl font-black text-2xl md:text-3xl shadow-[0_8px_0_rgb(21,128,61)] active:shadow-none active:translate-y-2 transition-all flex flex-col items-center gap-2"
          >
            <Check size={36} /> DOĞRU (+1)
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
            <span className="font-bold flex items-center gap-2"><X className="text-red-400"/> Tabu:</span>
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