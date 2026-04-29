import { Link } from 'react-router-dom';

export default function AnaSayfa() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Deme Oyunu Butonu */}
        <Link to="/deme" className="bg-white p-6 rounded-3xl shadow-xl hover:scale-105 transition-transform flex flex-col items-center">
          <img src="/logo.png"/>
        </Link>
        
        {/* Locked Checker Butonu */}
        <Link to="/lockedchecker" className="bg-white p-6 rounded-3xl shadow-xl hover:scale-105 transition-transform flex flex-col items-center">
          <img src="/logo2.png"/>
        </Link>

      </div>
    </div>
  );
}