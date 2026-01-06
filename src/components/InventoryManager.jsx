import React from 'react';
import { Box, Plus, Edit, Trash2 } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { formatCurrency } from '../utils/utils';

const InventoryManager = ({ user, inventory, onLogin }) => {
    const [editingId, setEditingId] = React.useState(null);
    const [newItem, setNewItem] = React.useState({
        type: 'module', brand: '', model: '', vendor: '', pitch: '',
        width: 250, height: 250, price: 0, carriage: 0, currency: 'INR', indoor: true,
        brightness: '', refreshRate: '', scanRate: '', grayScale: '',
        stock: 0
    });

    const handleSaveItem = async () => {
        if (!user) {
            alert("You must be logged in to manage inventory.");
            onLogin();
            return;
        }
        if (!newItem.brand || !newItem.model) return alert("Brand and Model are required");
        try {
            const collectionRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('inventory');
            const transCollectionRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('transactions');

            const itemData = {
                ...newItem,
                width: Number(newItem.width),
                height: Number(newItem.height),
                price: Number(newItem.price),
                carriage: Number(newItem.carriage || 0),
                pitch: Number(newItem.pitch),
                currency: newItem.currency || 'INR',
                indoor: newItem.indoor === 'true' || newItem.indoor === true,
                stock: Number(newItem.stock || 0),
                updatedAt: new Date()
            };

            const batch = db.batch();

            if (editingId) {
                const itemRef = collectionRef.doc(editingId);
                batch.update(itemRef, itemData);
            } else {
                const itemRef = collectionRef.doc();
                batch.set(itemRef, { ...itemData, createdAt: new Date() });

                // Record initial stock as a transaction if > 0
                if (itemData.stock > 0) {
                    const transRef = transCollectionRef.doc();
                    batch.set(transRef, {
                        itemId: itemRef.id,
                        itemDetails: `${itemData.brand} ${itemData.model}`,
                        type: 'IN',
                        quantity: itemData.stock,
                        previousStock: 0,
                        newStock: itemData.stock,
                        note: 'Initial Stock',
                        userId: user.uid,
                        userEmail: user.email,
                        createdAt: new Date()
                    });
                }
            }

            await batch.commit();
            setEditingId(null);
            setNewItem({ type: 'module', brand: '', model: '', vendor: '', pitch: '', width: 250, height: 250, price: 0, carriage: 0, currency: 'INR', indoor: true, brightness: '', refreshRate: '', scanRate: '', grayScale: '', stock: 0 });
        } catch (e) { console.error(e); }
    };

    const handleEdit = (item) => {
        setNewItem({ ...item, vendor: item.vendor || '', currency: item.currency || 'INR', carriage: item.carriage || 0 });
        setEditingId(item.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setNewItem({ type: 'module', brand: '', model: '', vendor: '', pitch: '', width: 250, height: 250, price: 0, carriage: 0, currency: 'INR', indoor: true, brightness: '', refreshRate: '', scanRate: '', grayScale: '', stock: 0 });
    };

    const handleDelete = async (id) => {
        if (confirm("Delete this item?")) {
            await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('inventory').doc(id).delete();
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                    <Box className="w-5 h-5 text-teal-600 dark:text-teal-400" /> BOM Management
                </h2>
            </div>

            {/* Add/Edit Item Form */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 rounded-lg transition-colors ${editingId ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                <div className="col-span-2 md:col-span-4 flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400">{editingId ? 'Editing Item' : 'Add New Item'}</h3>
                    {editingId && <button onClick={handleCancelEdit} className="text-xs text-slate-500 dark:text-slate-400 hover:underline">Cancel Edit</button>}
                </div>

                <select className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })}>
                    <option value="module">Module</option>
                    <option value="cabinet">Cabinet</option>
                    <option value="ready">Ready Unit</option>
                    <option value="card">Receiving Card</option>
                    <option value="psu">Power Supply</option>
                    <option value="processor">Processor</option>
                </select>

                {newItem.type === 'module' && (
                    <input placeholder="Pitch (e.g. 3.91)" type="number" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white border-teal-500 ring-1 ring-teal-500" value={newItem.pitch} onChange={e => setNewItem({ ...newItem, pitch: e.target.value })} />
                )}

                <input placeholder="Brand" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newItem.brand} onChange={e => setNewItem({ ...newItem, brand: e.target.value })} />
                <input placeholder="Model" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newItem.model} onChange={e => setNewItem({ ...newItem, model: e.target.value })} />
                <input placeholder="Vendor / Supplier" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newItem.vendor} onChange={e => setNewItem({ ...newItem, vendor: e.target.value })} />

                <div className="flex gap-2 items-center col-span-2 md:col-span-1">
                    <div className="flex-1 min-w-[100px]" title="Base Price">
                        <input
                            placeholder="Base Price"
                            type="number"
                            className="p-2 w-full border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            value={newItem.price}
                            onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                        />
                        <div className="text-[9px] text-slate-400 mt-0.5 ml-1">BASE</div>
                    </div>
                    <span className="text-slate-400 font-bold mb-3">+</span>
                    <div className="flex-1 min-w-[80px]" title="Carriage Inwards">
                        <input
                            placeholder="Carriage"
                            type="number"
                            className="p-2 w-full border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            value={newItem.carriage}
                            onChange={e => setNewItem({ ...newItem, carriage: e.target.value })}
                        />
                        <div className="text-[9px] text-slate-400 mt-0.5 ml-1">CARRIAGE</div>
                    </div>
                    <div className="flex-none mb-3">
                        <select
                            className="p-2 border rounded bg-slate-100 dark:bg-slate-600 dark:border-slate-600 dark:text-white"
                            value={newItem.currency}
                            onChange={e => setNewItem({ ...newItem, currency: e.target.value })}
                        >
                            <option value="INR">INR</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                </div>

                {(newItem.type === 'module' || newItem.type === 'cabinet' || newItem.type === 'ready') && (
                    <>
                        <input placeholder="Width (mm)" type="number" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newItem.width} onChange={e => setNewItem({ ...newItem, width: e.target.value })} />
                        <input placeholder="Height (mm)" type="number" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newItem.height} onChange={e => setNewItem({ ...newItem, height: e.target.value })} />
                    </>
                )}
                {newItem.type === 'module' && (
                    <>
                        <select className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newItem.indoor} onChange={e => setNewItem({ ...newItem, indoor: e.target.value })}>
                            <option value="true">Indoor</option>
                            <option value="false">Outdoor</option>
                        </select>
                        <input placeholder="Brightness (e.g. 800 nits)" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newItem.brightness} onChange={e => setNewItem({ ...newItem, brightness: e.target.value })} />
                        <input placeholder="Refresh (e.g. 3840Hz)" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newItem.refreshRate} onChange={e => setNewItem({ ...newItem, refreshRate: e.target.value })} />
                        <input placeholder="Scan (e.g. 1/16)" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newItem.scanRate} onChange={e => setNewItem({ ...newItem, scanRate: e.target.value })} />
                        <input placeholder="Grayscale (e.g. 14bit)" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newItem.grayScale} onChange={e => setNewItem({ ...newItem, grayScale: e.target.value })} />
                        <input placeholder="Initial Stock" type="number" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={newItem.stock} onChange={e => setNewItem({ ...newItem, stock: e.target.value })} />
                    </>
                )}
                <button
                    onClick={handleSaveItem}
                    className={`px-4 py-2 rounded text-white flex items-center justify-center gap-2 hover:opacity-90 transition ${editingId ? 'bg-amber-600' : 'bg-teal-600'} col-span-2 md:col-span-1`}
                >
                    {editingId ? <Edit size={16} /> : <Plus size={16} />}
                    {editingId ? 'Update Item' : 'Add Item'}
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border border-slate-200 dark:border-slate-700 rounded">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                        <tr>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Vendor / Brand</th>
                            <th className="px-4 py-3">Specs</th>
                            <th className="px-4 py-3">Landed Cost</th>
                            <th className="px-4 py-3 text-center">Stock</th>
                            <th className="px-4 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                        {inventory.map(item => (
                            <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${editingId === item.id ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
                                <td className="px-4 py-3 capitalize"><span className={`px-2 py-1 rounded-full text-xs ${item.type === 'module' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : item.type === 'ready' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>{item.type}</span></td>
                                <td className="px-4 py-3 dark:text-slate-200">
                                    <div className="font-medium">{item.brand} {item.model}</div>
                                    {item.vendor && <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">{item.vendor}</div>}
                                    {(item.type === 'module' || item.type === 'ready') && <div className="text-[10px] text-slate-400 mt-1">{item.indoor ? 'Indoor' : 'Outdoor'} • {item.brightness}</div>}
                                </td>
                                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{item.width && `${item.width}x${item.height}mm`} {item.pitch && ` | P${item.pitch}`}</td>
                                <td className="px-4 py-3 dark:text-slate-200">
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{formatCurrency((item.price || 0) + (item.carriage || 0), item.currency || 'INR')}</span>
                                        {(item.carriage > 0) && <span className="text-[10px] text-slate-400">Base: {item.price} + Carr: {item.carriage}</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center border-x dark:border-slate-700">
                                    <div className={`font-bold ${item.stock > 0 ? 'text-slate-800 dark:text-white' : 'text-red-500'}`}>{item.stock || 0}</div>
                                </td>
                                <td className="px-4 py-3 flex gap-2">
                                    <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 dark:bg-blue-900/30 rounded"><Edit size={14} /></button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 p-1 bg-red-50 dark:bg-red-900/30 rounded"><Trash2 size={14} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {inventory.length === 0 && <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-800">{user ? 'No items found.' : 'Please log in to view and manage BOM.'}</div>}
            </div>
        </div>
    );
};

export default InventoryManager;
