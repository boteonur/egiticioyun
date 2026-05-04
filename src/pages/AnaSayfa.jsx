import React from 'react';
import { Link, BrowserRouter, useInRouterContext } from 'react-router-dom';

function AnaSayfaContent() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      
      {/* SİTE ANA LOGOSU (anasayfa.jpg) BURAYA EKLENDİ */}
      <img 
        src="/anasayfa.jpg" 
        alt="Eğitici Oyunlar Ana Sayfa" 
        className="w-48 sm:w-64 md:w-80 object-contain mb-12 drop-shadow-xl rounded-3xl" 
      />

      {/* Container: Mobilde alt alta (flex-col), bilgisayarda yan yana (md:flex-row) */}
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl justify-center items-center">
        
        {/* Deme Oyunu Butonu ve Logosu */}
        <Link 
          to="/deme" 
          className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl hover:scale-105 transition-transform flex flex-col items-center justify-center w-full md:w-1/2"
        >
          <img 
            src="/deme_logo.png" 
            alt="Deme Oyunu" 
            className="w-full h-40 md:h-48 object-contain drop-shadow-md" 
          />
        </Link>
        
        {/* Locked Checker Butonu ve Logosu */}
        <Link 
          to="/lockedchecker" 
          className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl hover:scale-105 transition-transform flex flex-col items-center justify-center w-full md:w-1/2"
        >
          <img 
            src="/lc_logo.png" 
            alt="Locked Checker" 
            className="w-full h-40 md:h-48 object-contain drop-shadow-md" 
          />
        </Link>
        
      </div>
    </div>
  );
}
export default function AnaSayfa() {
  // Önizleme (Canvas) ortamında sayfa tek başına açıldığında <Link> bileşeninin çökmesini
  // önlemek için bir Router bağlamında olup olmadığımızı kontrol ediyoruz.
  const inRouter = useInRouterContext();

  if (!inRouter) {
    return (
      <BrowserRouter>
        <AnaSayfaContent />
      </BrowserRouter>
    );
  }

  return <AnaSayfaContent />;
}