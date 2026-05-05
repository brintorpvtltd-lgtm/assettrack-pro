import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Package, 
  Layers, 
  ScanQrCode, 
  ArrowLeftRight, 
  BarChart3, 
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  User as UserIcon,
  Archive,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  key?: string;
}

const NavItem = ({ to, icon: Icon, label, isActive, onClick }: NavItemProps) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium text-sm">{label}</span>
  </Link>
);

export default function Shell({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin, isManager, isStaff } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager'] },
    { to: '/scanner', icon: ScanQrCode, label: 'Scan Assets', roles: ['admin', 'manager', 'staff'] },
    { to: '/assets', icon: Archive, label: 'Inventory', roles: ['admin', 'manager', 'staff'] },
    { to: '/depreciation', icon: TrendingDown, label: 'Depreciation', roles: ['admin'] },
    { to: '/locations', icon: MapPin, label: 'Locations', roles: ['admin', 'manager'] },
    { to: '/products', icon: Package, label: 'Products', roles: ['admin', 'manager'] },
    { to: '/batches', icon: Layers, label: 'Batches', roles: ['admin', 'manager'] },
    { to: '/transfers', icon: ArrowLeftRight, label: 'Transfers', roles: ['admin', 'manager', 'staff'] },
    { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin'] },
    { to: '/settings', icon: SettingsIcon, label: 'Settings', roles: ['admin'] },
  ].filter(item => item.roles.includes(profile?.role || ''));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <ScanQrCode className="text-white" size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight">AssetTrack</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r min-h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
            <ScanQrCode size={24} />
          </div>
          <span className="font-extrabold text-xl tracking-tighter text-gray-900">AssetTrack<span className="text-blue-600">Pro</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.to}
            />
          ))}
        </nav>

        <div className="p-4 mt-auto border-t">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <UserIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{profile?.displayName}</p>
              <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 z-40 bg-white md:hidden"
          >
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <span className="font-bold text-xl">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
              </div>
              <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                    isActive={location.pathname === item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </nav>
              <button
                onClick={() => auth.signOut()}
                className="mt-8 flex items-center gap-3 px-4 py-4 text-red-600 font-bold border-t"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Bar */}
        <header className="hidden md:flex items-center justify-between px-8 h-16 bg-white border-b">
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search assets, locations, orders..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-transparent focus:bg-white focus:border-blue-500 focus:ring-0 transition-all text-sm shadow-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">{profile?.email}</span>
            </div>
          </div>
        </header>

        <section className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </section>
      </main>
    </div>
  );
}
