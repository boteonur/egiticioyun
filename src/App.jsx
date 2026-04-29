import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AnaSayfa from './pages/AnaSayfa';
import Deme from './pages/Deme';
import Lockedchecker from './pages/Lockedchecker';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AnaSayfa />} />
        <Route path="/deme" element={<Deme />} />
        <Route path="/lockedchecker" element={<Lockedchecker />} />
      </Routes>
    </BrowserRouter>
  );
}