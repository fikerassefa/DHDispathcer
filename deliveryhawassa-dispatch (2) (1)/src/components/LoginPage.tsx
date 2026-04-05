import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, ShieldCheck, UserCog, ArrowRight, Bike } from 'lucide-react';
// import { auth, db } from '../firebase';
// import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
// import { doc, setDoc, getDoc } from 'firebase/firestore';

type UserRole = 'super_admin' | 'dispatcher' | 'sub_admin';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [role, setRole] = useState<UserRole>('dispatcher');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fullError, setFullError] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');
    setFullError(null);
    try {
      // Local login logic for admin/admin
      if (email === 'admin' && password === 'admin') {
        onLogin();
        return;
      }
      
      setError('Invalid credentials for local development. Use admin/admin.');
    } catch (err: any) {
      console.error('Auth error:', err);
      setFullError(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        setError('Incorrect email or password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
        setIsSignUp(false);
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email to reset password');
      return;
    }
    try {
      // await sendPasswordResetEmail(auth, email);
      alert('Password reset email simulation! Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-[#134e4a] rounded-full mb-4 shadow-2xl shadow-teal-500/20"
          >
            <Bike className="text-white w-10 h-10" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white tracking-tight"
          >
            DeliveryHawassa
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 mt-2"
          >
            Dispatch Management System
          </motion.p>
        </div>

        {/* Login Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl"
        >
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <button 
                onClick={async () => {
                  // await signOut(auth);
                  setDebugInfo('Signed out successfully');
                }}
                className="text-[10px] text-slate-600 hover:text-slate-400 underline mb-2"
              >
                Reset Session
              </button>
              <h2 className="text-xl font-semibold text-white">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-slate-400">
                {isSignUp ? 'Register a new account to continue' : 'Select your role and sign in to continue'}
              </p>
            </div>

            {/* Role Selection */}
            {!isSignUp && (
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-900/50 rounded-2xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setRole('dispatcher')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    role === 'dispatcher' 
                      ? 'bg-teal-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserCog size={16} />
                  Dispatcher
                </button>
                <button
                  type="button"
                  onClick={() => setRole('super_admin')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    role === 'super_admin' 
                      ? 'bg-teal-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck size={16} />
                  Super Admin
                </button>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 ml-1 uppercase tracking-wider">Username or Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin or name@example.com"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Password</label>
                  {!isSignUp && (
                    <button 
                      type="button"
                      onClick={handleResetPassword}
                      className="text-[10px] text-teal-500 hover:text-teal-400 font-medium transition-colors"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                  />
                </div>
              </div>

              {debugInfo && (
                <p className="text-[10px] text-teal-500 text-center mt-2">{debugInfo}</p>
              )}

              {error && (
                <div className="space-y-2">
                  <motion.p 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-red-400 text-xs font-medium text-center"
                  >
                    {error}
                  </motion.p>
                  {fullError && (
                    <div className="text-center">
                      <button 
                        type="button"
                        onClick={() => alert(JSON.stringify(fullError, null, 2))}
                        className="text-[10px] text-slate-500 hover:text-slate-400 underline"
                      >
                        Show technical details
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-3 group transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn size={20} />
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-teal-500 hover:text-teal-400 font-medium transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-500 leading-relaxed">
              By signing in, you agree to our Terms of Service and Privacy Policy. 
              Access is restricted to authorized personnel only.
            </p>
          </div>
        </motion.div>

        {/* Footer Info */}
        <p className="text-center text-slate-500 text-xs mt-8">
          &copy; 2026 DeliveryHawassa. All rights reserved.
        </p>
      </div>
    </div>
  );
}
