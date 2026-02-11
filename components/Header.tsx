import React from 'react';
import { View } from '../types';

interface HeaderProps {
  balance: number;
  currentView: View;
  setView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ balance, currentView, setView }) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0f051a]/90 backdrop-blur-xl border-b border-pink-500/20 px-4 py-3 md:px-8 shadow-[0_4px_30px_rgba(236,72,153,0.15)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div 
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => setView('LOBBY')}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-pink-500 rounded-full blur-xl opacity-20 group-hover:opacity-60 transition-opacity"></div>
            <div className="w-12 h-12 rounded-full border-2 border-pink-500/50 p-0.5 relative z-10 overflow-hidden shadow-[0_0_15px_rgba(236,72,153,0.3)]">
              {/* GAMBAR LOGO CIRI KHAS DEVOURER DI PERTAHANKAN */}
              <img 
                src="https://image2url.com/r2/default/images/1770034854711-60d7c45b-78b0-45d4-9f36-3773406af894.jpeg" 
                alt="Devourer Mascot" 
                className="w-full h-full object-cover contrast-110 group-hover:scale-110 transition-transform duration-700"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight font-rajdhani logo-gradient leading-none italic">
              DEVOURER
            </h1>
            <span className="text-[9px] font-bold text-pink-500 tracking-[0.3em] uppercase opacity-80 mt-0.5">VAULT INTERFACE</span>
          </div>
        </div>

        <nav className="flex items-center gap-6 md:gap-10">
          <button onClick={() => setView('LOBBY')} className={`text-xs font-black tracking-widest transition-all uppercase ${currentView === 'LOBBY' ? 'text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'text-slate-400 hover:text-white'}`}>Cases</button>
          <button onClick={() => setView('SHOP')} className={`text-xs font-black tracking-widest transition-all uppercase ${currentView === 'SHOP' ? 'text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'text-slate-400 hover:text-white'}`}>Market</button>
          <button onClick={() => setView('INVENTORY')} className={`text-xs font-black tracking-widest transition-all uppercase ${currentView === 'INVENTORY' ? 'text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'text-slate-400 hover:text-white'}`}>Vault</button>

          <div className="flex items-center gap-3 bg-[#05020a] rounded-xl px-4 py-2 border border-pink-500/10 shadow-inner group transition-all hover:border-pink-500/30">
            <span className="text-yellow-500 font-bold font-rajdhani text-base">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <button 
              onClick={() => setView('PAYMENT')}
              className="bg-pink-600 hover:bg-pink-500 text-white w-6 h-6 rounded-lg flex items-center justify-center text-lg transition-all transform hover:rotate-90 active:scale-75"
            >
              +
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;