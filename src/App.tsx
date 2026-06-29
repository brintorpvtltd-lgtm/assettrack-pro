import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Shell from './components/layout/Shell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Locations from './pages/Locations';
import Products from './pages/Products';
import Batches from './pages/Batches';
import Assets from './pages/Assets';
import QRScanner from './pages/QRScanner';
import Transfers from './pages/Transfers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import RegisterUser from './pages/RegisterUser';
import Depreciation from './pages/Depreciation';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes - accessible without login */}
      <Route path="/register-user" element={user ? <Navigate to="/" replace /> : <RegisterUser />} />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* Protected routes */}
      {!user ? (
        <Route path="*" element={<Login />} />
      ) : (
        <Route path="/*" element={
          <Shell>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/products" element={<Products />} />
              <Route path="/batches" element={<Batches />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/depreciation" element={<Depreciation />} />
              <Route path="/scanner" element={<QRScanner />} />
              <Route path="/transfers" element={<Transfers />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/register-user" element={<RegisterUser />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Shell>
        } />
      )}
    </Routes>
  );
}
