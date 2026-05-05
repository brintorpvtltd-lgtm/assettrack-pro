import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { 
  Package, 
  MapPin, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Activity,
  ScanQrCode
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'motion/react';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 900 },
];

const categoryData = [
  { name: 'Furniture', value: 4500, color: '#3b82f6' },
  { name: 'Electronics', value: 3200, color: '#10b981' },
  { name: 'Vehicles', value: 2100, color: '#f59e0b' },
  { name: 'Machinery', value: 1800, color: '#ef4444' },
];

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ElementType;
  className?: string;
}

const StatCard = ({ title, value, change, isPositive, icon: Icon, className }: StatCardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md ${className}`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-gray-50 rounded-2xl">
        <Icon size={24} className="text-blue-600" />
      </div>
      {change && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
          isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change}
        </div>
      )}
    </div>
    <div className="flex flex-col">
      <span className="text-sm font-semibold text-gray-500 mb-1">{title}</span>
      <span className="text-2xl font-black text-gray-900">{value}</span>
    </div>
  </motion.div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalValue: 0,
    damagedAssets: 0,
    activeLocations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const assetSnap = await getDocs(collection(db, 'assets'));
        const locSnap = await getDocs(collection(db, 'locations'));
        
        let totalValue = 0;
        let damaged = 0;
        assetSnap.forEach(doc => {
          const data = doc.data();
          totalValue += data.currentValue || 0;
          if (data.status === 'damaged') damaged++;
        });

        setStats({
          totalAssets: assetSnap.size,
          totalValue,
          damagedAssets: damaged,
          activeLocations: locSnap.size
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-gray-500 font-medium">Monitoring asset lifecycle and enterprise value.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
            Export Report
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
            Update Inventory
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Assets" 
          value={stats.totalAssets.toLocaleString()} 
          change="+12.5%" 
          isPositive={true}
          icon={Package} 
        />
        <StatCard 
          title="Total Asset Value" 
          value={stats.totalValue >= 1000000 
            ? `$${(stats.totalValue / 1000000).toFixed(1)}M` 
            : `$${Math.round(stats.totalValue).toLocaleString()}`
          } 
          change="+8.2%" 
          isPositive={true}
          icon={DollarSign} 
        />
        <StatCard 
          title="Damaged Assets" 
          value={stats.damagedAssets} 
          change="-2.1%" 
          isPositive={true}
          icon={AlertTriangle} 
        />
        <StatCard 
          title="Active Locations" 
          value={stats.activeLocations} 
          icon={MapPin} 
        />
      </div>

      {!loading && stats.totalAssets === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 rounded-[2.5rem] p-12 text-white shadow-2xl shadow-blue-200 relative overflow-hidden mb-8"
        >
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl font-black mb-4 tracking-tight text-white">Ready to track your first asset?</h2>
            <p className="text-blue-100 text-lg font-medium mb-8 leading-relaxed opacity-90">
              Your inventory is currently empty. Start by defining your facilities and products, 
              then use the "Register Asset" button in the inventory or the bulk "Batches" tool.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/locations" className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all shadow-lg text-sm">
                1. Add Facility
              </Link>
              <Link to="/products" className="bg-blue-500 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-400 transition-all border border-blue-400 text-sm">
                2. Define Product
              </Link>
              <Link to="/assets" className="bg-blue-700 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-800 transition-all text-sm">
                3. Register Asset
              </Link>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none">
            <ScanQrCode size={400} />
          </div>
        </motion.div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Value Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-gray-900">Portfolio Growth</h3>
              <p className="text-sm text-gray-500 font-medium">Cumulative asset value over 6 months.</p>
            </div>
            <div className="flex items-center gap-4 text-sm font-bold">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span>Actual</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                <span>Forecast</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-8">
            <h3 className="text-lg font-black text-gray-900">Asset Categories</h3>
            <p className="text-sm text-gray-500 font-medium">Value distribution by sector.</p>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={categoryData} layout="vertical" barSize={24}>
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 600 }}
                  width={80}
                />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-4">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm font-medium text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-gray-900">${item.value}K</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-900">Critical Alerts</h3>
            <Activity size={20} className="text-blue-600" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-red-50/50 rounded-2xl border border-red-100">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">Maintenance Due: Forklift #402</p>
                  <p className="text-xs text-red-600 font-semibold">Location: Warehouse KHI</p>
                </div>
                <span className="text-xs font-bold text-gray-400">2h ago</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-900">Recent Transfers</h3>
            <TrendingUp size={20} className="text-blue-600" />
          </div>
          <div className="space-y-4">
            {['MacBook Air', 'Office Chair x10', 'Industrial Printer'].map((item, i) => (
              <div key={item} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <TrendingUp size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{item}</p>
                  <p className="text-xs text-gray-500 font-medium">Head Office → Warehouse LHR</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">Completed</p>
                  <p className="text-xs text-gray-400">Today</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
