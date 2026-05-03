import React from 'react';
import { Link } from 'react-router-dom';

export default function AnaSayfa() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-black text-purple-600 mb-12 drop-shadow-sm">egiticioyun.tr</h1>
      
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl justify-center items-center">
        
        {/* Deme Oyunu Butonu */}
        <Link to="/deme" className="bg-white p-8 rounded-3xl shadow-xl hover:scale-105 transition-transform flex flex-col items-center text-center w-full md:w-1/2">
          <img src="/deme_logo.png" alt="Deme Oyunu" className="w-full h-40 object-contain mb-6 drop-shadow-md" />
          <h2 className="text-3xl font-bold text-gray-800">Deme!</h2>
        </Link>
        
        {/* Locked Checker Butonu */}
        <Link to="/lockedchecker" className="bg-white p-8 rounded-3xl shadow-xl hover:scale-105 transition-transform flex flex-col items-center text-center w-full md:w-1/2">
          <img src="/lc_logo.png" alt="Locked Checker" className="w-full h-40 object-contain mb-6 drop-shadow-md" />
          <h2 className="text-3xl font-bold text-gray-800">Locked Checker</h2>
        </Link>

      </div>
    </div>
  );
}