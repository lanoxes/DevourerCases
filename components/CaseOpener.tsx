import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Case, Skin, Rarity } from '../types';
import { RARITY_COLORS } from '../constants';
import { sounds } from '../services/soundService';

interface CaseOpenerProps {
  activeCase: Case;
  onClose: () => void;
  onWin: (skin: Skin) => void;
}

const ROLLING_TIME = 5000; 
const ITEM_WIDTH = 200;
const ITEM_COUNT = 70; 

const CaseOpener: React.FC<CaseOpenerProps> = ({ activeCase, onClose, onWin }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [items, setItems] = useState<Skin[]>([]);
  const [winningSkin, setWinningSkin] = useState<Skin | null>(null);
  const [offset, setOffset] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(false);
  const [showWinFlash, setShowWinFlash] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tickingIntervalRef = useRef<number | null>(null);

  const getRandomSkin = useCallback(() => {
    const rand = Math.random() * 100;
    const skins = activeCase.skins;
    
    const getOfRarity = (rarity: Rarity) => {
      const pool = skins.filter(s => s.rarity === rarity);
      return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
    };

    const GOLD_THRESHOLD = 0.5;
    const COVERT_THRESHOLD = GOLD_THRESHOLD + 1.5;
    const CLASSIFIED_THRESHOLD = COVERT_THRESHOLD + 5;
    const RESTRICTED_THRESHOLD = CLASSIFIED_THRESHOLD + 15;

    if (activeCase.hasGold && rand < GOLD_THRESHOLD) return getOfRarity(Rarity.GOLD) || skins[0];
    if (rand < COVERT_THRESHOLD) return getOfRarity(Rarity.COVERT) || skins[0];
    if (rand < CLASSIFIED_THRESHOLD) return getOfRarity(Rarity.CLASSIFIED) || skins[0];
    if (rand < RESTRICTED_THRESHOLD) return getOfRarity(Rarity.RESTRICTED) || skins[0];
    
    return getOfRarity(Rarity.MIL_SPEC) || skins[skins.length - 1];
  }, [activeCase]);

  useEffect(() => {
    const initialItems = Array.from({ length: ITEM_COUNT }, () => getRandomSkin());
    setItems(initialItems);
    setOffset(0);
    setTransitionEnabled(false);
  }, [activeCase, getRandomSkin]);

  const handleOpen = () => {
    if (isSpinning) return;
    
    setOffset(0);
    setTransitionEnabled(false);
    setWinningSkin(null);
    setShowWinFlash(false);
    
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
      const finalOffset = (winIdx * ITEM_WIDTH) - (containerWidth / 2) + (ITEM_WIDTH / 2) + (Math.random() * 140 - 70);

      setOffset(finalOffset);

      let currentTickedIdx = 0;
      const startTime = Date.now();
      
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / ROLLING_TIME;
        
        if (progress < 1) {
          const easedProgress = 1 - Math.pow(1 - progress, 4); // Cubic easing like CS2
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
        setShowWinFlash(true);
        sounds.playWin();
        onWin(winner);
        setIsSpinning(false);
      }, ROLLING_TIME + 100);
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-midnight/95 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in zoom-in duration-500">
      {showWinFlash && (
        <div className="absolute inset-0 z-[110] bg-white animate-out fade-out duration-1000 pointer-events-none"></div>
      )}

      <button 
        onClick={onClose}
        disabled={isSpinning}
        className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all disabled:opacity-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="mb-12 text-center">
        <h2 className="text-4xl font-black font-rajdhani text-white uppercase italic tracking-widest">{activeCase.name}</h2>
        <p className="text-pink-500 font-bold tracking-[0.3em] text-[10px] uppercase mt-2">Initializing Rolling Sequence</p>
      </div>

      <div className="relative w-full max-w-5xl overflow-hidden bg-[#0a0515] border-y border-white/5 py-12 h-64 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-pink-500 z-20 shadow-[0_0_20px_rgba(236,72,153,1)]"></div>
        
        <div 
          ref={scrollRef}
          className={`flex ${transitionEnabled ? 'transition-transform duration-[5000ms] ease-[cubic-bezier(0.15,0,0.05,1)]' : ''}`}
          style={{ transform: `translateX(${-offset}px)` }}
        >
          {items.map((skin, i) => (
            <div 
              key={i} 
              className="flex-shrink-0 w-[200px] p-3 flex flex-col items-center justify-center border-r border-white/5"
            >
              <div className="w-full h-32 relative bg-[#0f051a] rounded-xl p-4 flex items-center justify-center">
                 <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-xl ${RARITY_COLORS[skin.rarity]}`}></div>
                 <img src={skin.imageUrl} alt={skin.name} className="max-w-full max-h-full object-contain filter drop-shadow-2xl" />
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-2 text-center">{skin.weapon}</p>
              <p className="text-[11px] text-white font-bold text-center truncate w-full px-2">{skin.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 flex flex-col items-center gap-6">
        {winningSkin && !isSpinning ? (
          <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
            <div className={`px-12 py-5 bg-[#0a0515] border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center`}>
               <span className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 ${RARITY_COLORS[winningSkin.rarity].replace('bg-', 'text-')}`}>{winningSkin.rarity}</span>
               <p className="text-3xl font-black text-white font-rajdhani uppercase italic leading-none">{winningSkin.name}</p>
               <p className="text-yellow-500 font-rajdhani mt-3 text-2xl font-bold">${winningSkin.price.toFixed(2)}</p>
            </div>
          </div>
        ) : (
          <div className="h-20 flex items-center justify-center">
            {isSpinning && <div className="text-pink-500 font-rajdhani text-xl tracking-[1em] animate-pulse">SPINNING...</div>}
          </div>
        )}

        <button
          onClick={handleOpen}
          disabled={isSpinning}
          className="bg-gradient-to-r from-pink-600 to-purple-800 hover:from-pink-500 hover:to-purple-700 disabled:from-slate-900 disabled:to-slate-950 text-white font-black text-2xl py-5 px-16 rounded-2xl font-rajdhani tracking-widest shadow-2xl transition-all active:scale-95 uppercase italic border-b-4 border-black/30"
        >
          {isSpinning ? 'SPINNING' : `Open for $${activeCase.price.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
};

export default CaseOpener;