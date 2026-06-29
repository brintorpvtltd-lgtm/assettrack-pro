import React, { useState } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserPlus, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../lib/firebase';
import { Role } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

const ROLES: { value: Role; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Full access to all features' },
  { value: 'manager', label: 'Manager', description: 'Manage assets, locations, and staff' },
  { value: 'staff', label: 'Staff', description: 'Scan and view assets only' },
];

export default function RegisterUser() {
  const { isAdmin, user } = useAuth();

  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin' as Role,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // If logged in but not admin, deny access
  if (user && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Access denied. Admin only.</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.displayName.trim()) return setError('Display name is required.');
    if (!form.email.trim()) return setError('Email is required.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');

    setLoading(true);

    let secondaryApp: ReturnType<typeof initializeApp> | null = null;

    try {
      let uid: string;
      let email: string = form.email;

      if (!user) {
        // Not logged in — use primary auth, will auto-login after register
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        uid = cred.user.uid;
      } else {
        // Admin is logged in — use secondary app so admin session stays intact
        secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
        const secondaryAuth = getAuth(secondaryApp);
        const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);
        uid = cred.user.uid;
        await secondaryAuth.signOut();
      }

      await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        displayName: form.displayName.trim(),
        role: form.role,
        createdAt: serverTimestamp(),
      });

      setSuccess(`User "${form.displayName}" registered successfully as ${form.role}.`);
      setForm({ displayName: '', email: '', password: '', confirmPassword: '', role: 'admin' });
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      if (secondaryApp) {
        try { await deleteApp(secondaryApp); } catch {}
      }
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Register New User</h1>
        <p className="text-gray-500 mt-1">Create an account for a team member and assign their role.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              placeholder="e.g. John Smith"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="john@company.com"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Role
            </label>
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map(r => (
                <label
                  key={r.value}
                  className={`cursor-pointer rounded-xl border-2 p-3 text-center transition-all ${
                    form.role === r.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={form.role === r.value}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <p className={`font-semibold text-sm ${form.role === r.value ? 'text-blue-700' : 'text-gray-700'}`}>
                    {r.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{r.description}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
              <CheckCircle size={16} className="shrink-0" />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <UserPlus size={18} />
            )}
            {loading ? 'Registering...' : 'Register User'}
          </button>
        </form>
      </div>
    </div>
  );
}
