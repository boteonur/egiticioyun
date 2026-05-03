import React from 'react';

export default function UserProfileModal({ player, onClose, t }) {
  if (!player) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div 
        className="bg-white/95 backdrop-blur-md rounded-3xl w-full max-w-sm p-6 shadow-2xl relative transform transition-all border border-white/50 animate-bounce-short"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-200 hover:bg-red-100 hover:text-red-600 transition-colors"
        >
          ✕
        </button>

        {/* Profile Header */}
        <div className="flex flex-col items-center mt-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-tr from-amber-200 to-amber-400 rounded-full flex items-center justify-center text-5xl sm:text-6xl shadow-inner border-4 border-white mb-3">
             {player.avatar || '🧑‍🚀'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-800 tracking-tight">
            {player.displayName || t('enterName') || 'Oyuncu'}
          </h2>
          <div className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full text-xs sm:text-sm mt-1 mb-6 border border-indigo-200">
            {t('level') || 'Seviye'} {player.level || 1}
          </div>
        </div>

        {/* Wealth / Coins */}
        <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-xl p-3 text-center border-b-2 border-amber-300">
                <div className="text-xl mb-1 drop-shadow-sm">💰</div>
                <div className="text-amber-700 font-black text-sm">{player.gold || 0}</div>
            </div>
            <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-xl p-3 text-center border-b-2 border-slate-300">
                <div className="text-xl mb-1 drop-shadow-sm">🪙</div>
                <div className="text-slate-600 font-black text-sm">{player.silver || 0}</div>
            </div>
            <div className="bg-gradient-to-b from-orange-50 to-orange-100 rounded-xl p-3 text-center border-b-2 border-orange-300">
                <div className="text-xl mb-1 drop-shadow-sm">🥉</div>
                <div className="text-orange-700 font-black text-sm">{player.bronze || 0}</div>
            </div>
        </div>

        {/* Stats */}
        <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-neutral-200">
            <span className="text-neutral-500 font-bold text-sm">{t('totalGames') || 'Toplam Maç'}:</span>
            <span className="text-neutral-800 font-black">{player.total || 0}</span>
          </div>
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-neutral-200">
            <span className="text-green-600 font-bold text-sm">{t('wins') || 'Kazanma'}:</span>
            <span className="text-green-700 font-black">{player.wins || 0}</span>
          </div>
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-neutral-200">
            <span className="text-red-500 font-bold text-sm">{t('losses') || 'Kaybetme'}:</span>
            <span className="text-red-600 font-black">{player.losses || 0}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-blue-600 font-bold text-sm">{t('winRate') || 'Kazanma Oranı'}:</span>
            <span className="text-blue-700 font-black text-lg bg-blue-100 px-2 rounded-lg">
                %{(player.winRate || 0).toFixed(1)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
