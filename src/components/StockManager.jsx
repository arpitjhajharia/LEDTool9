import React from 'react';
import { Package, Plus, Minus, Search, History } from 'lucide-react';
import { db, appId } from '../config/firebase';

const StockManager = ({ user, inventory }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [updatingId, setUpdatingId] = React.useState(null);
    const [updateAmount, setUpdateAmount] = React.useState(1);
    const [note, setNote] = React.useState('');
    const [history, setHistory] = React.useState([]);
    const [showHistoryId, setShowHistoryId] = React.useState(null);
    const [loadingHistory, setLoadingHistory] = React.useState(false);

    const handleUpdateStock = async (item, amount, customNote = '') => {
        if (!user) {
            alert("You must be logged in to update stock.");
            return;
        }

        const currentStock = Number(item.stock || 0);
        const newStock = Math.max(0, currentStock + amount);
        const transactionType = amount >= 0 ? 'IN' : 'OUT';
        const finalNote = customNote || note || (transactionType === 'IN' ? 'Restocked' : 'Stock adjustment');

        try {
            const batch = db.batch();

            // 1. Update Inventory Item
            const itemRef = db.collection('artifacts').doc(appId)
                .collection('public').doc('data')
                .collection('inventory').doc(item.id);
            batch.update(itemRef, {
                stock: newStock,
                updatedAt: new Date()
            });

            // 2. Add Transaction Log
            const transRef = db.collection('artifacts').doc(appId)
                .collection('public').doc('data')
                .collection('transactions').doc();
            batch.set(transRef, {
                itemId: item.id,
                itemDetails: `${item.brand} ${item.model}`,
                type: transactionType,
                quantity: Math.abs(amount),
                previousStock: currentStock,
                newStock: newStock,
                note: finalNote,
                userId: user.uid,
                userEmail: user.email,
                createdAt: new Date()
            });

            await batch.commit();

            setUpdatingId(null);
            setUpdateAmount(1);
            setNote('');

            // If history is open for this item, refresh it
            if (showHistoryId === item.id) fetchHistory(item.id);

        } catch (e) {
            console.error("Stock Update Error:", e);
            alert("Failed to update stock: " + e.message);
        }
    };

    const fetchHistory = async (itemId) => {
        setLoadingHistory(true);
        try {
            const snap = await db.collection('artifacts').doc(appId)
                .collection('public').doc('data')
                .collection('transactions')
                .where('itemId', '==', itemId)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();
            setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) {
            console.error("History Fetch Error:", e);
        }
        setLoadingHistory(false);
    };

    const toggleHistory = (itemId) => {
        if (showHistoryId === itemId) {
            setShowHistoryId(null);
            setHistory([]);
        } else {
            setShowHistoryId(itemId);
            fetchHistory(itemId);
        }
    };

    const filteredInventory = inventory.filter(item =>
    (item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                        <Package className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Inventory Management
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Track and update stock levels for all BOM components.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 dark:text-white text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                            <th className="px-4 py-3">Item Details</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3 text-center">Current Stock</th>
                            <th className="px-4 py-3 text-right">Quick Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                        {filteredInventory.map(item => (
                            <React.Fragment key={item.id}>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="font-semibold text-slate-800 dark:text-white">{item.brand} {item.model}</div>
                                        <div className="text-[11px] text-slate-400">{item.pitch ? `P${item.pitch} | ` : ''}{item.width}x{item.height}mm</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.type === 'module' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                            item.type === 'cabinet' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                                'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className={`text-lg font-black ${item.stock > 0 ? 'text-slate-800 dark:text-white' : 'text-red-500'}`}>
                                            {item.stock || 0}
                                        </div>
                                        <div className="text-[9px] text-slate-400 uppercase font-bold">Units</div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                                                <button
                                                    onClick={() => handleUpdateStock(item, -1, 'Quick Out')}
                                                    className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-md transition shadow-sm text-red-500"
                                                    title="Remove 1"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <div className="px-3 text-xs font-bold dark:text-white text-slate-600">
                                                    Update
                                                </div>
                                                <button
                                                    onClick={() => handleUpdateStock(item, 1, 'Quick In')}
                                                    className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-md transition shadow-sm text-teal-600"
                                                    title="Add 1"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => setUpdatingId(updatingId === item.id ? null : item.id)}
                                                className={`p-2 rounded-lg transition ${updatingId === item.id ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200'}`}
                                                title="Batch Update"
                                            >
                                                <Plus size={16} />
                                            </button>

                                            <button
                                                onClick={() => toggleHistory(item.id)}
                                                className={`p-2 rounded-lg transition ${showHistoryId === item.id ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200'}`}
                                                title="View History"
                                            >
                                                <History size={16} />
                                            </button>
                                        </div>

                                        {updatingId === item.id && (
                                            <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 flex flex-col gap-3">
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <label className="text-[9px] font-bold text-slate-400 mb-1 block text-left">QUANTITY</label>
                                                        <input
                                                            type="number"
                                                            className="w-full p-2 text-sm border rounded bg-white dark:bg-slate-800 dark:text-white"
                                                            value={updateAmount}
                                                            onChange={e => setUpdateAmount(Number(e.target.value))}
                                                            placeholder="Qty"
                                                        />
                                                    </div>
                                                    <div className="flex-[2]">
                                                        <label className="text-[9px] font-bold text-slate-400 mb-1 block text-left">TRANSACTION NOTE</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2 text-sm border rounded bg-white dark:bg-slate-800 dark:text-white"
                                                            value={note}
                                                            onChange={e => setNote(e.target.value)}
                                                            placeholder="Reason (e.g. New Shipment)"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleUpdateStock(item, updateAmount)}
                                                        className="flex-1 py-2 bg-teal-600 text-white text-xs rounded font-bold hover:bg-teal-700 transition"
                                                    >
                                                        STOCK IN
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStock(item, -updateAmount)}
                                                        className="flex-1 py-2 bg-red-600 text-white text-xs rounded font-bold hover:bg-red-700 transition"
                                                    >
                                                        STOCK OUT
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>

                                {showHistoryId === item.id && (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-4 bg-slate-50 dark:bg-slate-900/30">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Transaction History (Last 20)</h4>
                                                <button onClick={() => setShowHistoryId(null)} className="text-[10px] text-slate-400 hover:text-red-500 font-bold">CLOSE</button>
                                            </div>

                                            {loadingHistory ? (
                                                <div className="flex justify-center py-4">
                                                    <div className="w-4 h-4 border-2 border-teal-600/20 border-t-teal-600 rounded-full animate-spin"></div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {history.length > 0 ? history.map(h => (
                                                        <div key={h.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                                                            <div className="flex gap-4 items-center">
                                                                <div className={`px-2 py-0.5 rounded font-black text-[9px] ${h.type === 'IN' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                                    {h.type}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-slate-700 dark:text-slate-200">{h.note}</div>
                                                                    <div className="text-[10px] text-slate-400">{h.createdAt?.toDate().toLocaleString()} • {h.userEmail?.split('@')[0]}</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-black text-slate-800 dark:text-white">
                                                                    {h.type === 'IN' ? '+' : '-'}{h.quantity}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400">Bal: {h.newStock}</div>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <div className="text-center py-4 text-slate-400 text-[10px]">No transaction history found for this item.</div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                {filteredInventory.length === 0 && (
                    <div className="text-center py-20">
                        <Package size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-medium">No items found matching your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockManager;
