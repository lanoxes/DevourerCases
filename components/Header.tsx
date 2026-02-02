
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
            <div className="w-14 h-14 rounded-full border-2 border-pink-500/50 p-0.5 relative z-10 overflow-hidden shadow-[0_0_20px_rgba(236,72,153,0.4)]">
              <img 
                src="https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=1974&auto=format&fit=crop" 
                alt="Devourer Mascot" 
                className="w-full h-full object-cover grayscale-[0.2] contrast-125 group-hover:scale-110 transition-transform duration-700"
                style={{ filter: 'hue-rotate(270deg) brightness(1.2)' }}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-[0.1em] font-rajdhani logo-gradient leading-none italic">
              DEVOURER
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-pink-500 tracking-[0.4em] uppercase opacity-80 leading-none">OF CASE</span>
              <div className="h-[1px] w-8 bg-pink-500/30"></div>
              <span className="text-[8px] font-bold text-blue-400 tracking-tighter uppercase opacity-50">V3.1 LIVE</span>
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-3 md:gap-8">
          <button onClick={() => setView('LOBBY')} className={`text-xs md:text-sm font-black tracking-widest transition-all ${currentView === 'LOBBY' ? 'text-pink-500 scale-110 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'text-slate-400 hover:text-white'}`}>CASES</button>
          <button onClick={() => setView('SHOP')} className={`text-xs md:text-sm font-black tracking-widest transition-all ${currentView === 'SHOP' ? 'text-pink-500 scale-110 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'text-slate-400 hover:text-white'}`}>MARKET</button>
          <button onClick={() => setView('INVENTORY')} className={`text-xs md:text-sm font-black tracking-widest transition-all ${currentView === 'INVENTORY' ? 'text-pink-500 scale-110 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'text-slate-400 hover:text-white'}`}>VAULT</button>
          <button onClick={() => setView('AI_ANALYSIS')} className={`text-xs md:text-sm font-black tracking-widest transition-all ${currentView === 'AI_ANALYSIS' ? 'text-pink-500 scale-110 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'text-slate-400 hover:text-white'}`}>NEURAL AI</button>

          <div className="flex items-center gap-3 bg-[#0f051a] rounded-2xl px-5 py-2.5 border border-pink-500/20 shadow-inner group transition-all hover:border-pink-500/50">
            <div className="flex flex-col items-end">
              <span className="text-yellow-500 font-bold font-rajdhani text-lg leading-none">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span className="text-[7px] text-pink-500 font-black tracking-[0.2em] uppercase opacity-50">Authorized Credits</span>
            </div>
            <button 
              onClick={() => setView('PAYMENT')}
              className="bg-pink-600 hover:bg-pink-500 text-white w-8 h-8 rounded-xl flex items-center justify-center text-xl transition-all transform hover:rotate-90 active:scale-75 shadow-[0_0_15px_rgba(236,72,153,0.4)]"
            >
              +
            </button>
          </div>
          <button onClick={() => setView('ADMIN')} className="text-[10px] font-black text-slate-700 hover:text-white transition-colors uppercase tracking-widest border border-slate-800 px-3 py-1.5 rounded-lg">ROOT</button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
