
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View, Case, Skin, InventoryItem, Rarity, PaymentProvider } from './types';
import { CASES as INITIAL_CASES, SKINS as INITIAL_SKINS, RARITY_COLORS, BORDER_COLORS, GLOW_COLORS } from './constants';
import Header from './components/Header';
import CaseOpener from './components/CaseOpener';
import { getLuckAnalysis } from './services/geminiService';
import { sounds } from './services/soundService';

const ADMIN_PASSWORD = "devourer123";

const pageVariants = {
  initial: { opacity: 0, y: 15, filter: 'blur(10px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -15, filter: 'blur(10px)' }
};

const App: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [currentView, setView] = useState<View>('LOBBY');
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [caseSessionId, setCaseSessionId] = useState(0);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [aiResponse, setAiResponse] = useState<{ score: number; comment: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [inventorySort, setInventorySort] = useState<'NEWEST' | 'PRICE' | 'RARITY'>('NEWEST');
  
  // Admin & Payment States
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [adminBalanceInput, setAdminBalanceInput] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number>(10);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('PAYPAL');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [cases] = useState<Case[]>(INITIAL_CASES);
  const [skins] = useState<Skin[]>(INITIAL_SKINS);

  // Updated Mascot URL based on the iconic girl description
  const MASCOT_URL = "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=1974&auto=format&fit=crop";

  const handleNavigate = (v: View) => {
    sounds.playClick();
    setView(v);
  };

  const handleOpenCase = (c: Case) => {
    if (balance >= c.price) {
      sounds.playClick();
      setBalance(prev => prev - c.price);
      setActiveCase(c);
      setCaseSessionId(prev => prev + 1);
      setView('CASE_OPEN');
    } else {
      sounds.playTick();
      alert("Insufficient funds! Please top up.");
      handleNavigate('PAYMENT');
    }
  };

  const handleBuySkin = (skin: Skin) => {
    if (balance >= skin.price) {
      sounds.playWin();
      setBalance(prev => prev - skin.price);
      handleWinItem(skin);
      alert(`Purchased ${skin.weapon} | ${skin.name}`);
    } else {
      sounds.playTick();
      alert("Insufficient funds!");
    }
  };

  const handleWinItem = (skin: Skin) => {
    const newItem: InventoryItem = {
      ...skin,
      instanceId: Math.random().toString(36).substr(2, 9),
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

  const toggleWishlist = (caseId: string) => {
    sounds.playTick();
    setWishlist(prev => prev.includes(caseId) ? prev.filter(id => id !== caseId) : [...prev, caseId]);
  };

  const sortedInventory = useMemo(() => {
    const items = [...inventory];
    if (inventorySort === 'PRICE') return items.sort((a, b) => b.price - a.price);
    if (inventorySort === 'RARITY') {
        const order = Object.values(Rarity);
        return items.sort((a, b) => order.indexOf(b.rarity) - order.indexOf(a.rarity));
    }
    return items.sort((a, b) => b.acquiredAt - a.acquiredAt);
  }, [inventory, inventorySort]);

  const handleAdminAuth = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdminAuth(true);
      sounds.playWin();
    } else {
      sounds.playTick();
      alert("Incorrect password");
    }
  };

  const handleSetBalance = () => {
    const newBalance = parseFloat(adminBalanceInput);
    if (!isNaN(newBalance)) {
      setBalance(newBalance);
      sounds.playWin();
      alert(`Admin override successful: Balance set to $${newBalance.toFixed(2)}`);
    } else {
      alert("Invalid amount");
    }
  };

  const handleProcessTopup = () => {
    if (paymentAmount <= 0) return;
    setIsProcessingPayment(true);
    sounds.playClick();
    
    // Simulate payment gateway delay
    setTimeout(() => {
      setBalance(prev => prev + paymentAmount);
      setIsProcessingPayment(false);
      sounds.playWin();
      alert(`Top-up successful! $${paymentAmount.toFixed(2)} has been added to your balance via ${selectedProvider}.`);
      handleNavigate('LOBBY');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f051a]">
      <Header balance={balance} currentView={currentView} setView={handleNavigate} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'LOBBY' && (
            <motion.div 
              key="lobby"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-12"
            >
              <div className="flex items-center gap-8 border-l-4 border-pink-600 pl-6 py-4 bg-[#1a0b2e]/30 rounded-r-3xl">
                <div className="relative group">
                  <div className="absolute inset-0 bg-pink-500 rounded-3xl blur-2xl opacity-10 group-hover:opacity-30 transition-opacity"></div>
                  <div className="w-28 h-28 rounded-3xl border-2 border-pink-500/40 overflow-hidden shadow-[0_0_30px_rgba(236,72,153,0.3)] hidden md:block relative z-10">
                    <img 
                      src={MASCOT_URL} 
                      className="w-full h-full object-cover grayscale-[0.1] contrast-125" 
                      style={{ filter: 'hue-rotate(270deg) brightness(1.2)' }} 
                    />
                  </div>
                </div>
                <div>
                  <h2 className="text-5xl font-black font-rajdhani text-white uppercase italic tracking-tighter drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">EXTRACTION POINT</h2>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-pink-500 font-bold uppercase text-xs tracking-[0.4em]">Neural Sync Deployment Active</p>
                    <div className="h-1 w-24 bg-gradient-to-r from-pink-600 to-transparent rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {cases.map(c => (
                  <motion.div 
                    key={c.id} 
                    whileHover={{ y: -10, scale: 1.02 }}
                    className={`group bg-[#1a0b2e] border-2 ${c.rarityTier ? BORDER_COLORS[c.rarityTier] : 'border-pink-500/10'} rounded-3xl p-7 flex flex-col items-center hover:bg-[#25133d] transition-all relative overflow-hidden shadow-2xl ${c.rarityTier ? GLOW_COLORS[c.rarityTier] : 'shadow-black/60'}`}
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(c.id); }}
                      className={`absolute top-5 right-5 text-xl transition-all ${wishlist.includes(c.id) ? 'text-pink-500 scale-125 shadow-[0_0_20px_rgba(236,72,153,0.8)]' : 'text-slate-700 hover:text-pink-500'}`}
                    >
                      ★
                    </button>
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-pink-500/10 blur-3xl rounded-full scale-150 group-hover:bg-pink-500/20 transition-all"></div>
                      <img src={c.imageUrl} alt={c.name} className="w-48 h-48 object-contain relative z-10 transform group-hover:rotate-6 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]" />
                    </div>
                    <h3 className="text-2xl font-black font-rajdhani text-white mb-2 text-center h-16 flex items-center tracking-tight leading-tight uppercase italic">{c.name}</h3>
                    <p className="text-yellow-500 font-black mb-8 text-3xl font-rajdhani drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]">${c.price.toFixed(2)}</p>
                    <button onClick={() => handleOpenCase(c)} className="w-full bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-500 hover:to-purple-600 text-white font-black py-4.5 rounded-2xl transition-all shadow-xl hover:shadow-pink-600/40 active:scale-95 uppercase tracking-[0.2em] text-[10px] italic border-b-4 border-black/30">Execute Protocol</button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {currentView === 'PAYMENT' && (
            <motion.div 
              key="payment"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="max-w-4xl mx-auto space-y-10"
            >
              <div className="text-center">
                <h2 className="text-5xl font-black font-rajdhani text-white uppercase italic mb-3 tracking-tighter">CREDIT UPLINK</h2>
                <div className="inline-flex items-center gap-4 bg-pink-600/10 px-6 py-1.5 rounded-full border border-pink-500/20">
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
                  <p className="text-pink-500 font-bold text-[9px] tracking-[0.6em] uppercase">Authorized Secure Gateway Established</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-[#1a0b2e] border border-pink-500/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-pink-600/5 blur-3xl rounded-full"></div>
                    <h3 className="text-white font-black uppercase tracking-[0.3em] text-xs mb-8 flex items-center gap-4">
                      <span className="w-10 h-10 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-xs font-black italic text-pink-500">01</span>
                      Resource Allocation
                    </h3>
                    <div className="grid grid-cols-3 gap-6">
                      {[10, 25, 50, 100, 250, 500].map(amt => (
                        <button 
                          key={amt}
                          onClick={() => { sounds.playTick(); setPaymentAmount(amt); }}
                          className={`py-6 rounded-3xl font-black font-rajdhani text-4xl border-2 transition-all ${paymentAmount === amt ? 'bg-pink-600 border-pink-400 text-white shadow-[0_0_30px_rgba(236,72,153,0.3)] scale-105' : 'bg-[#0f051a] border-[#2d1b4d] text-slate-500 hover:border-pink-500/40 hover:text-white'}`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#1a0b2e] border border-pink-500/10 rounded-[2.5rem] p-10 shadow-2xl">
                    <h3 className="text-white font-black uppercase tracking-[0.3em] text-xs mb-8 flex items-center gap-4">
                      <span className="w-10 h-10 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-xs font-black italic text-pink-500">02</span>
                      Transfer Interface
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                      {(['PAYPAL', 'DANA', 'GOPAY', 'QRIS', 'SEABANK'] as PaymentProvider[]).map(provider => (
                        <button 
                          key={provider}
                          onClick={() => { sounds.playTick(); setSelectedProvider(provider); }}
                          className={`flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border-2 transition-all ${selectedProvider === provider ? 'bg-pink-600/15 border-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.2)]' : 'bg-[#0f051a] border-[#2d1b4d] text-slate-500 hover:border-pink-500/30'}`}
                        >
                          <span className="text-xs font-black uppercase tracking-[0.4em]">{provider}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-[#1a0b2e] border-2 border-pink-600/30 rounded-[2.5rem] p-10 shadow-2xl sticky top-32 overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-600 opacity-5 blur-[60px] rounded-full"></div>
                    <h3 className="text-white font-black uppercase tracking-[0.3em] text-[10px] mb-10 border-b border-pink-500/10 pb-4">Transaction Details</h3>
                    <div className="space-y-6 mb-12">
                      <div className="flex justify-between text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                        <span>Units Ordered</span>
                        <span className="text-white">${paymentAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                        <span>Portal Fee</span>
                        <span className="text-green-500">EXEMPT</span>
                      </div>
                      <div className="pt-8 flex justify-between items-center border-t border-pink-500/10">
                        <span className="text-white font-black uppercase tracking-[0.2em] text-xs italic">Final Total</span>
                        <span className="text-4xl text-yellow-500 font-black font-rajdhani drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]">${paymentAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleProcessTopup}
                      disabled={isProcessingPayment || paymentAmount <= 0}
                      className="w-full bg-gradient-to-br from-pink-600 via-purple-700 to-pink-700 hover:from-pink-500 hover:to-purple-600 text-white font-black py-7 rounded-3xl uppercase tracking-[0.4em] shadow-2xl shadow-pink-900/50 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all text-xs italic border-t border-pink-400/20"
                    >
                      {isProcessingPayment ? 'Synchronizing...' : 'START UPLINK'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'AI_ANALYSIS' && (
            <motion.div key="ai" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-5xl mx-auto space-y-12">
               <div className="text-center">
                  <h2 className="text-6xl font-black font-rajdhani text-white uppercase italic mb-3 tracking-tighter">NEURAL SYNC</h2>
                  <p className="text-pink-500 font-bold text-[11px] tracking-[0.6em] uppercase">Mascot Protocol V2.4: Luck Evaluation</p>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-pink-500 rounded-[3rem] blur-[80px] opacity-10 group-hover:opacity-25 transition-all duration-1000"></div>
                    <div className="relative z-10 rounded-[3rem] border-2 border-pink-500/40 overflow-hidden shadow-2xl aspect-[4/5] bg-[#0f051a]">
                       <img 
                          src={MASCOT_URL} 
                          className="w-full h-full object-cover transition-all duration-1000 grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110" 
                          style={{ filter: 'hue-rotate(270deg) brightness(1.2) contrast(1.1)' }} 
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-[#0f051a] via-transparent to-transparent opacity-80"></div>
                       <div className="absolute bottom-10 left-0 right-0 text-center flex flex-col items-center">
                          <div className="h-[2px] w-24 bg-pink-500 mb-4 animate-pulse"></div>
                          <span className="text-pink-500 font-black tracking-[0.6em] uppercase text-[11px] italic drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]">NEURAL MODEL SYNCED</span>
                       </div>
                    </div>
                  </div>

                  <div className="bg-[#1a0b2e]/80 backdrop-blur-md border border-pink-500/20 rounded-[4rem] p-12 flex flex-col items-center gap-10 shadow-2xl relative overflow-hidden h-full justify-between">
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-pink-600 opacity-5 blur-[100px]"></div>
                    
                    <div className="w-full flex flex-col items-center gap-4">
                      <h3 className="text-white font-black font-rajdhani text-2xl tracking-widest uppercase italic">Diagnostic Core</h3>
                      <div className="h-1 w-full bg-gradient-to-r from-transparent via-pink-500/20 to-transparent"></div>
                    </div>

                    <motion.div 
                      animate={isAiLoading ? { rotate: 360 } : {}}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                      className="w-56 h-56 rounded-full border-[10px] border-pink-500/10 border-t-pink-600 flex items-center justify-center bg-[#0f051a] shadow-[0_0_60px_rgba(236,72,153,0.2)] relative"
                    >
                       <div className="absolute inset-4 rounded-full border border-pink-500/10 animate-ping"></div>
                       <span className="text-8xl font-black text-white font-rajdhani italic drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">{aiResponse ? aiResponse.score : '??'}</span>
                    </motion.div>

                    <div className="min-h-[160px] w-full flex items-center justify-center px-6">
                      {aiResponse ? (
                        <p className="text-slate-100 italic text-2xl leading-relaxed font-serif text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">"{aiResponse.comment}"</p>
                      ) : (
                        <div className="flex flex-col items-center gap-6">
                          <p className="text-pink-500/60 font-black uppercase tracking-[0.5em] text-[10px] animate-pulse">Establishing Connection to Neural Mascot...</p>
                          <div className="flex gap-2">
                            {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>)}
                          </div>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={async () => { 
                        sounds.playTick(); 
                        setIsAiLoading(true); 
                        const res = await getLuckAnalysis(inventory); 
                        setAiResponse(res); 
                        sounds.playWin(); 
                        setIsAiLoading(false); 
                      }} 
                      disabled={isAiLoading} 
                      className="w-full bg-white text-black font-black py-7 rounded-[2rem] hover:bg-pink-500 hover:text-white disabled:opacity-50 transition-all uppercase tracking-[0.4em] italic text-sm shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-pink-600/50 active:scale-95"
                    >
                      {isAiLoading ? 'SCANNING CORE...' : 'INITIALIZE NEURAL SYNC'}
                    </button>
                  </div>
               </div>
            </motion.div>
          )}

          {/* Other views remain largely unchanged but inherit the updated high-fidelity theme */}
          {currentView === 'SHOP' && (
            <motion.div 
              key="shop"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-8"
            >
              <h2 className="text-4xl font-black font-rajdhani text-white italic border-l-4 border-pink-600 pl-4 uppercase tracking-tighter">BLACK MARKET</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {skins.map(skin => (
                  <motion.div 
                    key={skin.id} 
                    whileHover={{ y: -5 }}
                    className="bg-[#1a0b2e] border border-pink-500/10 p-6 rounded-3xl flex flex-col hover:border-pink-500 transition-all group shadow-xl"
                  >
                    <div className={`h-2 w-full rounded-t-2xl mb-5 ${RARITY_COLORS[skin.rarity]}`}></div>
                    <img src={skin.imageUrl} className="w-full aspect-square object-contain mb-5 group-hover:scale-110 transition-transform duration-500" />
                    <p className="text-[10px] text-slate-500 font-bold tracking-[0.3em] uppercase mb-1">{skin.weapon}</p>
                    <p className="text-base font-black text-white mb-2 truncate font-rajdhani italic">{skin.name}</p>
                    <p className="text-yellow-500 font-black mb-5 font-rajdhani text-2xl tracking-tighter drop-shadow-[0_0_8px_rgba(234,179,8,0.2)]">${skin.price.toLocaleString()}</p>
                    <button onClick={() => handleBuySkin(skin)} className="mt-auto bg-[#0f051a] border border-pink-500/20 hover:bg-pink-600 text-white text-[10px] py-3.5 rounded-xl font-black uppercase transition-all shadow-md active:scale-95 tracking-[0.4em] italic">Capture Asset</button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {currentView === 'INVENTORY' && (
            <motion.div 
              key="inventory"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-10"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-l-4 border-pink-600 pl-6">
                <div>
                  <h2 className="text-5xl font-black font-rajdhani text-white italic uppercase tracking-tighter">ARCHIVE VAULT</h2>
                  <p className="text-slate-500 font-bold text-[10px] tracking-[0.5em] uppercase mt-1">{inventory.length} Neural Assets Secured</p>
                </div>
                <div className="flex items-center gap-6">
                  <select 
                    onChange={(e) => { sounds.playTick(); setInventorySort(e.target.value as any); }}
                    className="bg-[#1a0b2e] border border-pink-500/20 text-white text-[10px] p-4 rounded-2xl outline-none focus:border-pink-500 font-black uppercase tracking-widest cursor-pointer shadow-xl"
                  >
                    <option value="NEWEST">Sequence: Recency</option>
                    <option value="PRICE">Valuation: Market</option>
                    <option value="RARITY">Class: Tier</option>
                  </select>
                  <div className="bg-[#1a0b2e] px-10 py-4 rounded-3xl border border-pink-500/20 text-right shadow-[0_0_40px_rgba(0,0,0,0.4)]">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-1">Total Net Worth</p>
                    <p className="text-3xl text-yellow-500 font-black font-rajdhani tracking-tighter drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]">${inventory.reduce((acc, item) => acc + item.price, 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {sortedInventory.map((item) => (
                  <motion.div 
                    key={item.instanceId} 
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { sounds.playClick(); setSelectedItem(item); }}
                    className="bg-[#1a0b2e] border border-pink-500/10 rounded-3xl p-5 group relative cursor-pointer hover:bg-[#25133d] transition-all shadow-2xl"
                  >
                    <div className={`absolute bottom-0 left-0 right-0 h-2 rounded-b-3xl ${RARITY_COLORS[item.rarity]}`}></div>
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full group-hover:bg-white/10 transition-all"></div>
                      <img src={item.imageUrl} className="w-full aspect-square object-contain relative z-10 group-hover:scale-115 transition-transform duration-500" />
                    </div>
                    <p className="text-[9px] text-slate-500 font-black truncate opacity-80 uppercase tracking-tighter mb-1">{item.weapon}</p>
                    <p className="text-xs text-white font-black truncate font-rajdhani uppercase italic tracking-tight">{item.name}</p>
                  </motion.div>
                ))}
              </div>

              <AnimatePresence>
                {selectedItem && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-6 backdrop-blur-2xl"
                  >
                     <motion.div 
                       initial={{ scale: 0.9, opacity: 0, y: 30 }}
                       animate={{ scale: 1, opacity: 1, y: 0 }}
                       exit={{ scale: 0.9, opacity: 0, y: 30 }}
                       className="bg-[#1a0b2e] border-2 border-pink-500/30 p-14 rounded-[4rem] max-w-2xl w-full relative shadow-[0_0_150px_rgba(236,72,153,0.3)] overflow-hidden"
                     >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-600/5 blur-[120px]"></div>
                        <button onClick={() => { sounds.playTick(); setSelectedItem(null); }} className="absolute top-10 right-10 text-slate-700 hover:text-white text-4xl transition-colors">✕</button>
                        <div className="flex flex-col items-center">
                            <div className="relative mb-12">
                              <div className="absolute inset-0 bg-pink-500/5 blur-[60px] scale-150"></div>
                              <img src={selectedItem.imageUrl} className="w-80 h-80 object-contain relative z-10 filter drop-shadow-[0_20px_60px_rgba(0,0,0,0.8)]" />
                            </div>
                            <p className="text-pink-500 font-black tracking-[0.6em] uppercase text-[10px] mb-4 italic">{selectedItem.weapon}</p>
                            <h3 className="text-6xl font-black text-white font-rajdhani mb-6 text-center tracking-tighter italic uppercase">{selectedItem.name}</h3>
                            <div className={`px-12 py-3 rounded-full text-xs font-black mb-14 tracking-[0.4em] uppercase shadow-[0_0_30px_rgba(0,0,0,0.5)] italic border border-white/10 ${RARITY_COLORS[selectedItem.rarity]}`}>{selectedItem.rarity}</div>
                            
                            <div className="w-full grid grid-cols-2 gap-10 text-center mb-14">
                               <div className="bg-[#0f051a] p-8 rounded-[2rem] border border-pink-500/15 shadow-inner">
                                  <p className="text-[10px] text-slate-500 font-black uppercase mb-3 tracking-[0.3em]">Estimated Value</p>
                                  <p className="text-4xl text-yellow-500 font-rajdhani font-black tracking-tighter drop-shadow-[0_0_12px_rgba(234,179,8,0.4)]">${selectedItem.price.toFixed(2)}</p>
                               </div>
                               <div className="bg-[#0f051a] p-8 rounded-[2rem] border border-pink-500/15 shadow-inner">
                                  <p className="text-[10px] text-slate-500 font-black uppercase mb-3 tracking-[0.3em]">Neural Stamp</p>
                                  <p className="text-base text-white font-black mt-2 uppercase tracking-widest italic">{new Date(selectedItem.acquiredAt).toLocaleDateString()}</p>
                               </div>
                            </div>

                            <button 
                              onClick={() => handleSellSkin(selectedItem)}
                              className="w-full py-7 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-black uppercase tracking-[0.5em] rounded-3xl hover:from-yellow-500 hover:to-yellow-300 transition-all shadow-2xl shadow-yellow-900/50 active:scale-95 text-base italic border-t border-white/20"
                            >
                              LIQUIDATE FOR ${selectedItem.price.toFixed(2)}
                            </button>
                        </div>
                     </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {currentView === 'CASE_OPEN' && activeCase && (
            <motion.div 
              key={`case_open_${caseSessionId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CaseOpener key={caseSessionId} activeCase={activeCase} onClose={() => handleNavigate('LOBBY')} onWin={handleWinItem} />
            </motion.div>
          )}

          {currentView === 'ADMIN' && (
            <motion.div 
              key="admin"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="max-w-xl mx-auto space-y-10"
            >
              <div className="text-center">
                <h2 className="text-5xl font-black font-rajdhani text-white uppercase italic mb-4 tracking-tighter">ROOT ACCESS</h2>
                <div className="bg-red-600/10 px-6 py-2 rounded-full border border-red-600/20 inline-block">
                  <p className="text-red-500 font-bold text-[10px] tracking-[0.6em] uppercase">Security Clearance Required</p>
                </div>
              </div>

              {!isAdminAuth ? (
                <div className="bg-[#1a0b2e] border border-pink-500/10 rounded-[4rem] p-12 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-pink-600/5 blur-3xl"></div>
                  <div className="space-y-10">
                    <div>
                      <label className="block text-[11px] font-black text-pink-500 uppercase tracking-[0.4em] mb-5 italic">Neural Override Key</label>
                      <input 
                        type="password" 
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full bg-[#0f051a] border border-[#2d1b4d] rounded-3xl p-7 text-white font-rajdhani text-3xl outline-none focus:border-pink-500 transition-all placeholder:text-slate-900 shadow-inner"
                        placeholder="••••••••"
                      />
                    </div>
                    <button 
                      onClick={handleAdminAuth}
                      className="w-full bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-500 hover:to-purple-600 text-white font-black py-7 rounded-3xl uppercase tracking-[0.4em] shadow-2xl shadow-pink-900/40 active:scale-95 transition-all italic text-sm"
                    >
                      ESTABLISH UPLINK
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#1a0b2e] border-2 border-green-600/30 rounded-[4rem] p-12 shadow-2xl space-y-14 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-green-600 opacity-5 blur-[100px]"></div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-10">
                    <h3 className="text-3xl font-black text-white font-rajdhani italic tracking-tighter uppercase">ADMIN OVERRIDE</h3>
                    <div className="bg-green-600/10 px-6 py-2 rounded-full border border-green-600/40">
                      <span className="text-green-500 text-[10px] font-black uppercase tracking-[0.4em]">SECURE ROOT CHANNEL</span>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-5 italic">Direct Credit Injection</label>
                      <div className="relative">
                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-yellow-500 font-black text-3xl">$</span>
                        <input 
                          type="number" 
                          value={adminBalanceInput}
                          onChange={(e) => setAdminBalanceInput(e.target.value)}
                          className="w-full bg-[#0f051a] border border-white/5 rounded-3xl p-8 pl-16 text-white font-rajdhani text-5xl outline-none focus:border-green-500 transition-all font-black shadow-inner"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleSetBalance}
                      className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-7 rounded-3xl uppercase tracking-[0.4em] shadow-2xl shadow-green-900/40 active:scale-95 transition-all italic text-sm border-t border-white/20"
                    >
                      COMMIT DATA CHANGES
                    </button>
                  </div>

                  <button 
                    onClick={() => setIsAdminAuth(false)}
                    className="w-full text-slate-700 hover:text-slate-400 text-[11px] font-black uppercase tracking-[0.8em] transition-colors italic"
                  >
                    Disconnect ROOT-LEVEL Sync
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-24 bg-[#05020a] border-t border-pink-500/5 mt-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="w-20 h-20 rounded-full border border-pink-500/20 mx-auto mb-10 opacity-30 grayscale overflow-hidden group hover:grayscale-0 hover:opacity-100 transition-all duration-700 cursor-help">
            <img src={MASCOT_URL} className="w-full h-full object-cover" style={{ filter: 'hue-rotate(270deg)' }} />
          </div>
          <h4 className="text-2xl font-black font-rajdhani text-white/20 mb-4 tracking-[0.2em] italic uppercase">Devourer Management Systems</h4>
          <p className="text-slate-900 text-[11px] font-black uppercase tracking-[1em] font-rajdhani">© 2024 DEVOUREROFCASE | THE NEURAL REIGN</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pink-600/30 to-transparent"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[1px] bg-gradient-to-r from-transparent via-pink-500/10 to-transparent"></div>
      </footer>
    </div>
  );
};

export default App;
