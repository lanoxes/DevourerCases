import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { Case, Skin, Rarity } from '../types';
import { RARITY_COLORS } from '../constants';
import { sounds } from '../services/soundService';

interface CaseOpenerProps {
  activeCase: Case;
  onClose: () => void;
  onWin: (skin: Skin) => void;
}

const ROLLING_TIME = 5; // seconds
const ITEM_WIDTH = 180;
const ITEM_COUNT = 60;

export default function CaseOpener({ activeCase, onClose, onWin }: CaseOpenerProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [items, setItems] = useState<Skin[]>([]);
  const [winningSkin, setWinningSkin] = useState<Skin | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTickRef = useRef(0);

  const getRandomSkin = useCallback(() => {
    const rand = Math.random() * 100;
    const skins = activeCase.skins;
    
    const getByRarity = (r: Rarity) => skins.filter(s => s.rarity === r);

    const GOLD_CHANCE = 0.5;
    const COVERT_CHANCE = 2.0;
    const CLASSIFIED_CHANCE = 8.0;
    const RESTRICTED_CHANCE = 15.0;

    if (activeCase.hasGold && rand < GOLD_CHANCE) return getByRarity(Rarity.GOLD)[0] || skins[0];
    if (rand < GOLD_CHANCE + COVERT_CHANCE) return getByRarity(Rarity.COVERT)[0] || skins[0];
    if (rand < GOLD_CHANCE + COVERT_CHANCE + CLASSIFIED_CHANCE) return getByRarity(Rarity.CLASSIFIED)[0] || skins[0];
    if (rand < GOLD_CHANCE + COVERT_CHANCE + CLASSIFIED_CHANCE + RESTRICTED_CHANCE) return getByRarity(Rarity.RESTRICTED)[0] || skins[0];
    return getByRarity(Rarity.MIL_SPEC)[Math.floor(Math.random() * getByRarity(Rarity.MIL_SPEC).length)] || skins[skins.length - 1];
  }, [activeCase]);

  // Initial populate
  useEffect(() => {
    const initialItems = Array.from({ length: ITEM_COUNT }, () => getRandomSkin());
    setItems(initialItems);
  }, [activeCase, getRandomSkin]);

  const handleStartSpin = async () => {
    if (isSpinning) return;
    
    // 1. Reset State
    setIsSpinning(true);
    setWinningSkin(null);
    setShowFlash(false);
    lastTickRef.current = 0;
    
    // 2. Play Initial Sound
    sounds.playClick();
    
    // 3. Reset Reel Position (Crucial for second spin)
    await controls.set({ x: 0 });

    // 4. Prepare Winning Item
    const winIdx = ITEM_COUNT - 8;
    const winner = getRandomSkin();
    
    // Update items to ensure winner is at the win index
    const newItems = [...items];
    newItems[winIdx] = winner;
    setItems(newItems);

    // 5. Calculate Stop Position
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const centerOffset = containerWidth / 2;
    // Stop exactly in the middle of the item at winIdx + slight random variance
    const stopPos = (winIdx * ITEM_WIDTH) - centerOffset + (ITEM_WIDTH / 2) + (Math.random() * 100 - 50);

    // 6. Execute Animation
    await controls.start({
      x: -stopPos,
      transition: { 
        duration: ROLLING_TIME, 
        ease: [0.15, 0, 0.05, 1] // Authentic CS2 Easing curve
      }
    });

    // 7. Reveal Results
    setWinningSkin(winner);
    setShowFlash(true);
    sounds.playWin();
    onWin(winner);
    setIsSpinning(false);
    
    // Brief flash effect
    setTimeout(() => setShowFlash(false), 300);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[100] bg-midnight/98 flex flex-col items-center justify-center p-4 backdrop-blur-2xl"
    >
      <AnimatePresence>
        {showFlash && (
          <motion.div 
            initial={{ opacity: 1 }} 
            animate={{ opacity: 0 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-[120] pointer-events-none"
          />
        )}
      </AnimatePresence>

      <button 
        onClick={onClose}
        disabled={isSpinning}
        className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all disabled:opacity-0 p-4"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="text-center mb-12">
        <h2 className="text-5xl font-black font-rajdhani text-white uppercase italic tracking-tighter logo-gradient">{activeCase.name}</h2>
        <div className="h-1 w-24 bg-pink-500 mx-auto mt-4 rounded-full shadow-[0_0_20px_rgba(236,72,153,0.8)] opacity-50"></div>
      </div>

      <div ref={containerRef} className="relative w-full max-w-6xl overflow-hidden h-72 bg-black/40 border-y border-white/5 flex items-center shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
        {/* Pointer indicators */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-pink-500 z-50 shadow-[0_0_20px_rgba(236,72,153,1)]">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-pink-500 rotate-45 -translate-y-1/2 rounded-sm shadow-[0_0_15px_rgba(236,72,153,0.8)]"></div>
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-pink-500 rotate-45 translate-y-1/2 rounded-sm shadow-[0_0_15px_rgba(236,72,153,0.8)]"></div>
        </div>

        <motion.div 
          animate={controls} 
          onUpdate={(latest: any) => {
            if (latest.x !== undefined) {
              const currentX = Math.abs(latest.x);
              const idx = Math.floor(currentX / ITEM_WIDTH);
              if (idx !== lastTickRef.current) {
                sounds.playTick();
                lastTickRef.current = idx;
              }
            }
          }}
          className="flex h-full items-center"
        >
          {items.map((skin, i) => (
            <div key={i} className="flex-shrink-0 w-[180px] h-full flex flex-col items-center justify-center border-r border-white/5 p-4">
              <div className="relative w-full aspect-square flex items-center justify-center bg-midnight-lighter/50 rounded-2xl p-4 overflow-hidden group">
                <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl ${RARITY_COLORS[skin.rarity]}`}></div>
                <img src={skin.imageUrl} alt={skin.name} className="max-w-full max-h-full object-contain filter drop-shadow-2xl scale-110 transition-transform group-hover:scale-125" />
              </div>
              <p className="text-[9px] text-white/30 font-bold uppercase mt-3 tracking-tighter text-center truncate w-full">{skin.weapon}</p>
              <p className="text-[10px] text-white font-black uppercase italic truncate w-full text-center px-2">{skin.name}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="mt-16 flex flex-col items-center gap-8 min-h-[180px]">
        <AnimatePresence mode="wait">
          {winningSkin && !isSpinning ? (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} 
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center"
            >
              <div className="bg-black/60 border border-white/10 px-12 py-8 rounded-[2rem] text-center shadow-2xl backdrop-blur-md">
                <p className={`text-[10px] font-black uppercase tracking-[0.5em] mb-2 ${RARITY_COLORS[winningSkin.rarity].replace('bg-', 'text-')}`}>{winningSkin.rarity}</p>
                <h3 className="text-4xl font-black text-white font-rajdhani uppercase italic leading-none tracking-tight">{winningSkin.name}</h3>
                <p className="text-yellow-500 text-3xl font-black font-rajdhani mt-4">${winningSkin.price.toFixed(2)}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="action" exit={{ opacity: 0 }} className="flex flex-col items-center">
               <button
                  onClick={handleStartSpin}
                  disabled={isSpinning}
                  className="group relative px-24 py-6 overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600 to-purple-800 disabled:from-slate-800 disabled:to-slate-900 transition-all active:scale-95 shadow-[0_20px_50px_rgba(236,72,153,0.2)] border-t border-white/20"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                  <span className="relative z-10 text-white font-black text-2xl font-rajdhani tracking-widest uppercase italic">
                    {isSpinning ? 'RECOVERING ASSETS...' : `DECRYPT FOR $${activeCase.price.toFixed(2)}`}
                  </span>
                </button>
                <p className="text-slate-600 font-bold uppercase text-[9px] mt-6 tracking-[0.5em] animate-pulse">
                  {isSpinning ? 'Extraction in progress' : 'Ready for deployment'}
                </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
