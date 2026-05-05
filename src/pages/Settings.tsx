import React from 'react';
import { User, Shield, Bell, Cloud, Trash2, Key, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

export default function Settings() {
  const { profile } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Settings</h1>
        <p className="text-gray-500 font-medium">Configure enterprise roles, alerts, and platform behavior.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200">
            <User size={18} />
            My Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white text-gray-600 hover:bg-gray-50 rounded-2xl font-bold transition-all">
            <Shield size={18} />
            Roles & Permissions
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white text-gray-600 hover:bg-gray-50 rounded-2xl font-bold transition-all">
            <Bell size={18} />
            Notifications
          </button>
        </div>

        {/* Form Content */}
        <div className="md:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <Info size={20} className="text-blue-600" />
              General Information
            </h3>
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                   <input type="text" defaultValue={profile?.displayName} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                 </div>
                 <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Display Role</label>
                   <div className="w-full px-4 py-3 bg-gray-100 border border-gray-100 rounded-xl font-bold text-gray-500 capitalize">
                     {profile?.role}
                   </div>
                 </div>
               </div>
               <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                 <input type="email" readOnly value={profile?.email} className="w-full px-4 py-3 bg-gray-100 border border-gray-100 rounded-xl font-bold text-gray-500 outline-none" />
               </div>
               <button className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200">
                 Update Profile
               </button>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm border-l-4 border-l-red-500">
            <h3 className="text-lg font-black text-gray-900 mb-2 flex items-center gap-2">
              <Trash2 size={20} className="text-red-500" />
              Danger Zone
            </h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">Irreversible actions that affect your enterprise data.</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                 <div>
                   <p className="text-sm font-bold text-gray-900">Factory Reset Database</p>
                   <p className="text-xs text-red-600 font-medium whitespace-nowrap">Delete all assets, batches, and records.</p>
                 </div>
                 <button className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm shadow-md shadow-red-100">
                   Reset
                 </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
