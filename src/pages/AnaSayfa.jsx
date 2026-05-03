import React from 'react';
import { Link } from 'react-router-dom';

export default function AnaSayfa() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
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