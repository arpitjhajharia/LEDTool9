import React from 'react';
import { formatCurrency, generateId } from '../utils/utils';

const PrintLayout = ({ data, currency }) => {
    if (!data || !data.moduleType) return null;

    const {
        clientName, projectName, finalWidth, finalHeight, totalCabinets,
        moduleType, cabinetType, detailedItems, breakdown,
        screenQty, totalProjectSell, matrix, assemblyMode
    } = data;

    return (
        <div className="p-12 max-w-[210mm] mx-auto bg-white min-h-screen relative text-slate-800 shadow-xl print:shadow-none print:p-0 print:w-full">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-slate-800 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-xl">A</div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-none">ADMIRE</h1>
                            <p className="text-teal-600 font-medium tracking-widest text-[10px] uppercase">Signage Solutions</p>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-light text-slate-400 tracking-wide">QUOTATION</h2>
                    <p className="text-sm font-bold text-slate-700 mt-2">#{generateId()}</p>
                    <p className="text-sm text-slate-500">{new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Project</p><p className="font-bold">{projectName}</p></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Client</p><p className="font-bold">{clientName}</p></div>
            </div>

            {/* Panel Specs Grid */}
            <div className="mb-8 border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase">Panel Specifications</h3>
                    <span className="text-xs font-bold text-teal-700 bg-teal-100 px-2 py-1 rounded">Quantity: {screenQty} Screens</span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-xs">
                    <div><span className="text-slate-500 block">Brightness</span><span className="font-bold">{moduleType?.brightness || '-'}</span></div>
                    <div><span className="text-slate-500 block">Refresh Rate</span><span className="font-bold">{moduleType?.refreshRate || '-'}</span></div>
                    <div><span className="text-slate-500 block">Scan Mode</span><span className="font-bold">{moduleType?.scanRate || '-'}</span></div>
                    <div><span className="text-slate-500 block">Pixel Pitch</span><span className="font-bold">P{moduleType?.pitch || '-'}</span></div>
                </div>
            </div>

            {/* Detailed BOM Table */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Cost Breakdown</h3>
                <table className="w-full text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700">
                        <tr>
                            <th className="p-2 text-left border-b">Item</th>
                            <th className="p-2 text-right border-b">Rate</th>
                            <th className="p-2 text-center border-b border-l">Qty (1)</th>
                            <th className="p-2 text-right border-b">Amt (1)</th>
                            <th className="p-2 text-center border-b border-l font-semibold">Qty ({screenQty})</th>
                            <th className="p-2 text-right border-b font-semibold">Amt ({screenQty})</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {detailedItems.map((item, i) => (
                            <tr key={i}>
                                <td className="p-2 font-medium">{item.name} <span className="text-slate-400 font-normal block text-[10px]">{item.spec}</span></td>
                                <td className="p-2 text-right">{formatCurrency(item.unit, currency)}</td>
                                <td className="p-2 text-center border-l bg-slate-50">{item.qty}</td>
                                <td className="p-2 text-right bg-slate-50">{formatCurrency(item.total, currency)}</td>
                                <td className="p-2 text-center border-l font-semibold">{item.qty * screenQty}</td>
                                <td className="p-2 text-right font-semibold">{formatCurrency(item.total * screenQty, currency)}</td>
                            </tr>
                        ))}
                        <tr>
                            <td className="p-2 font-medium">Add. Costs <span className="text-slate-400 font-normal block text-[10px]">Labour, Transport, etc.</span></td>
                            <td className="p-2 text-right">-</td>
                            <td className="p-2 text-center border-l bg-slate-50">1 Lot</td>
                            <td className="p-2 text-right bg-slate-50">{formatCurrency(breakdown.extras, currency)}</td>
                            <td className="p-2 text-center border-l font-semibold">{screenQty} Lots</td>
                            <td className="p-2 text-right font-semibold">{formatCurrency(breakdown.extras * screenQty, currency)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Financial Matrix */}
            <div className="mb-8 page-break-inside-avoid">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Financial Summary</h3>
                <table className="w-full text-sm border border-slate-200">
                    <thead className="bg-slate-800 text-white">
                        <tr>
                            <th className="p-2 text-left w-1/4">Metric</th>
                            <th className="p-2 text-right w-1/4">Per Sq.Ft</th>
                            <th className="p-2 text-right w-1/4">Per Screen</th>
                            <th className="p-2 text-right w-1/4 bg-teal-700">Total Project</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                        <tr>
                            <td className="p-3 font-semibold bg-slate-50">Cost Price</td>
                            <td className="p-3 text-right">{formatCurrency(matrix.cost.sqft, currency)}</td>
                            <td className="p-3 text-right">{formatCurrency(matrix.cost.unit, currency)}</td>
                            <td className="p-3 text-right font-semibold bg-slate-50">{formatCurrency(matrix.cost.total, currency)}</td>
                        </tr>
                        <tr>
                            <td className="p-3 font-semibold bg-slate-50">Margin (₹)</td>
                            <td className="p-3 text-right text-teal-600">{formatCurrency(matrix.margin.sqft, currency)}</td>
                            <td className="p-3 text-right text-teal-600">{formatCurrency(matrix.margin.unit, currency)}</td>
                            <td className="p-3 text-right font-semibold text-teal-600 bg-slate-50">{formatCurrency(matrix.margin.total, currency)}</td>
                        </tr>
                        <tr className="text-lg">
                            <td className="p-3 font-bold bg-slate-50">Selling Price</td>
                            <td className="p-3 text-right font-bold">{formatCurrency(matrix.sell.sqft, currency)}</td>
                            <td className="p-3 text-right font-bold">{formatCurrency(matrix.sell.unit, currency)}</td>
                            <td className="p-3 text-right font-bold text-teal-700 bg-teal-50">{formatCurrency(matrix.sell.total, currency)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PrintLayout;
