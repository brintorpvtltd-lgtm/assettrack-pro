import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Location, Batch } from '../types';
import { Layers, Plus, Loader2, CheckCircle2, ChevronRight, Printer, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';

export default function Batches() {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState('');
  
  const [formData, setFormData] = useState({
    productId: '',
    locationId: '',
    quantity: 1,
    depreciationMethod: 'percentage',
    depreciationValue: 10
  });

  useEffect(() => {
    const productsUnsub = onSnapshot(query(collection(db, 'products')), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });
    const locationsUnsub = onSnapshot(query(collection(db, 'locations')), (snap) => {
      setLocations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Location)));
    });
    const batchesUnsub = onSnapshot(query(collection(db, 'batches')), (snap) => {
      setBatches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Batch)));
      setLoading(false);
    });

    return () => {
      productsUnsub();
      locationsUnsub();
      batchesUnsub();
    };
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const product = products.find(p => p.id === formData.productId);
      const location = locations.find(l => l.id === formData.locationId);
      
      if (!product || !location) return;

      // 1. Create the Batch record
      const batchRef = await addDoc(collection(db, 'batches'), {
        ...formData,
        productName: product.name,
        locationName: location.name,
        costPerItem: product.cost,
        createdAt: serverTimestamp(),
      });

      // 2. Bulk create individual assets
      const assetsBatch = writeBatch(db);
      for (let i = 0; i < formData.quantity; i++) {
        const assetId = `AST-${Date.now()}-${i}`;
        const assetRef = doc(collection(db, 'assets'));
        assetsBatch.set(assetRef, {
          qrCode: assetId,
          productId: product.id,
          productName: product.name,
          locationId: location.id,
          locationName: location.name,
          batchId: batchRef.id,
          status: 'active',
          purchaseCost: product.cost,
          currentValue: product.cost,
          lastDepreciationAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }
      await assetsBatch.commit();

      setCurrentBatchId(batchRef.id);
      setShowSuccess(true);
      setFormData({ ...formData, quantity: 1, productId: '', locationId: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batches/assets');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Batch Creation</h1>
          <p className="text-gray-500 font-medium">Mass produce assets and automate QR code generation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <Plus className="text-blue-600" />
            Create Asset Batch
          </h3>
          
          <form onSubmit={handleCreateBatch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Select Product</label>
                <select 
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Assign Location</label>
                <select 
                  required
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-bold"
                >
                  <option value="">-- Choose Location --</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Quantity to Generate</label>
                <div className="relative">
                  <input 
                    required
                    type="number" 
                    min="1"
                    max="100"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-2xl text-blue-600"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold">Units</span>
                </div>
                <p className="mt-2 text-xs text-gray-400 font-medium">* Max 100 items per batch for performance.</p>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Depreciation Model</label>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, depreciationMethod: 'percentage'})}
                    className={`flex-1 p-4 rounded-2xl border-2 transition-all font-bold ${
                      formData.depreciationMethod === 'percentage' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-inner' : 'border-gray-50 bg-gray-50 text-gray-400'
                    }`}
                  >
                    Percentage (10%)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, depreciationMethod: 'fixed'})}
                    className={`flex-1 p-4 rounded-2xl border-2 transition-all font-bold ${
                      formData.depreciationMethod === 'fixed' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-inner' : 'border-gray-50 bg-gray-50 text-gray-400'
                    }`}
                  >
                    Fixed Value
                  </button>
                </div>
              </div>
            </div>

            {isSubmitting ? (
              <div className="w-full py-4 flex items-center justify-center gap-3 bg-blue-50 text-blue-600 rounded-2xl font-bold">
                <Loader2 className="animate-spin" />
                Generating Assets & QR Codes...
              </div>
            ) : (
              <button 
                type="submit"
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl shadow-gray-200"
              >
                GENERATE {formData.quantity} ASSETS
              </button>
            )}
          </form>
        </div>

        {/* History / Recent batches Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">Recent Activity</h3>
            <div className="space-y-3">
              {batches.slice(0, 5).map(b => (
                <div key={b.id} className="p-3 bg-gray-50 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                      <QrCode size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900">{b.productName}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{b.quantity} items • {b.locationName}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-600" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Success View / QR Grid Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-white p-4 md:p-12 overflow-y-auto"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-green-100 rounded-3xl flex items-center justify-center text-green-600">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Batch Created Successfully!</h2>
                    <p className="text-gray-500 font-medium">Batch ID: <span className="text-blue-600 font-bold">{currentBatchId}</span></p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200"
                  >
                    <Printer size={20} />
                    Print Labels
                  </button>
                  <button 
                    onClick={() => setShowSuccess(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-900 rounded-2xl font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>

              {/* QR Preview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 print:grid-cols-4 print:p-0">
                {Array.from({ length: batches.find(b => b.id === currentBatchId)?.quantity || 0 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center justify-center p-4 bg-white border border-dashed border-gray-200 rounded-3xl aspect-square print:border-solid print:border-black print:m-2">
                    <QRCodeSVG value={`asset-${currentBatchId}-${i}`} size={100} level="H" />
                    <p className="mt-3 text-[10px] font-black text-gray-900 uppercase">AST-{i+1}</p>
                    <p className="text-[8px] font-bold text-gray-400">BATCH-{currentBatchId.slice(-4)}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
