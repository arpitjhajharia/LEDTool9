import React, { useState, useEffect } from 'react';
import { auth, db, appId, isConfigured } from './config/firebase';
import firebase from 'firebase/compat/app';
import { Calculator, Box, FileText, Sun, Moon, RefreshCw } from 'lucide-react';
import InventoryManager from './components/InventoryManager';
import StockManager from './components/StockManager';
import QuoteCalculator from './components/QuoteCalculator';
import SavedQuotesManager from './components/SavedQuotesManager';
import Login from './components/Login';

const INITIAL_CALCULATOR_STATE = {
    client: '', project: '', screenQty: 1, targetWidth: 3, targetHeight: 2, unit: 'm',
    selectedIndoor: 'true', assemblyMode: 'assembled',
    selectedPitch: '', selectedModuleId: '', selectedCabinetId: '',
    selectedCardId: '', selectedPSUId: '', selectedProcId: '',
    sizingMode: 'near', readyId: '',
    margin: 20,
    extras: {
        labour: { val: 0, type: 'abs' },
        transport: { val: 0, type: 'abs' },
        structure: { val: 0, type: 'abs' },
        buffer: { val: 0, type: 'pct' }
    },
    overrides: {},
    editingRow: null
};

function App() {
    const [user, setUser] = useState(null);
    const [initializing, setInitializing] = useState(true);
    const [inventory, setInventory] = useState([]);
    const [exchangeRate, setExchangeRate] = useState(83);
    const [view, setView] = useState('calc');
    const [darkMode, setDarkMode] = useState(false);
    const [calculatorState, setCalculatorState] = useState(INITIAL_CALCULATOR_STATE);

    useEffect(() => {
        if (!isConfigured) {
            setInitializing(false);
            return;
        }
        const unsub = auth.onAuthStateChanged(u => {
            setUser(u);
            setInitializing(false);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!db || !user) {
            setInventory([]);
            return;
        }
        const unsub = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('inventory')
            .onSnapshot(snap => {
                setInventory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, err => {
                console.error("Inventory Fetch Error:", err);
            });
        return () => unsub();
    }, [user]);

    const handleLogin = () => {
        // Fallback or legacy manual login - usually won't be triggered now with Login component
        const email = prompt("Email:");
        if (email === null) return;
        const pass = prompt("Password:");
        if (pass === null) return;

        if (email && pass) {
            auth.signInWithEmailAndPassword(email, pass).catch(e => alert(e.message));
        }
    };

    const handleSaveQuote = async () => {
        if (!user) return;
        const finalPrice = document.querySelector('.text-3xl')?.innerText || '0';
        try {
            const data = {
                client: calculatorState.client,
                project: calculatorState.project,
                updatedAt: new Date(),
                userId: user.uid,
                finalAmount: Number(finalPrice.replace(/[^0-9.-]+/g, "")),
                calculatorState: calculatorState
            };
            await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('quotes').add(data);
            alert("Quote Saved Successfully!");
        } catch (e) { alert(e.message); }
    };

    const onLoadQuote = (quote, isClone = false) => {
        setCalculatorState(quote.calculatorState);
        if (isClone) {
            setCalculatorState(prev => ({ ...prev, client: `${prev.client} (Copy)`, project: `${prev.project} (Copy)` }));
        }
        setView('calc');
    };

    if (!isConfigured) return <div className="p-10 text-center text-red-500 font-sans">Firebase is not configured correctly. Check your environment variables or config files.</div>;

    if (initializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="w-10 h-10 border-4 border-teal-600/20 border-t-teal-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <Login onLoginSuccess={() => { }} />;
    }

    return (
        <div className={darkMode ? 'dark' : ''}>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 pb-20 font-sans">
                {/* Navbar */}
                <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-teal-600 flex items-center justify-center text-white font-bold">A</div>
                                <h1 className="font-black text-xl tracking-tight text-slate-800 dark:text-white">ADMIRE <span className="text-teal-600 font-normal">SIGNAGE</span></h1>
                            </div>
                            <div className="hidden md:flex items-center gap-6">
                                <button onClick={() => setView('calc')} className={`text-sm font-bold flex items-center gap-1.5 transition-colors ${view === 'calc' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                                    <Calculator size={16} /> Calculator
                                </button>
                                <button onClick={() => setView('quotes')} className={`text-sm font-bold flex items-center gap-1.5 transition-colors ${view === 'quotes' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                                    <FileText size={16} /> Saved Quotes
                                </button>
                                <button onClick={() => setView('inventory')} className={`text-sm font-bold flex items-center gap-1.5 transition-colors ${view === 'inventory' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                                    <Box size={16} /> BOM
                                </button>
                                <button onClick={() => setView('stock')} className={`text-sm font-bold flex items-center gap-1.5 transition-colors ${view === 'stock' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                                    <RefreshCw size={16} /> Inventory
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                                <span className="text-[10px] font-bold text-slate-400 px-2 tracking-wider">USD INR</span>
                                <input type="number" className="w-12 bg-white dark:bg-slate-600 text-[10px] font-bold p-1 rounded border-none outline-none dark:text-white text-center" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} />
                                <button className="p-1 hover:rotate-180 transition-transform duration-500 text-slate-400"><RefreshCw size={12} /></button>
                            </div>
                            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
                            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-200 dark:border-slate-700">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged in as</p>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{user.email ? user.email.split('@')[0] : 'Guest'}</p>
                                </div>
                                <button onClick={() => auth.signOut()} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto p-6 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {view === 'calc' && <QuoteCalculator user={user} inventory={inventory} state={calculatorState} setState={setCalculatorState} exchangeRate={exchangeRate} onSaveQuote={handleSaveQuote} onLogin={handleLogin} />}
                    {view === 'inventory' && <InventoryManager user={user} inventory={inventory} onLogin={handleLogin} />}
                    {view === 'stock' && <StockManager user={user} inventory={inventory} />}
                    {view === 'quotes' && <SavedQuotesManager user={user} onLoadQuote={onLoadQuote} onLogin={handleLogin} />}
                </main>
            </div>
        </div>
    );
}


export default App;
