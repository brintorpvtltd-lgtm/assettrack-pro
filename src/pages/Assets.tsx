import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, where, addDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Asset, Location, Product } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Tag, 
  Circle, 
  ArrowLeftRight, 
  Trash2, 
  ExternalLink, 
  QrCode,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetLocationId, setTargetLocationId] = useState('');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [newAsset, setNewAsset] = useState({
    productId: '',
    locationId: '',
    qrCode: '',
    status: 'active' as Asset['status']
  });

  useEffect(() => {
    let q = query(collection(db, 'assets'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const asts: Asset[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
      setAssets(asts);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'assets');
    });

    const locUnsub = onSnapshot(collection(db, 'locations'), (snap) => {
      setLocations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Location)));
    });

    const prodUnsub = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });

    return () => {
      unsubscribe();
      locUnsub();
      prodUnsub();
    };
  }, []);

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.productName.toLowerCase().includes(search.toLowerCase()) || 
                         a.qrCode.toLowerCase().includes(search.toLowerCase());
    const matchesLocation = filterLocation === 'all' || a.locationId === filterLocation;
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchesSearch && matchesLocation && matchesStatus;
  });

  const handleTransfer = async () => {
    if (!selectedAsset || !targetLocationId) return;
    try {
      const targetLocation = locations.find(l => l.id === targetLocationId);
      if (!targetLocation) return;

      const assetRef = doc(db, 'assets', selectedAsset.id);
      await updateDoc(assetRef, {
        locationId: targetLocationId,
        locationName: targetLocation.name,
      });

      // Log the transfer
      await addDoc(collection(db, 'transfers'), {
        assetIds: [selectedAsset.id],
        fromLocationId: selectedAsset.locationId,
        fromLocationName: selectedAsset.locationName,
        toLocationId: targetLocationId,
        toLocationName: targetLocation.name,
        status: 'completed',
        createdAt: serverTimestamp(),
      });

      setIsTransferModalOpen(false);
      setSelectedAsset(null);
      setTargetLocationId('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'assets');
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.productId || !newAsset.locationId || !newAsset.qrCode) return;
    
    try {
      const product = products.find(p => p.id === newAsset.productId);
      const location = locations.find(l => l.id === newAsset.locationId);
      
      if (!product || !location) return;

      await addDoc(collection(db, 'assets'), {
        productId: newAsset.productId,
        productName: product.name,
        locationId: newAsset.locationId,
        locationName: location.name,
        qrCode: newAsset.qrCode,
        status: newAsset.status,
        purchaseCost: product.cost,
        currentValue: product.cost,
        lastDepreciated: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      // Increment stock in product (optional but good for consistency)
      const prodRef = doc(db, 'products', product.id);
      await updateDoc(prodRef, {
        currentStock: (product.currentStock || 0) + 1
      });

      setNewAsset({ productId: '', locationId: '', qrCode: '', status: 'active' });
      setIsAddModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'assets');
    }
  };

  const handleDeleteAsset = async (id: string, qrCode: string) => {
    if (!window.confirm(`Are you sure you want to delete asset ${qrCode}? This record will be permanently removed.`)) return;
    try {
      await deleteDoc(doc(db, 'assets', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'assets');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-600 border-green-100';
      case 'damaged': return 'bg-red-50 text-red-600 border-red-100';
      case 'disposed': return 'bg-gray-50 text-gray-400 border-gray-100';
      case 'sold': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-gray-50 text-gray-400';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Active Inventory</h1>
          <p className="text-gray-500 font-medium">Tracking {assets.length} items across {locations.length} locations.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          Register Asset
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by QR, Product..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-sm"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="flex-1 md:w-48 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl font-bold text-xs ring-1 ring-inset ring-gray-100 outline-none"
          >
            <option value="all">All Locations</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 md:w-40 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl font-bold text-xs ring-1 ring-inset ring-gray-100 outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="damaged">Damaged</option>
            <option value="disposed">Disposed</option>
            <option value="sold">Sold</option>
          </select>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredAssets.map((asset) => (
            <motion.div
              layout
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white group rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col"
            >
              <div className="aspect-square bg-gray-50 flex items-center justify-center p-8 relative">
                <div className="bg-white p-4 rounded-2xl shadow-sm">
                  <QrCode size={80} className="text-gray-900" />
                </div>
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor(asset.status)}`}>
                  {asset.status}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">{asset.productName}</h3>
                  <p className="text-xs font-bold text-gray-400">ID: {asset.qrCode}</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-600">{asset.locationName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-600">${asset.currentValue.toLocaleString()} current</span>
                  </div>
                </div>

                <div className="mt-auto flex gap-2">
                  <button 
                    onClick={() => { setSelectedAsset(asset); setIsTransferModalOpen(true); }}
                    className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-2xl font-bold text-xs hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeftRight size={14} />
                    Transfer
                  </button>
                  <button 
                    onClick={() => handleDeleteAsset(asset.id, asset.qrCode)}
                    className="p-3 bg-red-50 text-red-400 hover:bg-red-600 hover:text-white rounded-2xl transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button className="p-3 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-2xl transition-all">
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Asset Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-2xl font-black text-gray-900 mb-2">Register Asset</h3>
                <p className="text-gray-500 mb-6 text-sm font-medium">Manually add a new item to the registry.</p>
                
                <form onSubmit={handleAddAsset} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Product Type</label>
                      <select 
                        required
                        value={newAsset.productId}
                        onChange={(e) => setNewAsset({ ...newAsset, productId: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      >
                        <option value="">-- Select Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Facility</label>
                      <select 
                        required
                        value={newAsset.locationId}
                        onChange={(e) => setNewAsset({ ...newAsset, locationId: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      >
                        <option value="">-- Select Location --</option>
                        {locations.map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">QR Code / Serial Number</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g. AST-123456"
                      value={newAsset.qrCode}
                      onChange={(e) => setNewAsset({ ...newAsset, qrCode: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200"
                    >
                      Register Asset
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Transfer Modal */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTransferModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              layoutId={selectedAsset?.id}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
            >
              <h3 className="text-2xl font-black text-gray-900 mb-2">Relocate Asset</h3>
              <p className="text-gray-500 mb-6 text-sm font-medium">Moving <span className="font-bold text-gray-900">{selectedAsset?.productName}</span> to a new destination.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Current Location</label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 italic text-gray-500">
                    <MapPin size={18} />
                    {selectedAsset?.locationName}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Destination Facility</label>
                  <select 
                    value={targetLocationId}
                    onChange={(e) => setTargetLocationId(e.target.value)}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold appearance-none"
                  >
                    <option value="">-- Choose New Location --</option>
                    {locations.filter(l => l.id !== selectedAsset?.locationId).map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsTransferModalOpen(false)}
                    className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleTransfer}
                    disabled={!targetLocationId}
                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 disabled:opacity-50"
                  >
                    Confirm Move
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
