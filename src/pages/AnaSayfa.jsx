import React from 'react';
import { Link } from 'react-router-dom';

export default function AnaSayfa() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-black text-purple-600 mb-12">egiticioyun.tr</h1>
      <div className="flex gap-8">
        
        {/* Deme Oyunu Butonu ve Logosu */}
        <Link to="/deme" className="bg-white p-8 rounded-3xl shadow-xl hover:scale-105 text-center flex flex-col items-center justify-center">
          <img src="/deme_logo.png" alt="Deme Oyunu" className="w-48 h-32 object-contain" />
        </Link>
        
        {/* Locked Checker Butonu ve Logosu */}
        <Link to="/lockedchecker" className="bg-white p-8 rounded-3xl shadow-xl hover:scale-105 text-center flex flex-col items-center justify-center">
          <img src="/lc_logo.png" alt="Locked Checker" className="w-48 h-32 object-contain" />
        </Link>
        
      </div>
    </div>
  );
}