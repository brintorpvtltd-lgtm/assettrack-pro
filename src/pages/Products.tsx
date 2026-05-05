import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product } from '../types';
import { Package, Plus, MoreVertical, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    category: 'Electronics', 
    cost: 0,
    depreciationMethod: 'percentage' as const,
    depreciationValue: 10
  });

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((doc) => {
        prods.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(prods);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => unsubscribe();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const docRef = doc(db, 'products', editingProduct.id);
        await updateDoc(docRef, {
          ...newProduct,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'products'), {
          ...newProduct,
          currentStock: 0,
          createdAt: serverTimestamp(),
        });
      }
      setNewProduct({ name: '', category: 'Electronics', cost: 0, depreciationMethod: 'percentage', depreciationValue: 10 });
      setEditingProduct(null);
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingProduct ? OperationType.UPDATE : OperationType.CREATE, 'products');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This will affect all future assets created of this type.`)) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'products');
    }
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setNewProduct({
      name: prod.name,
      category: prod.category,
      cost: prod.cost,
      depreciationMethod: prod.depreciationMethod,
      depreciationValue: prod.depreciationValue
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Product Catalog</h1>
          <p className="text-gray-500 font-medium">Define and manage asset types across your enterprise.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          Create Product
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, category..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-all text-sm">
            <Filter size={16} />
            Filters
          </button>
          <select className="flex-1 sm:flex-none px-4 py-2 bg-gray-50 text-gray-600 rounded-xl font-bold border-transparent outline-none text-sm appearance-none cursor-pointer">
            <option>All Categories</option>
            <option>Electronics</option>
            <option>Furniture</option>
            <option>Vehicles</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Cost</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence>
                {products.map((prod) => (
                  <motion.tr 
                    key={prod.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                          <Package size={20} />
                        </div>
                        <span className="font-bold text-gray-900">{prod.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-xs font-bold ring-1 ring-inset ring-gray-200">
                        {prod.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900">
                      ${prod.cost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${prod.currentStock > 0 ? 'text-green-600' : 'text-red-400'}`}>
                        {prod.currentStock} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(prod)}
                          className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {products.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                    No products found. Start by adding one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
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
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                  {editingProduct ? 'Edit Product' : 'Create New Product'}
                </h3>
                <p className="text-gray-500 mb-8 font-medium text-sm">
                  {editingProduct ? `Updating configuration for ${editingProduct.name}` : 'Define a new asset category and its properties.'}
                </p>
                
                <form onSubmit={handleAddProduct} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Product Name</label>
                      <input 
                        required
                        type="text" 
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium placeholder:text-gray-300"
                        placeholder="e.g. Dell XPS 15"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
                      <select 
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium appearance-none"
                      >
                        <option value="Electronics">Electronics</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Vehicles">Vehicles</option>
                        <option value="Industrial">Industrial</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Base Cost ($)</label>
                      <input 
                        required
                        type="number" 
                        value={newProduct.cost}
                        onChange={(e) => setNewProduct({ ...newProduct, cost: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                      />
                    </div>
                    <div>
                       <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Depreciation Value</label>
                       <div className="relative">
                        <input 
                          required
                          type="number" 
                          value={newProduct.depreciationValue}
                          onChange={(e) => setNewProduct({ ...newProduct, depreciationValue: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                          {newProduct.depreciationMethod === 'percentage' ? '%' : '$'}
                        </span>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Depreciation Method</label>
                     <div className="flex gap-4">
                       <label className="flex-1 flex items-center justify-center gap-2 p-3 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                          <input 
                            type="radio" 
                            name="depType" 
                            className="w-4 h-4 text-blue-600" 
                            checked={newProduct.depreciationMethod === 'percentage'}
                            onChange={() => setNewProduct({ ...newProduct, depreciationMethod: 'percentage' })}
                          />
                          <span className="text-sm font-bold text-gray-700">Percentage (Annual)</span>
                       </label>
                       <label className="flex-1 flex items-center justify-center gap-2 p-3 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                          <input 
                            type="radio" 
                            name="depType" 
                            className="w-4 h-4 text-blue-600" 
                            checked={newProduct.depreciationMethod === 'fixed'}
                            onChange={() => setNewProduct({ ...newProduct, depreciationMethod: 'fixed' })}
                          />
                          <span className="text-sm font-bold text-gray-700">Fixed (Monthly)</span>
                       </label>
                     </div>
                  </div>
                  
                  <div className="flex gap-4 pt-6">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setEditingProduct(null);
                        setNewProduct({ name: '', category: 'Electronics', cost: 0, depreciationMethod: 'percentage', depreciationValue: 10 });
                      }}
                      className="flex-1 px-6 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all shadow-sm"
                    >
                      Discard
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                      {editingProduct ? 'Save Changes' : 'Create Product'}
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
