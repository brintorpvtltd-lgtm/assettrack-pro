import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ScanQrCode, Box, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch {
      setError('Failed to login with Google');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Left Decoration - Desktop */}
      <div className="hidden md:flex md:w-1/2 bg-blue-600 flex-col items-center justify-center p-12 text-white overflow-hidden relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center"
        >
          <div className="inline-block p-4 bg-white/10 backdrop-blur-xl rounded-3xl mb-8">
            <ScanQrCode size={64} className="text-white" />
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-4">Control your assets with precision.</h1>
          <p className="text-xl text-blue-100 max-w-md mx-auto font-medium">
            Real-time tracking, QR management, and automated depreciation for modern enterprises.
          </p>
        </motion.div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
      </div>

      {/* Right Content - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-gray-200/50"
        >
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ScanQrCode className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl">AssetTrack Pro</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-500 mb-8">Sign in to manage your inventory and assets.</p>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="name@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group"
            >
              {loading ? 'Signing in...' : (
                <>
                  Sign In
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400 font-medium">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pwa/google.svg" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>

          <div className="mt-10 grid grid-cols-3 gap-4 border-t pt-8">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-2">
                <Box size={20} />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Secure Storage</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto mb-2">
                <ScanQrCode size={20} />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Instant Scans</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mx-auto mb-2">
                <ShieldCheck size={20} />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Role Access</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
