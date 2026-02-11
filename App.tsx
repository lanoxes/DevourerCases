import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View, Case, Skin, InventoryItem, Rarity, User } from './types';
import { CASES as INITIAL_CASES, SKINS as INITIAL_SKINS, RARITY_COLORS, BORDER_COLORS } from './constants';
import Header from './components/Header';
import CaseOpener from './components/CaseOpener';
import { sounds } from './services/soundService';

const STORAGE_KEYS = { USER: 'dev_user', INV: 'dev_inv' };

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const s = localStorage.getItem(STORAGE_KEYS.USER);
    return s ? JSON.parse(s) : null;
  });
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const s = localStorage.getItem(STORAGE_KEYS.INV);
    return s ? JSON.parse(s) : [];
  });

  const [authForm, setAuthForm] = useState({ email: '', username: '', password: '' });
  const [balance, setBalance] = useState(user?.balance || 0);
  const [currentView, setView] = useState<View>(user ? 'LOBBY' : 'AUTH');
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ ...user, balance }));
  }, [balance, user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INV, JSON.stringify(inventory));
  }, [inventory]);

  const handleNavigate = (v: View) => {
    sounds.playClick();
    setView(v);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = { username: authForm.username || 'User', email: authForm.email, balance: 50.00 };
    setUser(newUser);
    setBalance(50.00);
    setView('LOBBY');
  };

  const handleOpenCase = (c: Case) => {
    if (balance >= c.price) {
      setBalance(b => b - c.price);
      setActiveCase(c);
      setView('CASE_OPEN');
    } else {
      setView('PAYMENT');
    }
  };

  const handleWin = (skin: Skin) => {
    const item: InventoryItem = { ...skin, instanceId: Math.random().toString(36), acquiredAt: Date.now() };
    setInventory(prev => [item, ...prev]);
  };

  const handleSell = (item: InventoryItem) => {
    sounds.playWin();
    setBalance(b => b + item.price);
    setInventory(inv => inv.filter(i => i.instanceId !== item.instanceId));
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen bg-midnight font-inter selection:bg-pink-500/30">
      {currentView !== 'AUTH' && <Header balance={balance} currentView={currentView} setView={handleNavigate} />}

      <main className="max-w-7xl mx-auto px-4 py-10">
        <AnimatePresence mode="wait">
          {currentView === 'AUTH' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="w-full max-w-sm bg-black/40 border border-white/5 rounded-[2rem] p-10 backdrop-blur-md shadow-2xl">
                 <h2 className="text-4xl font-black font-rajdhani text-white mb-10 text-center italic tracking-tighter">ACCESS PORTAL</h2>
                 <form onSubmit={handleAuth} className="space-y-6">
                    <input required className="w-full bg-midnight-lighter border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-pink-500" placeholder="Identity (Email)" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
                    <button className="w-full bg-pink-600 py-5 rounded-2xl text-white font-black uppercase tracking-widest hover:bg-pink-500 transition-colors shadow-lg">Initialize</button>
                 </form>
              </div>
            </motion.div>
          )}

          {currentView === 'LOBBY' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {INITIAL_CASES.map(c => (
                <div 
                  key={c.id} 
                  className={`group bg-black/20 border rounded-[2rem] p-8 flex flex-col items-center hover:bg-black/40 transition-all duration-500 shadow-xl ${c.rarityTier ? BORDER_COLORS[c.rarityTier] : 'border-white/5'} hover:border-pink-500/50`}
                >
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <img src={c.imageUrl} alt={c.name} className="w-44 h-44 object-contain relative z-10 transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <h3 className="text-xl font-black font-rajdhani text-white mb-4 text-center h-14 uppercase italic leading-tight">{c.name}</h3>
                  <p className="text-yellow-500 font-black font-rajdhani text-3xl mb-8">${c.price.toFixed(2)}</p>
                  <button onClick={() => handleOpenCase(c)} className="w-full bg-white/5 hover:bg-pink-600 hover:text-white text-slate-300 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all italic border border-white/5 group-hover:border-pink-500/50">Open Case</button>
                </div>
              ))}
            </motion.div>
          )}

          {currentView === 'INVENTORY' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
              <div className="flex justify-between items-end border-b border-white/5 pb-8">
                <div>
                  <h2 className="text-5xl font-black font-rajdhani text-white italic tracking-tighter uppercase">SECURE VAULT</h2>
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2">Authenticated Assets: {inventory.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Vault Net Worth</p>
                  <p className="text-3xl font-black font-rajdhani text-yellow-500">${inventory.reduce((a, b) => a + b.price, 0).toFixed(2)}</p>
                </div>
              </div>

              {inventory.length === 0 ? (
                <div className="py-32 text-center bg-black/20 rounded-[3rem] border border-dashed border-white/10">
                   <p className="text-slate-700 font-rajdhani text-2xl uppercase italic font-bold">No assets secured yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                  {inventory.map(item => (
                    <motion.div 
                      key={item.instanceId} whileHover={{ scale: 1.05, y: -5 }} onClick={() => setSelectedItem(item)}
                      className="bg-black/30 border border-white/5 rounded-2xl p-4 cursor-pointer relative group overflow-hidden"
                    >
                      <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${RARITY_COLORS[item.rarity]}`}></div>
                      <img src={item.imageUrl} className="w-full aspect-square object-contain mb-3 drop-shadow-xl" />
                      <p className="text-[10px] text-white font-black truncate font-rajdhani uppercase italic">{item.name}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              <AnimatePresence>
                {selectedItem && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-6 backdrop-blur-md">
                     <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#0f051a] border border-white/10 p-10 rounded-[3rem] max-w-sm w-full relative shadow-[0_0_100px_rgba(236,72,153,0.1)]">
                        <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 text-slate-600 hover:text-white text-3xl transition-colors p-2">✕</button>
                        <div className="flex flex-col items-center">
                            <img src={selectedItem.imageUrl} className="w-56 h-56 object-contain mb-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]" />
                            <h3 className="text-4xl font-black text-white font-rajdhani mb-6 text-center uppercase italic tracking-tighter leading-none">{selectedItem.name}</h3>
                            <p className="text-yellow-500 font-rajdhani font-black text-4xl mb-10">${selectedItem.price.toFixed(2)}</p>
                            <button onClick={() => handleSell(selectedItem)} className="w-full py-5 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 text-xs italic">Sell Weapon</button>
                        </div>
                     </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {currentView === 'CASE_OPEN' && activeCase && (
            <CaseOpener activeCase={activeCase} onClose={() => setView('LOBBY')} onWin={handleWin} />
          )}

          {currentView === 'PAYMENT' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto py-20">
               <div className="bg-black/40 border border-white/5 rounded-[3rem] p-12 text-center">
                  <h2 className="text-4xl font-black font-rajdhani text-white mb-8 italic uppercase">CREDIT REPLENISH</h2>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                     {[25, 100, 500, 1000].map(val => (
                       <button key={val} onClick={() => { setBalance(b => b + val); setView('LOBBY'); sounds.playWin(); }} className="bg-white/5 hover:bg-pink-600 py-6 rounded-2xl text-white font-black font-rajdhani text-2xl transition-all border border-white/5">+ ${val}</button>
                     ))}
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;