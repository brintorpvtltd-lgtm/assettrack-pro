import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Location } from '../types';
import { MapPin, Plus, MoreVertical, Edit2, Trash2, ExternalLink, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [newLocation, setNewLocation] = useState({ name: '', type: 'warehouse' });

  useEffect(() => {
    const q = query(collection(db, 'locations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locs: Location[] = [];
      snapshot.forEach((doc) => {
        locs.push({ id: doc.id, ...doc.data() } as Location);
      });
      setLocations(locs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'locations');
    });

    return () => unsubscribe();
  }, []);

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        const docRef = doc(db, 'locations', editingLocation.id);
        await updateDoc(docRef, {
          name: newLocation.name,
          type: newLocation.type,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'locations'), {
          ...newLocation,
          assetCount: 0,
          totalValue: 0,
          createdAt: serverTimestamp(),
        });
      }
      setNewLocation({ name: '', type: 'warehouse' });
      setEditingLocation(null);
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingLocation ? OperationType.UPDATE : OperationType.CREATE, 'locations');
    }
  };

  const handleDeleteLocation = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'locations', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'locations');
    }
  };

  const openEditModal = (loc: Location) => {
    setEditingLocation(loc);
    setNewLocation({ name: loc.name, type: loc.type });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Facilities & Locations</h1>
          <p className="text-gray-500 font-medium">Manage your global warehouse and office network.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          Add Facility
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {locations.map((loc) => (
            <motion.div
              layout
              key={loc.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`p-4 rounded-2xl ${
                  loc.type === 'warehouse' ? 'bg-orange-50 text-orange-600' : 
                  loc.type === 'office' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                }`}>
                  <MapPin size={24} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEditModal(loc)}
                    className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteLocation(loc.id, loc.name)}
                    className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-black text-gray-900 mb-1">{loc.name}</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{loc.type}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Total Assets</p>
                    <p className="text-lg font-black text-gray-900 tracking-tight">{loc.assetCount || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Valuation</p>
                    <p className="text-lg font-black text-gray-900 tracking-tight">${(loc.totalValue || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">
                    {loc.managerName?.charAt(0) || 'U'}
                  </div>
                  <span className="text-xs font-bold text-gray-500">{loc.managerName || 'Unassigned'}</span>
                </div>
                <button className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                  View Detail <ExternalLink size={12} />
                </button>
              </div>

              {/* Decorative accent */}
              <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 rounded-full translate-x-12 -translate-y-12 ${
                loc.type === 'warehouse' ? 'bg-orange-600' : 'bg-blue-600'
              }`}></div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Location Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                  {editingLocation ? 'Edit Facility' : 'New Facility'}
                </h3>
                <p className="text-gray-500 mb-6 font-medium text-sm">
                  {editingLocation ? `Updating details for ${editingLocation.name}` : 'Register a new physical location for asset tracking.'}
                </p>
                
                <form onSubmit={handleAddLocation} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Facility Name</label>
                    <input 
                      autoFocus
                      required
                      type="text" 
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                      placeholder="e.g. Warehouse Sector A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Type</label>
                    <select 
                      value={newLocation.type}
                      onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value as any })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium appearance-none"
                    >
                      <option value="warehouse">Warehouse</option>
                      <option value="office">Office</option>
                      <option value="store">Retail Store</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setEditingLocation(null);
                        setNewLocation({ name: '', type: 'warehouse' });
                      }}
                      className="flex-1 px-6 py-3 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                      {editingLocation ? 'Save Changes' : 'Add Facility'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
