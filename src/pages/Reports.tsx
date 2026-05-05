import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingDown, TrendingUp, DollarSign, Download, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

const sampleData = [
  { name: 'Jan', revenue: 4000, depreciation: 2400 },
  { name: 'Feb', revenue: 3000, depreciation: 1398 },
  { name: 'Mar', revenue: 2000, depreciation: 9800 },
  { name: 'Apr', revenue: 2780, depreciation: 3908 },
  { name: 'May', revenue: 1890, depreciation: 4800 },
  { name: 'Jun', revenue: 2390, depreciation: 3800 },
];

export default function Reports() {
  const [stats, setStats] = useState({ totalItems: 0, totalValue: 0, facilities: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const assetSnap = await getDocs(collection(db, 'assets'));
      const locSnap = await getDocs(collection(db, 'locations'));
      
      let totalValue = 0;
      assetSnap.forEach(doc => {
        totalValue += doc.data().currentValue || 0;
      });

      setStats({
        totalItems: assetSnap.size,
        totalValue,
        facilities: locSnap.size
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Business Intelligence</h1>
          <p className="text-gray-500 font-medium">Financial insights and asset utilization reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-bold text-gray-600">
            <Calendar size={18} />
            Last 6 Months
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold shadow-lg shadow-gray-200">
            <Download size={18} />
            Generate PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-gray-900">Value vs Depreciation</h3>
              <p className="text-sm text-gray-500 font-medium">Loss analysis over the current fiscal year.</p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
              <TrendingDown size={24} />
            </div>
          </div>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={sampleData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                 <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                 <Area type="monotone" dataKey="revenue" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                 <Area type="monotone" dataKey="depreciation" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-200"
          >
            <DollarSign size={32} className="mb-4 text-blue-200" />
            <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-1">Inventory Valuation</p>
            <h3 className="text-4xl font-black mb-4">${Math.round(stats.totalValue).toLocaleString()}</h3>
            <p className="text-sm text-blue-100/80 leading-relaxed font-medium">Total book value of all active inventory across global facilities.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900 p-8 rounded-3xl text-white shadow-xl shadow-gray-200"
          >
            <BarChart3 size={32} className="mb-4 text-gray-500" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">Asset Count</p>
            <h3 className="text-4xl font-black mb-4">{stats.totalItems}</h3>
            <p className="text-sm text-gray-400 leading-relaxed font-medium">Currently managing {stats.totalItems} items across {stats.facilities} active facilities.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
