import React, { useState, useEffect, useRef } from 'react';
import { Play, ChevronRight, ChevronLeft, ArrowRight, Settings, BarChart3, Search, Ban, ShieldCheck, Check, X, SkipForward, Info, Trophy, RotateCcw, Maximize2, Minus, Plus, Globe, Medal, Film, Cpu, Landmark, Smile, Database, Save, Lock, MessageSquarePlus, CheckCircle2, ListTodo, Trash2, Edit3, Upload, FileJson, AlertTriangle, User, LogOut, LogIn, UserPlus, Gamepad2, Eye, Edit2, ArrowLeft, Users, FolderTree, Copy, Flag, Minimize2, Mail, Send } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously, signInWithCustomToken, sendPasswordResetEmail } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { auth, db, app, appId } from '../config/firebase.js';

// --- GENEL AYARLAR ---
const isUsingUserFirebase = true;

// --- GLOBAL YARDIMCI FONKSİYONLAR ---
// Dizileri Türkçe karakterlere uyumlu şekilde alfabetik (A-Z) sıralar
const sortWordsAlphabetically = (wordsArray) => {
  if (!Array.isArray(wordsArray)) return [];
  return [...wordsArray].sort((a, b) => {
    const wordA = (a && typeof a === 'object' && a.word) ? String(a.word) : "";
    const wordB = (b && typeof b === 'object' && b.word) ? String(b.word) : "";
    return wordA.localeCompare(wordB, 'tr-TR');
  });
};

/* ==========================================
   BÖLÜM 1: SABİT VERİLER (CONSTANTS)
   Oyunun varsayılan kelime havuzu ve ayarları.
============================================= */
const DEFAULT_WORD_DATABASE = {
  "Genel": [
    { word: "BİLGİSAYAR", forbidden: ["Klavye", "Ekran", "Fare", "İnternet", "Oyun"] },
    { word: "DENİZ", forbidden: ["Su", "Dalga", "Yüzmek", "Kum", "Sahil"] },
    { word: "KİTAP", forbidden: ["Okumak", "Sayfa", "Yazar", "Roman", "Kütüphane"] },
    { word: "OKUL", forbidden: ["Öğrenci", "Öğretmen", "Ders", "Sınıf", "Sınav"] },
    { word: "TELEFON", forbidden: ["Aramak", "Mesaj", "Ekran", "Uygulama", "İletişim"] }
  ],
  "Spor": [
    { word: "BASKETBOL", forbidden: ["Pota", "Zıplamak", "Smaç", "Top", "Salon"] },
    { word: "FUTBOL", forbidden: ["Top", "Kale", "Maç", "Gol", "Hakem"] },
    { word: "TENİS", forbidden: ["Raket", "Kort", "File", "Top", "Wimbledon"] },
    { word: "YÜZME", forbidden: ["Havuz", "Deniz", "Kulaç", "Bone", "Su"] }
  ],
  "Sinema": [
    { word: "OSCAR", forbidden: ["Ödül", "Film", "Tören", "Aktör", "Akademi"] },
    { word: "PATLAMAMIŞ MISIR", forbidden: ["Sinema", "Yemek", "Tuzlu", "İzlemek", "Film"] },
    { word: "YÖNETMEN", forbidden: ["Film", "Kamera", "Oyuncu", "Sahne", "Motor"] }
  ],
  "Teknoloji": [
    { word: "İNTERNET", forbidden: ["Web", "Bağlantı", "Wifi", "Tarayıcı", "Dünya"] },
    { word: "YAPAY ZEKA", forbidden: ["Robot", "Bilgisayar", "Gelecek", "Öğrenme", "Akıllı"] },
    { word: "YAZILIM", forbidden: ["Kod", "Program", "Bilgisayar", "Geliştirici", "Uygulama"] }
  ],
  "Tarih": [
    { word: "İMPARATORLUK", forbidden: ["Devlet", "Savaş", "Padişah", "Tarih", "Kral"] },
    { word: "MÜZE", forbidden: ["Eser", "Tarihi", "Sergi", "Eski", "Gezmek"] },
    { word: "PİRAMİT", forbidden: ["Mısır", "Firavun", "Mezar", "Çöl", "Üçgen"] }
  ],
  "Çocuk": [
    { word: "ELMA", forbidden: ["Meyve", "Kırmızı", "Ağaç", "Yemek", "Tatlı"] },
    { word: "GÜNEŞ", forbidden: ["Sıcak", "Gökyüzü", "Sarı", "Yaz", "Işık"] },
    { word: "KÖPEK", forbidden: ["Havlamak", "Kemik", "Hayvan", "Kedi", "Evcil"] }
  ]
};

const ADJECTIVES = ["Cesur", "Uçan", "Gizemli", "Hızlı", "Zeki", "Korkusuz", "Muhteşem", "Çılgın", "Efsanevi", "Yenilmez", "Kızgın", "Süper", "Görünmez", "Komik"];
const NOUNS = ["Aslanlar", "Kartallar", "Ejderhalar", "Kaplanlar", "Büyücüler", "Savaşçılar", "Dahiler", "Ninjalar", "Korsanlar", "Şövalyeler", "Robotlar", "Zombiler"];

/* ==========================================
   BÖLÜM 2: GÖRSEL BİLEŞENLER VE KATEGORİLER
============================================= */
const ScalableEmoji = ({ emoji, className }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ overflow: 'visible' }}>
    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontSize="75" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.15))' }}>{emoji}</text>
  </svg>
);

const GenelEmoji = (props) => <ScalableEmoji emoji="⭐" {...props} />;
const SporEmoji = (props) => <ScalableEmoji emoji="🏆" {...props} />;
const SinemaEmoji = (props) => <ScalableEmoji emoji="🎥" {...props} />;
const TeknolojiEmoji = (props) => <ScalableEmoji emoji="🤖" {...props} />;
const TarihEmoji = (props) => <ScalableEmoji emoji="📜" {...props} />;
const BookEmoji = (props) => <ScalableEmoji emoji="📖" {...props} />;
const HandshakeEmoji = (props) => <ScalableEmoji emoji="🤝" {...props} />;
const MusicEmoji = (props) => <ScalableEmoji emoji="🎵" {...props} />;
const BeakerEmoji = (props) => <ScalableEmoji emoji="🧪" {...props} />;
const WolfEmoji = (props) => <ScalableEmoji emoji="🐺" {...props} />;
const ChildEmoji = (props) => <ScalableEmoji emoji="🧒" {...props} />;

const CATEGORY_LIST = [
  { name: "Genel", icon: GenelEmoji, color: "text-blue-500", gradient: "from-blue-100 to-blue-200" },
  { name: "Spor", icon: SporEmoji, color: "text-orange-500", gradient: "from-orange-100 to-orange-200" },
  { name: "Sinema", icon: SinemaEmoji, color: "text-purple-500", gradient: "from-purple-100 to-purple-200" },
  { name: "Teknoloji", icon: TeknolojiEmoji, color: "text-slate-700", gradient: "from-slate-100 to-slate-200" },
  { name: "Tarih", icon: TarihEmoji, color: "text-amber-700", gradient: "from-amber-100 to-amber-200" },
  { name: "Çocuk", icon: ChildEmoji, color: "text-pink-500", gradient: "from-pink-100 to-pink-200" },
  { name: "Eski Türkçe", icon: BookEmoji, color: "text-stone-600", gradient: "from-stone-100 to-stone-200" },
  { name: "Hayat Bilgisi", icon: HandshakeEmoji, color: "text-emerald-600", gradient: "from-emerald-100 to-emerald-200" },
  { name: "Müzik", icon: MusicEmoji, color: "text-rose-500", gradient: "from-rose-100 to-rose-200" },
  { name: "Ortaokul Fen Bilimleri", icon: BeakerEmoji, color: "text-cyan-600", gradient: "from-cyan-100 to-cyan-200" },
  { name: "Türkiye'm", icon: WolfEmoji, color: "text-red-600", gradient: "from-red-100 to-red-200" }
];

/* ==========================================
   BÖLÜM 3: SES MOTORU (AUDIO ENGINE)
============================================= */
const getAudioCtx = () => {
  if (!window.audioCtx) window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (window.audioCtx.state === 'suspended') window.audioCtx.resume();
  return window.audioCtx;
};

const playClickSound = () => {
  try {
    const audioCtx = getAudioCtx(); const oscillator = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); 
    oscillator.connect(gainNode); gainNode.connect(audioCtx.destination);
    oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {}
};

const playTickSound = (freq = 1000) => {
  try {
    const audioCtx = getAudioCtx(); const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq / 1.5, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.05);
  } catch (e) {}
};

const playCorrectSound = () => {
  try {
    const audioCtx = getAudioCtx(); const osc1 = audioCtx.createOscillator(); const gain1 = audioCtx.createGain();
    osc1.type = 'sine'; osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    gain1.gain.setValueAtTime(0, audioCtx.currentTime); gain1.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc1.connect(gain1); gain1.connect(audioCtx.destination);
    osc1.start(); osc1.stop(audioCtx.currentTime + 0.15);

    const osc2 = audioCtx.createOscillator(); const gain2 = audioCtx.createGain();
    osc2.type = 'sine'; osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
    gain2.gain.setValueAtTime(0, audioCtx.currentTime + 0.1); gain2.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    osc2.connect(gain2); gain2.connect(audioCtx.destination);
    osc2.start(audioCtx.currentTime + 0.1); osc2.stop(audioCtx.currentTime + 0.4);
  } catch (e) {}
};

const playTabooSound = () => {
  try {
    const audioCtx = getAudioCtx(); const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {}
};

const playPassSound = () => {
  try {
    const audioCtx = getAudioCtx(); const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {}
};

const playTimeUpSound = () => {
  try {
    const audioCtx = getAudioCtx(); const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'square'; osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.5);
  } catch (e) {}
};
/* ==========================================
   BÖLÜM 4: ALT BİLEŞENLER (MODALS & ROWS)
============================================= */

// --- 4.1 Oyunlarım Modalı ---
const MyGamesModal = ({ onClose, user, myGames, username }) => {
  const [view, setView] = useState('list'); 
  const [addMode, setAddMode] = useState('single');
  const [selectedGame, setSelectedGame] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [word, setWord] = useState("");
  const [forbidden, setForbidden] = useState(["", "", "", "", ""]);
  const [addedWords, setAddedWords] = useState([]);
  const [status, setStatus] = useState(null);
  const [editingWordIndex, setEditingWordIndex] = useState(null);
  const [confirmDeleteGame, setConfirmDeleteGame] = useState(false);

  const aiPrompt = `Bir kelime anlatma oyununda kullanılmak üzere, <kategori adı giriniz> kategorisinde, 200 adet kelime ya da kelime grubu ve bunları anlatırken kullanılmaması gereken 5'er tane yasaklı kelimeyi içeren bir json dosyası hazırla ve indirilebilir link ver. İçeriği oluştururken dikkat etmen gereken kodlama dizimi şu şekildedir: 
[
  { "category": "Türkiye'm", "word": "MUSTAFA KEMAL ATATÜRK", "forbidden": ["Ali Rıza Bey", "Zübeyde Hanım", "Anıtkabir", "Önder", "Selanik"] }, 
  { "category": "Türkiye'm", "word": "ŞEHZADELER ŞEHRİ", "forbidden": ["Amasya", "Osmanlı", "Padişah", "Oğul", "Eğitim"] }
]`;

  const resetForm = () => {
    setCategoryName(""); setVisibility("public"); setWord(""); setForbidden(["", "", "", "", ""]);
    setAddedWords([]); setEditingWordIndex(null); setStatus(null); setConfirmDeleteGame(false);
  };

  const openAddChoice = () => { resetForm(); setView('add-choice'); };
  const openView = (game) => { setSelectedGame(game); setView('view'); };
  const openEdit = (game) => {
    setSelectedGame(game); setCategoryName(game.name); setVisibility(game.type || 'public');
    setAddedWords(game.words || []); setWord(""); setForbidden(["", "", "", "", ""]);
    setEditingWordIndex(null); setStatus(null); setConfirmDeleteGame(false); setAddMode('single'); setView('edit');
  };

  const handleAddOrUpdateWord = () => {
    if (!word.trim() || forbidden.some(f => !f.trim())) { setStatus({ type: 'error', msg: "Lütfen kelimeyi ve 5 yasaklı kelimeyi doldurun!" }); return; }
    const newWordObj = { word: word.trim().toLocaleUpperCase('tr-TR'), forbidden: forbidden.map(f => f.trim().toLocaleUpperCase('tr-TR')) };
    let updatedList = [];
    if (editingWordIndex !== null) {
      updatedList = [...addedWords]; updatedList[editingWordIndex] = newWordObj; setStatus({ type: 'success', msg: "Kelime güncellendi!" });
    } else {
      updatedList = [newWordObj, ...addedWords]; setStatus({ type: 'success', msg: "Kelime eklendi!" });
    }
    updatedList = sortWordsAlphabetically(updatedList); setAddedWords(updatedList);
    setEditingWordIndex(null); setWord(""); setForbidden(["", "", "", "", ""]); setTimeout(() => setStatus(null), 2000);
  };

  const handleEditWordClick = (index) => {
    const w = addedWords[index]; setWord(w.word); setForbidden([...w.forbidden]);
    setEditingWordIndex(index); setStatus({ type: 'info', msg: "Kelimeyi düzenliyorsunuz..." });
  };

  const handleDeleteWordClick = (index) => {
    setAddedWords(addedWords.filter((_, i) => i !== index));
    if (editingWordIndex === index) { setWord(""); setForbidden(["", "", "", "", ""]); setEditingWordIndex(null); }
  };

  const handleUserJSONUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data)) throw new Error("Geçersiz format.");
        let newWords = []; let detectedCategory = "";
        data.forEach(item => {
          if (item.word && Array.isArray(item.forbidden) && item.forbidden.length > 0) {
            newWords.push({ word: item.word.trim().toLocaleUpperCase('tr-TR'), forbidden: item.forbidden.map(f => f.trim().toLocaleUpperCase('tr-TR')) });
            if (!detectedCategory && item.category) detectedCategory = item.category.trim();
          }
        });
        if (newWords.length === 0) throw new Error("Geçerli kelime bulunamadı.");
        setAddedWords(prev => sortWordsAlphabetically([...newWords, ...prev]));
        if (!categoryName && detectedCategory) setCategoryName(detectedCategory);
        setStatus({ type: 'success', msg: `${newWords.length} kelime başarıyla eklendi!` }); e.target.value = null; 
      } catch (error) { setStatus({ type: 'error', msg: "Hata: " + error.message }); e.target.value = null; }
    };
    reader.readAsText(file);
  };

  const copyToClipboard = () => {
    const textArea = document.createElement("textarea"); textArea.value = aiPrompt; textArea.style.position = "absolute"; textArea.style.left = "-999999px";
    document.body.appendChild(textArea); textArea.select();
    try { document.execCommand('copy'); setStatus({ type: 'success', msg: "Prompt kopyalandı!" }); setTimeout(() => setStatus(null), 4000); } 
    catch (err) { setStatus({ type: 'error', msg: "Kopyalama başarısız oldu." }); }
    document.body.removeChild(textArea);
  };

  const handleFinish = async () => {
    if (!categoryName.trim()) { setStatus({ type: 'error', msg: "Lütfen bir kategori ismi girin!" }); return; }
    if (addedWords.length === 0) { setStatus({ type: 'error', msg: "Oyununuza hiç kelime eklemediniz!" }); return; }

    try {
      setStatus({ type: 'info', msg: "Kaydediliyor..." });
      const gameData = {
        name: categoryName.trim(), words: addedWords, ownerId: user.uid, ownerEmail: user.email || "Üye", ownerUsername: username || "Üye",
        visibility: visibility, status: visibility === 'public' ? (view === 'edit' ? (selectedGame?.status || 'pending') : 'pending') : 'private',
        updatedAt: Date.now(), createdAt: view === 'edit' ? (selectedGame?.createdAt || Date.now()) : Date.now()
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
        setStatus({ type: 'success', msg: "Değişiklikler kaydedildi!" });
      } else {
        const coll = visibility === 'public' ? `public/data/customGames` : `users/${user.uid}/customGames`;
        await addDoc(collection(db, 'artifacts', appId, ...coll.split('/')), gameData);
        setStatus({ type: 'success', msg: "Oyun başarıyla oluşturuldu!" });
      }
      setTimeout(() => { setStatus(null); setView('list'); }, 1500);
    } catch (e) { setStatus({ type: 'error', msg: "Hata: " + e.message }); }
  };

  const handleDeleteGame = async () => {
    try {
      setStatus({ type: 'info', msg: "Oyun siliniyor..." });
      const coll = selectedGame.type === 'public' ? `public/data/customGames` : `users/${user.uid}/customGames`;
      await deleteDoc(doc(db, 'artifacts', appId, ...coll.split('/'), selectedGame.id));
      setStatus({ type: 'success', msg: "Oyun silindi!" });
      setTimeout(() => { setStatus(null); setConfirmDeleteGame(false); setView('list'); }, 1500);
    } catch (e) { setStatus({ type: 'error', msg: "Silinirken hata oluştu: " + e.message }); }
  };

  return (
    <div className="fixed inset-0 w-full h-screen bg-gray-900/95 flex items-center justify-center p-4 z-50 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-2xl shadow-2xl relative border-4 border-blue-300 my-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors z-10"><X size={32} /></button>
        {/* LİSTE GÖRÜNÜMÜ */}
        {view === 'list' && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-black text-blue-600 mb-6 flex items-center gap-3"><Gamepad2 size={36} /> Oyunlarım</h2>
            <button onClick={openAddChoice} className="w-full mb-6 bg-blue-50 border-2 border-dashed border-blue-300 hover:bg-blue-100 text-blue-600 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"><Plus size={24} /> Yeni Oyun Ekle</button>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {myGames.length === 0 ? <div className="text-center py-8 text-gray-400 font-medium">Henüz bir oyun eklemediniz.</div> : (
                myGames.map(game => (
                  <div key={game.id} className="bg-white border-2 border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-blue-200 transition-all">
                    <div>
                      <h3 className="font-black text-xl text-gray-800">{game.name}</h3>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{game.words?.length || 0} Kelime</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${game.type === 'public' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{game.type === 'public' ? (game.status === 'pending' ? 'Onay Bekliyor' : 'Herkese Açık') : 'Bana Özel'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openView(game)} className="flex-1 md:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"><Eye size={18} /> Görüntüle</button>
                      <button onClick={() => openEdit(game)} className="flex-1 md:flex-none px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"><Edit2 size={18} /> Düzenle</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === 'add-choice' && (
          <div className="animate-fade-in flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setView('list')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"><ArrowLeft size={24} /></button>
              <h2 className="text-2xl font-black text-blue-600">Oyun Ekleme Yöntemi</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => { setAddMode('single'); setView('add'); }} className="flex flex-col items-center justify-center p-8 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-3xl transition-all gap-4 group">
                <div className="w-16 h-16 bg-blue-500 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Edit3 size={32} /></div>
                <div className="text-xl font-black text-blue-800">Tek Tek Ekle</div>
                <div className="text-sm font-medium text-blue-600 text-center">Kelimeleri ve yasaklı kelimeleri manuel olarak kutucuklara girin.</div>
              </button>
              <button onClick={() => { setAddMode('bulk'); setView('add'); }} className="flex flex-col items-center justify-center p-8 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-3xl transition-all gap-4 group relative overflow-hidden">
                <div className="absolute -right-6 -top-6 text-purple-200 opacity-50 group-hover:scale-110 transition-transform"><Cpu size={120} /></div>
                <div className="w-16 h-16 bg-purple-500 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform relative z-10"><FileJson size={32} /></div>
                <div className="text-xl font-black text-purple-800 relative z-10">Toplu Ekle (Yapay Zeka)</div>
                <div className="text-sm font-medium text-purple-600 text-center relative z-10">Yapay zeka araçları ile oluşturduğunuz yüzlerce kelimeyi anında yükleyin.</div>
              </button>
            </div>
          </div>
        )}

        {view === 'view' && selectedGame && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setView('list')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"><ArrowLeft size={24} /></button>
              <h2 className="text-3xl font-black text-gray-800">{selectedGame.name}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {selectedGame.words?.map((w, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h4 className="font-black text-lg text-blue-700 mb-2 border-b border-blue-100 pb-2">{w.word}</h4>
                  <ul className="text-sm font-semibold text-red-500 space-y-1">{w.forbidden.map((f, i) => <li key={i}>- {f}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {(view === 'add' || view === 'edit') && (
          <div className="animate-fade-in flex flex-col max-h-[80vh]">
            <div className="flex items-center gap-4 mb-4 flex-shrink-0">
              <button onClick={() => view === 'edit' ? setView('list') : setView('add-choice')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"><ArrowLeft size={24} /></button>
              <h2 className="text-2xl font-black text-blue-600">{view === 'edit' ? 'Oyunu Düzenle' : (addMode === 'bulk' ? 'Toplu Kelime Yükle' : 'Yeni Oyun Oluştur')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">Oyun Adı</label>
                <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Örn: 90'lar Pop" className="w-full border-2 border-blue-200 bg-blue-50 rounded-xl p-3 font-bold text-gray-800 focus:border-blue-500 outline-none" />
              </div>
              
              {addMode === 'bulk' && view === 'add' && (
                <div className="bg-purple-50 p-4 md:p-5 rounded-2xl border border-purple-200 shadow-sm space-y-4">
                  <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-purple-100">
                    <Info size={24} className="text-purple-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-purple-800 font-medium">Aşağıdaki Prompta kendi kategori isminizi yazarak yapay zeka araçlarından aldığınız sonucu json formatında yükleyebilirsiniz.</p>
                  </div>
                  <div className="bg-white border-2 border-purple-200 rounded-xl p-4 shadow-inner flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1.5">Örnek Prompt</p>
                      <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" onClick={copyToClipboard} className="p-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold shrink-0 cursor-pointer no-underline"><Copy size={16} /> Kopyala ve Git</a>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-words leading-relaxed w-full">{aiPrompt}</pre>
                    </div>
                  </div>
                  <div className="bg-white border-2 border-dashed border-purple-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-purple-50 transition-colors">
                    <Upload size={36} className="text-purple-400 mb-3" />
                    <p className="font-bold text-purple-900 mb-2">JSON Dosyanızı Yükleyin</p>
                    <label className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-xl cursor-pointer transition-colors shadow-md mt-2">
                      <span>Dosya Seç</span><input type="file" accept=".json" onChange={handleUserJSONUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              )}

              {(addMode === 'single' || view === 'edit' || editingWordIndex !== null) && (
                <div className="bg-gray-50 p-4 md:p-5 rounded-2xl border border-gray-200 shadow-sm relative">
                  {addMode === 'bulk' && <div className="absolute -top-3 left-4 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">Kelimeleri Düzenle</div>}
                  <label className="block text-gray-700 font-bold mb-2">Anlatılacak Kelime:</label>
                  <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="Anlatılacak Kelime" className="w-full border-2 border-gray-200 rounded-xl p-3 font-black text-xl text-gray-800 focus:border-blue-500 outline-none uppercase shadow-inner" />
                  <label className=" text-red-500 font-bold mb-2 mt-4 flex items-center gap-2"><X size={18} /> Deme Kelimeleri (5 Adet)</label>
                  <div className="space-y-2">
                    {forbidden.map((fw, i) => (
                      <input key={i} value={fw} onChange={(e) => { const newF = [...forbidden]; newF[i] = e.target.value; setForbidden(newF); }} placeholder={`${i + 1}. Yasaklı Kelime`} className="w-full border-2 border-red-100 bg-white rounded-xl p-2 font-bold text-gray-700 focus:border-red-400 outline-none capitalize shadow-sm" />
                    ))}
                  </div>
                  <button onClick={handleAddOrUpdateWord} className={`w-full mt-4 text-white font-black text-lg py-3 rounded-xl hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 ${editingWordIndex !== null ? 'bg-amber-500 hover:bg-amber-600 shadow-[0_4px_0_rgb(217,119,6)]' : 'bg-blue-500 hover:bg-blue-600 shadow-[0_4px_0_rgb(37,99,235)]'}`}>
                    {editingWordIndex !== null ? <><Check size={22} /> KELİMEYİ GÜNCELLE</> : <><Plus size={22} /> KELİME EKLE</>}
                  </button>
                </div>
              )}

              {addedWords.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <h4 className="font-bold text-gray-600 mb-3 text-sm flex items-center justify-between"><span>Eklenen Kelimeler</span><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{addedWords.length} Adet</span></h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {addedWords.map((aw, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-2 md:p-3 rounded-lg border ${editingWordIndex === idx ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100 hover:bg-blue-50 hover:border-blue-100'} transition-colors`}>
                        <span className="font-black text-gray-800">{aw.word}</span>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditWordClick(idx)} className="p-2 bg-white rounded-md text-blue-600 hover:bg-blue-100 shadow-sm border border-gray-200"><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteWordClick(idx)} className="p-2 bg-white rounded-md text-red-600 hover:bg-red-100 shadow-sm border border-gray-200"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
                <Info size={24} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 font-medium">Oyun oluşturmayı tamamladığınızda, oyununuz "Oyna" seçeneği altındaki kategorilere eklenecek ve hemen oynamaya hazır olacaktır. Ancak herkese açılması için yönetici onayı gerekmektedir. Kullanılan kelimelerdeki sorumluluk ekleyen kullanıcıya aittir.</p>
              </div>

              <div className="flex gap-4">
                <label className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer transition-all ${visibility === 'public' ? 'border-blue-500 bg-blue-50 shadow-inner' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <input type="radio" checked={visibility === 'public'} onChange={() => setVisibility('public')} className="hidden" /><Globe size={20} className={visibility === 'public' ? 'text-blue-500' : 'text-gray-400'} /><span className={`font-bold text-sm md:text-base ${visibility === 'public' ? 'text-blue-700' : 'text-gray-500'}`}>Herkese Açık</span>
                </label>
                <label className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer transition-all ${visibility === 'private' ? 'border-purple-500 bg-purple-50 shadow-inner' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  <input type="radio" checked={visibility === 'private'} onChange={() => setVisibility('private')} className="hidden" /><Lock size={20} className={visibility === 'private' ? 'text-purple-500' : 'text-gray-400'} /><span className={`font-bold text-sm md:text-base ${visibility === 'private' ? 'text-purple-700' : 'text-gray-500'}`}>Bana Özel</span>
                </label>
              </div>
              {status && <div className={`p-3 rounded-xl font-bold flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-700 border-green-200' : status.type === 'info' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-red-100 text-red-700 border-red-200'} border`}>{status.type === 'success' ? <Check size={20} /> : <Info size={20} />} {status.msg}</div>}
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row gap-3 flex-shrink-0">
              {view === 'edit' && (
                confirmDeleteGame ? (
                  <div className="flex-1 flex gap-2">
                    <button onClick={handleDeleteGame} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl">Eminim, Sil</button>
                    <button onClick={() => setConfirmDeleteGame(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl">İptal</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteGame(true)} className="md:w-1/3 bg-red-100 hover:bg-red-200 text-red-600 font-black text-lg py-3 rounded-xl transition-all flex items-center justify-center gap-2"><Trash2 size={20} /> SİL</button>
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

// --- 4.2 Kullanıcı Kelime Öneri Modalı ---
const SuggestionModal = ({ onClose, wordDatabase, user }) => {
  const [category, setCategory] = useState("Genel");
  const [customCategory, setCustomCategory] = useState("");
  const [word, setWord] = useState("");
  const [forbidden, setForbidden] = useState(["", "", "", "", ""]);
  const [status, setStatus] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!word.trim() || forbidden.some(f => !f.trim())) { setStatus({ type: 'error', msg: "Lütfen kelimeyi ve 5 yasaklı kelimeyi eksiksiz doldurun!" }); return; }
    if (category === "NEW" && !customCategory.trim()) { setStatus({ type: 'error', msg: "Lütfen önermek istediğiniz kategorinin adını yazın!" }); return; }

    try {
      if (!db || !appId) throw new Error("Veritabanı bağlantısı kurulamadı. Firebase ayarlarınızı kontrol edin.");
      const suggRef = collection(db, 'artifacts', appId, 'public', 'data', 'suggestions');
      await addDoc(suggRef, {
        category: category === "NEW" ? customCategory.trim() : category,
        word: word.trim().toLocaleUpperCase('tr-TR'),
        forbidden: forbidden.map(f => f.trim().toLocaleUpperCase('tr-TR')),
        timestamp: Date.now(),
        suggestedBy: user && !user.isAnonymous ? user.email : "Anonim" 
      });
      setIsSuccess(true); setStatus(null);
    } catch (e) { setStatus({ type: 'error', msg: "Öneri gönderilemedi: " + e.message }); }
  };

  const resetForm = () => { setWord(""); setForbidden(["", "", "", "", ""]); setCustomCategory(""); setCategory("Genel"); setIsSuccess(false); };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 w-full h-screen bg-gray-900/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative border-4 border-green-200 flex flex-col items-center text-center">
          <CheckCircle2 size={80} className="text-green-500 mb-6 animate-bounce" />
          <h2 className="text-3xl font-black text-gray-800 mb-2">Harika!</h2>
          <p className="text-gray-600 mb-8 font-medium">Kelime önerin başarıyla alındı. Yönetici onayından sonra oyuna eklenecektir.</p>
          <button onClick={resetForm} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-[0_5px_0_rgb(21,128,61)] hover:translate-y-1 hover:shadow-none transition-all mb-4">YENİ KELİME ÖNER</button>
          <button onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-4 rounded-xl shadow-[0_5px_0_rgb(156,163,175)] hover:translate-y-1 hover:shadow-none transition-all">ANASAYFAYA DÖN</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-screen bg-gray-900/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-lg shadow-2xl relative border-4 border-yellow-300 my-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors"><X size={32} /></button>
        <h2 className="text-3xl font-black text-yellow-600 mb-6 flex items-center gap-3"><MessageSquarePlus size={36} /> Kelime Öner</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Kategori Seçimi</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border-2 border-yellow-200 bg-yellow-50 rounded-xl p-3 font-bold text-gray-800 focus:border-yellow-500 outline-none cursor-pointer">
              {Object.keys(wordDatabase).map(cat => (<option key={cat} value={cat}>{cat}</option>))}
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
            <label className="text-gray-700 font-bold mb-3 flex items-center gap-2"><X size={18} className="text-red-500"/> Deme Kelimeleri:</label>
            <div className="space-y-2">
              {forbidden.map((fw, i) => (
                <input key={i} value={fw} onChange={(e) => { const newF = [...forbidden]; newF[i] = e.target.value; setForbidden(newF); }} placeholder={`${i + 1}. Yasaklı Kelime`} className="w-full border-2 border-red-100 bg-white rounded-xl p-2 md:p-3 font-bold text-gray-700 focus:border-red-400 outline-none capitalize shadow-sm" />
              ))}
            </div>
          </div>
          {status && <div className="p-3 rounded-xl font-bold flex items-center gap-2 bg-red-100 text-red-700 border border-red-200"><Info size={20} />{status.msg}</div>}
          <button onClick={handleSubmit} className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black text-xl py-4 rounded-xl shadow-[0_5px_0_rgb(202,138,4)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3 mt-4">
            KELİMEYİ ÖNER
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 4.3 Yönetici İçin Kelime Düzenleme Satırı ---
const AdminWordRow = ({ wordObj, onSave, onDelete, isSelected, onToggleSelect }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // GÜVENLİK ÖNLEMİ: Hatalı veya eski test verileri varsa çökmeyi engelle
  const safeWord = (wordObj && wordObj.word) ? String(wordObj.word) : "";
  let safeForbidden = ["", "", "", "", ""];
  if (wordObj && Array.isArray(wordObj.forbidden)) {
    safeForbidden = wordObj.forbidden.map(f => f ? String(f) : "");
  }
  while (safeForbidden.length < 5) safeForbidden.push("");

  const [word, setWord] = useState(safeWord);
  const [forbidden, setForbidden] = useState(safeForbidden.slice(0, 5));

  const handleSave = () => { onSave({ word, forbidden }); setIsEditing(false); };

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
        <input type="checkbox" checked={isSelected} onChange={onToggleSelect} className="w-5 h-5 cursor-pointer accent-purple-600 flex-shrink-0" />
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

// --- 4.4 Yönetici Paneli Öneri Satırı Bileşeni ---
const SuggestionItemRow = ({ suggestion, wordDatabase, onApprove, onReject }) => {
  
  // 1. HOOK'LAR: En üstte ve koşulsuz tanımlanmalı (React kuralı)
  const initialWord = suggestion?.word ? String(suggestion.word) : "";
  const initialCat = suggestion?.category ? String(suggestion.category) : "Genel";
  const initialForbidden = (() => {
    let arr = ["", "", "", "", ""];
    if (suggestion && Array.isArray(suggestion.forbidden)) {
      arr = suggestion.forbidden.map(f => String(f || ""));
    }
    while (arr.length < 5) arr.push("");
    return arr.slice(0, 5);
  })();

  const [word, setWord] = useState(initialWord);
  const [cat, setCat] = useState(initialCat);
  const [forbidden, setForbidden] = useState(initialForbidden);

  // 2. KORUMA: Çökmeyi engelleyen kontrol (Mutlaka Hook'lardan sonra!)
  if (!suggestion || !suggestion.id) return null;

  const safeUser = String(suggestion.suggestedBy || "Bilinmiyor");

  return (
    <div className="bg-purple-50 rounded-2xl p-4 border-2 border-purple-100 mb-4 shadow-sm">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-purple-600 uppercase block">Kategori</label>
            <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-bold">Öneren: {safeUser}</span>
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
            <input key={i} value={fw} onChange={(e) => { const newF = [...forbidden]; newF[i] = e.target.value; setForbidden(newF); }} className="w-full p-2 rounded-lg border border-red-200 text-sm font-semibold focus:outline-none focus:border-red-500 capitalize" />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-purple-200">
        <button onClick={() => onReject(suggestion.id)} className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-lg transition-colors flex items-center gap-2"><Trash2 size={18} /> Sil</button>
        <button onClick={() => onApprove(suggestion.id, cat, word, forbidden)} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-md"><Check size={18} /> Onayla ve Ekle</button>
      </div>
    </div>
  );
}
/* ==========================================
   BÖLÜM 4.5: YÖNETİCİ (ADMIN) MODALI
============================================= */
const AdminModal = ({ onClose, wordDatabase, suggestions, customPublicGames, reports, messagesList, adminReplyText, setAdminReplyText, handleAdminReply, handleAdminDeleteMessage }) => {
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
  const [selectedWords, setSelectedWords] = useState([]);
  
  const [usersList, setUsersList] = useState([]);
  const [searchUser, setSearchUser] = useState("");

  useEffect(() => {
    if (activeTab === 'stats') {
      const q = collection(db, 'artifacts', appId, 'userProfiles');
      const unsub = onSnapshot(q, (snapshot) => {
        let arr = [];
        snapshot.forEach(d => arr.push({ uid: d.id, ...d.data() }));
        arr.sort((a,b) => (b.lastLogin || 0) - (a.lastLogin || 0));
        setUsersList(arr);
      });
      return () => unsub();
    }
  }, [activeTab]);

  const handleToggleBan = async (uid, currentBanStatus) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'userProfiles', uid), { isBanned: !currentBanStatus });
      setStatus({ type: 'success', msg: `Kullanıcı engeli ${!currentBanStatus ? 'koyuldu' : 'kaldırıldı'}.` });
      setTimeout(() => setStatus(null), 2000);
    } catch (e) { setStatus({ type: 'error', msg: "Hata: " + e.message }); }
  };

  const handleLogin = async () => {
    try {
      setStatus({ type: 'info', msg: "Giriş yapılıyor..." });
      await signInWithEmailAndPassword(auth, "boteonur@gmail.com", password);
      setIsAuthenticated(true); setStatus(null);
    } catch (error) { setStatus({ type: 'error', msg: "Hatalı şifre girdiniz!" }); }
  };

  const handleResetPassword = async () => {
    if (resetEmail.trim() === "boteonur@gmail.com") {
      setStatus({ type: 'info', msg: "Şifre sıfırlama bağlantısı gönderiliyor..." });
      try {
        await sendPasswordResetEmail(auth, resetEmail.trim());
        setStatus({ type: 'success', msg: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!" });
        setTimeout(() => { setIsForgotPassword(false); setStatus(null); setResetEmail(""); }, 4000);
      } catch (err) { setStatus({ type: 'error', msg: "Gönderilemedi. Lütfen bağlantınızı kontrol edin." }); }
    } else { setStatus({ type: 'error', msg: "Böyle bir yönetici e-posta adresi bulunamadı!" }); }
  };

  const handleDirectSave = async () => {
    if (!word.trim() || forbidden.some(f => !f.trim())) { setStatus({ type: 'error', msg: "Lütfen kelimeyi ve 5 yasaklı kelimeyi eksiksiz doldurun!" }); return; }
    try {
      if (!db || !appId) throw new Error("Veritabanı bağlantısı kurulamadı.");
      const newWordObj = { word: word.trim().toLocaleUpperCase('tr-TR'), forbidden: forbidden.map(f => f.trim().toLocaleUpperCase('tr-TR')) };
      const currentWords = wordDatabase[category] || [];
      
      // Alfabetik sırala
      const updatedWords = sortWordsAlphabetically([...currentWords, newWordObj]);

      const catRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), category);
      await setDoc(catRef, { words: updatedWords });

      setStatus({ type: 'success', msg: "Kelime başarıyla eklendi!" });
      setWord(""); setForbidden(["", "", "", "", ""]);
      setTimeout(() => setStatus(null), 3000);
    } catch (e) { setStatus({ type: 'error', msg: "Kaydedilirken hata oluştu: " + e.message }); }
  };

  const handleApproveSuggestion = async (id, catName, wordVal, forbiddenArr) => {
    if (!wordVal.trim() || forbiddenArr.some(f => !f.trim()) || !catName.trim()) { setStatus({ type: 'error', msg: "Eksik alan var, onaylanamadı." }); return; }
    try {
      const currentWords = wordDatabase[catName.trim()] || [];
      const newWordObj = { word: wordVal.trim().toLocaleUpperCase('tr-TR'), forbidden: forbiddenArr.map(f => f.trim().toLocaleUpperCase('tr-TR')) };
      
      // Alfabetik sırala
      const updatedWords = sortWordsAlphabetically([...currentWords, newWordObj]);
      
      const catRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), catName.trim());
      await setDoc(catRef, { words: updatedWords });
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'suggestions', id));
      
      setStatus({ type: 'success', msg: "Öneri onaylandı ve veritabanına eklendi!" });
      setTimeout(() => setStatus(null), 3000);
    } catch (e) { setStatus({ type: 'error', msg: "Hata: " + e.message }); }
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

        const groupedWords = {}; let validWordCount = 0;
        data.forEach(item => {
          if (item.category && item.word && Array.isArray(item.forbidden) && item.forbidden.length > 0) {
            const cat = item.category.trim();
            if (!groupedWords[cat]) groupedWords[cat] = [];
            groupedWords[cat].push({
              word: item.word.trim().toLocaleUpperCase('tr-TR'),
              forbidden: item.forbidden.map(f => f.trim().toLocaleUpperCase('tr-TR'))
            });
            validWordCount++;
          }
        });

        if (validWordCount === 0) throw new Error("Geçerli kelime bulunamadı.");

        for (const [catName, newWords] of Object.entries(groupedWords)) {
          const currentWords = wordDatabase[catName] || [];
          const updatedWords = sortWordsAlphabetically([...currentWords, ...newWords]);
          const catRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'categories'), catName);
          await setDoc(catRef, { words: updatedWords });
        }

        setStatus({ type: 'success', msg: `Tebrikler! ${validWordCount} adet kelime başarıyla eklendi.` });
        e.target.value = null; setTimeout(() => setStatus(null), 5000);
      } catch (error) { setStatus({ type: 'error', msg: "Hata: " + error.message }); e.target.value = null; }
    };
    reader.readAsText(file);
  };

  const handleOpenCat = (type, data) => {
    setSelectedCat({ type, data }); setEditCatName(type === 'official' ? data : data.name);
    setConfirmDeleteCat(false); setSelectedWords([]);
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
    } catch (e) { setStatus({ type: 'error', msg: e.message }); }
  };

  const handleSaveWord = async (originalIdx, newWordObj) => {
    try {
      if (selectedCat.type === 'official') {
        const catName = selectedCat.data;
        const newWords = [...wordDatabase[catName]];
        newWords[originalIdx] = newWordObj; 
        const sortedNewWords = sortWordsAlphabetically(newWords);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', catName), { words: sortedNewWords });
      } else {
        const gameId = selectedCat.data.id;
        const newWords = [...selectedCat.data.words];
        newWords[originalIdx] = newWordObj;
        const sortedNewWords = sortWordsAlphabetically(newWords);
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customGames', gameId), { words: sortedNewWords });
        setSelectedCat({ type: 'custom', data: { ...selectedCat.data, words: sortedNewWords } });
      }
      setStatus({ type: 'success', msg: "Kelime güncellendi!" });
      setTimeout(() => setStatus(null), 2000);
    } catch(e) { setStatus({ type: 'error', msg: e.message }); }
  };

  const handleDeleteWord = async (originalIdx) => {
    try {
      if (selectedCat.type === 'official') {
        const catName = selectedCat.data;
        const newWords = [...wordDatabase[catName]];
        newWords.splice(originalIdx, 1);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', catName), { words: newWords });
      } else {
        const gameId = selectedCat.data.id;
        const newWords = [...selectedCat.data.words];
        newWords.splice(originalIdx, 1);
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customGames', gameId), { words: newWords });
        setSelectedCat({ type: 'custom', data: { ...selectedCat.data, words: newWords } });
      }
      setSelectedWords(prev => prev.filter(i => i !== originalIdx).map(i => i > originalIdx ? i - 1 : i));
      setStatus({ type: 'success', msg: "Kelime silindi!" });
      setTimeout(() => setStatus(null), 2000);
    } catch(e) { setStatus({ type: 'error', msg: e.message }); }
  };

  const rawWordList = selectedCat ? (selectedCat.type === 'official' ? wordDatabase[selectedCat.data] : (selectedCat.data.words || [])) : [];
  const sortedWordList = sortWordsAlphabetically(rawWordList);
  const isAllSelected = rawWordList.length > 0 && selectedWords.length === rawWordList.length;

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedWords(rawWordList.map((_, i) => i));
    else setSelectedWords([]);
  };

  const handleSelectWord = (originalIdx) => {
    if (selectedWords.includes(originalIdx)) setSelectedWords(selectedWords.filter(i => i !== originalIdx));
    else setSelectedWords([...selectedWords, originalIdx]);
  };

  const handleDeleteSelectedWords = async () => {
    if (selectedWords.length === 0) return;
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
      setSelectedWords([]); setTimeout(() => setStatus(null), 2000);
    } catch(e) { setStatus({ type: 'error', msg: e.message }); }
  };

  const handleApproveCustomGame = async (gameId) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customGames', gameId), { status: 'approved' });
      setStatus({ type: 'success', msg: "Oyun onaylandı ve herkese açıldı!" });
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
      if (selectedCat.type === 'official') await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', selectedCat.data));
      else await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customGames', selectedCat.data.id));
      setStatus({ type: 'success', msg: "Kategori silindi!" });
      setTimeout(() => { setStatus(null); setSelectedCat(null); setConfirmDeleteCat(false); }, 2000);
    } catch (e) { setStatus({ type: 'error', msg: e.message }); }
  };

  const handleMoveToCustom = async () => {
    try {
      const catName = selectedCat.data;
      const words = sortWordsAlphabetically(wordDatabase[catName] || []);
      setStatus({ type: 'info', msg: "Taşınıyor..." });
      const gameData = { name: catName, words: words, ownerId: "admin", ownerEmail: "Yönetici", visibility: "public", status: "approved", updatedAt: Date.now(), createdAt: Date.now() };
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'customGames'), gameData);
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', catName));
      setStatus({ type: 'success', msg: "Başarıyla 'Üyelerden Gelenler'e taşındı!" });
      setTimeout(() => { setStatus(null); setSelectedCat(null); }, 2000);
    } catch (e) { setStatus({ type: 'error', msg: e.message }); }
  };

  const handleMoveToOfficial = async () => {
    try {
      const game = selectedCat.data;
      setStatus({ type: 'info', msg: "Taşınıyor..." });
      const sortedWords = sortWordsAlphabetically(game.words || []);
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', game.name), { words: sortedWords });
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customGames', game.id));
      setStatus({ type: 'success', msg: "Başarıyla 'Resmi Kategoriler'e taşındı!" });
      setTimeout(() => { setStatus(null); setSelectedCat(null); }, 2000);
    } catch (e) { setStatus({ type: 'error', msg: e.message }); }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', reportId));
      setStatus({ type: 'success', msg: "Bildirim silindi." });
      setTimeout(() => setStatus(null), 2000);
    } catch(e) { setStatus({ type: 'error', msg: e.message }); }
  };

  const handleDeleteReportedWord = async (report) => {
    try {
      setStatus({ type: 'info', msg: "Kelime siliniyor..." });
      if (!report.isCustomGame) {
        const catName = report.categoryName; const currentWords = wordDatabase[catName] || [];
        const newWords = currentWords.filter(w => w.word !== report.word);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'categories', catName), { words: newWords });
      } else {
        const gameId = report.categoryId; const game = customPublicGames.find(g => g.id === gameId);
        if (game) {
          const newWords = game.words.filter(w => w.word !== report.word);
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customGames', gameId), { words: newWords });
        } else throw new Error("Bu oyun silinmiş veya özel yapılmış olabilir.");
      }
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', report.id));
      setStatus({ type: 'success', msg: "Kelime başarıyla silindi ve bildirim kapatıldı!" });
      setTimeout(() => setStatus(null), 2000);
    } catch(e) { setStatus({ type: 'error', msg: e.message }); }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 w-full h-screen bg-gray-900/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative border-4 border-purple-200">
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors"><X size={32} /></button>
          <h2 className="text-3xl font-black text-purple-900 mb-6 flex items-center gap-3"><Lock className="text-purple-500" size={36} /> Yönetici Girişi</h2>

          <div className="space-y-4">
            {isForgotPassword ? (
              <div className="animate-fade-in">
                <div className="text-sm text-gray-500 mb-4">Şifrenizi yenilemek için yönetici e-posta adresinizi girin.</div>
                <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()} placeholder="bo................@gmail.com" className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold text-gray-800 focus:border-purple-500 outline-none shadow-inner" />
                {status && (<div className={`mt-4 p-3 rounded-xl font-bold flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border`}>{status.msg}</div>)}
                <div className="flex gap-3 mt-4">
                  <button onClick={handleResetPassword} className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black py-4 rounded-xl transition-all">GÖNDER</button>
                  <button onClick={() => { setIsForgotPassword(false); setStatus(null); setResetEmail(""); }} className="px-5 bg-gray-200 text-gray-600 font-bold rounded-xl transition-all">İptal</button>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="text-sm text-gray-500 mb-4">Panele erişmek için yönetici şifresini girin.</div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} placeholder="Şifre" className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold text-gray-800 focus:border-purple-500 outline-none shadow-inner" />
                {status && (<div className={`mt-4 p-3 rounded-xl font-bold flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border`}>{status.msg}</div>)}
                <div className="flex gap-3 mt-4">
                  <button onClick={handleLogin} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xl py-4 rounded-xl transition-all">GİRİŞ YAP</button>
                  <button onClick={() => { setIsForgotPassword(true); setStatus(null); }} className="w-16 bg-gray-100 rounded-xl text-3xl" title="Şifremi Unuttum">😔</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-screen bg-gray-900/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-4xl shadow-2xl relative border-4 border-purple-200 my-auto min-h-[60vh]">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors z-10"><X size={32} /></button>
        <h2 className="text-3xl font-black text-purple-900 mb-6 flex items-center gap-3"><Database className="text-purple-500" size={36} /> Yönetici Paneli</h2>

        <div className="flex flex-wrap gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => {setActiveTab('categories'); setSelectedCat(null); setStatus(null);}} className={`flex-1 min-w-[100px] py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'categories' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}><FolderTree size={18} /> Kategoriler</button>
          <button onClick={() => setActiveTab('review')} className={`flex-1 min-w-[120px] py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'review' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}><ListTodo size={18} /> Öneriler {suggestions.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{suggestions.length}</span>}</button>
          <button onClick={() => setActiveTab('stats')} className={`flex-1 min-w-[120px] py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'stats' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}><BarChart3 size={18} /> Üyeler / İstatistik</button>
          <button onClick={() => setActiveTab('reports')} className={`flex-1 min-w-[120px] py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'reports' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}><Flag size={18} /> Bildirimler {reports && reports.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1 animate-pulse">{reports.length}</span>}</button>
          <button onClick={() => setActiveTab('messages')} className={`flex-1 min-w-[120px] py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'messages' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}><Mail size={18} /> Mesajlar {messagesList?.filter(m => !m.isReadAdmin).length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1 animate-pulse">{messagesList.filter(m => !m.isReadAdmin).length}</span>}</button>
          <button onClick={() => setActiveTab('add')} className={`flex-1 min-w-[100px] py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'add' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}><Edit3 size={18} /> Tek Ekle</button>
          <button onClick={() => setActiveTab('import')} className={`flex-1 min-w-[100px] py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'import' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}><Upload size={18} /> Toplu Yükle</button>
        </div>

        {status && (
          <div className={`p-4 rounded-xl font-bold flex items-center gap-2 mb-4 ${status.type === 'success' ? 'bg-green-100 text-green-700 border-green-200' : status.type === 'info' ? 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse' : 'bg-red-100 text-red-700 border-red-200'}`}>
            {status.type === 'success' ? <Check size={20} /> : status.type === 'info' ? <Upload size={20} /> : <Info size={20} />} {status.msg}
          </div>
        )}

        {/* BİLDİRİMLER İÇERİĞİ */}
        {activeTab === 'reports' && (
          <div className="animate-fade-in max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {!reports || reports.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-medium flex flex-col items-center"><CheckCircle2 size={48} className="mb-4 text-green-300" />Şu an bekleyen hiçbir hata bildirimi yok. Harika!</div>
            ) : (
              reports.map(report => (
                <div key={report.id} className="bg-red-50 rounded-2xl p-4 border-2 border-red-100 mb-4 shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="bg-red-200 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{report.categoryName}</span>
                      <h4 className="font-black text-xl text-red-900 mt-1">{report.word}</h4>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-semibold text-gray-500">{new Date(report.timestamp).toLocaleDateString('tr-TR')}</span>
                      <span className="text-[10px] font-bold text-red-400 mt-0.5">@{report.reportedBy?.split('@')[0]}</span>
                    </div>
                  </div>
                  <div className="text-sm text-red-700 mb-3 bg-white p-3 rounded-lg border border-red-100 font-medium shadow-inner flex-1">
                    <strong className="text-gray-500 block mb-1 text-xs uppercase tracking-wider">Bildirim Sebebi:</strong> {report.reason}
                  </div>
                  <div className="text-xs text-gray-500 mb-4 font-medium">
                    <strong className="text-gray-400 uppercase tracking-wider">Yasaklı Kelimeler:</strong> {report.forbidden?.join(', ')}
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-red-200">
                    <button onClick={() => handleDeleteReport(report.id)} className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 border border-gray-200"><Check size={18} /> Sorun Yok (Kapat)</button>
                    <button onClick={() => handleDeleteReportedWord(report)} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"><Trash2 size={18} /> Kelimeyi Sil</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* MESAJLAR İÇERİĞİ */}
        {activeTab === 'messages' && (
          <div className="animate-fade-in max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {!messagesList || messagesList.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-medium flex flex-col items-center"><CheckCircle2 size={48} className="mb-4 text-green-300" />Şu an bekleyen hiçbir mesaj yok.</div>
            ) : (
              messagesList.map(msg => (
                <div key={msg.id} className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-100 mb-4 shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-black text-xl text-blue-900">{msg.username}</h4>
                      <span className="text-sm font-semibold text-gray-500">{msg.userEmail}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-semibold text-gray-500">{new Date(msg.lastUpdatedAt).toLocaleString('tr-TR')}</span>
                      {!msg.isReadAdmin && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-bold mt-1">YENİ</span>}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-inner flex-1 max-h-40 overflow-y-auto mb-3 space-y-2">
                    {(msg.thread || []).map((t, i) => (
                      <div key={i} className={`flex flex-col ${t.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                        <span className={`px-3 py-1.5 rounded-xl text-sm font-medium max-w-[85%] ${t.sender === 'admin' ? 'bg-purple-100 text-purple-800 rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                          {t.text}
                        </span>
                        <span className="text-[9px] text-gray-400 mt-0.5">{new Date(t.timestamp).toLocaleTimeString('tr-TR')}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 items-center pt-2 border-t border-blue-200">
                    <input 
                      type="text" 
                      value={adminReplyText[msg.id] || ""} 
                      onChange={(e) => setAdminReplyText(prev => ({...prev, [msg.id]: e.target.value}))} 
                      onKeyDown={(e) => e.key === 'Enter' && handleAdminReply(msg.id)}
                      placeholder="Kullanıcıya cevap yaz..." 
                      className="flex-1 border-2 border-white rounded-lg p-2 font-medium focus:outline-none focus:border-blue-400 shadow-sm"
                    />
                    <button onClick={() => handleAdminReply(msg.id)} className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"><Send size={20}/></button>
                    <button onClick={() => handleAdminDeleteMessage(msg.id)} className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors shadow-sm"><Trash2 size={20}/></button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* İSTATİSTİKLER VE ÜYELER SEKMESİ */}
        {activeTab === 'stats' && (
          <div className="animate-fade-in flex flex-col h-full max-h-[60vh]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-center shadow-sm">
                <div className="text-blue-500 font-bold text-sm uppercase mb-1">Toplam Üye</div>
                <div className="text-3xl font-black text-blue-800">{usersList.length}</div>
              </div>
              <div className="bg-green-50 border border-green-200 p-4 rounded-2xl text-center shadow-sm">
                <div className="text-green-500 font-bold text-sm uppercase mb-1">Aktif Üyeler</div>
                <div className="text-3xl font-black text-green-800">{usersList.filter(u => !u.isBanned).length}</div>
              </div>
              <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-center shadow-sm">
                <div className="text-red-500 font-bold text-sm uppercase mb-1">Engellenenler</div>
                <div className="text-3xl font-black text-red-800">{usersList.filter(u => u.isBanned).length}</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm">
                <Info className="text-purple-400 mb-1" size={20} />
                <div className="text-[10px] text-purple-700 font-semibold leading-tight">Ziyaretçi analizi için Google Analytics tavsiye edilir.</div>
              </div>
            </div>

            <div className="relative mb-4 flex-shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="text-gray-400" size={20} /></div>
              <input type="text" placeholder="E-posta adresine göre üye ara..." value={searchUser} onChange={(e) => setSearchUser(e.target.value.toLowerCase())} className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 font-semibold text-gray-700" />
            </div>

            <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar">
              {usersList.length === 0 ? (
                <div className="text-center py-8 text-gray-400 font-medium">Henüz kayıtlı üye bulunmuyor.</div>
              ) : (
                usersList.filter(u => u.email?.toLowerCase().includes(searchUser)).map(userObj => (
                    <div key={userObj.uid} className={`flex flex-col md:flex-row md:items-center justify-between p-4 mb-3 rounded-xl border-2 transition-colors ${userObj.isBanned ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 hover:border-purple-200'}`}>
                      <div className="flex flex-col mb-3 md:mb-0">
                        <span className={`font-black text-lg ${userObj.isBanned ? 'text-red-700 line-through' : 'text-gray-800'}`}>{userObj.email}</span>
                        <span className="text-xs font-bold text-gray-400 mt-1">Son Giriş: {userObj.lastLogin ? new Date(userObj.lastLogin).toLocaleString('tr-TR') : 'Bilinmiyor'}</span>
                      </div>
                      
                      <button onClick={() => handleToggleBan(userObj.uid, userObj.isBanned)} className={`px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${userObj.isBanned ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                        {userObj.isBanned ? <><ShieldCheck size={18} /> Engeli Kaldır</> : <><Ban size={18} /> Engelle</>}
                      </button>
                    </div>
                  ))
              )}
            </div>
            
          </div>
        )}

        {/* KATEGORİLER İÇERİSİNDE ALFABETİK GÖRÜNÜM */}
        {activeTab === 'categories' && (
          <div className="animate-fade-in flex flex-col h-full max-h-[60vh]">
            {!selectedCat ? (
              <div className="overflow-y-auto pr-2 custom-scrollbar">
                <h3 className="font-bold text-gray-500 uppercase tracking-widest text-sm mb-3">Mevcut Kategoriler (Resmi)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  {Object.keys(wordDatabase).map(catName => (
                    <div key={catName} className="bg-white border-2 border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-purple-200 transition-colors">
                      <div><div className="font-black text-lg text-gray-800">{catName}</div><div className="text-xs font-bold text-gray-500">{wordDatabase[catName].length} Kelime</div></div>
                      <button onClick={() => handleOpenCat('official', catName)} className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 font-bold flex items-center gap-2"><Edit2 size={16} /> Düzenle</button>
                    </div>
                  ))}
                </div>
                <h3 className="font-bold text-blue-500 uppercase tracking-widest text-sm mb-3 mt-6">Üyelerden (Onaylı)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  {customPublicGames.filter(g => g.status === 'approved').length === 0 ? (
                    <div className="col-span-2 text-center py-6 text-gray-400 font-medium">Onaylı üye oyunu yok.</div>
                  ) : (
                    customPublicGames.filter(g => g.status === 'approved').map(game => (
                      <div key={game.id} className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-blue-300 transition-colors">
                        <div>
                          <div className="font-black text-lg text-blue-800">{game.name}</div>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-200 px-2 py-0.5 rounded">{game.words?.length || 0} Kelime</span>
                            <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">@{game.ownerUsername || game.ownerEmail?.split('@')[0]}</span>
                          </div>
                        </div>
                        <button onClick={() => handleOpenCat('custom', game)} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold flex items-center gap-2 shadow-sm"><Edit2 size={16} /> Düzenle</button>
                      </div>
                    ))
                  )}
                </div>
                <h3 className="font-bold text-orange-500 uppercase tracking-widest text-sm mb-3">Onay Bekleyen Oyunlar (Üyelerden)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customPublicGames.filter(g => g.status === 'pending').length === 0 ? (
                    <div className="col-span-2 text-center py-6 text-gray-400 font-medium">Onay bekleyen oyun yok.</div>
                  ) : (
                    customPublicGames.filter(g => g.status === 'pending').map(game => (
                      <div key={game.id} className="bg-orange-50 border-2 border-orange-100 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-orange-300 transition-colors">
                        <div>
                          <div className="font-black text-lg text-orange-800">{game.name}</div>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-200 px-2 py-0.5 rounded">{game.words?.length || 0} Kelime</span>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">@{game.ownerEmail?.split('@')[0]}</span>
                          </div>
                        </div>
                        <button onClick={() => handleOpenCat('custom', game)} className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-bold flex items-center gap-2 shadow-sm"><Eye size={16} /> İncele</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3 bg-gray-50 p-4 rounded-xl border border-gray-200 flex-shrink-0">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={() => {setSelectedCat(null); setStatus(null); setConfirmDeleteCat(false); setSelectedWords([]);}} className="p-2 bg-white hover:bg-gray-100 rounded-full text-gray-600 shadow-sm transition-colors border border-gray-200 flex-shrink-0"><ArrowLeft size={24} /></button>
                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3">
                      <input value={editCatName} onChange={e => setEditCatName(e.target.value)} className="font-black text-2xl text-gray-800 bg-white border border-gray-300 px-3 py-1 rounded-lg focus:outline-none focus:border-purple-500 w-full md:w-auto" />
                      <button onClick={handleRenameCat} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-1.5 rounded-lg font-bold text-sm transition-colors flex-shrink-0 whitespace-nowrap">İsmi Kaydet</button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 flex-shrink-0 flex-wrap">
                    {selectedCat.type === 'official' ? (
                      <button onClick={handleMoveToCustom} className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-1 border border-indigo-200 whitespace-nowrap">
                        <Users size={16} /> Üyelere Taşı
                      </button>
                    ) : (
                      <button onClick={handleMoveToOfficial} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-1 border border-emerald-200 whitespace-nowrap">
                        <Database size={16} /> Resmiye Taşı
                      </button>
                    )}

                    {confirmDeleteCat ? (
                      <div className="flex items-center gap-2">
                        <button onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap">Eminim, Sil</button>
                        <button onClick={() => setConfirmDeleteCat(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors">İptal</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteCat(true)} className="bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-1 whitespace-nowrap border border-red-200">
                        <Trash2 size={16} /> Kategoriyi Sil
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center bg-purple-50 border border-purple-100 p-3 rounded-xl mb-3 flex-shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-900 select-none">
                    <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="w-5 h-5 accent-purple-600 cursor-pointer" /> Tümünü Seç ({rawWordList.length})
                  </label>
                  {selectedWords.length > 0 && (
                    <button onClick={handleDeleteSelectedWords} className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"><Trash2 size={16} /> Seçilenleri Sil ({selectedWords.length})</button>
                  )}
                </div>
                <div className="overflow-y-auto pr-2 flex-1 custom-scrollbar">
                  {sortedWordList.map((w, idx) => {
                    const originalIdx = rawWordList.findIndex(orig => orig.word === w.word);
                    return (
                      <AdminWordRow key={idx} wordObj={w} isSelected={selectedWords.includes(originalIdx)} onToggleSelect={() => handleSelectWord(originalIdx)} onSave={(newObj) => handleSaveWord(originalIdx, newObj)} onDelete={() => handleDeleteWord(originalIdx)} />
                    );
                  })}
                </div>
                {selectedCat.type === 'custom' && selectedCat.data.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3 flex-shrink-0">
                    <button onClick={() => handleApproveCustomGame(selectedCat.data.id)} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl shadow-[0_4px_0_rgb(21,128,61)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"><Check size={24} /> ONAYLA (HERKESE AÇ)</button>
                    <button onClick={() => handleRejectCustomGame(selectedCat.data)} className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2"><Lock size={20} /> ÖZEL YAP (REDDET)</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TEK / TOPLU EKLEME SEKMESİ */}
        {activeTab === 'add' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Kategori Seçimi</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border-2 border-purple-100 bg-purple-50 rounded-xl p-3 font-bold text-purple-900 focus:border-purple-500 outline-none cursor-pointer">
                {Object.keys(wordDatabase).map(cat => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Anlatılacak Kelime</label>
              <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="Örn: BİSİKLET" className="w-full border-2 border-gray-200 rounded-xl p-3 font-black text-2xl text-gray-800 focus:border-purple-500 outline-none uppercase placeholder:text-gray-300 shadow-inner" />
            </div>
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
              <label className=" text-red-600 font-bold mb-3 flex items-center gap-2"><X size={18} /> Yasaklı Kelimeler (5 Adet)</label>
              <div className="space-y-2">
                {forbidden.map((fw, i) => (
                  <input key={i} value={fw} onChange={(e) => { const newF = [...forbidden]; newF[i] = e.target.value; setForbidden(newF); }} placeholder={`${i + 1}. Yasaklı Kelime`} className="w-full border-2 border-red-200 bg-white rounded-xl p-3 font-bold text-gray-700 focus:border-red-500 outline-none capitalize shadow-sm" />
                ))}
              </div>
            </div>
            <button onClick={handleDirectSave} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xl py-4 rounded-xl shadow-[0_5px_0_rgb(67,56,202)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3 mt-4"><Save size={24} /> KAYDET</button>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="space-y-6 animate-fade-in max-h-[60vh] overflow-y-auto pr-2">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <h3 className="text-blue-800 font-bold mb-2 flex items-center gap-2"><FileJson size={20} /> Nasıl Yüklenir?</h3>
              <p className="text-sm text-blue-700 mb-4">Yüzlerce kelimeyi tek seferde yüklemek için kelimelerinizi bir <strong>.json</strong> dosyası olarak hazırlayın. Dosyanızın içeriği aşağıdaki örnekteki gibi görünmelidir:</p>
              <pre className="bg-white p-4 rounded-xl text-xs font-mono text-gray-700 border border-blue-100 overflow-x-auto shadow-inner">
{`[
  { "category": "Genel", "word": "ASTRONOT", "forbidden": ["Uzay", "Gemi", "Yıldız", "Gezegen", "Roket"] }
]`}
              </pre>
            </div>
            <div className="bg-purple-50 p-6 rounded-2xl border-2 border-dashed border-purple-300 flex flex-col items-center justify-center text-center">
              <Upload size={48} className="text-purple-400 mb-4" />
              <p className="font-bold text-purple-900 mb-2">JSON Dosyanızı Seçin</p>
              <label className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl cursor-pointer transition-colors shadow-md">
                <span>Dosya Seç ve Yükle</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl text-amber-700 text-sm border border-amber-200">
              <AlertTriangle size={24} className="flex-shrink-0" />
              <p>Mevcut kategorilere ait kelimeler direkt içine eklenir. Eğer json dosyasında yeni bir kategori ismi yazarsanız, sistem o kategoriyi otomatik olarak oluşturur.</p>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="animate-fade-in max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {suggestions.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-medium flex flex-col items-center"><CheckCircle2 size={48} className="mb-4 text-gray-300" /> Şu an bekleyen hiçbir kelime önerisi yok.</div>
            ) : (
              suggestions.map(sugg => (
                <SuggestionItemRow key={sugg.id} suggestion={sugg} wordDatabase={wordDatabase} onApprove={handleApproveSuggestion} onReject={handleRejectSuggestion} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};/* ==========================================
   BÖLÜM 4.6: TAKIM KURULUM KARTI (TEAM SETUP)
============================================= */
const TeamSetupCard = ({ title, teamName, setTeamName, playerCount, setPlayerCount, theme = "orange", otherTeamName }) => {
  const [history, setHistory] = useState([teamName || "Takım"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [animClassRight, setAnimClassRight] = useState('scale-100');
  const [animClassLeft, setAnimClassLeft] = useState('scale-100');

  const themeColors = {
    orange: {
      text: 'text-orange-600', badgeBg: 'bg-gradient-to-r from-orange-400 to-orange-500',
      buttonGradient: 'bg-[radial-gradient(circle,white_30%,#fdba74_130%)]',
      buttonHover: 'hover:bg-[radial-gradient(circle,white_10%,#fb923c_120%)]',
      border: 'border-orange-200', focusBorder: 'focus:border-orange-400',
      divider: 'bg-orange-200', iconHover: 'hover:bg-orange-100 text-orange-500 hover:text-orange-600',
      glow: 'shadow-[0_0_20px_rgba(249,115,22,0.5)]'
    },
    turquoise: {
      text: 'text-teal-600', badgeBg: 'bg-gradient-to-r from-teal-400 to-teal-500',
      buttonGradient: 'bg-[radial-gradient(circle,white_30%,#5eead4_130%)]',
      buttonHover: 'hover:bg-[radial-gradient(circle,white_10%,#2dd4bf_120%)]',
      border: 'border-teal-200', focusBorder: 'focus:border-teal-400',
      divider: 'bg-teal-200', iconHover: 'hover:bg-teal-100 text-teal-500 hover:text-teal-600',
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
    } while (newName.toLowerCase() === (otherTeamName || "").toLowerCase() || newName.toLowerCase() === (teamName || "").toLowerCase());
    return newName;
  };

  const triggerAnim = (dir) => {
    playClickSound();
    if (dir === 'right') { setAnimClassRight(`scale-75 ${colors.glow}`); setTimeout(() => setAnimClassRight('scale-100'), 150); } 
    else { setAnimClassLeft(`scale-75 ${colors.glow}`); setTimeout(() => setAnimClassLeft('scale-100'), 150); }
  };

  const handleRight = () => {
    triggerAnim('right');
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1; setHistoryIndex(nextIndex); setTeamName(history[nextIndex]);
    } else {
      const newName = generateName(); const newHistory = [...history, newName];
      setHistory(newHistory); setHistoryIndex(newHistory.length - 1); setTeamName(newName);
    }
  };

  const handleLeft = () => {
    if (historyIndex > 0) { triggerAnim('left'); const prevIndex = historyIndex - 1; setHistoryIndex(prevIndex); setTeamName(history[prevIndex]); }
  };

  const handlePlayerChange = (increment) => {
    playClickSound();
    const newValue = playerCount + increment;
    if (newValue >= 2 && newValue <= 10) setPlayerCount(newValue);
  };

  const isDuplicate = teamName.trim().toLowerCase() === (otherTeamName || "").trim().toLowerCase();

  return (
    <div className={`relative bg-white/95 backdrop-blur-md rounded-3xl md:rounded-[2rem] p-4 pt-8 md:p-6 md:pt-10 border-2 md:border-4 ${isDuplicate ? 'border-red-500' : colors.border} flex flex-col gap-4 md:gap-5 shadow-2xl w-full max-w-md transition-all hover:-translate-y-1 hover:shadow-3xl`}>
      <div className={`absolute -top-4 md:-top-5 left-1/2 -translate-x-1/2 px-6 md:px-8 py-1 md:py-2 rounded-full font-black text-white text-sm md:text-lg tracking-widest shadow-lg border-2 border-white/50 ${isDuplicate ? 'bg-red-500' : colors.badgeBg}`}>
        {title}
      </div>

      <div className="flex items-center justify-between space-x-2 md:space-x-3 w-full">
        <button onClick={handleLeft} disabled={historyIndex === 0} className={`p-2 md:p-3 rounded-full transition-all duration-200 shadow-md flex-shrink-0 ${animClassLeft} ${historyIndex === 0 ? 'bg-[radial-gradient(circle,white_40%,#e5e7eb_140%)] text-gray-400 cursor-not-allowed opacity-70' : `${colors.text} ${colors.buttonGradient} ${colors.buttonHover}`}`}>
          <ChevronLeft className="w-5 h-5 md:w-7 md:h-7" />
        </button>
        
        <input 
          type="text" 
          value={teamName} 
          onChange={(e) => setTeamName(e.target.value)} 
          onFocus={(e) => e.target.select()}
          className={`flex-1 min-w-0 text-center text-lg md:text-2xl font-black py-2 px-1 md:py-3 md:px-2 rounded-xl md:rounded-2xl bg-transparent border-2 ${isDuplicate ? 'border-red-500 text-red-600 focus:border-red-600 focus:bg-red-50' : `border-transparent ${colors.focusBorder} ${colors.text}`} focus:bg-white focus:outline-none transition-colors truncate`} 
          placeholder="Takım Adı" 
        />
        
        <button onClick={handleRight} className={`p-2 md:p-3 rounded-full flex-shrink-0 ${colors.text} ${colors.buttonGradient} ${colors.buttonHover} shadow-md transition-all duration-200 ${animClassRight}`}>
          <ChevronRight className="w-5 h-5 md:w-7 md:h-7" />
        </button>
      </div>

      <div className={`w-full h-px ${colors.divider} opacity-60 rounded-full`}></div>

      <div className="flex items-center justify-between px-1 md:px-2">
        <span className="text-gray-500 font-extrabold text-sm md:text-lg tracking-wide">Kişi Sayısı</span>
        <div className={`flex items-center gap-1 md:gap-2 bg-gray-50/80 rounded-xl md:rounded-2xl p-1 border-2 ${colors.border}`}>
          <button onClick={() => handlePlayerChange(-1)} disabled={playerCount <= 2} className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${playerCount <= 2 ? 'text-gray-300 cursor-not-allowed' : colors.iconHover}`}>
            <Minus className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} />
          </button>
          <span className={`font-black text-lg md:text-2xl w-6 md:w-8 text-center ${colors.text}`}>{playerCount}</span>
          <button onClick={() => handlePlayerChange(1)} disabled={playerCount >= 10} className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${playerCount >= 10 ? 'text-gray-300 cursor-not-allowed' : colors.iconHover}`}>
            <Plus className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ==========================================
   BÖLÜM 5: ANA UYGULAMA BİLEŞENİ (Deme.jsx)
   Tüm oyunun aktığı ana mekanizma.
============================================= */
export default function Deme() {
  // --- 1. UYGULAMA VE VERİTABANI DURUMLARI (STATES) ---
  const [user, setUser] = useState(null);
  const [wordDatabase, setWordDatabase] = useState(DEFAULT_WORD_DATABASE);
  const [suggestions, setSuggestions] = useState([]);
  const [customPublicGames, setCustomPublicGames] = useState([]);
  const [customPrivateGames, setCustomPrivateGames] = useState([]);
  const [reports, setReports] = useState([]); 
  const [dbError, setDbError] = useState(""); 

  // --- 2. ARAYÜZ VE MODAL DURUMLARI ---
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showMyGamesModal, setShowMyGamesModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false); 
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // --- 3. FORMLAR VE MESAJLAŞMA DURUMLARI ---
  const [reportReason, setReportReason] = useState(""); 
  const [reportStatus, setReportStatus] = useState(null); 
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStatus, setAuthStatus] = useState(null);
  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [messagesList, setMessagesList] = useState([]);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [userMsgText, setUserMsgText] = useState("");
  const [adminReplyText, setAdminReplyText] = useState({});

  // --- 4. OYUN KURULUM DURUMLARI ---
  const [setupStep, setSetupStep] = useState(0); 
  const [team1Name, setTeam1Name] = useState("Kırmızı Ejderler");
  const [team2Name, setTeam2Name] = useState("Mavi Aslanlar");
  const [team1Players, setTeam1Players] = useState(2);
  const [team2Players, setTeam2Players] = useState(2);
  const [settings, setSettings] = useState({
    timeLimit: 60, penalty: 1, passLimit: 3, endType: 'rounds', endRoundsValue: 6, endScoreValue: 50,
  });
  
  // --- 5. AKTİF OYUN DURUMLARI ---
  const [gameState, setGameState] = useState('setup'); 
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0); 
  const [scores, setScores] = useState([0, 0]);
  const [roundsPlayed, setRoundsPlayed] = useState([0, 0]); 
  const [outOfWords, setOutOfWords] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [currentWord, setCurrentWord] = useState(null);
  const [usedWords, setUsedWords] = useState([]);
  const [turnStats, setTurnStats] = useState({ correct: 0, taboo: 0, pass: 0 });
  const [passesLeft, setPassesLeft] = useState(0);

  // --- KAYDIRMA (SWIPE) DURUMLARI ---
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const gameRootRef = useRef(null); 

  /* ==========================================
     KULLANICI PROFİLİ VE GİRİŞ EFEKTLERİ
  ============================================= */
  useEffect(() => { document.title = "Deme"; }, []);

  useEffect(() => {
    let unsub = () => {};
    if (user && !user.isAnonymous) {
      const userRef = doc(db, 'artifacts', appId, 'userProfiles', user.uid);
      unsub = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().username) {
          setUsername(docSnap.data().username);
        } else if (user.email) {
          setUsername(user.email.split('@')[0].substring(0, 10));
        }
      });
    } else {
      setUsername("");
    }
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (isUsingUserFirebase) { await signInAnonymously(auth); } 
        else {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            try { await signInWithCustomToken(auth, __initial_auth_token); } 
            catch (tokenError) { await signInAnonymously(auth); }
          } else { await signInAnonymously(auth); }
        }
      } catch (e) {
        if (e.code === 'auth/operation-not-allowed' || e.code === 'auth/configuration-not-found') {
          setDbError("Firebase Auth Hatası: Lütfen Firebase Console'dan Anonim girişi aktif edin.");
        }
      }
    };
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) initAuth();
      else if (!currentUser.isAnonymous && currentUser.email) {
        try {
          const userRef = doc(db, 'artifacts', appId, 'userProfiles', currentUser.uid);
          await setDoc(userRef, { email: currentUser.email, lastLogin: Date.now(), isBanned: false }, { merge: true });
        } catch(e) {}
      }
    });
    
    return () => unsubscribe();
  }, []);

  /* ==========================================
     VERİTABANI (FIRESTORE) EFEKTLERİ
  ============================================= */
  useEffect(() => {
    if (!user || !db) return;
    
    const wordsRef = collection(db, 'artifacts', appId, 'public', 'data', 'categories');
    const unsubWords = onSnapshot(wordsRef, (snapshot) => {
      setDbError(""); 
      if (snapshot.empty) {
        Object.keys(DEFAULT_WORD_DATABASE).forEach(cat => {
          setDoc(doc(wordsRef, cat), { words: DEFAULT_WORD_DATABASE[cat] }).catch(() => {});
        });
      } else {
        const newDB = {};
        snapshot.forEach(document => { newDB[document.id] = document.data().words; });
        setWordDatabase(newDB);
      }
    }, (error) => {
      if (error.code === 'permission-denied' || error.message.includes('permission')) {
        setDbError("Veritabanı İzin Hatası: Lütfen Firebase Console'da veritabanınızı Test Moduna alın.");
      }
    });

    const suggsRef = collection(db, 'artifacts', appId, 'public', 'data', 'suggestions');
    const unsubSuggs = onSnapshot(suggsRef, (snapshot) => {
      const s = []; snapshot.forEach(d => s.push({ id: d.id, ...d.data() })); setSuggestions(s);
    });

    const reportsRef = collection(db, 'artifacts', appId, 'public', 'data', 'reports');
    const unsubReports = onSnapshot(reportsRef, (snapshot) => {
      const arr = []; snapshot.forEach(d => arr.push({ id: d.id, ...d.data() }));
      arr.sort((a,b) => b.timestamp - a.timestamp); setReports(arr);
    });

    const msgsRef = collection(db, 'artifacts', appId, 'messages');
    const unsubMsgs = onSnapshot(msgsRef, (snapshot) => {
      const arr = []; snapshot.forEach(d => arr.push({ id: d.id, ...d.data() }));
      arr.sort((a,b) => b.lastUpdatedAt - a.lastUpdatedAt); setMessagesList(arr);
    });

    const pubCustomRef = collection(db, 'artifacts', appId, 'public', 'data', 'customGames');
    const unsubPubCustom = onSnapshot(pubCustomRef, (snapshot) => {
      const arr = []; snapshot.forEach(d => arr.push({ id: d.id, ...d.data(), type: 'public' })); setCustomPublicGames(arr);
    });

    let unsubPrivCustom = () => {};
    if (user && !user.isAnonymous) {
      const privCustomRef = collection(db, 'artifacts', appId, 'users', user.uid, 'customGames');
      unsubPrivCustom = onSnapshot(privCustomRef, (snapshot) => {
        const arr = []; snapshot.forEach(d => arr.push({ id: d.id, ...d.data(), type: 'private' })); setCustomPrivateGames(arr);
      });
    } else { setCustomPrivateGames([]); }
    
    return () => { unsubWords(); unsubSuggs(); unsubPubCustom(); unsubPrivCustom(); unsubReports(); unsubMsgs();};
  }, [user]);

  /* ==========================================
     ZAMANLAYICI VE OYUN İÇİ EFEKTLER
  ============================================= */
  useEffect(() => {
    const handlePopState = (event) => {
      if (setupStep > 0) { 
        event.preventDefault(); setShowExitConfirmModal(true); window.history.pushState(null, '', window.location.href); 
      }
    };
    if (setupStep > 0) { window.history.pushState(null, '', window.location.href); window.addEventListener('popstate', handlePopState); }
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setupStep]);

  useEffect(() => {
    let timer;
    if (gameState === 'countdown' && countdown > 0) {
      playTickSound(1500); timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (gameState === 'countdown' && countdown === 0) {
      playCorrectSound(); setGameState('playing'); setTimeLeft(settings.timeLimit); setPassesLeft(settings.passLimit); setTurnStats({ correct: 0, taboo: 0, pass: 0 }); pickNextWord();
    }
    return () => clearTimeout(timer);
  }, [gameState, countdown]);

  useEffect(() => {
    let mainTimer; let soundTimers = [];
    if (showReportModal || gameState !== 'playing') return;

    if (timeLeft > 0) {
      mainTimer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      if (timeLeft > 10) { playTickSound(1000); } 
      else if (timeLeft > 3 && timeLeft <= 10) { playTickSound(1200); soundTimers.push(setTimeout(() => playTickSound(1200), 500)); } 
      else if (timeLeft <= 3) { playTickSound(1400); soundTimers.push(setTimeout(() => playTickSound(1400), 333)); soundTimers.push(setTimeout(() => playTickSound(1400), 666)); }
    } else if (timeLeft === 0) { playTimeUpSound(); endTurn(); }
    return () => { clearTimeout(mainTimer); soundTimers.forEach(clearTimeout); };
  }, [gameState, timeLeft, showReportModal]); 

  /* ==========================================
     FONKSİYONLAR - OYUN MANTIĞI VE YÖNETİM
  ============================================= */
  const minSwipeDistance = 50;
  const nextStep = () => setSetupStep(prev => prev + 1);
  const prevStep = () => setSetupStep(prev => Math.max(0, prev - 1));
  const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance; const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && setupStep < 3) {
      if (setupStep === 1 && team1Name.trim().toLowerCase() === team2Name.trim().toLowerCase()) return;
      nextStep();
    }
    if (isRightSwipe && setupStep > 0) prevStep();
  };

  const handleRequestFullscreen = () => {
    const element = gameRootRef.current;
    if (element && element.requestFullscreen) { element.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {}); } 
    else {
      if (element.webkitRequestFullscreen) { element.webkitRequestFullscreen(); setIsFullscreen(true); }
      else if (element.mozRequestFullScreen) { element.mozRequestFullScreen(); setIsFullscreen(true); }
      else if (element.msRequestFullscreen) { element.msRequestFullscreen(); setIsFullscreen(true); }
    }
  };

  const handleExitFullscreen = () => {
    if (document.exitFullscreen) { document.exitFullscreen().then(() => setIsFullscreen(false)); } 
    else {
      if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); setIsFullscreen(false); }
      else if (document.mozCancelFullScreen) { document.mozCancelFullScreen(); setIsFullscreen(false); }
      else if (document.msExitFullscreen) { document.msExitFullscreen(); setIsFullscreen(false); }
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) { setAuthStatus({ type: 'error', msg: "Lütfen e-posta ve şifre girin." }); return; }
    try {
      if (isLoginMode) await signInWithEmailAndPassword(auth, authEmail, authPassword);
      else await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      setAuthStatus({ type: 'success', msg: "Giriş Başarılı!" });
      setTimeout(() => { setShowAuthModal(false); setAuthStatus(null); }, 1000);
    } catch (error) { setAuthStatus({ type: 'error', msg: "Hata: " + error.message }); }
  };

  const handleLogout = async () => await signOut(auth);

  const handleSaveUsername = async () => {
    const forbiddenList = ["yönetici", "admin", "egiticioyun", "deme"];
    const newName = tempUsername.trim();
    if (newName.length === 0) { alert("Kullanıcı adı boş olamaz!"); return; }
    if (forbiddenList.some(fw => newName.toLowerCase().includes(fw))) { alert("Bu ismi kullanıcı adı olarak alamazsınız!"); return; }

    try {
      await updateDoc(doc(db, 'artifacts', appId, 'userProfiles', user.uid), { username: newName });
      setIsEditingUsername(false);
    } catch (error) { alert("Kullanıcı adı güncellenirken hata oluştu."); }
  };

  const startGameFlow = (catId, catName, catWords) => {
    setSelectedCategory({ id: catId, name: catName, words: catWords });
    setGameState('preGame'); setCurrentTeamIndex(0); setScores([0, 0]); setRoundsPlayed([0, 0]); setUsedWords([]); setOutOfWords(false);
  };

  const startTurn = () => { setGameState('countdown'); setCountdown(3); };

  const pickNextWord = () => {
    const categoryWords = selectedCategory?.words && selectedCategory.words.length > 0 ? selectedCategory.words : wordDatabase["Genel"];
    const availableWords = categoryWords.filter(w => !usedWords.includes(w.word));
    
    if (availableWords.length === 0) {
      setOutOfWords(true); setGameState('gameOver'); return; 
    } else {
      const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
      setCurrentWord(randomWord); setUsedWords(prev => [...prev, randomWord.word]);
    }
  };

  const handleAction = (type) => {
    if (gameState !== 'playing' || showReportModal) return;
    let pointsChange = 0; const newStats = { ...turnStats };

    if (type === 'correct') {
      playCorrectSound(); pointsChange = 1; newStats.correct++;
      const newScores = [...scores]; newScores[currentTeamIndex] += pointsChange;
      setScores(newScores); setTurnStats(newStats); pickNextWord();
    } else if (type === 'taboo') {
      playTabooSound(); pointsChange = -settings.penalty; newStats.taboo++;
      const newScores = [...scores]; newScores[currentTeamIndex] += pointsChange;
      setScores(newScores); setTurnStats(newStats); pickNextWord();
    } else if (type === 'pass') {
      if (passesLeft > 0 || settings.passLimit === 999) {
        playPassSound(); newStats.pass++;
        if (settings.passLimit !== 999) setPassesLeft(prev => prev - 1);
        setTurnStats(newStats); pickNextWord();
      }
    }
  };

  const endTurn = () => {
    setGameState('turnSummary');
    const newRounds = [...roundsPlayed]; newRounds[currentTeamIndex] += 1; setRoundsPlayed(newRounds);
  };

  const handleNextTurn = () => {
    let isGameOver = false;
    if (roundsPlayed[0] === roundsPlayed[1]) {
      if (settings.endType === 'rounds' && roundsPlayed[0] >= settings.endRoundsValue) isGameOver = true;
      else if (settings.endType === 'score' && (scores[0] >= settings.endScoreValue || scores[1] >= settings.endScoreValue)) isGameOver = true;
    }
    if (isGameOver) setGameState('gameOver');
    else { setCurrentTeamIndex(prev => (prev === 0 ? 1 : 0)); setGameState('preGame'); }
  };

  const returnToMainMenu = () => {
    if (gameState === 'playing') setShowExitConfirmModal(true);
    else { setGameState('setup'); setSetupStep(0); setOutOfWords(false); }
  };

  const handleConfirmExit = () => {
    setShowExitConfirmModal(false); setGameState('setup'); setSetupStep(0); setOutOfWords(false);
  };

  const handleReportSubmit = async () => {
    if (!reportReason.trim()) { setReportStatus({ type: 'error', msg: "Lütfen bir sebep belirtin." }); return; }
    try {
      setReportStatus({ type: 'info', msg: "Gönderiliyor..." });
      const repRef = collection(db, 'artifacts', appId, 'public', 'data', 'reports');
      await addDoc(repRef, {
        categoryId: selectedCategory?.id || "official", categoryName: selectedCategory?.name || "Bilinmiyor",
        word: currentWord.word, forbidden: currentWord.forbidden, reason: reportReason.trim(),
        timestamp: Date.now(), reportedBy: user && !user.isAnonymous ? user.email : "Anonim",
        isCustomGame: selectedCategory?.id !== selectedCategory?.name
      });
      setReportStatus({ type: 'success', msg: "Katkılarınız için teşekkür ederiz!" });
      setTimeout(() => { setShowReportModal(false); setReportReason(""); setReportStatus(null); }, 2000);
    } catch(e) { setReportStatus({ type: 'error', msg: "Hata oluştu: " + e.message }); }
  };

  const handleSendMessage = async () => {
    if (!userMsgText.trim()) return;
    const msgRef = doc(db, 'artifacts', appId, 'messages', user.uid);
    const newMessage = { sender: 'user', text: userMsgText.trim(), timestamp: Date.now() };

    try {
      const existing = messagesList.find(m => m.id === user.uid);
      if (existing) {
        await updateDoc(msgRef, { thread: [...(existing.thread || []), newMessage], lastUpdatedAt: Date.now(), isReadAdmin: false });
      } else {
        await setDoc(msgRef, {
          userId: user.uid, userEmail: user.email, username: username || user.email?.split('@')[0] || "İsimsiz",
          thread: [newMessage], lastUpdatedAt: Date.now(), isReadAdmin: false, isReadUser: true
        });
      }
      setUserMsgText("");
    } catch (e) { alert("Mesaj gönderilemedi: " + e.message); }
  };

  const handleAdminReply = async (userId) => {
    const text = adminReplyText[userId];
    if (!text || !text.trim()) return;
    
    const msgRef = doc(db, 'artifacts', appId, 'messages', userId);
    const existing = messagesList.find(m => m.id === userId);
    const newMessage = { sender: 'admin', text: text.trim(), timestamp: Date.now() };

    try {
      await updateDoc(msgRef, { thread: [...(existing.thread || []), newMessage], lastUpdatedAt: Date.now(), isReadUser: false, isReadAdmin: true });
      setAdminReplyText(prev => ({ ...prev, [userId]: "" }));
    } catch(e) { alert("Cevap gönderilemedi: " + e.message); }
  };

  const handleAdminDeleteMessage = async (userId) => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'messages', userId)); } 
    catch(e) { alert("Silinemedi: " + e.message); }
  };

  const markUserMessageAsRead = async () => {
    const existing = messagesList.find(m => m.id === user?.uid);
    if (existing && !existing.isReadUser) {
      try { await updateDoc(doc(db, 'artifacts', appId, 'messages', user.uid), { isReadUser: true }); } 
      catch(e) {}
    }
  };
/* ==========================================
     BÖLÜM 6: RENDER (ARAYÜZ ÇİZİMİ)
  ============================================= */

  if (showAdmin) return <AdminModal onClose={() => setShowAdmin(false)} wordDatabase={wordDatabase} suggestions={suggestions} customPublicGames={customPublicGames} reports={reports} messagesList={messagesList} adminReplyText={adminReplyText} setAdminReplyText={setAdminReplyText} handleAdminReply={handleAdminReply} handleAdminDeleteMessage={handleAdminDeleteMessage} />;
  if (showSuggestionModal) return <SuggestionModal onClose={() => setShowSuggestionModal(false)} wordDatabase={wordDatabase} user={user} />;
  
  const myGames = [...customPublicGames, ...customPrivateGames].filter(g => g.ownerId === user?.uid);
  if (showMyGamesModal) return <MyGamesModal onClose={() => setShowMyGamesModal(false)} user={user} myGames={myGames} username={username} />;

  if (showAuthModal) {
    return (
      <div className="fixed inset-0 w-full h-screen bg-gray-900/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative border-4 border-purple-200">
          <button onClick={() => {setShowAuthModal(false); setAuthStatus(null);}} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors"><X size={32} /></button>
          
          <h2 className="text-3xl font-black text-purple-900 mb-6 flex items-center gap-3">
            {isLoginMode ? <LogIn className="text-purple-500" size={36} /> : <UserPlus className="text-purple-500" size={36} />}
            {isLoginMode ? "Giriş Yap" : "Kayıt Ol"}
          </h2>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1 font-bold">E-posta</label>
              <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold text-gray-800 focus:border-purple-500 outline-none shadow-inner" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1 font-bold">Şifre</label>
              <input type="password" required minLength="6" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold text-gray-800 focus:border-purple-500 outline-none shadow-inner" />
            </div>
            
            {authStatus && (
              <div className={`p-3 rounded-xl font-bold flex items-center gap-2 ${authStatus.type === 'success' ? 'bg-green-100 text-green-700 border-green-200' : authStatus.type === 'info' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-red-100 text-red-700 border-red-200'} border`}>
                {authStatus.type === 'success' ? <Check size={20} /> : <Info size={20} />} {authStatus.msg}
              </div>
            )}

            <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xl py-4 rounded-xl shadow-[0_5px_0_rgb(67,56,202)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3 mt-2">
              {isLoginMode ? "GİRİŞ YAP" : "KAYIT OL"}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-gray-100 pt-4">
            <p className="text-gray-500 text-sm font-bold">{isLoginMode ? "Hesabınız yok mu?" : "Zaten bir hesabınız var mı?"}</p>
            <button type="button" onClick={() => { setIsLoginMode(!isLoginMode); setAuthStatus(null); }} className="text-purple-600 hover:text-purple-800 font-black mt-1 transition-colors">
              {isLoginMode ? "Yeni Hesap Oluştur" : "Mevcut Hesaba Giriş Yap"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- PROFİL MENÜSÜ GÖRÜNÜMÜ ---
  if (showProfileMenu) {
    const myMsgDoc = messagesList.find(m => m.id === user?.uid);
    const hasUnread = myMsgDoc && !myMsgDoc.isReadUser;

    return (
      <div className="fixed inset-0 w-full h-screen bg-gray-900/60 flex items-center justify-center p-4 z-[110] backdrop-blur-sm">
        <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-sm shadow-2xl relative border-4 border-blue-200 animate-bounce-short">
          
          <button onClick={() => {setShowProfileMenu(false); setIsEditingUsername(false); setIsMessageOpen(false);}} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
            <X size={28} />
          </button>

          <button onClick={() => { setIsMessageOpen(!isMessageOpen); if (!isMessageOpen) markUserMessageAsRead(); }} className="absolute top-4 left-4 text-gray-400 hover:text-blue-500 transition-colors relative">
            <Mail size={28} />
            {hasUnread && !isMessageOpen && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">1</span>
            )}
          </button>

          {!isMessageOpen ? (
            <>
              <div className="text-center mb-8 mt-2">
                <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-md">
                  <User size={40} />
                </div>
                {isEditingUsername ? (
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <input type="text" maxLength={10} value={tempUsername} onChange={(e) => setTempUsername(e.target.value)} className="border-2 border-blue-300 rounded-lg px-2 py-1 text-center font-black text-gray-800 w-32 focus:outline-none focus:border-blue-500 uppercase" autoFocus />
                    <button onClick={handleSaveUsername} className="bg-green-500 text-white p-1.5 rounded-lg hover:bg-green-600 transition-colors"><Check size={16}/></button>
                    <button onClick={() => setIsEditingUsername(false)} className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"><X size={16}/></button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 mb-2 group cursor-pointer" onClick={() => { setTempUsername(username); setIsEditingUsername(true); }} title="Kullanıcı adını değiştir">
                    <h2 className="font-black text-2xl text-gray-800 uppercase tracking-wide">{username}</h2>
                    <Edit2 size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                )}
                <h3 className="font-bold text-gray-500 text-sm truncate px-2 mb-2">{user?.email}</h3>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full border border-green-200 inline-block shadow-sm">Aktif Üye</span>
              </div>
              <div className="space-y-3">
                <button onClick={() => { setShowProfileMenu(false); setShowMyGamesModal(true); }} className="w-full bg-blue-50 hover:bg-blue-500 hover:text-white text-blue-600 font-black py-4 rounded-xl transition-all shadow-sm border border-blue-100 flex items-center justify-center gap-3 group">
                  <Gamepad2 size={24} className="group-hover:scale-110 transition-transform" /> OYUNLARIM
                </button>
                <button onClick={() => { setShowProfileMenu(false); setShowSuggestionModal(true); }} className="w-full bg-yellow-50 hover:bg-yellow-400 hover:text-gray-900 text-yellow-600 font-black py-4 rounded-xl transition-all shadow-sm border border-yellow-100 flex items-center justify-center gap-3 group">
                  <MessageSquarePlus size={24} className="group-hover:scale-110 transition-transform" /> KELİME ÖNER
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col h-72 mt-8">
                <h3 className="font-black text-lg text-blue-800 mb-2 border-b border-blue-100 pb-2 flex items-center gap-2"><Mail size={18}/> Yöneticiye Mesaj</h3>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  {myMsgDoc?.thread?.length > 0 ? (
                    myMsgDoc.thread.map((t, idx) => (
                      <div key={idx} className={`flex flex-col ${t.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`px-3 py-2 rounded-xl text-sm font-medium max-w-[85%] ${t.sender === 'user' ? 'bg-blue-500 text-white rounded-tr-none shadow-sm' : 'bg-white text-gray-800 rounded-tl-none border border-gray-200 shadow-sm'}`}>
                          {t.text}
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1">{new Date(t.timestamp).toLocaleTimeString('tr-TR')}</span>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-center text-sm font-bold text-gray-400">Henüz mesajlaşma yok.<br/>İlk mesajınızı aşağıdan gönderebilirsiniz.</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input type="text" maxLength={200} value={userMsgText} onChange={(e) => setUserMsgText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Yöneticiye mesaj göndermek isterseniz tıklayın..." className="flex-1 border-2 border-gray-200 rounded-xl p-2 text-xs font-medium focus:outline-none focus:border-blue-500" />
                  <button onClick={handleSendMessage} className="bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600 transition-all shadow-sm"><Send size={20}/></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const visiblePublicGames = customPublicGames.filter(g => g.status === 'approved' || g.ownerId === user?.uid);
  const customCategoriesList = [...visiblePublicGames, ...customPrivateGames];

  if (gameState === 'setup') {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden font-sans flex flex-col">
        <div 
          className="flex-1 flex transition-transform duration-700 ease-in-out w-full h-full"
          style={{ transform: `translateX(-${setupStep * 100}%)` }}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={handleTouchEnd}
        >
          {/* STEP 0: ANA EKRAN */}
          <div className="min-w-full h-full flex flex-col items-center justify-start pt-10 md:justify-center md:pt-6 p-6 relative overflow-y-auto">
            <Link to="/" className="mb-5 md:mb-8 hover:scale-105 transition-transform z-[100] shrink-0" title="Ana Sayfaya Dön">
                <img src="/anasayfa.png" alt="Eğitici Oyunlar" className="w-48 sm:w-64 md:w-80 object-contain drop-shadow-xl rounded-3xl" />
            </Link>

            <div className="bg-white/20 p-6 md:p-8 rounded-[3rem] backdrop-blur-sm border border-white/30 shadow-2xl flex flex-col items-center shrink-0 w-full max-w-[90%] md:max-w-md">
              <img src="/deme_logo.png" alt="Oyun Logosu" className="w-full max-w-[280px] md:max-w-[400px] h-auto mb-6 drop-shadow-2xl hover:scale-105 transition-transform duration-300" />
              <p className="text-white/90 text-xl md:text-2xl mb-8 md:mb-12 text-center font-medium">Yasaklı kelimeleri kullanmadan takım arkadaşlarına kelimeyi anlat!</p>
              <div className="w-32 h-[2px] bg-white/30 mb-8 rounded-full"></div>
              
              <div className="flex flex-col items-center gap-4 w-full">
                {dbError && (
                  <div className="bg-red-500/90 text-white p-4 rounded-xl shadow-lg border-2 border-red-300 text-sm max-w-md text-center mb-2 animate-pulse flex flex-col items-center gap-2">
                    <Info size={24} /> <p className="font-bold">{dbError}</p>
                  </div>
                )}
                <button onClick={nextStep} className="group relative px-12 py-6 bg-yellow-400 hover:bg-yellow-300 text-purple-900 text-3xl font-bold rounded-full shadow-[0_10px_0_rgb(202,138,4)] hover:shadow-[0_5px_0_rgb(202,138,4)] hover:translate-y-1 transition-all flex items-center gap-4 mb-2">
                  <Play fill="currentColor" size={32} /> OYNA
                </button>

                <div className="flex flex-col items-center gap-4 mt-2 w-full max-w-[320px]">
                  {(!user || user.isAnonymous) ? (
                    <div className="flex items-center justify-center gap-2 w-full">
                      <button onClick={() => { setShowAuthModal(true); setIsLoginMode(true); }} className="flex-1 px-4 py-3.5 bg-white text-purple-700 font-bold rounded-xl shadow-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 hover:scale-105 whitespace-nowrap text-sm sm:text-base">
                        <User size={20} /> Giriş Yap / Kayıt Ol
                      </button>
                      <button onClick={() => setShowAdmin(true)} className="p-3.5 bg-transparent hover:bg-white/10 text-white/80 hover:text-white rounded-xl transition-colors flex items-center justify-center border border-white/30 shadow-sm hover:scale-105 flex-shrink-0" title="Yönetici Girişi">
                        <Lock size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 w-full">
                      <button onClick={() => setShowProfileMenu(true)} className="flex-1 px-4 py-3.5 bg-white text-blue-600 font-black rounded-xl shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2 hover:scale-105 whitespace-nowrap text-sm sm:text-base border-b-4 border-blue-200 active:border-b-0 active:translate-y-1">
                        <User size={20} /> Profilim
                      </button>
                      <button onClick={handleLogout} className="p-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all shadow-lg hover:scale-105 border-b-4 border-red-700 active:border-b-0 active:translate-y-1 flex-shrink-0" title="Çıkış Yap">
                        <LogOut size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 1: TAKIM ADLARI */}
          <div className="min-w-full h-full flex flex-col items-center justify-start p-4 pt-14 md:p-6 md:pt-20 pb-20 relative overflow-y-auto">
            <div className="absolute top-3 left-3 md:top-6 md:left-6 z-10">
              <button onClick={prevStep} className="text-white/80 hover:text-white flex items-center text-lg font-bold">
                <ChevronLeft size={24} /> Geri
              </button>
            </div>
            
            <div className="bg-white/20 backdrop-blur-md px-6 md:px-10 py-2 md:py-4 rounded-2xl border border-white/30 shadow-lg mb-6 md:mb-8 flex-shrink-0 flex items-center justify-center gap-2 md:gap-3">
              <h2 className="text-2xl md:text-4xl font-black text-white tracking-wide text-center">Takımları Belirle</h2>
            </div>
            
            <div className="w-full max-w-md flex flex-col gap-6 md:gap-12 mt-2 flex-shrink-0">
              <TeamSetupCard title="1. TAKIM" teamName={team1Name} setTeamName={setTeam1Name} playerCount={team1Players} setPlayerCount={setTeam1Players} theme="orange" otherTeamName={team2Name} />
              <TeamSetupCard title="2. TAKIM" teamName={team2Name} setTeamName={setTeam2Name} playerCount={team2Players} setPlayerCount={setTeam2Players} theme="turquoise" otherTeamName={team1Name} />
            </div>
            
            {team1Name.trim().toLowerCase() === team2Name.trim().toLowerCase() ? (
              <div className="mt-8 bg-red-500/90 text-white px-6 py-3 rounded-full font-bold shadow-lg backdrop-blur-sm animate-bounce flex items-center gap-2 border-2 border-white/50 flex-shrink-0">
                <Info size={20} /> Takım isimleri birbirinden farklı olmalıdır!
              </div>
            ) : (
              <button onClick={nextStep} className="mt-6 px-6 py-2 bg-white text-purple-700 hover:bg-gray-100 rounded-full font-bold text-base flex items-center gap-2 transition-all shadow-md hover:scale-105 hover:shadow-lg flex-shrink-0">
                İLERİ <ArrowRight size={18} strokeWidth={3} />
              </button>
            )}
          </div>

          {/* STEP 2: AYARLAR */}
          <div className="min-w-full h-full flex flex-col items-center justify-start p-4 pt-14 md:p-6 md:pt-20 pb-24 relative overflow-y-auto">
            <div className="absolute top-3 left-3 md:top-6 md:left-6 z-10">
              <button onClick={prevStep} className="text-white/80 hover:text-white flex items-center text-lg font-bold"><ChevronLeft size={24} /> Geri</button>
            </div>
            
            <div className="bg-white/20 backdrop-blur-md px-6 md:px-10 py-2 md:py-4 rounded-2xl border border-white/30 shadow-lg mb-6 md:mb-8 flex-shrink-0 flex items-center justify-center gap-2 md:gap-3">
              <Settings className="text-white w-6 h-6 md:w-8 md:h-8" />
              <h2 className="text-2xl md:text-4xl font-black text-white tracking-wide text-center">Oyun Ayarları</h2>
            </div>
            
            <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-3xl shadow-2xl flex-shrink-0">
              <div className="space-y-8">
                <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 shadow-sm">
                  <label className="block text-lg font-bold text-purple-900 mb-3">Anlatma Süresi (Saniye)</label>
                  <div className="flex flex-wrap gap-2">
                    {[15, 30, 45, 60, 75, 90, 105, 120].map(val => (
                      <button key={val} onClick={() => setSettings({...settings, timeLimit: val})} className={`px-4 py-2 rounded-xl font-bold transition-all ${settings.timeLimit === val ? 'bg-purple-600 text-white shadow-lg scale-105' : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-100 shadow-sm'}`}>
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
                        <button key={val} onClick={() => setSettings({...settings, penalty: val})} className={`flex-1 py-3 rounded-xl font-bold transition-all ${settings.penalty === val ? 'bg-red-500 text-white shadow-lg scale-105' : 'bg-white text-red-600 border border-red-200 hover:bg-red-100 shadow-sm'}`}>
                          -{val}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 shadow-sm">
                    <label className="block text-lg font-bold text-amber-900 mb-3">Pas Hakkı</label>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 999].map(val => (
                        <button key={val} onClick={() => setSettings({...settings, passLimit: val})} className={`px-3 py-3 flex-1 rounded-xl font-bold transition-all ${settings.passLimit === val ? 'bg-yellow-400 text-gray-900 shadow-lg scale-105' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-100 shadow-sm'}`}>
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
                      <input type="radio" name="endType" checked={settings.endType === 'rounds'} onChange={() => setSettings({...settings, endType: 'rounds'})} className="w-5 h-5 text-purple-600 mt-1 md:mt-0 flex-shrink-0" />
                      <div className="flex-1 flex flex-wrap items-center gap-x-2 gap-y-2 text-base md:text-lg">
                        <span className="font-semibold text-gray-700 whitespace-nowrap">Her takım</span>
                        <select disabled={settings.endType !== 'rounds'} value={settings.endRoundsValue} onChange={(e) => setSettings({...settings, endRoundsValue: parseInt(e.target.value)})} className="bg-white border rounded-lg px-2 py-1 font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm">
                          {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span className="font-semibold text-gray-700 whitespace-nowrap">kez anlattığında.</span>
                      </div>
                    </label>

                    <label className={`flex items-start md:items-center gap-3 md:gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all ${settings.endType === 'score' ? 'border-purple-500 bg-purple-50' : 'border-transparent bg-white shadow-sm'}`}>
                      <input type="radio" name="endType" checked={settings.endType === 'score'} onChange={() => setSettings({...settings, endType: 'score'})} className="w-5 h-5 text-purple-600 mt-1 md:mt-0 flex-shrink-0" />
                      <div className="flex-1 flex flex-wrap items-center gap-x-2 gap-y-2 text-base md:text-lg">
                        <span className="font-semibold text-gray-700 whitespace-nowrap">Toplam skor</span>
                        <select disabled={settings.endType !== 'score'} value={settings.endScoreValue} onChange={(e) => setSettings({...settings, endScoreValue: parseInt(e.target.value)})} className="bg-white border rounded-lg px-2 py-1 font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm">
                          {Array.from({length: 20}, (_, i) => (i+1)*5).map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span className="font-semibold text-gray-700 whitespace-nowrap">olduğunda.</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={nextStep} className="mt-6 mb-8 px-6 py-2 bg-white text-purple-700 hover:bg-gray-100 rounded-full font-bold text-base flex items-center gap-2 transition-all shadow-md hover:scale-105 hover:shadow-lg flex-shrink-0">
              İLERİ <ArrowRight size={18} strokeWidth={3} />
            </button>
          </div>

          {/* STEP 3: KATEGORİ SEÇİMİ */}
          <div className="min-w-full h-full flex flex-col items-center justify-start p-4 pt-14 md:p-6 md:pt-20 pb-20 relative overflow-y-auto">
            <div className="absolute top-3 left-3 md:top-6 md:left-6 z-10">
              <button onClick={prevStep} className="text-white/80 hover:text-white flex items-center text-lg font-bold"><ChevronLeft size={24} /> Geri</button>
            </div>
            
            <div className="bg-white/20 backdrop-blur-md px-6 md:px-10 py-2 md:py-4 rounded-2xl border border-white/30 shadow-lg mb-6 md:mb-8 flex-shrink-0 flex items-center justify-center gap-2 md:gap-3">
              <h2 className="text-2xl md:text-4xl font-black text-white tracking-wide text-center">Kategori Seç</h2>
            </div>
            
            <div className="w-full max-w-5xl px-2 md:px-4 flex flex-col items-center">
              
              <div className="w-full mb-8 md:mb-12">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 border-b border-white/20 pb-2 md:pb-3">
                  <Database className="text-yellow-400 w-6 h-6 md:w-7 md:h-7" />
                  <h3 className="text-xl md:text-3xl font-bold text-white/90 text-left">Resmi Kategoriler</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
                  {Object.keys(wordDatabase).map((catName) => {
                    const defaultCat = CATEGORY_LIST.find(c => c.name === catName);
                    const Icon = defaultCat ? defaultCat.icon : Database;
                    const color = defaultCat ? defaultCat.color : "text-blue-500";
                    const gradient = defaultCat ? defaultCat.gradient : "from-blue-100 to-blue-200";

                    return (
                      <button
                        key={catName} onClick={() => startGameFlow(catName, catName, wordDatabase[catName] || [])}
                        className="relative overflow-hidden bg-white/95 backdrop-blur-sm text-gray-800 rounded-2xl md:rounded-[2.5rem] p-4 md:p-10 flex flex-col items-center justify-center gap-3 md:gap-6 shadow-[0_8px_16px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:-translate-y-2 md:hover:-translate-y-3 transition-all duration-300 group border-2 md:border-4 border-white/40"
                      >
                        <Icon className={`absolute -bottom-4 -right-4 md:-bottom-8 md:-right-8 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-500 ${color} w-24 h-24 md:w-48 md:h-48`} />
                        <div className={`w-14 h-14 md:w-32 md:h-32 bg-gradient-to-br ${gradient} rounded-xl md:rounded-[2rem] flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-inner relative z-10 border-2 md:border-4 border-white`}>
                          <Icon className={`${color} drop-shadow-md w-6 h-6 md:w-16 md:h-16`} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col items-center relative z-10">
                          <span className="text-base md:text-3xl font-black tracking-wide text-center leading-tight">{catName}</span>
                          <span className="text-[11px] md:text-sm font-bold text-gray-500 mt-1">({wordDatabase[catName] ? wordDatabase[catName].length : 0} Kelime)</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {customCategoriesList.length > 0 && (
                <div className="w-full">
                  <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 border-b border-white/20 pb-2 md:pb-3">
                    <Users className="text-blue-300 w-6 h-6 md:w-7 md:h-7" />
                    <h3 className="text-xl md:text-3xl font-bold text-white/90 text-left">Üyelerden & Oyunlarım</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
                    {customCategoriesList.map((custom) => (
                      <button
                        key={custom.id} onClick={() => startGameFlow(custom.id, custom.name, custom.words)}
                        className="relative overflow-hidden bg-white/95 backdrop-blur-sm text-gray-800 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 flex flex-col items-center justify-center gap-2 md:gap-4 shadow-[0_8px_16px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] hover:-translate-y-2 transition-all duration-300 group border-2 md:border-4 border-white/40"
                      >
                        <div className={`w-12 h-12 md:w-20 md:h-20 bg-gradient-to-br ${custom.type === 'private' ? 'from-purple-100 to-purple-200' : 'from-blue-100 to-blue-200'} rounded-xl md:rounded-3xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-inner border-2 border-white`}>
                          {custom.type === 'private' ? <Lock className="text-purple-500 drop-shadow-md w-6 h-6 md:w-9 md:h-9" /> : <Gamepad2 className="text-blue-500 drop-shadow-md w-6 h-6 md:w-9 md:h-9" />}
                        </div>
                        <div className="flex flex-col items-center mt-1 md:mt-2">
                          <span className="text-sm md:text-2xl font-black tracking-wide text-center leading-tight">{custom.name}</span>
                          <span className="text-[10px] md:text-sm font-bold text-gray-500 mt-1">({custom.words?.length || 0} Kelime)</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 mt-1">
                          {custom.type === 'public' && custom.ownerEmail && (
                            <span className="text-[9px] md:text-[11px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">@{custom.ownerUsername || custom.ownerEmail?.split('@')[0]}</span>
                          )}
                          {custom.type === 'private' && (
                            <span className="text-[9px] md:text-[11px] font-bold text-purple-500 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">Bana Özel</span>
                          )}
                          {custom.type === 'public' && custom.status === 'pending' && (
                            <span className="text-[9px] md:text-[11px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 mt-0.5 md:mt-1">Onay Bekliyor</span>
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

  const currentTeamName = currentTeamIndex === 0 ? team1Name : team2Name;

  if (gameState === 'preGame') {
    return (
      <div className="w-full h-screen bg-blue-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8">
          <p className="text-2xl text-blue-300 font-bold mb-2">Sıra şu takımda:</p>
          <h1 className="text-6xl font-black text-yellow-400 drop-shadow-lg">{currentTeamName}</h1>
        </div>
        <div className="flex gap-12 mb-16 opacity-80">
          <div><p className="text-sm uppercase tracking-wider">{team1Name}</p><p className="text-3xl font-bold">{scores[0]} Puan</p></div>
          <div className="w-px bg-white/20"></div>
          <div><p className="text-sm uppercase tracking-wider">{team2Name}</p><p className="text-3xl font-bold">{scores[1]} Puan</p></div>
        </div>
        <button onClick={startTurn} className="px-16 py-6 bg-green-500 hover:bg-green-400 text-white text-4xl font-bold rounded-full shadow-[0_10px_0_rgb(22,163,74)] hover:shadow-[0_5px_0_rgb(22,163,74)] hover:translate-y-1 transition-all">HAZIRIZ, BAŞLA!</button>
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
      <div ref={gameRootRef} className="w-full h-[100dvh] bg-gray-50 flex flex-col font-sans relative">
        {showReportModal && (
          <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-md shadow-2xl flex flex-col border-4 border-red-200">
               <h3 className="text-xl md:text-2xl font-black text-gray-800 mb-3 flex items-center gap-2"><Flag className="text-red-500" /> "{currentWord.word}" İfadesini Bildir</h3>
               <p className="text-gray-600 mb-4 font-medium text-sm">Oyun süreniz şu an duraklatıldı. Lütfen bu kelimede ne gibi bir hata olduğunu kısaca belirtin.</p>
               <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3 font-medium text-gray-800 focus:border-red-400 outline-none shadow-inner resize-none h-28 mb-4" placeholder="Bildirme sebebiniz..." />
               {reportStatus && (<div className={`p-3 rounded-xl font-bold flex items-center gap-2 mb-4 ${reportStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border`}>{reportStatus.msg}</div>)}
               <div className="flex gap-3">
                 <button onClick={() => { setShowReportModal(false); setReportReason(""); setReportStatus(null); }} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-colors">İptal</button>
                 <button onClick={handleReportSubmit} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2"><Flag size={18} /> Bildir</button>
               </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm p-4 flex justify-between items-center px-4 md:px-6 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-lg md:text-xl">{timeLeft}</div>
            <span className="font-bold text-gray-500 hidden md:block">Saniye Kaldı</span>
          </div>
          <div className="text-lg md:text-xl font-black text-purple-900 truncate px-2">{currentTeamName} Oynuyor</div>
          <div className="flex gap-2 items-center">
            {!isFullscreen ? (
              <button onClick={handleRequestFullscreen} className="p-1.5 md:p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors shadow-sm" title="Tam Ekran"><Maximize2 size={20} className="w-5 h-5 md:w-6 md:h-6" /></button>
            ) : (
              <button onClick={handleExitFullscreen} className="p-1.5 md:p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors shadow-sm" title="Tam Ekrandan Çık"><Minimize2 size={20} className="w-5 h-5 md:w-6 md:h-6" /></button>
            )}
            <button onClick={() => setShowExitConfirmModal(true)} className="p-1.5 md:p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-sm" title="Oyunu Sonlandır"><LogOut size={20} className="w-5 h-5 md:w-6 md:h-6" /></button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-3 md:p-8 overflow-hidden">
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border-4 md:border-8 border-yellow-400 flex flex-col max-h-[70vh] relative mb-2">
            <div className="bg-yellow-400 text-center py-2 md:py-8 px-4 flex-shrink-0 relative">
              <button onClick={() => setShowReportModal(true)} className="absolute top-2 right-2 md:top-4 md:right-4 text-yellow-700 hover:text-red-600 bg-white/30 hover:bg-white/50 p-2 rounded-full transition-colors flex items-center justify-center" title="Hatalı Kelimeyi Bildir"><Flag size={20} /></button>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-wide">{currentWord.word}</h2>
            </div>
            <div className="bg-white px-3 py-6 md:px-8 md:py-10 flex flex-col justify-around gap-3 md:gap-5 items-center overflow-y-auto">
              {currentWord.forbidden.map((word, index) => (
                <div key={index} className="w-full flex items-center justify-center relative">
                  <div className="absolute left-0 right-0 h-px bg-gray-200"></div>
                  <span className="relative bg-white px-4 md:px-6 text-xl md:text-3xl font-bold text-gray-700 capitalize">{word}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-center gap-6 md:gap-12 mb-2 flex-shrink-0 font-bold text-sm md:text-xl">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-gray-500">Doğru: <span className="text-green-600 font-black text-lg md:text-2xl">{turnStats.correct}</span></div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-gray-500">Dedim: <span className="text-red-500 font-black text-lg md:text-2xl">{turnStats.taboo}</span></div>
        </div>

        <div className="bg-white p-3 md:p-6 border-t shadow-[0_-10px_20px_rgba(0,0,0,0.05)] flex justify-center gap-3 md:gap-6 flex-shrink-0">
          <button onClick={() => handleAction('taboo')} className="flex-1 max-w-xs py-3 md:py-6 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-2xl md:rounded-3xl font-black text-lg md:text-3xl shadow-[0_6px_0_rgb(185,28,28)] md:shadow-[0_8px_0_rgb(185,28,28)] active:shadow-none active:translate-y-2 transition-all flex flex-col items-center gap-1 md:gap-2">
            <X size={28} className="md:w-9 md:h-9" /> <span className="md:hidden">DEDİM (-{settings.penalty})</span><span className="hidden md:inline">DEDİM (-{settings.penalty})</span>
          </button>
          <button onClick={() => handleAction('pass')} className={`flex-1 max-w-[90px] md:max-w-[120px] py-3 md:py-6 rounded-2xl md:rounded-3xl font-black text-base md:text-xl flex flex-col items-center justify-center gap-1 md:gap-2 transition-all ${passesLeft > 0 || settings.passLimit === 999 ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-[0_6px_0_rgb(202,138,4)] md:shadow-[0_8px_0_rgb(202,138,4)] active:shadow-none active:translate-y-2' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            <SkipForward size={24} className="md:w-8 md:h-8" /> <span className="text-xs md:text-base">PAS ({settings.passLimit === 999 ? '∞' : passesLeft})</span>
          </button>
          <button onClick={() => handleAction('correct')} className="flex-1 max-w-xs py-3 md:py-6 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-2xl md:rounded-3xl font-black text-lg md:text-3xl shadow-[0_6px_0_rgb(21,128,61)] md:shadow-[0_8px_0_rgb(21,128,61)] active:shadow-none active:translate-y-2 transition-all flex flex-col items-center gap-1 md:gap-2">
            <Check size={28} className="md:w-9 md:h-9" /> <span className="md:hidden">DOĞRU (+1)</span><span className="hidden md:inline">DOĞRU (+1)</span>
          </button>
        </div>
        
        {showExitConfirmModal && (
          <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden border-2 border-red-200 text-center animate-bounce-short">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
              <h2 className="text-xl font-black text-neutral-800 mb-2">Oyundan Çıkış</h2>
              <p className="text-sm font-bold text-neutral-600 mb-6">Oyundan çıkmak istediğinize emin misiniz? İlerlemeniz kaybolacaktır.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowExitConfirmModal(false)} className="flex-1 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-black rounded-xl transition-all shadow-sm">Hayır, Kal</button>
                <button onClick={handleConfirmExit} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-md transition-all transform hover:scale-105">Evet, Çık</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gameState === 'turnSummary') {
    return (
      <div className="w-full h-screen bg-indigo-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-5xl font-black mb-2 text-yellow-400">Süre Doldu!</h1>
        <p className="text-2xl mb-12 opacity-90">{currentTeamName} takımının tur özeti</p>
        <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-md mb-12 w-full max-w-md">
          <div className="flex justify-between items-center mb-6 text-2xl"><span className="font-bold flex items-center gap-2"><Check className="text-green-400"/> Doğru:</span><span className="font-black text-green-400">+{turnStats.correct} Puan</span></div>
          <div className="flex justify-between items-center mb-6 text-2xl"><span className="font-bold flex items-center gap-2"><X className="text-red-400"/> Dedim:</span><span className="font-black text-red-400">-{turnStats.taboo * settings.penalty} Puan</span></div>
          <div className="w-full h-px bg-white/20 mb-6"></div>
          <div className="flex justify-between items-center text-3xl"><span className="font-black">Bu Tur Kazanılan:</span><span className="font-black text-yellow-400">{turnStats.correct - (turnStats.taboo * settings.penalty)} Puan</span></div>
        </div>
        <button onClick={handleNextTurn} className="px-12 py-5 bg-white text-indigo-900 text-2xl font-bold rounded-full shadow-xl hover:scale-105 transition-transform flex items-center gap-3">Devam Et <ArrowRight /></button>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    const isTie = scores[0] === scores[1];
    const winnerName = scores[0] > scores[1] ? team1Name : team2Name;

    return (
      <div className="w-full h-screen bg-gradient-to-t from-yellow-600 via-yellow-500 to-orange-500 flex flex-col items-center justify-center p-6 text-center text-white overflow-y-auto">
        {outOfWords && (
          <div className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-lg border-2 border-white/40 flex flex-col items-center gap-2 mb-6 mt-4 w-full max-w-md text-center animate-pulse shrink-0">
            <AlertTriangle size={36} />
            <h3 className="font-black text-xl">KELİMELER TÜKENDİ!</h3>
            <p className="font-medium text-red-100 text-sm md:text-base">Kategorideki tüm kelimeler bittiği için oyun mecburi olarak sonlandırıldı. Mevcut puanlara göre sonuçlar aşağıdadır:</p>
          </div>
        )}
        <Trophy size={100} className="mb-6 drop-shadow-2xl text-yellow-100 animate-bounce shrink-0" />
        <h1 className="text-6xl md:text-8xl font-black mb-4 drop-shadow-lg shrink-0">{isTie ? "BERABERE!" : "KAZANAN"}</h1>
        {!isTie && <h2 className="text-5xl md:text-6xl font-bold text-yellow-100 mb-12 drop-shadow-md shrink-0">{winnerName}</h2>}

        <div className="bg-white/20 p-8 rounded-3xl backdrop-blur-md mb-12 flex gap-12 text-3xl shrink-0">
          <div className={`flex flex-col items-center ${scores[0] > scores[1] ? 'font-black scale-110' : 'opacity-80'}`}><span className="text-sm uppercase tracking-widest mb-2">{team1Name}</span><span>{scores[0]}</span></div>
          <div className="w-1 bg-white/30 rounded-full"></div>
          <div className={`flex flex-col items-center ${scores[1] > scores[0] ? 'font-black scale-110' : 'opacity-80'}`}><span className="text-sm uppercase tracking-widest mb-2">{team2Name}</span><span>{scores[1]}</span></div>
        </div>

        <button onClick={returnToMainMenu} className="px-10 py-5 bg-white text-orange-600 hover:bg-orange-50 text-2xl font-bold rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center gap-3 shrink-0"><RotateCcw /> Ana Menüye Dön</button>
      </div>
    );
  }

  return null;
}