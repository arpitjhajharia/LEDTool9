import React from 'react';
import { FileText, Edit, Copy, Trash2 } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { formatCurrency } from '../utils/utils';

const SavedQuotesManager = ({ user, onLoadQuote }) => {
    const [quotes, setQuotes] = React.useState([]);

    React.useEffect(() => {
        if (!user) return;
        const unsub = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('quotes')
            .orderBy('updatedAt', 'desc')
            .onSnapshot(snap => {
                setQuotes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
        return () => unsub();
    }, [user]);

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this quote?")) {
            await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('quotes').doc(id).delete();
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                    <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Saved Quotes
                </h2>
            </div>

            <div className="grid gap-4">
                {quotes.map(quote => {
                    const state = quote.calculatorState || {};
                    const unit = state.unit || 'm';
                    const width = state.finalWidth || state.targetWidth;
                    const height = state.finalHeight || state.targetHeight;
                    const pitch = state.selectedPitch || 'N/A';
                    const isIndoor = state.selectedIndoor === 'true';

                    return (
                        <div key={quote.id} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-700/50 dark:border-slate-600 flex justify-between items-center">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-slate-800 dark:text-white">{quote.project || 'Untitled Project'}</h3>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${isIndoor ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                                        {isIndoor ? 'Indoor' : 'Outdoor'}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">P{pitch}</span>
                                </div>
                                <p className="text-sm text-slate-500 mb-2">{quote.client || 'No Client'} • {new Date(quote.updatedAt?.seconds * 1000).toLocaleDateString()}</p>

                                <div className="flex gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-400">
                                    <span className="bg-white dark:bg-slate-800 border dark:border-slate-600 px-2 py-1 rounded">Size: {state.targetWidth} x {state.targetHeight} {unit}</span>
                                    <span className="bg-white dark:bg-slate-800 border dark:border-slate-600 px-2 py-1 rounded">Qty: {state.screenQty || 1}</span>
                                    <span className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-800 px-2 py-1 rounded font-bold">{formatCurrency(quote.finalAmount, 'INR')}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                                <button onClick={() => onLoadQuote(quote, false)} className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"><Edit size={14} /> Edit</button>
                                <button onClick={() => onLoadQuote(quote, true)} className="px-3 py-2 bg-slate-600 text-white rounded text-sm hover:bg-slate-700 flex items-center gap-1"><Copy size={14} /> Clone</button>
                                <button onClick={() => handleDelete(quote.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    );
                })}
                {quotes.length === 0 && <p className="text-center text-slate-400 py-10">No saved quotes found.</p>}
            </div>
        </div>
    );
};

export default SavedQuotesManager;
