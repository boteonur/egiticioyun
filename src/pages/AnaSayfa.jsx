import React from 'react';
import { Link } from 'react-router-dom';

export default function AnaSayfa() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-black text-purple-600 mb-12">egiticioyun.tr</h1>
      <div className="flex gap-8">
        <Link to="/deme" className="bg-white p-8 rounded-3xl shadow-xl hover:scale-105 text-center">
          <h2 className="text-3xl font-bold text-gray-800">Deme!</h2>
        </Link>
        <Link to="/lockedchecker" className="bg-white p-8 rounded-3xl shadow-xl hover:scale-105 text-center">
          <h2 className="text-3xl font-bold text-gray-800">Locked Checker</h2>
        </Link>
      </div>
    </div>
  );
}