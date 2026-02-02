
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Case, Skin, Rarity } from '../types';
import { RARITY_COLORS } from '../constants';
import { sounds } from '../services/soundService';

interface CaseOpenerProps {
  activeCase: Case;
  onClose: () => void;
  onWin: (skin: Skin) => void;
}

const ROLLING_TIME = 6000; // 6 seconds
const ITEM_WIDTH = 180;
const ITEM_COUNT = 80; 

const CaseOpener: React.FC<CaseOpenerProps> = ({ activeCase, onClose, onWin }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [items, setItems] = useState<Skin[]>([]);
  const [winningSkin, setWinningSkin] = useState<Skin | null>(null);
  const [offset, setOffset] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tickingIntervalRef = useRef<number | null>(null);

  const getRandomSkin = useCallback(() => {
    const rand = Math.random() * 100;
    const skins = activeCase.skins;
    
    const getOfRarity = (rarity: Rarity) => {
      const pool = skins.filter(s => s.rarity === rarity);
      return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
    };

    const GOLD_THRESHOLD = 0.26;
    const COVERT_THRESHOLD = GOLD_THRESHOLD + 0.64;
    const CLASSIFIED_THRESHOLD = COVERT_THRESHOLD + 3.20;
    const RESTRICTED_THRESHOLD = CLASSIFIED_THRESHOLD + 15.98;

    if (activeCase.hasGold && rand < GOLD_THRESHOLD) {
      const gold = getOfRarity(Rarity.GOLD);
      if (gold) return gold;
    }
    if (rand < COVERT_THRESHOLD) {
      const covert = getOfRarity(Rarity.COVERT);
      if (covert) return covert;
    }
    if (rand < CLASSIFIED_THRESHOLD) {
      const classified = getOfRarity(Rarity.CLASSIFIED);
      if (classified) return classified;
    }
    if (rand < RESTRICTED_THRESHOLD) {
      const restricted = getOfRarity(Rarity.RESTRICTED);
      if (restricted) return restricted;
    }
    const milSpec = getOfRarity(Rarity.MIL_SPEC);
    if (milSpec) return milSpec;
    return skins[Math.floor(Math.random() * skins.length)];
  }, [activeCase]);

  useEffect(() => {
    const initialItems = Array.from({ length: ITEM_COUNT }, () => getRandomSkin());
    setItems(initialItems);
    setOffset(0);
    setTransitionEnabled(false);
  }, [activeCase, getRandomSkin]);

  const handleOpen = () => {
    if (isSpinning) return;
    
    // Reset position instantly
    setOffset(0);
    setTransitionEnabled(false);
    setWinningSkin(null);
    
    // Tiny timeout to ensure the reset happens before starting animation
    setTimeout(() => {
      sounds.playClick();
      setIsSpinning(true);
      setTransitionEnabled(true);

      const winIdx = ITEM_COUNT - 6; 
      const winner = getRandomSkin();
      const newItems = [...items];
      newItems[winIdx] = winner;
      setItems(newItems);
      setWinningSkin(winner);

      const containerWidth = scrollRef.current?.offsetWidth || 0;
      // Exact center alignment plus random jitter within the item
      const finalOffset = (winIdx * ITEM_WIDTH) - (containerWidth / 2) + (ITEM_WIDTH / 2) + (Math.random() * 120 - 60);

      setOffset(finalOffset);

      let currentTickedIdx = 0;
      const startTime = Date.now();
      
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / ROLLING_TIME;
        
        if (progress < 1) {
          const easedProgress = 1 - Math.pow(1 - progress, 3); 
          const currentPos = easedProgress * finalOffset;
          const predictedIdx = Math.floor((currentPos + containerWidth/2) / ITEM_WIDTH);
          
          if (predictedIdx > currentTickedIdx) {
            sounds.playTick();
            currentTickedIdx = predictedIdx;
          }
          tickingIntervalRef.current = requestAnimationFrame(tick);
        }
      };
      tickingIntervalRef.current = requestAnimationFrame(tick);

      setTimeout(() => {
        if (tickingIntervalRef.current) cancelAnimationFrame(tickingIntervalRef.current);
        sounds.playWin();
        onWin(winner);
        setIsSpinning(false);
      }, ROLLING_TIME + 200);
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/98 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
      <button 
        onClick={onClose}
        disabled={isSpinning}
        className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="mb-12 text-center">
        <h2 className="text-5xl font-bold font-rajdhani text-white mb-2 uppercase tracking-[0.2em] logo-gradient">{activeCase.name}</h2>
        <p className="text-pink-500 font-bold tracking-widest text-xs uppercase animate-pulse">Case Decoding Sequence Active</p>
      </div>

      <div className="relative w-full max-w-6xl overflow-hidden bg-[#1a0b2e] border-y-2 border-[#2d1b4d] py-10 h-72 shadow-2xl">
        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-pink-500 z-20 shadow-[0_0_20px_rgba(236,72,153,0.8)]"></div>
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/50 to-transparent z-10"></div>
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
        
        <div 
          ref={scrollRef}
          className={`flex ${transitionEnabled ? 'transition-transform duration-[6000ms] cubic-bezier(0.1, 0, 0.1, 1)' : ''}`}
          style={{ transform: `translateX(${-offset}px)` }}
        >
          {items.map((skin, i) => (
            <div 
              key={i} 
              className={`flex-shrink-0 w-[180px] p-2 flex flex-col items-center justify-center border-r border-[#2d1b4d]/30`}
            >
              <div className={`w-full h-36 mb-2 relative group overflow-hidden bg-[#0f051a] rounded-lg p-4 flex items-center justify-center border border-white/5`}>
                 <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${RARITY_COLORS[skin.rarity]}`}></div>
                 <img src={skin.imageUrl} alt={skin.name} className="max-w-full max-h-full object-contain transform group-hover:scale-110 transition-transform filter drop-shadow-lg" />
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-bold text-center tracking-tighter">{skin.weapon}</p>
              <p className="text-xs text-white font-bold text-center truncate w-full px-2">{skin.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-8 min-h-[300px]">
        {winningSkin && !isSpinning ? (
          <div className="text-center animate-bounce-short">
            <h3 className="text-lg font-bold text-pink-500 mb-2 tracking-[0.3em] uppercase">COLLECTED</h3>
            <div className={`px-10 py-6 bg-[#1a0b2e] border-2 ${RARITY_COLORS[winningSkin.rarity].replace('bg-', 'border-')} rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]`}>
               <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{winningSkin.weapon}</p>
               <p className="text-3xl font-black text-white font-rajdhani">{winningSkin.name}</p>
               <p className="text-yellow-500 font-rajdhani mt-2 text-xl font-bold">${winningSkin.price.toFixed(2)}</p>
            </div>
          </div>
        ) : (
          <div className="h-[120px] flex items-center justify-center">
            {isSpinning && <div className="text-white/20 font-rajdhani text-2xl tracking-[0.5em] animate-pulse">FAST SPINNING...</div>}
          </div>
        )}

        <button
          onClick={handleOpen}
          disabled={isSpinning}
          className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-900 text-white font-black text-3xl py-5 px-16 rounded-2xl font-rajdhani tracking-tighter shadow-2xl transform transition-all active:scale-95 disabled:cursor-not-allowed border-b-4 border-black/30"
        >
          {isSpinning ? 'SPINNING...' : `OPEN FOR $${activeCase.price.toFixed(2)}`}
        </button>
      </div>

      <div className="mt-8 grid grid-cols-6 md:grid-cols-12 gap-2 overflow-x-auto w-full max-w-5xl opacity-30 hover:opacity-100 transition-opacity pb-8">
          {activeCase.skins.map(s => (
            <div key={s.id} className="p-1 group relative">
               <div className={`h-1 w-full ${RARITY_COLORS[s.rarity]} rounded-t-sm`}></div>
               <div className="bg-white/5 p-1 rounded-b-sm">
                  <img src={s.imageUrl} className="w-12 h-8 object-contain mx-auto opacity-80 group-hover:opacity-100" />
               </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default CaseOpener;
