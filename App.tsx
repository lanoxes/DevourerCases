
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

  // The iconic cyberpunk mascot image URL
  const MASCOT_URL = "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=1974&auto=format&fit=crop";

  const handleNavigate = (v: View) => {
    sounds.playClick();
    setView(v);
  };

  const handleOpenCase = (c: Case) => {
    if (balance >= c.price) {
      sounds.playClick();
      setBalance(prev => Math.max(0, prev - c.price));
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
      setBalance(prev => Math.max(0, prev - skin.price));
      handleWinItem(skin);
      alert(`Asset Secured: ${skin.weapon} | ${skin.name}`);
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
      alert("Access Denied: Incorrect Root Key");
    }
  };

  const handleSetBalance = () => {
    const newBalance = parseFloat(adminBalanceInput);
    if (!isNaN(newBalance)) {
      setBalance(newBalance);
      sounds.playWin();
      alert(`Root Override: Core Balance set to $${newBalance.toFixed(2)}`);
    } else {
      alert("Invalid numeric input.");
    }
  };

  const handleProcessTopup = () => {
    if (paymentAmount <= 0) return;
    setIsProcessingPayment(true);
    sounds.playClick();
    
    // Vercel deployment: Modern Fetch is global, ensuring no node-domexception triggers
    setTimeout(() => {
      setBalance(prev => prev + paymentAmount);
      setIsProcessingPayment(false);
      sounds.playWin();
      alert(`Protocol Success: $${paymentAmount.toFixed(2)} synchronized via ${selectedProvider}.`);
      handleNavigate('LOBBY');
    }, 1800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#05020a]">
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
              <div className="flex items-center gap-8 border-l-4 border-pink-600 pl-6 py-4 bg-[#1a0b2e]/40 rounded-r-[2rem] shadow-2xl backdrop-blur-md">
                <div className="relative group">
                  <div className="absolute inset-0 bg-pink-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <div className="w-24 h-24 rounded-3xl border-2 border-pink-500/30 overflow-hidden shadow-2xl hidden md:block relative z-10">
                    <img 
                      src={MASCOT_URL} 
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
                      style={{ filter: 'hue-rotate(270deg) brightness(1.2)' }} 
                    />
                  </div>
                </div>
                <div>
                  <h2 className="text-5xl font-black font-rajdhani text-white uppercase italic tracking-tighter drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">EXTRACTION POINT</h2>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-pink-500 font-bold uppercase text-[9px] tracking-[0.6em]">Neural Sync Deployment Active</p>
                    <div className="h-[1px] w-32 bg-gradient-to-r from-pink-600 to-transparent"></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {cases.map(c => (
                  <motion.div 
                    key={c.id} 
                    whileHover={{ y: -12, scale: 1.02 }}
                    className={`group bg-[#1a0b2e] border-2 ${c.rarityTier ? BORDER_COLORS[c.rarityTier] : 'border-pink-500/10'} rounded-[2rem] p-8 flex flex-col items-center hover:bg-[#25133d] transition-all relative overflow-hidden shadow-2xl ${c.rarityTier ? GLOW_COLORS[c.rarityTier] : 'shadow-black/60'}`}
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(c.id); }}
                      className={`absolute top-6 right-6 text-xl transition-all ${wishlist.includes(c.id) ? 'text-pink-500 scale-125 drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]' : 'text-slate-700 hover:text-pink-500'}`}
                    >
                      ★
                    </button>
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-pink-500/5 blur-3xl rounded-full scale-150 group-hover:bg-pink-500/15 transition-all"></div>
                      <img src={c.imageUrl} alt={c.name} className="w-44 h-44 object-contain relative z-10 transform group-hover:rotate-6 group-hover:scale-115 transition-all duration-500 drop-shadow-[0_25px_45px_rgba(0,0,0,0.7)]" />
                    </div>
                    <h3 className="text-2xl font-black font-rajdhani text-white mb-3 text-center h-16 flex items-center tracking-tight leading-tight uppercase italic drop-shadow-sm">{c.name}</h3>
                    <p className="text-yellow-500 font-black mb-8 text-3xl font-rajdhani drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]">${c.price.toFixed(2)}</p>
                    <button onClick={() => handleOpenCase(c)} className="w-full bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-500 hover:to-purple-600 text-white font-black py-4.5 rounded-2xl transition-all shadow-xl hover:shadow-pink-600/50 active:scale-95 uppercase tracking-[0.25em] text-[10px] italic border-b-4 border-black/40">Execute Protocol</button>
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
              className="max-w-4xl mx-auto space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-6xl font-black font-rajdhani text-white uppercase italic tracking-tighter drop-shadow-2xl">CREDIT UPLINK</h2>
                <div className="inline-flex items-center gap-6 bg-pink-600/10 px-8 py-2 rounded-full border border-pink-500/20 backdrop-blur-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse"></span>
                  <p className="text-pink-500 font-bold text-[10px] tracking-[0.6em] uppercase">Authorized Secure Gateway: Neural Handshake Stable</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-10">
                  <div className="bg-[#1a0b2e]/60 border border-pink-500/10 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden backdrop-blur-lg">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-pink-600/5 blur-[100px] rounded-full"></div>
                    <h3 className="text-white font-black uppercase tracking-[0.3em] text-xs mb-10 flex items-center gap-5">
                      <span className="w-12 h-12 rounded-2xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-sm font-black italic text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]">01</span>
                      Resource Allocation
                    </h3>
                    <div className="grid grid-cols-3 gap-6">
                      {[10, 25, 50, 100, 250, 500].map(amt => (
                        <button 
                          key={amt}
                          onClick={() => { sounds.playTick(); setPaymentAmount(amt); }}
                          className={`py-8 rounded-[2rem] font-black font-rajdhani text-4xl border-2 transition-all ${paymentAmount === amt ? 'bg-pink-600 border-pink-400 text-white shadow-[0_0_40px_rgba(236,72,153,0.4)] scale-105' : 'bg-[#0f051a] border-[#2d1b4d] text-slate-500 hover:border-pink-500/50 hover:text-white'}`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#1a0b2e]/60 border border-pink-500/10 rounded-[3rem] p-12 shadow-2xl backdrop-blur-lg">
                    <h3 className="text-white font-black uppercase tracking-[0.3em] text-xs mb-10 flex items-center gap-5">
                      <span className="w-12 h-12 rounded-2xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-sm font-black italic text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]">02</span>
                      Transfer Interface
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                      {(['PAYPAL', 'DANA', 'GOPAY', 'QRIS', 'SEABANK'] as PaymentProvider[]).map(provider => (
                        <button 
                          key={provider}
                          onClick={() => { sounds.playTick(); setSelectedProvider(provider); }}
                          className={`flex flex-col items-center justify-center gap-5 p-8 rounded-[2.5rem] border-2 transition-all ${selectedProvider === provider ? 'bg-pink-600/15 border-pink-500 text-white shadow-[0_0_25px_rgba(236,72,153,0.2)]' : 'bg-[#0f051a] border-[#2d1b4d] text-slate-500 hover:border-pink-500/40'}`}
                        >
                          <span className="text-[11px] font-black uppercase tracking-[0.5em]">{provider}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="bg-[#1a0b2e] border-2 border-pink-600/40 rounded-[3rem] p-12 shadow-[0_0_60px_rgba(236,72,153,0.1)] sticky top-36 overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-pink-600 opacity-10 blur-[80px] rounded-full"></div>
                    <h3 className="text-white font-black uppercase tracking-[0.3em] text-[10px] mb-12 border-b border-pink-500/10 pb-6 italic">Protocol Metadata</h3>
                    <div className="space-y-8 mb-14">
                      <div className="flex justify-between text-slate-500 text-[11px] font-black uppercase tracking-[0.3em]">
                        <span>Units Ordered</span>
                        <span className="text-white">${paymentAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px] font-black uppercase tracking-[0.3em]">
                        <span>Portal Fee</span>
                        <span className="text-green-500 font-black italic">EXEMPT</span>
                      </div>
                      <div className="pt-10 flex justify-between items-center border-t border-pink-500/20">
                        <span className="text-white font-black uppercase tracking-[0.3em] text-xs italic">Grand Total</span>
                        <span className="text-5xl text-yellow-500 font-black font-rajdhani drop-shadow-[0_0_20px_rgba(234,179,8,0.5)] tracking-tighter">${paymentAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleProcessTopup}
                      disabled={isProcessingPayment || paymentAmount <= 0}
                      className="w-full bg-gradient-to-br from-pink-600 via-purple-700 to-pink-800 hover:from-pink-500 hover:to-purple-600 text-white font-black py-8 rounded-[2rem] uppercase tracking-[0.5em] shadow-2xl shadow-pink-900/60 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all text-[11px] italic border-t border-pink-400/20"
                    >
                      {isProcessingPayment ? (
                        <span className="flex items-center justify-center gap-4">
                           <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
                           SYNCING...
                        </span>
                      ) : 'START UPLINK'}
                    </button>
                    <p className="mt-8 text-[9px] text-slate-700 font-black uppercase text-center tracking-widest">Neural Encryption: 512-bit RSA</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'AI_ANALYSIS' && (
            <motion.div key="ai" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-5xl mx-auto space-y-16">
               <div className="text-center space-y-2">
                  <h2 className="text-7xl font-black font-rajdhani text-white uppercase italic tracking-tighter drop-shadow-2xl">NEURAL SYNC</h2>
                  <p className="text-pink-500 font-bold text-[12px] tracking-[0.7em] uppercase">Protocol Mascot: Destiny Evaluator V2.4</p>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-pink-600 rounded-[4rem] blur-[100px] opacity-15 group-hover:opacity-30 transition-all duration-1000"></div>
                    <div className="relative z-10 rounded-[4rem] border-2 border-pink-500/40 overflow-hidden shadow-[0_0_80px_rgba(236,72,153,0.2)] aspect-[4/5] bg-[#0f051a]">
                       <img 
                          src={MASCOT_URL} 
                          className="w-full h-full object-cover transition-all duration-1000 grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105" 
                          style={{ filter: 'hue-rotate(270deg) brightness(1.2) contrast(1.15)' }} 
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-[#05020a] via-transparent to-transparent opacity-90"></div>
                       <div className="absolute bottom-12 left-0 right-0 text-center flex flex-col items-center">
                          <div className="h-0.5 w-32 bg-pink-500 mb-6 animate-pulse shadow-[0_0_15px_pink]"></div>
                          <span className="text-pink-500 font-black tracking-[0.8em] uppercase text-[12px] italic drop-shadow-[0_0_15px_rgba(236,72,153,1)]">NEURAL HANDSHAKE: STABLE</span>
                       </div>
                    </div>
                  </div>

                  <div className="bg-[#1a0b2e]/90 backdrop-blur-2xl border-2 border-pink-500/20 rounded-[5rem] p-16 flex flex-col items-center gap-12 shadow-3xl relative overflow-hidden h-full justify-between border-t-pink-500/40">
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-pink-600 opacity-5 blur-[120px] rounded-full"></div>
                    
                    <div className="w-full flex flex-col items-center gap-6">
                      <h3 className="text-white font-black font-rajdhani text-3xl tracking-[0.2em] uppercase italic drop-shadow-sm">DIAGNOSTIC CORE</h3>
                      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-pink-500/30 to-transparent"></div>
                    </div>

                    <motion.div 
                      animate={isAiLoading ? { rotate: 360 } : {}}
                      transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                      className="w-64 h-64 rounded-full border-[12px] border-pink-500/10 border-t-pink-600 flex items-center justify-center bg-[#05020a] shadow-[0_0_80px_rgba(236,72,153,0.3)] relative group-hover:shadow-pink-600/50 transition-all"
                    >
                       <div className="absolute inset-4 rounded-full border-2 border-pink-500/5 animate-[ping_3s_infinite]"></div>
                       <span className="text-[9rem] font-black text-white font-rajdhani italic drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] tracking-tighter">{aiResponse ? aiResponse.score : '??'}</span>
                    </motion.div>

                    <div className="min-h-[200px] w-full flex items-center justify-center px-8 relative z-10">
                      <AnimatePresence mode="wait">
                        {aiResponse ? (
                          <motion.p 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-slate-100 italic text-3xl leading-relaxed font-serif text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
                          >
                            "{aiResponse.comment}"
                          </motion.p>
                        ) : (
                          <div className="flex flex-col items-center gap-8">
                            <p className="text-pink-500/50 font-black uppercase tracking-[0.6em] text-[11px] animate-pulse">Awaiting Mascot Synchronization Pulse...</p>
                            <div className="flex gap-4">
                              {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 rounded-full bg-pink-600 animate-bounce shadow-[0_0_8px_pink]" style={{ animationDelay: `${i * 0.15}s` }}></div>)}
                            </div>
                          </div>
                        )}
                      </AnimatePresence>
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
                      className="w-full bg-white text-black font-black py-8 rounded-[2.5rem] hover:bg-pink-600 hover:text-white disabled:opacity-50 transition-all uppercase tracking-[0.5em] italic text-base shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-pink-600/60 active:scale-95 border-t-2 border-white/30"
                    >
                      {isAiLoading ? 'SCANNING NEURAL MESH...' : 'COMMENCE NEURAL SYNC'}
                    </button>
                  </div>
               </div>
            </motion.div>
          )}

          {/* SHOP, INVENTORY, etc. remain with the refined theme */}
          {currentView === 'SHOP' && (
            <motion.div 
              key="shop"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-10"
            >
              <h2 className="text-5xl font-black font-rajdhani text-white italic border-l-4 border-pink-600 pl-6 uppercase tracking-tighter drop-shadow-xl">BLACK MARKET</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {skins.map(skin => (
                  <motion.div 
                    key={skin.id} 
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="bg-[#1a0b2e] border border-pink-500/10 p-7 rounded-[2.5rem] flex flex-col hover:border-pink-500 transition-all group shadow-2xl backdrop-blur-sm"
                  >
                    <div className={`h-2.5 w-full rounded-t-2xl mb-6 ${RARITY_COLORS[skin.rarity]} shadow-inner`}></div>
                    <img src={skin.imageUrl} className="w-full aspect-square object-contain mb-6 group-hover:scale-115 transition-all duration-700" />
                    <p className="text-[11px] text-slate-500 font-bold tracking-[0.4em] uppercase mb-1.5">{skin.weapon}</p>
                    <p className="text-lg font-black text-white mb-3 truncate font-rajdhani italic tracking-tight">{skin.name}</p>
                    <p className="text-yellow-500 font-black mb-6 font-rajdhani text-3xl tracking-tighter drop-shadow-[0_0_12px_rgba(234,179,8,0.3)]">${skin.price.toLocaleString()}</p>
                    <button onClick={() => handleBuySkin(skin)} className="mt-auto bg-[#05020a] border border-pink-500/20 hover:bg-pink-600 text-white text-[11px] py-4 rounded-2xl font-black uppercase transition-all shadow-md active:scale-95 tracking-[0.5em] italic">Capture Asset</button>
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
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-l-4 border-pink-600 pl-8 bg-[#1a0b2e]/20 p-6 rounded-r-[3rem]">
                <div>
                  <h2 className="text-6xl font-black font-rajdhani text-white italic uppercase tracking-tighter drop-shadow-xl">ARCHIVE VAULT</h2>
                  <p className="text-slate-500 font-bold text-[11px] tracking-[0.6em] uppercase mt-2">{inventory.length} Neural Assets Secured & Encrypted</p>
                </div>
                <div className="flex items-center gap-8">
                  <select 
                    onChange={(e) => { sounds.playTick(); setInventorySort(e.target.value as any); }}
                    className="bg-[#0f051a] border border-pink-500/20 text-white text-[11px] p-5 rounded-2xl outline-none focus:border-pink-500 font-black uppercase tracking-widest cursor-pointer shadow-2xl transition-all"
                  >
                    <option value="NEWEST">Sequence: Recency</option>
                    <option value="PRICE">Valuation: Market</option>
                    <option value="RARITY">Class: Tier System</option>
                  </select>
                  <div className="bg-[#1a0b2e] px-12 py-5 rounded-[2rem] border border-pink-500/30 text-right shadow-[0_0_50px_rgba(0,0,0,0.6)] backdrop-blur-md">
                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] mb-1.5">Net Asset Worth</p>
                    <p className="text-4xl text-yellow-500 font-black font-rajdhani tracking-tighter drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">${inventory.reduce((acc, item) => acc + item.price, 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {inventory.length === 0 ? (
                <div className="py-40 text-center space-y-6 bg-[#1a0b2e]/10 rounded-[4rem] border border-dashed border-pink-500/10">
                   <p className="text-slate-700 text-3xl font-rajdhani uppercase tracking-[0.4em] italic">Archive currently empty</p>
                   <button onClick={() => handleNavigate('LOBBY')} className="text-pink-500 font-black uppercase text-xs tracking-widest hover:text-white transition-colors">Commence Extraction</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-10">
                  {sortedInventory.map((item) => (
                    <motion.div 
                      key={item.instanceId} 
                      whileHover={{ scale: 1.08, y: -8 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => { sounds.playClick(); setSelectedItem(item); }}
                      className="bg-[#1a0b2e] border border-pink-500/10 rounded-[2.5rem] p-6 group relative cursor-pointer hover:bg-[#25133d] transition-all shadow-3xl"
                    >
                      <div className={`absolute bottom-0 left-0 right-0 h-2.5 rounded-b-[2.5rem] ${RARITY_COLORS[item.rarity]}`}></div>
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-all duration-700"></div>
                        <img src={item.imageUrl} className="w-full aspect-square object-contain relative z-10 group-hover:scale-120 transition-all duration-700 drop-shadow-xl" />
                      </div>
                      <p className="text-[10px] text-slate-500 font-black truncate opacity-80 uppercase tracking-tighter mb-1.5">{item.weapon}</p>
                      <p className="text-sm text-white font-black truncate font-rajdhani uppercase italic tracking-tight">{item.name}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              <AnimatePresence>
                {selectedItem && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] bg-[#05020a]/98 flex items-center justify-center p-8 backdrop-blur-3xl"
                  >
                     <motion.div 
                       initial={{ scale: 0.85, opacity: 0, y: 40 }}
                       animate={{ scale: 1, opacity: 1, y: 0 }}
                       exit={{ scale: 0.85, opacity: 0, y: 40 }}
                       className="bg-[#1a0b2e]/80 border-2 border-pink-500/30 p-16 rounded-[5rem] max-w-2xl w-full relative shadow-[0_0_180px_rgba(236,72,153,0.3)] overflow-hidden"
                     >
                        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-600/10 blur-[150px]"></div>
                        <button onClick={() => { sounds.playTick(); setSelectedItem(null); }} className="absolute top-12 right-12 text-slate-700 hover:text-white text-5xl transition-all transform hover:rotate-90">✕</button>
                        <div className="flex flex-col items-center">
                            <div className="relative mb-14">
                              <div className="absolute inset-0 bg-pink-500/5 blur-[80px] scale-150 rounded-full animate-pulse"></div>
                              <img src={selectedItem.imageUrl} className="w-96 h-96 object-contain relative z-10 filter drop-shadow-[0_30px_80px_rgba(0,0,0,1)]" />
                            </div>
                            <p className="text-pink-500 font-black tracking-[0.8em] uppercase text-[11px] mb-6 italic drop-shadow-md">{selectedItem.weapon}</p>
                            <h3 className="text-7xl font-black text-white font-rajdhani mb-8 text-center tracking-tighter italic uppercase leading-none">{selectedItem.name}</h3>
                            <div className={`px-16 py-4 rounded-full text-sm font-black mb-16 tracking-[0.5em] uppercase shadow-3xl italic border border-white/10 ${RARITY_COLORS[selectedItem.rarity]}`}>{selectedItem.rarity}</div>
                            
                            <div className="w-full grid grid-cols-2 gap-12 text-center mb-16">
                               <div className="bg-[#05020a] p-10 rounded-[2.5rem] border border-pink-500/20 shadow-inner">
                                  <p className="text-[11px] text-slate-500 font-black uppercase mb-4 tracking-[0.4em]">Valuation Mesh</p>
                                  <p className="text-5xl text-yellow-500 font-rajdhani font-black tracking-tighter drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">${selectedItem.price.toFixed(2)}</p>
                               </div>
                               <div className="bg-[#05020a] p-10 rounded-[2.5rem] border border-pink-500/20 shadow-inner">
                                  <p className="text-[11px] text-slate-500 font-black uppercase mb-4 tracking-[0.4em]">Registry Date</p>
                                  <p className="text-xl text-white font-black mt-3 uppercase tracking-widest italic">{new Date(selectedItem.acquiredAt).toLocaleDateString()}</p>
                               </div>
                            </div>

                            <button 
                              onClick={() => handleSellSkin(selectedItem)}
                              className="w-full py-8 bg-gradient-to-r from-yellow-600 to-yellow-300 text-black font-black uppercase tracking-[0.6em] rounded-[2.5rem] hover:from-yellow-500 hover:to-white transition-all shadow-3xl shadow-yellow-900/60 active:scale-95 text-lg italic border-t-2 border-white/40"
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
              className="max-w-2xl mx-auto space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-6xl font-black font-rajdhani text-white uppercase italic tracking-tighter drop-shadow-2xl">ROOT ACCESS</h2>
                <div className="bg-red-600/10 px-8 py-3 rounded-full border border-red-600/30 inline-flex items-center gap-4">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
                  <p className="text-red-500 font-bold text-[11px] tracking-[0.6em] uppercase">Authorized Personnel Only</p>
                </div>
              </div>

              {!isAdminAuth ? (
                <div className="bg-[#1a0b2e] border-2 border-pink-500/10 rounded-[4rem] p-16 shadow-3xl relative overflow-hidden backdrop-blur-md">
                  <div className="absolute top-0 left-0 w-40 h-40 bg-pink-600/5 blur-[80px]"></div>
                  <div className="space-y-12">
                    <div className="space-y-6">
                      <label className="block text-[12px] font-black text-pink-500 uppercase tracking-[0.5em] italic">Neural Encryption Key</label>
                      <input 
                        type="password" 
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full bg-[#05020a] border-2 border-pink-500/10 rounded-3xl p-8 text-white font-rajdhani text-4xl outline-none focus:border-pink-500 transition-all placeholder:text-slate-900 shadow-inner tracking-[0.2em]"
                        placeholder="••••••••"
                      />
                    </div>
                    <button 
                      onClick={handleAdminAuth}
                      className="w-full bg-gradient-to-r from-pink-600 to-purple-800 hover:from-pink-500 hover:to-purple-700 text-white font-black py-8 rounded-3xl uppercase tracking-[0.5em] shadow-2xl shadow-pink-900/50 active:scale-95 transition-all italic text-base border-t border-pink-400/20"
                    >
                      ESTABLISH UPLINK
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#1a0b2e] border-2 border-green-600/30 rounded-[4rem] p-16 shadow-3xl space-y-16 relative overflow-hidden backdrop-blur-md">
                   <div className="absolute top-0 right-0 w-80 h-80 bg-green-600 opacity-5 blur-[120px] rounded-full"></div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-12">
                    <h3 className="text-4xl font-black text-white font-rajdhani italic tracking-tighter uppercase drop-shadow-md">ADMIN OVERRIDE</h3>
                    <div className="bg-green-600/10 px-8 py-3 rounded-full border border-green-600/50 flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-500 text-[11px] font-black uppercase tracking-[0.4em]">ROOT STABLE</span>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <div className="space-y-6">
                      <label className="block text-[12px] font-black text-slate-500 uppercase tracking-[0.5em] italic">Force Balance Injection</label>
                      <div className="relative">
                        <span className="absolute left-10 top-1/2 -translate-y-1/2 text-yellow-500 font-black text-4xl italic">$</span>
                        <input 
                          type="number" 
                          value={adminBalanceInput}
                          onChange={(e) => setAdminBalanceInput(e.target.value)}
                          className="w-full bg-[#05020a] border-2 border-white/5 rounded-3xl p-10 pl-20 text-white font-rajdhani text-6xl outline-none focus:border-green-500 transition-all font-black shadow-inner tracking-tighter"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleSetBalance}
                      className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-9 rounded-[2.5rem] uppercase tracking-[0.5em] shadow-3xl shadow-green-900/50 active:scale-95 transition-all italic text-base border-t-2 border-white/20"
                    >
                      COMMIT DATA OVERRIDE
                    </button>
                  </div>

                  <button 
                    onClick={() => setIsAdminAuth(false)}
                    className="w-full text-slate-700 hover:text-slate-400 text-[12px] font-black uppercase tracking-[1em] transition-all italic group"
                  >
                    Disconnect <span className="text-red-900/50 group-hover:text-red-600 transition-colors">ROOT-LEVEL Sync</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-28 bg-[#020105] border-t border-pink-500/5 mt-40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <motion.div 
             whileHover={{ scale: 1.1, rotate: 5 }}
             className="w-24 h-24 rounded-full border-2 border-pink-500/20 mx-auto mb-12 opacity-30 grayscale overflow-hidden group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 cursor-crosshair shadow-2xl"
          >
            <img src={MASCOT_URL} className="w-full h-full object-cover" style={{ filter: 'hue-rotate(270deg)' }} />
          </motion.div>
          <h4 className="text-3xl font-black font-rajdhani text-white/15 mb-6 tracking-[0.4em] italic uppercase drop-shadow-sm">Devourer Management Systems</h4>
          <p className="text-slate-900 text-[12px] font-black uppercase tracking-[1.2em] font-rajdhani">© 2024 DEVOUREROFCASE | THE NEURAL REIGN</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pink-600/40 to-transparent"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-pink-500/20 to-transparent"></div>
      </footer>
    </div>
  );
};

export default App;
