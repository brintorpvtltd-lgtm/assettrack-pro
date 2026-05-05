import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, getDocs, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Transfer } from '../types';
import { ArrowLeftRight, Clock, CheckCircle2, ChevronRight, Filter, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Transfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'transfers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransfers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transfer)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transfers');
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Movement History</h1>
        <p className="text-gray-500 font-medium">Audit trail for all asset relocations between facilities.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
               <Clock size={20} />
             </div>
             <h3 className="font-black text-gray-900">Recent Movements</h3>
           </div>
           <button className="text-xs font-bold text-blue-600 px-3 py-1 bg-blue-50 rounded-lg">Export CSV</button>
        </div>
        
        <div className="divide-y divide-gray-50">
          <AnimatePresence>
            {transfers.map((t) => (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 flex flex-col md:flex-row md:items-center gap-6 group hover:bg-gray-50/50 transition-all"
              >
                <div className="flex items-center gap-4 flex-1">
                   <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                      <ArrowLeftRight size={20} />
                   </div>
                   <div>
                     <p className="text-sm font-black text-gray-900">Transfer {t.id.slice(-6).toUpperCase()}</p>
                     <p className="text-xs font-bold text-gray-400">{t.assetIds.length} Assets Moved</p>
                   </div>
                </div>

                <div className="flex flex-1 items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Origin</p>
                    <p className="text-sm font-bold text-gray-700">{t.fromLocationName || 'Multiple'}</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Target</p>
                    <p className="text-sm font-bold text-blue-600">{t.toLocationName || 'Specified'}</p>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-end gap-6 text-right">
                   <div>
                     <p className="text-sm font-black text-gray-900">Completed</p>
                     <p className="text-xs text-gray-400 font-medium">May 15, 2026</p>
                   </div>
                   <div className="p-2 bg-green-50 text-green-600 rounded-full">
                     <CheckCircle2 size={24} />
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {transfers.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mx-auto mb-4">
                <ArrowLeftRight size={32} />
              </div>
              <p className="text-gray-400 font-bold italic">No transfer records found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
