import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Asset, Location } from '../types';
import { 
  ScanQrCode, 
  MapPin, 
  Tag, 
  ArrowLeftRight, 
  AlertTriangle, 
  Trash2, 
  DollarSign,
  X,
  CheckCircle2,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function QRScanner() {
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, []);

  function onScanSuccess(decodedText: string) {
    if (scannedResult === decodedText) return; // Prevent duplicate triggers
    setScannedResult(decodedText);
    fetchAsset(decodedText);
    // Pause scanner
    if (scannerRef.current) {
      // Html5QrcodeScanner doesn't have a direct 'pause', we can just hide it and show results
    }
  }

  function onScanFailure(error: any) {
    // Frequently happens when QR not in frame, just ignore
  }

  const fetchAsset = async (qrCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'assets'), where('qrCode', '==', qrCode));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setAsset({ id: doc.id, ...doc.data() } as Asset);
      } else {
        setError("Asset not found in registry.");
      }
    } catch (err) {
      setError("Failed to look up asset.");
      handleFirestoreError(err, OperationType.GET, 'assets');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: Asset['status']) => {
    if (!asset) return;
    try {
      setLoading(true);
      const assetRef = doc(db, 'assets', asset.id);
      await updateDoc(assetRef, { status: newStatus });
      setAsset({ ...asset, status: newStatus });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'assets');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAsset(null);
    setScannedResult(null);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Smart Scanner</h1>
        <p className="text-gray-500 font-medium">Scan any asset QR code to manage status or relocate.</p>
      </div>

      <AnimatePresence mode="wait">
        {!asset && !error && (
          <motion.div 
            key="scanner"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white p-4 rounded-3xl border-4 border-blue-600 shadow-2xl overflow-hidden"
          >
            <div id="reader" className="w-full"></div>
            <div className="mt-4 p-4 text-center">
              <p className="text-sm font-bold text-blue-600 flex items-center justify-center gap-2">
                <ScanQrCode size={18} className="animate-pulse" />
                Align QR code within the frame
              </p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div 
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl border border-red-100 shadow-xl text-center"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Scan Failed</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button 
              onClick={handleReset}
              className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {asset && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl relative overflow-hidden">
              <button 
                onClick={handleReset}
                className="absolute top-4 right-4 p-2 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-full"
              >
                <X size={20} />
              </button>

              <div className="flex items-start gap-6 mb-8">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Package size={40} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 leading-tight">{asset.productName}</h2>
                  <p className="text-sm font-bold text-blue-600">QR: {asset.qrCode}</p>
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                    {asset.status}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-6 border-y border-gray-50">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</p>
                  <div className="flex items-center gap-2 text-gray-900 font-bold">
                    <MapPin size={16} className="text-gray-400" />
                    {asset.locationName}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Value</p>
                  <div className="flex items-center gap-2 text-gray-900 font-black text-lg">
                    <DollarSign size={16} className="text-green-600" />
                    ${asset.currentValue.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Manage Status</p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => updateStatus('active')}
                    className="flex items-center justify-center gap-2 p-4 bg-green-50 text-green-600 rounded-2xl font-bold hover:bg-green-600 hover:text-white transition-all text-sm"
                  >
                    <CheckCircle2 size={16} /> Mark Active
                  </button>
                  <button 
                    onClick={() => updateStatus('damaged')}
                    className="flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all text-sm"
                  >
                    <AlertTriangle size={16} /> Report Damage
                  </button>
                  <button 
                    onClick={() => updateStatus('sold')}
                    className="flex items-center justify-center gap-2 p-4 bg-blue-50 text-blue-600 rounded-2xl font-bold hover:bg-blue-600 hover:text-white transition-all text-sm"
                  >
                    <DollarSign size={16} /> Record Sale
                  </button>
                  <button 
                    onClick={() => updateStatus('disposed')}
                    className="flex items-center justify-center gap-2 p-4 bg-gray-50 text-gray-400 rounded-2xl font-bold hover:bg-gray-900 hover:text-white transition-all text-sm"
                  >
                    <Trash2 size={16} /> Dispose Asset
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className="h-px bg-gray-200 flex-1"></div>
              <button 
                onClick={handleReset}
                className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors bg-white px-4 py-2 rounded-full border border-gray-100"
              >
                Scan Another Item
              </button>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-2xl z-50"
        >
          <CheckCircle2 className="text-green-500" size={20} />
          Status updated successfully
        </motion.div>
      )}
    </div>
  );
}
