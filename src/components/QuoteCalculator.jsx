import React from 'react';
import { Eye, Printer, Save, RefreshCw, DollarSign, Wrench, Percent, Edit } from 'lucide-react';
import ScreenVisualizer from './ScreenVisualizer';
import PrintLayout from './PrintLayout';
import { formatCurrency } from '../utils/utils';

const ExtraInput = ({ label, fieldKey, extras, updateExtra, currency }) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 dark:text-slate-400">{label}</label>
        <div className="flex items-center">
            <input
                type="number"
                value={extras[fieldKey].val}
                onChange={e => updateExtra(fieldKey, 'val', e.target.value)}
                className="w-full p-2 border rounded-l text-sm border-r-0 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
            <button
                onClick={() => updateExtra(fieldKey, 'type', extras[fieldKey].type === 'abs' ? 'pct' : 'abs')}
                className={`px-3 py-2 text-xs font-bold border rounded-r w-16 transition-colors dark:border-slate-600 ${extras[fieldKey].type === 'pct' ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-600 dark:text-slate-300'}`}
            >
                {extras[fieldKey].type === 'abs' ? (currency === 'INR' ? '₹' : '$') : '%'}
            </button>
        </div>
    </div>
);

const QuoteCalculator = ({ user, inventory, state, setState, exchangeRate, onSaveQuote }) => {
    const {
        client, project, screenQty, targetWidth, targetHeight, unit,
        selectedIndoor, assemblyMode, selectedPitch, selectedModuleId,
        selectedCabinetId, selectedCardId, selectedPSUId, selectedProcId,
        sizingMode, readyId, margin, extras, overrides, editingRow
    } = state;

    const [calculation, setCalculation] = React.useState(null);
    const [showPreview, setShowPreview] = React.useState(false);

    const updateState = (key, value) => setState(prev => ({ ...prev, [key]: value }));
    const updateExtra = (key, field, val) => {
        setState(prev => ({ ...prev, extras: { ...prev.extras, [key]: { ...prev.extras[key], [field]: val } } }));
    };

    const handleOverride = (id, field, value) => {
        setState(prev => ({
            ...prev, overrides: { ...prev.overrides, [id]: { ...prev.overrides[id], [field]: value } }
        }));
    };

    const clearOverride = (id) => {
        const newOverrides = { ...overrides };
        delete newOverrides[id];
        updateState('overrides', newOverrides);
        updateState('editingRow', null);
    };

    const toggleEditRow = (id) => {
        updateState('editingRow', editingRow === id ? null : id);
    };

    // Filters
    const isIndoor = selectedIndoor === 'true';
    const availableModules = inventory.filter(i => i.type === 'module' && i.indoor === isIndoor);
    const uniquePitches = [...new Set(availableModules.map(m => m.pitch))].sort((a, b) => a - b);
    const filteredModules = selectedPitch ? availableModules.filter(m => m.pitch == selectedPitch) : [];
    const readyUnits = inventory.filter(i => i.type === 'ready' && i.indoor === isIndoor);

    const selectedModule = inventory.find(i => i.id === selectedModuleId);
    const cabinets = inventory.filter(i => {
        if (i.type !== 'cabinet') return false;
        if (!selectedModule) return true;
        const wMod = i.width % selectedModule.width;
        const hMod = i.height % selectedModule.height;
        return wMod === 0 && hMod === 0;
    });

    const cards = inventory.filter(i => i.type === 'card');
    const psus = inventory.filter(i => i.type === 'psu');
    const processors = inventory.filter(i => i.type === 'processor');

    // --- REAL-TIME CALCULATION ---
    React.useEffect(() => {
        const getPriceInInr = (item) => {
            if (!item) return 0;
            const basePrice = Number(item.price || 0);
            const carriage = Number(item.carriage || 0);
            const totalBase = basePrice + carriage;
            if (item.currency === 'USD') return totalBase * exchangeRate;
            return totalBase;
        };

        let module, cabinet, card, psu, proc;
        let totalModules = 0;

        if (assemblyMode === 'assembled') {
            module = inventory.find(i => i.id === selectedModuleId);
            cabinet = inventory.find(i => i.id === selectedCabinetId);
            card = inventory.find(i => i.id === selectedCardId);
            psu = inventory.find(i => i.id === selectedPSUId);
            proc = inventory.find(i => i.id === selectedProcId);
            if (!module || !cabinet) { setCalculation(null); return; }
        } else {
            const readyUnit = inventory.find(i => i.id === readyId);
            proc = inventory.find(i => i.id === selectedProcId);
            if (!readyUnit) { setCalculation(null); return; }
            module = readyUnit;
            cabinet = readyUnit;
        }

        const w_mm = unit === 'm' ? targetWidth * 1000 : targetWidth * 304.8;
        const h_mm = unit === 'm' ? targetHeight * 1000 : targetHeight * 304.8;

        const rawCols = w_mm / cabinet.width;
        const rawRows = h_mm / cabinet.height;
        let cols, rows;
        if (sizingMode === 'up') { cols = Math.ceil(rawCols); rows = Math.ceil(rawRows); }
        else if (sizingMode === 'down') { cols = Math.max(1, Math.floor(rawCols)); rows = Math.max(1, Math.floor(rawRows)); }
        else { cols = Math.max(1, Math.round(rawCols)); rows = Math.max(1, Math.round(rawRows)); }

        const finalW_mm = cols * cabinet.width;
        const finalH_mm = rows * cabinet.height;
        const totalCabinetsPerScreen = cols * rows;
        const areaSqFt = (finalW_mm * finalH_mm) / 92903;

        let rawItems = [];
        if (assemblyMode === 'assembled') {
            const modsPerCab = (Math.floor(cabinet.width / module.width) * Math.floor(cabinet.height / module.height));
            totalModules = totalCabinetsPerScreen * modsPerCab;
            rawItems = [
                { id: 'modules', name: 'Modules', spec: `${module.brand} ${module.model}`, qty: totalModules, unit: getPriceInInr(module), total: totalModules * getPriceInInr(module) },
                { id: 'cabinets', name: 'Cabinets', spec: `${cabinet.brand} ${cabinet.model}`, qty: totalCabinetsPerScreen, unit: getPriceInInr(cabinet), total: totalCabinetsPerScreen * getPriceInInr(cabinet) },
                { id: 'cards', name: 'Cards', spec: card ? card.brand : '-', qty: totalCabinetsPerScreen, unit: getPriceInInr(card), total: totalCabinetsPerScreen * getPriceInInr(card) },
                { id: 'psu', name: 'PSU', spec: psu ? psu.brand : '-', qty: totalCabinetsPerScreen, unit: getPriceInInr(psu), total: totalCabinetsPerScreen * getPriceInInr(psu) },
            ];
        } else {
            rawItems = [
                { id: 'ready', name: 'LED Panels (Ready)', spec: `${cabinet.brand} ${cabinet.model}`, qty: totalCabinetsPerScreen, unit: getPriceInInr(cabinet), total: totalCabinetsPerScreen * getPriceInInr(cabinet) }
            ];
            totalModules = totalCabinetsPerScreen;
        }
        if (proc) {
            rawItems.push({ id: 'processor', name: 'Processor', spec: proc.brand, qty: 1, unit: getPriceInInr(proc), total: getPriceInInr(proc) });
        }

        const finalItems = rawItems.map(item => {
            if (overrides[item.id]) {
                const ov = overrides[item.id];
                const finalQty = ov.qty !== undefined && ov.qty !== '' ? Number(ov.qty) : item.qty;
                const finalRate = ov.rate !== undefined && ov.rate !== '' ? Number(ov.rate) : item.unit;
                return { ...item, qty: finalQty, unit: finalRate, total: finalQty * finalRate, isOverridden: true };
            }
            return item;
        });

        const costPerScreenBase = finalItems.reduce((acc, item) => acc + item.total, 0);

        const calculatedExtras = {};
        Object.keys(extras).forEach(key => {
            const item = extras[key];
            if (item.type === 'pct') calculatedExtras[key] = costPerScreenBase * (item.val / 100);
            else calculatedExtras[key] = Number(item.val);
        });
        const totalExtrasPerScreen = Object.values(calculatedExtras).reduce((a, b) => a + b, 0);

        const costPerScreen = costPerScreenBase + totalExtrasPerScreen;
        const totalProjectCost = costPerScreen * screenQty;
        const sellPerScreen = costPerScreen * (1 + margin / 100);
        const totalProjectSell = sellPerScreen * screenQty;
        const marginPerScreen = sellPerScreen - costPerScreen;
        const marginTotal = totalProjectSell - totalProjectCost;

        const matrix = {
            cost: { sqft: costPerScreen / areaSqFt, unit: costPerScreen, total: totalProjectCost },
            margin: { sqft: marginPerScreen / areaSqFt, unit: marginPerScreen, total: marginTotal },
            sell: { sqft: sellPerScreen / areaSqFt, unit: sellPerScreen, total: totalProjectSell },
            sqft: { perScreen: areaSqFt, total: areaSqFt * screenQty }
        };

        setCalculation({
            gridCols: cols, gridRows: rows,
            finalWidth: (finalW_mm / 1000).toFixed(2), finalHeight: (finalH_mm / 1000).toFixed(2),
            totalCabinets: totalCabinetsPerScreen, moduleType: module, cabinetType: cabinet,
            breakdown: { qtyModules: totalModules, extras: totalExtrasPerScreen },
            detailedItems: finalItems, calculatedExtras, costPerScreen, totalProjectCost,
            finalPrice: totalProjectSell, totalProjectSell, assemblyMode, screenQty, matrix
        });

    }, [targetWidth, targetHeight, unit, selectedIndoor, assemblyMode, selectedPitch, selectedModuleId, selectedCabinetId, selectedCardId, selectedPSUId, selectedProcId, readyId, sizingMode, margin, extras, inventory, exchangeRate, screenQty, overrides]);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative">

            {/* PDF Preview Modal */}
            {showPreview && calculation && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex justify-center items-center p-4">
                    <div className="bg-white max-w-4xl w-full h-[90vh] rounded-lg shadow-2xl flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-100 rounded-t-lg">
                            <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Eye size={20} /> Print Preview</h2>
                            <div className="flex gap-2">
                                <button onClick={() => setShowPreview(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded">Close</button>
                                <button onClick={() => window.print()} className="px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded flex items-center gap-2"><Printer size={16} /> Print / Save PDF</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-8 bg-slate-200">
                            <PrintLayout data={{ ...calculation, clientName: client, projectName: project, margin }} currency='INR' />
                        </div>
                    </div>
                </div>
            )}

            {/* Rest of UI... (truncated for brevity, but I will include the full logic) */}
            {/* Calculator UI code goes here, similar to the original HTML but adapted for modularity */}
            <div className="xl:col-span-8 flex flex-col gap-6">
                {/* Project Info */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Client Name</label>
                            <input className="w-full border-b-2 border-slate-200 focus:border-teal-500 outline-none p-2 text-lg font-medium dark:bg-slate-800 dark:text-white dark:border-slate-600" value={client} onChange={e => updateState('client', e.target.value)} placeholder="Enter Client Name" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Project Title</label>
                            <input className="w-full border-b-2 border-slate-200 focus:border-teal-500 outline-none p-2 text-lg font-medium dark:bg-slate-800 dark:text-white dark:border-slate-600" value={project} onChange={e => updateState('project', e.target.value)} placeholder="Project Reference" />
                        </div>
                    </div>
                </div>

                {/* Main Config */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Display Configuration</h3>
                        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                            <button onClick={() => updateState('selectedIndoor', 'true')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${selectedIndoor === 'true' ? 'bg-white dark:bg-slate-600 shadow-sm text-teal-600' : 'text-slate-500'}`}>INDOOR</button>
                            <button onClick={() => updateState('selectedIndoor', 'false')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${selectedIndoor === 'false' ? 'bg-white dark:bg-slate-600 shadow-sm text-teal-600' : 'text-slate-500'}`}>OUTDOOR</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="col-span-2 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-400 mb-2 block">Width</label>
                                    <input type="number" className="w-full p-3 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" value={targetWidth} onChange={e => updateState('targetWidth', e.target.value)} />
                                </div>
                                <div className="text-slate-400 mt-6">×</div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-400 mb-2 block">Height</label>
                                    <input type="number" className="w-full p-3 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" value={targetHeight} onChange={e => updateState('targetHeight', e.target.value)} />
                                </div>
                                <select className="mt-6 p-3 bg-slate-100 dark:bg-slate-600 rounded-lg text-sm dark:text-white" value={unit} onChange={e => updateState('unit', e.target.value)}>
                                    <option value="m">m</option>
                                    <option value="ft">ft</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 block">Quantity</label>
                            <input type="number" className="w-full p-3 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 dark:text-white" value={screenQty} onChange={e => updateState('screenQty', Number(e.target.value))} />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 block">Sizing Rule</label>
                            <select className="w-full p-3 bg-slate-100 dark:bg-slate-600 rounded-lg text-sm dark:text-white" value={sizingMode} onChange={e => updateState('sizingMode', e.target.value)}>
                                <option value="near">Nearest Size</option>
                                <option value="up">Size Up (Min size)</option>
                                <option value="down">Size Down (Max size)</option>
                            </select>
                        </div>
                    </div>

                    {/* Component Selectors */}
                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex gap-4 mb-4">
                            <button onClick={() => updateState('assemblyMode', 'assembled')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border transition ${assemblyMode === 'assembled' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 border-teal-200' : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-500'}`}>
                                <Wrench size={16} /> Componet Mix
                            </button>
                            <button onClick={() => updateState('assemblyMode', 'ready')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border transition ${assemblyMode === 'ready' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 border-teal-200' : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-500'}`}>
                                <DollarSign size={16} /> Ready Panels
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {assemblyMode === 'assembled' ? (
                                <>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">1. Pixel Pitch (mm)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {uniquePitches.map(p => (
                                                <button key={p} onClick={() => updateState('selectedPitch', p)} className={`px-3 py-2 rounded-md border text-sm transition ${selectedPitch == p ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>P{p}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">2. Module Brand/Model</label>
                                        <select className="w-full p-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded dark:text-white" value={selectedModuleId} onChange={e => updateState('selectedModuleId', e.target.value)}>
                                            <option value="">Select Module</option>
                                            {filteredModules.map(m => <option key={m.id} value={m.id}>{m.brand} {m.model} ({m.width}x{m.height})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">3. Cabinet Size/Type</label>
                                        <select className="w-full p-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded dark:text-white" value={selectedCabinetId} onChange={e => updateState('selectedCabinetId', e.target.value)} disabled={!selectedModuleId}>
                                            <option value="">Select Cabinet</option>
                                            {cabinets.map(c => <option key={c.id} value={c.id}>{c.brand} ({c.width}x{c.height}mm)</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">4. Receiving Card</label>
                                        <select className="w-full p-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded dark:text-white" value={selectedCardId} onChange={e => updateState('selectedCardId', e.target.value)}>
                                            <option value="">Auto/None</option>
                                            {cards.map(c => <option key={c.id} value={c.id}>{c.brand} {c.model}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">5. Power Supply</label>
                                        <select className="w-full p-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded dark:text-white" value={selectedPSUId} onChange={e => updateState('selectedPSUId', e.target.value)}>
                                            <option value="">Auto/None</option>
                                            {psus.map(p => <option key={p.id} value={p.id}>{p.brand} {p.model}</option>)}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Select Ready Component</label>
                                    <select className="w-full p-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded dark:text-white" value={readyId} onChange={e => updateState('readyId', e.target.value)}>
                                        <option value="">Select Ready Component</option>
                                        {readyUnits.map(r => <option key={r.id} value={r.id}>{r.brand} {r.model} (P{r.pitch})</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Video Processor</label>
                                <select className="w-full p-2 bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 rounded dark:text-white" value={selectedProcId} onChange={e => updateState('selectedProcId', e.target.value)}>
                                    <option value="">None</option>
                                    {processors.map(p => <option key={p.id} value={p.id}>{p.brand} {p.model}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calculation Table */}
                {calculation && (
                    <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Itemized Breakdown</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-slate-500 border-b dark:border-slate-700">
                                    <tr>
                                        <th className="text-left pb-3 font-medium">Item</th>
                                        <th className="text-right pb-3 font-medium">Unit Price</th>
                                        <th className="text-center pb-3 font-medium">Qty</th>
                                        <th className="text-right pb-3 font-medium">Total</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                    {calculation.detailedItems.map(item => (
                                        <React.Fragment key={item.id}>
                                            <tr className={`group transition ${item.isOverridden ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                                                <td className="py-3">
                                                    <div className="font-semibold text-slate-800 dark:text-white">{item.name}</div>
                                                    <div className="text-[11px] text-slate-400">{item.spec}</div>
                                                </td>
                                                <td className={`py-3 text-right font-medium ${item.isOverridden ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300'}`}>{formatCurrency(item.unit, 'INR')}</td>
                                                <td className={`py-3 text-center ${item.isOverridden ? 'text-amber-600' : ''}`}>{item.qty}</td>
                                                <td className="py-3 text-right font-bold text-slate-800 dark:text-white">{formatCurrency(item.total, 'INR')}</td>
                                                <td className="text-right">
                                                    <button onClick={() => toggleEditRow(item.id)} className={`p-1 rounded opacity-0 group-hover:opacity-100 transition ${editingRow === item.id ? 'bg-slate-200 dark:bg-slate-600 opacity-100' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                                        <Edit size={14} className="text-slate-400" />
                                                    </button>
                                                </td>
                                            </tr>
                                            {editingRow === item.id && (
                                                <tr>
                                                    <td colSpan="5" className="p-3 bg-slate-50 dark:bg-slate-700">
                                                        <div className="flex gap-4 items-end">
                                                            <div>
                                                                <label className="text-[9px] font-bold text-slate-400 mb-1 block">Override Rate (INR)</label>
                                                                <input type="number" className="p-1.5 text-xs border rounded w-28 bg-white dark:bg-slate-800 dark:text-white" placeholder={item.unit} value={overrides[item.id]?.rate || ''} onChange={e => handleOverride(item.id, 'rate', e.target.value)} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] font-bold text-slate-400 mb-1 block">Override Qty</label>
                                                                <input type="number" className="p-1.5 text-xs border rounded w-16 bg-white dark:bg-slate-800 dark:text-white" placeholder={item.qty} value={overrides[item.id]?.qty || ''} onChange={e => handleOverride(item.id, 'qty', e.target.value)} />
                                                            </div>
                                                            <button onClick={() => updateState('editingRow', null)} className="px-3 py-1.5 bg-slate-800 text-white text-[10px] rounded font-bold">Done</button>
                                                            <button onClick={() => clearOverride(item.id)} className="text-[9px] text-red-500 hover:underline">Clear Overrides</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                    {/* Additional Costs Section */}
                                    <tr className="bg-slate-50 dark:bg-slate-700/30">
                                        <td colSpan="5" className="p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <ExtraInput label="Labour Cost" fieldKey="labour" extras={extras} updateExtra={updateExtra} currency='INR' />
                                                <ExtraInput label="Transport" fieldKey="transport" extras={extras} updateExtra={updateExtra} currency='INR' />
                                                <ExtraInput label="Structure" fieldKey="structure" extras={extras} updateExtra={updateExtra} currency='INR' />
                                                <ExtraInput label="Buffer/Misc" fieldKey="buffer" extras={extras} updateExtra={updateExtra} currency='INR' />
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar Sticky Calculation */}
            <div className="xl:col-span-4 space-y-6">
                <div className="sticky top-6 flex flex-col gap-6">
                    {calculation ? (
                        <div className="bg-teal-600 rounded-2xl p-6 text-white shadow-xl shadow-teal-600/20 overflow-hidden relative">
                            {/* Visual Background */}
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>

                            <div className="relative">
                                <span className="text-xs font-bold text-teal-100 uppercase tracking-widest block mb-4">Financial Summary (INR)</span>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center border-b border-teal-500/30 pb-2">
                                        <span className="text-teal-100 text-sm">Size / Screen</span>
                                        <span className="font-bold flex items-center gap-2">{calculation.finalWidth}m × {calculation.finalHeight}m <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">P{calculation.moduleType?.pitch}</span></span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-teal-500/30 pb-2">
                                        <span className="text-teal-100 text-sm">Sell Price / Screen</span>
                                        <span className="font-bold">{formatCurrency(calculation.matrix.sell.unit, 'INR')}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-teal-500/30 -mx-6 px-6 py-3">
                                        <div className="flex-1">
                                            <div className="text-[10px] text-teal-100 uppercase font-black">Total Project Price ({screenQty} Screens)</div>
                                            <div className="text-3xl font-black tabular-nums">{formatCurrency(calculation.finalPrice, 'INR')}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="text-teal-100 font-bold uppercase">Profit Margin</span>
                                            <span className="font-black text-sm">{margin}% ({formatCurrency(calculation.matrix.margin.total, 'INR')})</span>
                                        </div>
                                        <div className="w-full h-2 bg-teal-700/50 rounded-full overflow-hidden">
                                            <input type="range" className="w-full h-full bg-transparent accent-white cursor-pointer" min="0" max="100" value={margin} onChange={e => updateState('margin', e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-8">
                                    <button onClick={onSaveQuote} className="flex-1 bg-white text-teal-700 font-bold py-3 rounded-xl hover:bg-teal-50 shadow-lg shadow-black/10 flex items-center justify-center gap-2 transition active:scale-95"><Save size={18} /> {user ? 'Save Quote' : 'Login to Save'}</button>
                                    <button onClick={() => setShowPreview(true)} className="flex-1 bg-teal-500 text-white font-bold py-3 rounded-xl hover:bg-teal-400 border border-teal-400/50 flex items-center justify-center gap-2 transition active:scale-95"><Eye size={18} /> Preview</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-200 dark:bg-slate-700 aspect-square rounded-2xl flex items-center justify-center border-4 border-dashed border-slate-300 dark:border-slate-600 px-10 text-center">
                            <p className="text-slate-400 font-medium">Configure display dimensions and components to see calculation</p>
                        </div>
                    )}

                    {calculation && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-2 underline decoration-teal-500 underline-offset-4 decoration-2">Technical Visualizer</h3>
                            <ScreenVisualizer
                                cols={calculation.gridCols}
                                rows={calculation.gridRows}
                                module={calculation.moduleType}
                                cabinet={calculation.cabinetType}
                                unit={unit}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuoteCalculator;
