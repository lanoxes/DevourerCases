import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View, Case, Skin, InventoryItem, Rarity, PaymentProvider, User } from './types';
import { CASES as INITIAL_CASES, SKINS as INITIAL_SKINS, RARITY_COLORS } from './constants';
import Header from './components/Header';
import CaseOpener from './components/CaseOpener';
import { sounds } from './services/soundService';

const ADMIN_KEY = "devourer123";
const STORAGE_KEYS = {
  USER: 'devourer_session',
  INVENTORY: 'devourer_inventory'
};

const RARITY_ORDER: Record<Rarity, number> = {
  [Rarity.GOLD]: 5,
  [Rarity.COVERT]: 4,
  [Rarity.CLASSIFIED]: 3,
  [Rarity.RESTRICTED]: 2,
  [Rarity.MIL_SPEC]: 1,
};

const pageVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.02 }
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    return saved ? JSON.parse(saved) : [];
  });

  const [authForm, setAuthForm] = useState({ email: '', username: '', password: '' });
  const [balance, setBalance] = useState<number>(user ? user.balance : 0);
  const [currentView, setView] = useState<View>(user ? 'LOBBY' : 'AUTH');
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [caseSessionId, setCaseSessionId] = useState(0);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [inventorySort, setInventorySort] = useState<'NEWEST' | 'PRICE' | 'RARITY'>('NEWEST');
  
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [adminBalanceInput, setAdminBalanceInput] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number>(10);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (user) {
      const updatedUser = { ...user, balance };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }
  }, [balance, user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  const handleNavigate = (v: View) => {
    sounds.playClick();
    setView(v);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playWin();
    const newUser = {
      username: authForm.username || authForm.email.split('@')[0],
      email: authForm.email,
      balance: user?.balance || 50.00,
    };
    if (!user) setBalance(50.00);
    setUser(newUser);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    setView('LOBBY');
  };

  const handleLogout = () => {
    sounds.playTick();
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setView('AUTH');
  };

  const handleOpenCase = (c: Case) => {
    if (balance >= c.price) {
      sounds.playClick();
      setBalance(prev => Math.max(0, prev - c.price));
      setActiveCase(c);
      setCaseSessionId(prev => prev + 1);
      setView('CASE_OPEN');
    } else {
      handleNavigate('PAYMENT');
    }
  };

  const handleBuySkin = (skin: Skin) => {
    if (balance >= skin.price) {
      sounds.playWin();
      setBalance(prev => Math.max(0, prev - skin.price));
      handleWinItem(skin);
    } else {
      sounds.playTick();
    }
  };

  const handleWinItem = (skin: Skin) => {
    const newItem: InventoryItem = {
      ...skin,
      instanceId: crypto.randomUUID(),
      acquiredAt: Date.now(),
    };
    setInventory(prev => [newItem, ...prev]);
  };

  const handleSellSkin = (item: InventoryItem) => {
    sounds.playWin();
    setBalance(prev => prev + item.price);
    setInventory(prev => prev.filter(i => i.instanceId !== item.instanceId));
    setSelectedItem(null);
  };

  const sortedInventory = useMemo(() => {
    const items = [...inventory];
    if (inventorySort === 'PRICE') return items.sort((a, b) => b.price - a.price);
    if (inventorySort === 'RARITY') return items.sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]);
    return items.sort((a, b) => b.acquiredAt - a.acquiredAt);
  }, [inventory, inventorySort]);

  return (
    <div className="min-h-screen flex flex-col bg-midnight">
      {currentView !== 'AUTH' && (
        <Header balance={balance} currentView={currentView} setView={handleNavigate} />
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'AUTH' && (
            <motion.div key="auth" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="min-h-[70vh] flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-[#0a0515] border border-white/5 rounded-3xl p-8 shadow-2xl text-center">
                <h2 className="text-3xl font-black font-rajdhani text-white mb-8 italic uppercase tracking-widest">IDENTIFY USER</h2>
                <form onSubmit={handleAuthSubmit} className="space-y-6">
                  <input 
                    required type="email" placeholder="Email Uplink" 
                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-white font-rajdhani outline-none focus:border-pink-500 transition-all"
                    value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})}
                  />
                  <input 
                    required type="password" placeholder="Access Code"
                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-white font-rajdhani outline-none focus:border-pink-500 transition-all"
                    value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})}
                  />
                  <button type="submit" className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black py-4 rounded-xl uppercase tracking-widest transition-all italic text-xs">Authorize</button>
                </form>
              </div>
            </motion.div>
          )}

          {currentView === 'LOBBY' && (
            <motion.div key="lobby" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-12">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0a0515] p-6 rounded-2xl border border-white/5">
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-black font-rajdhani text-white uppercase italic tracking-widest">DEPLOYMENT ZONE</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{user?.username}</p>
                    <button onClick={handleLogout} className="text-[8px] text-red-500 font-black uppercase hover:text-white transition-colors">Logout</button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {INITIAL_CASES.map(c => (
                  <motion.div 
                    key={c.id} whileHover={{ y: -6 }}
                    className={`bg-[#0a0515] border border-white/5 rounded-2xl p-6 flex flex-col items-center hover:border-pink-500/30 transition-all shadow-xl`}
                  >
                    <img src={c.imageUrl} alt={c.name} className="w-40 h-40 object-contain mb-4 drop-shadow-2xl" />
                    <h3 className="text-lg font-black font-rajdhani text-white mb-2 text-center h-12 uppercase italic leading-tight">{c.name}</h3>
                    <p className="text-yellow-500 font-black mb-6 font-rajdhani text-2xl tracking-tighter">${c.price.toFixed(2)}</p>
                    <button onClick={() => handleOpenCase(c)} className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black py-3.5 rounded-xl transition-all uppercase tracking-widest text-[10px] italic">Unlock</button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {currentView === 'SHOP' && (
            <motion.div key="shop" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-8">
              <h2 className="text-3xl font-black font-rajdhani text-white italic uppercase tracking-widest border-l-4 border-pink-600 pl-4">ASSET MARKET</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {INITIAL_SKINS.map(skin => (
                  <div key={skin.id} className="bg-[#0a0515] border border-white/5 p-5 rounded-2xl flex flex-col hover:border-pink-500/20 transition-all group">
                    <div className={`h-1.5 w-full rounded-full mb-4 ${RARITY_COLORS[skin.rarity]}`}></div>
                    <img src={skin.imageUrl} className="w-full aspect-square object-contain mb-4" />
                    <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">{skin.weapon}</p>
                    <p className="text-sm font-black text-white mb-3 truncate font-rajdhani italic">{skin.name}</p>
                    <p className="text-yellow-500 font-black mb-4 font-rajdhani text-xl tracking-tighter">${skin.price.toLocaleString()}</p>
                    <button onClick={() => handleBuySkin(skin)} className="mt-auto bg-white/5 hover:bg-white/10 text-white text-[9px] py-3 rounded-xl font-black uppercase tracking-widest italic">Acquire</button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentView === 'INVENTORY' && (
            <motion.div key="inventory" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-[#0a0515] p-8 rounded-2xl border border-white/5">
                <div>
                  <h2 className="text-4xl font-black font-rajdhani text-white italic uppercase tracking-widest">SECURE VAULT</h2>
                  <p className="text-slate-500 font-bold text-[10px] tracking-widest uppercase mt-1">{inventory.length} Assets Logged</p>
                </div>
                <div className="flex items-center gap-6">
                  <select 
                    onChange={(e) => setInventorySort(e.target.value as any)}
                    className="bg-black border border-white/10 text-white text-[10px] p-3 rounded-xl outline-none focus:border-pink-500 font-black uppercase tracking-widest"
                  >
                    <option value="NEWEST">Recency</option>
                    <option value="PRICE">Value</option>
                    <option value="RARITY">Tier</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-6">
                {sortedInventory.map((item) => (
                  <div 
                    key={item.instanceId} onClick={() => setSelectedItem(item)}
                    className="bg-[#0a0515] border border-white/5 rounded-xl p-4 group cursor-pointer hover:border-white/20 transition-all relative"
                  >
                    <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-xl ${RARITY_COLORS[item.rarity]}`}></div>
                    <img src={item.imageUrl} className="w-full aspect-square object-contain mb-3" />
                    <p className="text-[10px] text-white font-black truncate font-rajdhani uppercase italic">{item.name}</p>
                  </div>
                ))}
              </div>

              <AnimatePresence>
                {selectedItem && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm">
                     <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#0a0515] border border-white/10 p-8 rounded-3xl max-w-sm w-full relative shadow-2xl">
                        <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white text-2xl">✕</button>
                        <div className="flex flex-col items-center">
                            <img src={selectedItem.imageUrl} className="w-48 h-48 object-contain mb-8 drop-shadow-2xl" />
                            <h3 className="text-3xl font-black text-white font-rajdhani mb-6 text-center tracking-tight uppercase italic leading-none">{selectedItem.name}</h3>
                            
                            <div className="w-full flex justify-between bg-black/40 p-4 rounded-xl mb-8 border border-white/5">
                               <div className="text-left">
                                  <p className="text-[8px] text-slate-500 font-black uppercase mb-1">Market Value</p>
                                  <p className="text-xl text-yellow-500 font-rajdhani font-black">${selectedItem.price.toFixed(2)}</p>
                               </div>
                            </div>

                            <button onClick={() => handleSellSkin(selectedItem)} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-xl active:scale-95 text-xs italic">Sell Weapon</button>
                        </div>
                     </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {currentView === 'CASE_OPEN' && activeCase && (
            <CaseOpener key={caseSessionId} activeCase={activeCase} onClose={() => handleNavigate('LOBBY')} onWin={handleWinItem} />
          )}

          {currentView === 'PAYMENT' && (
            <motion.div key="payment" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-2xl mx-auto space-y-10">
              <h2 className="text-4xl font-black font-rajdhani text-white uppercase italic tracking-widest text-center">CREDIT REPLENISH</h2>
              <div className="bg-[#0a0515] border border-white/5 rounded-3xl p-8 space-y-8">
                <div className="grid grid-cols-3 gap-4">
                  {[10, 50, 100].map(amt => (
                    <button key={amt} onClick={() => setPaymentAmount(amt)} className={`py-6 rounded-xl font-black font-rajdhani text-2xl border transition-all ${paymentAmount === amt ? 'bg-pink-600 border-pink-400 text-white' : 'bg-black border-white/10 text-slate-500'}`}>${amt}</button>
                  ))}
                </div>
                <button 
                  onClick={() => { setIsProcessingPayment(true); setTimeout(() => { setBalance(prev => prev + paymentAmount); setIsProcessingPayment(false); setView('LOBBY'); }, 1500); }}
                  className="w-full bg-white text-black font-black py-5 rounded-xl uppercase tracking-widest transition-all italic text-sm"
                >
                  {isProcessingPayment ? 'Syncing...' : 'Authorize Transfer'}
                </button>
              </div>
            </motion.div>
          )}

          {currentView === 'ADMIN' && (
            <motion.div key="admin" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-md mx-auto">
              {!isAdminAuth ? (
                <div className="bg-[#0a0515] border border-white/5 rounded-3xl p-8 text-center">
                  <h2 className="text-2xl font-black font-rajdhani text-white mb-6 uppercase">ROOT ACCESS</h2>
                  <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white mb-6" placeholder="Admin Key" />
                  <button onClick={() => passwordInput === ADMIN_KEY && setIsAdminAuth(true)} className="w-full bg-pink-600 text-white font-black py-4 rounded-xl">Unlock</button>
                </div>
              ) : (
                <div className="bg-[#0a0515] border border-white/5 rounded-3xl p-8 space-y-6">
                  <input type="number" value={adminBalanceInput} onChange={e => setAdminBalanceInput(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white text-3xl font-black" placeholder="Set Balance" />
                  <button onClick={() => { setBalance(parseFloat(adminBalanceInput)); setIsAdminAuth(false); }} className="w-full bg-green-600 text-white font-black py-4 rounded-xl">Confirm Override</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-20 bg-black/50 border-t border-white/5 mt-20 text-center">
          <p className="text-slate-800 text-[9px] font-black uppercase tracking-[1em] font-rajdhani">© 2024 DEVOUREROFCASE | VAULT MANAGEMENT</p>
      </footer>
    </div>
  );
};

export default App;