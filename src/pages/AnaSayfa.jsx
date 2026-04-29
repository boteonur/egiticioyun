import { Link } from 'react-router-dom';

export default function AnaSayfa() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-black text-purple-600 mb-12">egiticioyun.tr'ye Hoş Geldiniz!</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Deme Oyunu Butonu */}
        <Link to="/deme" className="bg-white p-6 rounded-3xl shadow-xl hover:scale-105 transition-transform flex flex-col items-center">
          <img src="/logo.png"/>
          <h2 className="text-2xl font-bold">Deme! Oyunu</h2>
        </Link>
        
        {/* Locked Checker Butonu */}
        <Link to="/lockedchecker" className="bg-white p-6 rounded-3xl shadow-xl hover:scale-105 transition-transform flex flex-col items-center">
          <div className="w-48 h-32 bg-indigo-50 text-indigo-600 mb-4 rounded-2xl flex items-center justify-center font-black text-xl border-4 border-indigo-100 shadow-inner">
            LOCKED CHECKER
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Locked Checker</h2>
        </Link>

      </div>
    </div>
  );
}