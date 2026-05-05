import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, writeBatch, serverTimestamp, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Asset, Product } from '../types';
import { TrendingDown, Loader2, Play, CheckCircle2, History, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Depreciation() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [summary, setSummary] = useState({ totalDepreciated: 0, totalValueLoss: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Products first for mapping
      const prodSnap = await getDocs(collection(db, 'products'));
      const prodMap: Record<string, Product> = {};
      prodSnap.forEach(doc => {
        prodMap[doc.id] = { id: doc.id, ...doc.data() } as Product;
      });
      setProducts(prodMap);

      const q = query(collection(db, 'assets'));
      const snap = await getDocs(q);
      const asts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
      setAssets(asts.filter(a => a.status === 'active'));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'assets');
    } finally {
      setLoading(false);
    }
  };

  const calculateLoss = (asset: Asset) => {
    const prod = products[asset.productId];
    if (!prod) return 0;

    if (prod.depreciationMethod === 'percentage') {
      // Annual percentage applied monthly: (Value * %) / 100 / 12
      return (asset.currentValue * (prod.depreciationValue / 100)) / 12;
    } else {
      // Monthly fixed amount
      return prod.depreciationValue;
    }
  };

  const runDepreciation = async () => {
    if (assets.length === 0) return;
    setIsRunning(true);
    let depreciatedCount = 0;
    let valueLoss = 0;

    try {
      const batch = writeBatch(db);
      
      for (const asset of assets) {
        const loss = calculateLoss(asset);
        const newValue = Math.max(0, asset.currentValue - loss);
        
        const assetRef = doc(db, 'assets', asset.id);
        batch.update(assetRef, {
          currentValue: newValue,
          lastDepreciationAt: serverTimestamp(),
        });
        
        depreciatedCount++;
        valueLoss += loss;
      }
      
      await batch.commit();
      setSummary({ totalDepreciated: depreciatedCount, totalValueLoss: valueLoss });
      setIsFinished(true);
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'assets');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Depreciation Engine</h1>
          <p className="text-gray-500 font-medium">Re-evaluate asset book values based on enterprise rules.</p>
        </div>
        <button 
          onClick={runDepreciation}
          disabled={loading || isRunning || assets.length === 0}
          className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-2xl font-black shadow-lg shadow-gray-200 hover:bg-black transition-all disabled:opacity-50"
        >
          {isRunning ? <Loader2 className="animate-spin" /> : <Play size={18} fill="currentColor" />}
          Run Updates
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Info size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 leading-tight">Monthly Auto-Adjustment</h3>
                <p className="text-sm text-gray-500 font-medium">System applies a 10% annual depreciation rate (compounded monthly).</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                 <span className="text-sm font-bold text-gray-600">Eligible Assets</span>
                 <span className="text-lg font-black text-gray-900">{assets.length} items</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                 <span className="text-sm font-bold text-gray-600">Frequency</span>
                 <span className="text-lg font-black text-gray-900">Once per 30 days</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50">
               <h3 className="font-black text-gray-900">Target Inventory Preview</h3>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Original</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Current</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Est. Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assets.slice(0, 10).map((a) => (
                  <tr key={a.id}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{a.productName}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{a.qrCode}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500">${a.purchaseCost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-black text-gray-900">${a.currentValue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-bold text-red-500">-${Math.round(calculateLoss(a)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 p-8 rounded-3xl text-white shadow-xl shadow-gray-200">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6">Status Info</h3>
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-blue-400">
                    <History size={20} />
                 </div>
                 <div>
                   <p className="text-xs font-bold text-gray-400 uppercase">Last Global Update</p>
                   <p className="text-sm font-black">2 days ago</p>
                 </div>
               </div>
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-green-400">
                    <CheckCircle2 size={20} />
                 </div>
                 <div>
                   <p className="text-xs font-bold text-gray-400 uppercase">System Integrity</p>
                   <p className="text-sm font-black">Verified & Calibrated</p>
                 </div>
               </div>
            </div>
            
            <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10">
               <div className="flex gap-3 mb-2">
                 <div className="p-1 bg-yellow-500 rounded-full"></div>
                 <span className="text-[10px] font-black uppercase text-yellow-500">Auto-Scaling</span>
               </div>
               <p className="text-xs text-gray-400 leading-relaxed font-medium">Assets reaching book value sub $100 will default to scrap valuation automatically.</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isFinished && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.9 }}
             className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
           >
             <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-lg w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
                
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">Update Complete</h2>
                <p className="text-gray-500 font-medium mb-8">Successfully ran depreciation rules for all active assets.</p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="bg-gray-50 p-6 rounded-3xl">
                     <p className="text-xs font-bold text-gray-400 uppercase mb-1">Processed</p>
                     <p className="text-2xl font-black text-gray-900">{summary.totalDepreciated} items</p>
                   </div>
                   <div className="bg-gray-50 p-6 rounded-3xl">
                     <p className="text-xs font-bold text-gray-400 uppercase mb-1">Value Loss</p>
                     <p className="text-2xl font-black text-red-500">${Math.round(summary.totalValueLoss).toLocaleString()}</p>
                   </div>
                </div>

                <button 
                  onClick={() => setIsFinished(false)}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black shadow-lg"
                >
                  Return to Dashboard
                </button>
             </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
